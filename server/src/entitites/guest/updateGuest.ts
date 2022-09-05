import { ObjectId, WithId } from 'mongodb'
import { Guest } from '../../../../shared/models/Guest'
import { Result } from '../../../../shared/Result'
import { ObjectIdPath, Path } from '../../routing/Path'
import { Request } from '../../routing/Router'
import { ServerError } from '../../ServerError'
import { guestsCollection } from './guestsCollection'

export const updateGuestPath = Path.start().param<ObjectIdPath>('_id')

export async function updateGuest(
  req: Request<ObjectIdPath, unknown, Guest>,
): Promise<Result<ServerError, WithId<Guest>>> {
  const _id = await Result.tryCatch(
    () => new ObjectId(req.params._id),
    () => new ServerError(400, `Invalid ObjectId: ${req.params._id}`),
  )

  return _id.flatMap(async _id => guestsCollection.update(_id, req.body))
}
