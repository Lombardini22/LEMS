import { WithId } from 'mongodb'
import { Guest } from '../../../../shared/models/Guest'
import { Result } from '../../../../shared/Result'
import { Path } from '../../routing/Path'
import { Request } from '../../routing/Router'
import { ServerError } from '../../ServerError'
import { guestsCollection } from './guestsCollection'

type DeleteGuestParams = {
  emailHash: string
}

export const deleteGuestPath =
  Path.start().param<DeleteGuestParams>('emailHash')

export async function deleteGuest(
  req: Request<DeleteGuestParams>,
): Promise<Result<ServerError, WithId<Guest>>> {
  return guestsCollection.delete({ emailHash: req.params.emailHash })
}
