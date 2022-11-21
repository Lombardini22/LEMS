import { WithId } from 'mongodb'
import {
  Guest,
  GuestCreationInput,
  hashGuestEmail,
} from '../../../../shared/models/Guest'
import { Result } from '../../../../shared/Result'
import { env } from '../../resources/env'
import { Path } from '../../routing/Path'
import { Request } from '../../routing/Router'
import { ServerError } from '../../ServerError'
import { guestsCollection } from './guestsCollection'
import { fetchGuest } from './utils/fetchGuest'
import { mailchimpDatabaseListMemberToGuest } from './utils/mailchimpDatabaseListMemberToGuest'

export const createGuestPath = Path.start()

export async function createGuest(
  req: Request<unknown, unknown, GuestCreationInput>,
): Promise<Result<ServerError, WithId<Guest>>> {
  return env.use(async env => {
    const emailHash = hashGuestEmail(req.body.email)

    const existingGuest = await fetchGuest(
      emailHash,
      env.MAILCHIMP_DATABASE_LIST_ID,
      mailchimpDatabaseListMemberToGuest(emailHash),
    )

    return existingGuest.fold(
      function createGuestIfNotFound(error) {
        if (error.status === 404) {
          return guestsCollection.insert({
            ...req.body,
            emailHash: emailHash,
            companyName: req.body.companyName || null,
            source: 'MANUAL',
            status: 'RSVP',
          })
        } else {
          return Result.failure(() => error)
        }
      },
      _ => Result.success(() => _),
    )
  })
}
