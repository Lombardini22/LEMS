import {
  MemberErrorResponse,
  MembersSuccessResponse,
} from '@mailchimp/mailchimp_marketing'
import { Result } from '../../../../shared/Result'
import { mailchimp } from '../../resources/mailchimp'
import { Request } from '../../routing/Router'
import { ServerError } from '../../ServerError'
import { guestsCollection } from './guestsCollection'
import { WithId } from 'mongodb'
import { Guest, hashGuestEmail } from '../../../../shared/models/Guest'
import { Path } from '../../routing/Path'

type AddGuestThroughMailChimpParams = {
  listId: string
  email: string
}

export const addGuestThroughMailChimpPath = Path.start()
  .param<AddGuestThroughMailChimpParams>('listId')
  .param<AddGuestThroughMailChimpParams>('email')

export function addGuestThroughMailChimp(
  req: Request<AddGuestThroughMailChimpParams>,
): Promise<Result<ServerError, WithId<Guest>>> {
  return mailchimp.use(async mailchimp => {
    const { listId, email } = req.params
    const emailHash = hashGuestEmail(email)

    const response = await Result.tryCatch(
      () => mailchimp.lists.getListMember(listId, emailHash),
      error =>
        new ServerError(404, 'MailChimp subscriber not found', {
          error,
          listId,
          email,
        }),
    )

    const guestData = await response.flatMap(response => {
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

    const guest = await guestData.flatMap(async mcGuest => {
      if (!mcGuest.merge_fields['FNAME'] || !mcGuest.merge_fields['LNAME']) {
        return Result.failure(
          () =>
            new ServerError(500, 'Invalid data returned by MailChimp API', {
              guestData: mcGuest,
            }),
        )
      }

      const guestData: Guest = {
        ...{
          firstName: mcGuest.merge_fields['FNAME'],
          lastName: mcGuest.merge_fields['LNAME'],
          email: mcGuest.email_address,
          emailHash,
        },
        ...(mcGuest.merge_fields['MMERGE8']
          ? {
              companyName: mcGuest.merge_fields['MMERGE8'],
            }
          : {}),
      }

      const existingGuestResult = await guestsCollection.findOne({ emailHash })

      return existingGuestResult.fold<Result<ServerError, WithId<Guest>>>(
        error => {
          if (error.status === 404) {
            return guestsCollection.insert(guestData)
          } else {
            return existingGuestResult
          }
        },
        guest => guestsCollection.update({ _id: guest._id }, guestData),
      )
    })

    return guest
  })
}

function isMembersSuccessResponse(
  response: MembersSuccessResponse | MemberErrorResponse,
): response is MembersSuccessResponse {
  return typeof response.status === 'string'
}
