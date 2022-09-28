import { Guest } from '../../../../../shared/models/Guest'
import { Result } from '../../../../../shared/Result'
import { env } from '../../../resources/env'
import { mailchimp } from '../../../resources/mailchimp'
import { ServerError } from '../../../ServerError'
import { isMailchimpMembersSuccessResponse } from './isMailchimpMembersSuccessResponse'
import { MailchimpEventListMember } from './mailchimpTypes'

type MailchimpGuestData = Pick<
  Guest,
  'firstName' | 'lastName' | 'email' | 'emailHash' | 'companyName'
>

export async function subscribeGuest<G extends MailchimpGuestData>(
  guest: G,
): Promise<Result<ServerError, G>> {
  return env.use(env =>
    mailchimp.use(async mailchimp => {
      const sourceListId = env.MAILCHIMP_DATABASE_LIST_ID
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

      const subscription = await mailchimpGuestData.fold(
        async () => {
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
        },
        () => Result.success(() => guest),
      )

      return subscription.flatMap(async guest => {
        const tagSetResult = await Result.tryCatch(
          () =>
            mailchimp.lists.updateListMemberTags(
              sourceListId,
              guest.emailHash,
              {
                tags: [{ name: env.MAILCHIMP_RSVP_TAG_NAME, status: 'active' }],
              },
            ),
          error =>
            new ServerError(
              500,
              'Unable to set tag on source list for new guest',
              {
                error,
                guest,
              },
            ),
        )

        return tagSetResult.map(() => guest)
      })
    }),
  )
}

export function guestToMailchimpListMember(
  guest: MailchimpGuestData,
): MailchimpEventListMember {
  return {
    email_address: guest.email,
    status: 'subscribed',
    merge_fields: {
      FNAME: guest.firstName,
      LNAME: guest.lastName,
      MMERGE4: guest.companyName || '',
    },
  }
}
