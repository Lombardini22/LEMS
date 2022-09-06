import { WithId } from 'mongodb'
import { Cursor } from '../../../../shared/Cursor'
import { Guest } from '../../../../shared/models/Guest'
import { Result } from '../../../../shared/Result'
import { CursorQueryPath, parseCursorQueryPath, Path } from '../../routing/Path'
import { Request } from '../../routing/Router'
import { ServerError } from '../../ServerError'
import { guestsCollection } from './guestsCollection'

export const findGuestsPath = Path.start().withQuery<CursorQueryPath>()

const findGuestsFn = guestsCollection.find('fullName', [
  {
    $addFields: {
      fullName: {
        $concat: ['$firstName', ' ', '$lastName'],
      },
    },
  },
])

export function findGuests(
  req: Request<unknown, CursorQueryPath, unknown>,
): Promise<Result<ServerError, Cursor<WithId<Guest>>>> {
  const query = parseCursorQueryPath(req.query)
  return findGuestsFn(query)
}
