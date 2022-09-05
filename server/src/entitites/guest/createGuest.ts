import { WithId } from 'mongodb'
import { Guest } from '../../../../shared/models/Guest'
import { Result } from '../../../../shared/Result'
import { Path } from '../../routing/Path'
import { Request } from '../../routing/Router'
import { ServerError } from '../../ServerError'
import { guestsCollection } from './guestsCollection'

export const createGuestPath = Path.start()

export function createGuest(
  req: Request<unknown, unknown, Guest>,
): Promise<Result<ServerError, WithId<Guest>>> {
  return guestsCollection.insert(req.body)
}
