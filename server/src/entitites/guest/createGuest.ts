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

export const createGuestPath = Path.start()

export async function createGuest(
  req: Request<unknown, unknown, GuestCreationInput>,
): Promise<Result<ServerError, WithId<Guest>>> {
  const result = await guestsCollection.insert({
    ...req.body,
    emailHash: hashGuestEmail(req.body.email),
    source: 'MANUAL',
  })

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
