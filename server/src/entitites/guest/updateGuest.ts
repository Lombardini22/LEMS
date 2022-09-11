import { WithId } from 'mongodb'
import { Guest } from '../../../../shared/models/Guest'
import { Result } from '../../../../shared/Result'
import { Path } from '../../routing/Path'
import { Request } from '../../routing/Router'
import { ServerError } from '../../ServerError'
import { guestsCollection } from './guestsCollection'

type UpdateGuestPath = { emailHash: string }

export const updateGuestPath = Path.start().param<UpdateGuestPath>('emailHash')

export async function updateGuest(
  req: Request<UpdateGuestPath, unknown, Guest>,
): Promise<Result<ServerError, WithId<Guest>>> {
  return guestsCollection.update({ emailHash: req.params.emailHash }, req.body)
}
