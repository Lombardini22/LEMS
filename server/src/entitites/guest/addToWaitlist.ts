import { Guest, hashGuestEmail } from '../../../../shared/models/Guest'
import { Result } from '../../../../shared/Result'
import { env } from '../../resources/env'
import { mailchimp } from '../../resources/mailchimp'
import { Path } from '../../routing/Path'
import { Request } from '../../routing/Router'
import { ServerError } from '../../ServerError'
import { fetchGuest } from './utils/fetchGuest'
import { mailchimpDatabaseListMemberToGuest } from './utils/mailchimpDatabaseListMemberToGuest'

type AddToWaitlistParams = {
  email: string
}

export const addToWaitlistPath = Path.start()
  .param<AddToWaitlistParams>('email')
  .literal('waitlist')

export function addToWaitlist(
  req: Request<AddToWaitlistParams>,
): Promise<Result<ServerError, Guest>> {
  return env.use(async env => {
    const { email } = req.params
    const emailHash = hashGuestEmail(email)

    /*
      If the guest is found into local database, then it's fine, they were already there, no need to add them to the waiting list. If the guest comes from MailChimp instead, then they're added to the waiting list
     */
    const guest = await fetchGuest(
      emailHash,
      env.MAILCHIMP_DATABASE_LIST_ID,
      function turnMailchimpMemberIntoWaitingGuest(member) {
        return {
          ...mailchimpDatabaseListMemberToGuest(emailHash)(member),
          status: 'WAITING',
        }
      },
    )

    return guest.flatMap(function setMailchimpWaitingTagIfNeeded(guest) {
      if (guest.status !== 'WAITING') {
        return Result.success(() => guest)
      } else {
        return mailchimp.use(async mailchimp => {
          const setTagResult = await Result.tryCatch(
            () =>
              mailchimp.lists.updateListMemberTags(
                env.MAILCHIMP_DATABASE_LIST_ID,
                guest.emailHash,
                {
                  tags: [
                    {
                      name: env.MAILCHIMP_WAITING_LIST_TAG_NAME,
                      status: 'active',
                    },
                  ],
                },
              ),
            error =>
              new ServerError(
                500,
                'Unable to set tag on source list for waiting guest',
                {
                  error,
                  guest,
                },
              ),
          )

          return setTagResult.map(() => guest)
        })
      }
    })
  })
}
