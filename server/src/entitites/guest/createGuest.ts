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
  const guestEmailHash = hashGuestEmail(req.body.email)
  const referrerEmail = req.query.referrerEmail

  if (referrerEmail) {
    const referrer = await guestsCollection.findOne({ email: referrerEmail })

    return referrer.flatMap(async referrer => {
      const guest = await guestsCollection.findOne({
        emailHash: guestEmailHash,
      })

      if (guest.isSuccess()) {
        return guestsCollection.update(
          { emailHash: guestEmailHash },
          {
            ...guest.unsafeGetValue(),
            ...req.body,
            source: 'REFERRER',
            referrerId: referrer._id,
          },
        )
      } else {
        return guestsCollection.insert({
          ...req.body,
          emailHash: guestEmailHash,
          source: 'REFERRER',
          referrerId: referrer._id,
          status: 'RSVP',
        })
      }
    })
  } else {
    const guest = await guestsCollection.findOne({ emailHash: guestEmailHash })

    if (guest.isSuccess()) {
      return guestsCollection.update(
        { emailHash: guestEmailHash },
        {
          ...guest.unsafeGetValue(),
          ...req.body,
        },
      )
    } else {
      return guestsCollection.insert({
        ...req.body,
        emailHash: guestEmailHash,
        source: 'MANUAL',
        status: 'RSVP',
      })
    }
  }
}
