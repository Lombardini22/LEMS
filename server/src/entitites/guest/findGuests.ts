import { WithId } from 'mongodb'
import { Cursor } from '../../../../shared/Cursor'
import { Guest } from '../../../../shared/models/Guest'
import { Result } from '../../../../shared/Result'
import { CursorQueryPath, parseCursorQueryPath, Path } from '../../routing/Path'
import { Request } from '../../routing/Router'
import { ServerError } from '../../ServerError'
import { guestsCollection } from './guestsCollection'

type FindGuestsPath = CursorQueryPath & {
  searchField?: string
}

export const findGuestsPath = Path.start().withQuery<FindGuestsPath>()

export function findGuests(
  req: Request<unknown, FindGuestsPath, unknown>,
): Promise<Result<ServerError, Cursor<WithId<Guest>>>> {
  const searchField = req.query.searchField || 'fullName'

  const findGuestsFn = guestsCollection.find(searchField, [
    {
      $addFields: {
        fullName: {
          $concat: ['$firstName', ' ', '$lastName'],
        },
      },
    },
  ])

  const query = parseCursorQueryPath(req.query)

  return findGuestsFn(query)
}
