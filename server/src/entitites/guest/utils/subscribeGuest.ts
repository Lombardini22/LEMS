import { AddListMemberBody } from '@mailchimp/mailchimp_marketing'
import { WithId } from 'mongodb'
import { Guest } from '../../../../../shared/models/Guest'
import { Result } from '../../../../../shared/Result'
import { env } from '../../../resources/env'
import { mailchimp } from '../../../resources/mailchimp'
import { ServerError } from '../../../ServerError'
import { isMailchimpMembersSuccessResponse } from './isMailchimpMembersSuccessResponse'

export async function subscribeGuest(
  guest: WithId<Guest>,
): Promise<Result<ServerError, WithId<Guest>>> {
  return env.use(env =>
    mailchimp.use(async mailchimp => {
      const destinationListId = env.MAILCHIMP_EVENT_LIST_ID

      const mailchimpGuest = await Result.tryCatch(
        () => mailchimp.lists.getListMember(destinationListId, guest.emailHash),
        error =>
          new ServerError(404, 'MailChimp subscriber not found', {
            error,
            destinationListId,
            guest,
          }),
      )

      const mailchimpGuestData = await mailchimpGuest.flatMap(response => {
        if (isMailchimpMembersSuccessResponse(response)) {
          return Result.success(() => response)
        } else {
          return Result.failure(
            () =>
              new ServerError(
                500,
                'Error in getting subscriber from MailChimp',
                {
                  response,
                },
              ),
          )
        }
      })

      if (mailchimpGuestData.isSuccess()) {
        return Result.success(() => guest)
      } else {
        const subscriptionResult = await Result.tryCatch(
          () =>
            mailchimp.lists.addListMember(
              destinationListId,
              guestToMailchimpListMember(guest),
            ),
          error =>
            new ServerError(
              500,
              'Unable to add guest to the destination list',
              { error, guest, destinationListId },
            ),
        )

        return await subscriptionResult.flatMap(response => {
          if (isMailchimpMembersSuccessResponse(response)) {
            return Result.success(() => guest)
          } else {
            return Result.failure(
              () =>
                new ServerError(
                  500,
                  'Error in adding guest to destination list',
                  { response },
                ),
            )
          }
        })
      }
    }),
  )
}

export function guestToMailchimpListMember(
  guest: Pick<Guest, 'firstName' | 'lastName' | 'email' | 'companyName'>,
): AddListMemberBody {
  return {
    email_address: guest.email,
    status: 'subscribed',
    merge_fields: {
      FNAME: guest.firstName,
      LNAME: guest.lastName,
      MMERGE3: guest.companyName,
    },
  }
}
