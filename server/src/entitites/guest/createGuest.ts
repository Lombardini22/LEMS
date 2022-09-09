import { WithId } from 'mongodb'
import {
  Guest,
  GuestCreationInput,
  hashGuestEmail,
} from '../../../../shared/models/Guest'
import { Result } from '../../../../shared/Result'
import { Path } from '../../routing/Path'
import { Request } from '../../routing/Router'
import { ServerError } from '../../ServerError'
import { guestsCollection } from './guestsCollection'

type CreateGuestQuery = {
  referrerEmail?: string
}

export const createGuestPath = Path.start().withQuery<CreateGuestQuery>()

export async function createGuest(
  req: Request<unknown, CreateGuestQuery, GuestCreationInput>,
): Promise<Result<ServerError, WithId<Guest>>> {
  const referrerEmail = req.query.referrerEmail

  const result = await (async () => {
    if (referrerEmail) {
      const referrer = await guestsCollection.findOne({ email: referrerEmail })

      return referrer.flatMap(referrer =>
        guestsCollection.insert({
          ...req.body,
          emailHash: hashGuestEmail(req.body.email),
          source: 'REFERRER',
          referrerId: referrer._id,
          status: 'RSVP',
        }),
      )
    } else {
      return guestsCollection.insert({
        ...req.body,
        emailHash: hashGuestEmail(req.body.email),
        source: 'MANUAL',
        status: 'RSVP',
      })
    }
  })()

  return result.mapError(e => {
    if (e.extra['error']['code']) {
      return new ServerError(
        409,
        'A guest with the same email address already exists',
      )
    } else {
      return e
    }
  })
}
