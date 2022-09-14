import { WithId } from 'mongodb'
import {
  Guest,
  GuestCreationInput,
  hashGuestEmail,
} from '../../../../shared/models/Guest'
import { Result } from '../../../../shared/Result'
import { NoTimestamps } from '../../database/Collection'
import { Path } from '../../routing/Path'
import { Request } from '../../routing/Router'
import { ServerError } from '../../ServerError'
import { guestsCollection } from './guestsCollection'
import { subscribeGuest } from './utils/subscribeGuest'

type CreateGuestQuery = {
  referrerEmail?: string
}

export const createGuestPath = Path.start().withQuery<CreateGuestQuery>()

export async function createGuest(
  req: Request<unknown, CreateGuestQuery, GuestCreationInput>,
): Promise<Result<ServerError, WithId<Guest>>> {
  const guestEmailHash = hashGuestEmail(req.body.email)
  const referrerEmail = req.query.referrerEmail

  const guest = await (async () => {
    if (referrerEmail) {
      const referrer = await guestsCollection.findOne({ email: referrerEmail })

      return referrer.flatMap(async referrer => {
        const guest = await guestsCollection.findOne({
          emailHash: guestEmailHash,
        })

        if (guest.isSuccess()) {
          return guestsCollection.update({ emailHash: guestEmailHash }, {
            ...guest.unsafeGetValue(),
            ...req.body,
            source: 'REFERRER',
            referrerId: referrer._id,
          } as Guest)
        } else {
          const guest = await guestsCollection.insert({
            ...req.body,
            emailHash: guestEmailHash,
            source: 'REFERRER',
            referrerId: referrer._id,
            status: 'RSVP',
          } as NoTimestamps<Guest>)

          return guest.flatMap(guest => subscribeGuest(guest))
        }
      })
    } else {
      const guest = await guestsCollection.findOne({
        emailHash: guestEmailHash,
      })

      if (guest.isSuccess()) {
        return guestsCollection.update(
          { emailHash: guestEmailHash },
          {
            ...guest.unsafeGetValue(),
            ...req.body,
          },
        )
      } else {
        const guest = await guestsCollection.insert({
          ...req.body,
          emailHash: guestEmailHash,
          companyName: req.body.companyName || null,
          source: 'MANUAL',
          status: 'RSVP',
        })

        return guest.flatMap(guest => subscribeGuest(guest))
      }
    }
  })()

  return guest
}