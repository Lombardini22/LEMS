import {
  MemberErrorResponse,
  MembersSuccessResponse,
} from '@mailchimp/mailchimp_marketing'
import { Result } from '../../../../shared/Result'
import { mailchimp } from '../../resources/mailchimp'
import { Request } from '../../routing/Router'
import { ServerError } from '../../ServerError'
import { MD5 } from 'crypto-js'

export type AddGuestThroughMailChimpParams = {
  listId: string
  email: string
}

export function addGuestThroughMailChimp(
  req: Request<AddGuestThroughMailChimpParams>,
): Promise<Result<ServerError, MembersSuccessResponse>> {
  return mailchimp.use(async mailchimp => {
    const { listId, email } = req.params

    const response = await Result.tryCatch(
      () => mailchimp.lists.getListMember(listId, MD5(email).toString()),
      error =>
        new ServerError(404, 'MailChimp subscriber not found', {
          error,
          listId,
          email,
        }),
    )

    return response.flatMap(response => {
      if (isMembersSuccessResponse(response)) {
        return Result.success(() => response)
      } else {
        return Result.failure(
          () =>
            new ServerError(500, 'Error in getting subscriber from MailChimp', {
              response,
            }),
        )
      }
    })
  })
}

function isMembersSuccessResponse(
  response: MembersSuccessResponse | MemberErrorResponse,
): response is MembersSuccessResponse {
  return typeof response.status === 'string'
}
