import { WithId } from 'mongodb'
import { Guest } from '../../../../shared/models/Guest'
import { Result } from '../../../../shared/Result'
import { Path } from '../../routing/Path'
import { Request } from '../../routing/Router'
import { ServerError } from '../../ServerError'
import { guestsCollection } from './guestsCollection'

type FindGuestParams = {
  emailHash: string
}

export const findGuestPath = Path.start().param<FindGuestParams>('emailHash')

export async function findGuest(
  req: Request<FindGuestParams>,
): Promise<Result<ServerError, WithId<Guest>>> {
  return guestsCollection.findOne({ emailHash: req.params.emailHash })
}
