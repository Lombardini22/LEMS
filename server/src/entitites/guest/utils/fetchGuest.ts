import { MembersSuccessResponse } from '@mailchimp/mailchimp_marketing'
import { WithId } from 'mongodb'
import { Guest } from '../../../../../shared/models/Guest'
import { Result } from '../../../../../shared/Result'
import { NoTimestamps } from '../../../database/Collection'
import { mailchimp } from '../../../resources/mailchimp'
import { ServerError } from '../../../ServerError'
import { guestsCollection } from '../guestsCollection'
import { isMailchimpMembersSuccessResponse } from './isMailchimpMembersSuccessResponse'

export function fetchGuest(
  emailHash: string,
  mailchimpListId: string,
  mailchimpMemberToGuest: (
    mailchimpMember: MembersSuccessResponse,
  ) => NoTimestamps<Guest>,
): Promise<Result<ServerError, WithId<Guest>>> {
  return mailchimp.use(async mailchimp => {
    const localGuest = await guestsCollection.findOne({ emailHash })

    return localGuest.fold(
      async function fetchGuestThroughMailchimp(error) {
        if (error.status === 404) {
          const response = await Result.tryCatch(
            () => mailchimp.lists.getListMember(mailchimpListId, emailHash),
            error =>
              new ServerError(404, 'MailChimp subscriber not found', {
                error,
                mailchimpListId,
                emailHash,
              }),
          )

          const mailchimpMemberData = await response.flatMap(
            function validateMailchimpResponse(response) {
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
            },
          )

          const guestData = await mailchimpMemberData.map(
            mailchimpMemberToGuest,
          )

          return guestData.flatMap(data => guestsCollection.insert(data))
        } else {
          return Result.failure(() => error)
        }
      },
      guest => Result.success(() => guest),
    )
  })
}
