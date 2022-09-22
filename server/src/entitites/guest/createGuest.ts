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

  const localGuest = await guestsCollection.findOne({
    emailHash: guestEmailHash,
  })

  const subscriptionResult = await localGuest.fold<
    Result<ServerError, unknown>
  >(
    () =>
      subscribeGuest({
        firstName: req.body.firstName,
        lastName: req.body.lastName,
        email: req.body.email,
        emailHash: guestEmailHash,
        companyName: req.body.companyName || null,
      }),
    guest => Result.success(() => guest),
  )

  return subscriptionResult.flatMap(async () => {
    const referrerEmail = req.query.referrerEmail

    if (referrerEmail) {
      const referrer = await guestsCollection.findOne({
        emailHash: hashGuestEmail(referrerEmail),
      })

      return referrer.flatMap(async referrer => {
        if (localGuest.isSuccess()) {
          return guestsCollection.update({ emailHash: guestEmailHash }, {
            ...localGuest.unsafeGetValue(),
            ...req.body,
            source: 'REFERRER',
            referrerId: referrer._id,
          } as Guest)
        } else {
          return await guestsCollection.insert({
            ...req.body,
            emailHash: guestEmailHash,
            source: 'REFERRER',
            referrerId: referrer._id,
            status: 'RSVP',
          } as NoTimestamps<Guest>)
        }
      })
    } else {
      if (localGuest.isSuccess()) {
        return guestsCollection.update(
          { emailHash: guestEmailHash },
          {
            ...localGuest.unsafeGetValue(),
            ...req.body,
          },
        )
      } else {
        return guestsCollection.insert({
          ...req.body,
          emailHash: guestEmailHash,
          companyName: req.body.companyName || null,
          source: 'MANUAL',
          status: 'RSVP',
        })
      }
    }
  })
}
