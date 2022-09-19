import { Collection } from '../../database/Collection'
import { Guest } from '../../../../shared/models/Guest'
import { Result } from '../../../../shared/Result'
import { ServerError } from '../../ServerError'
import { constVoid } from '../../../../shared/utils'

export const guestsCollection = new Collection<Guest>(
  'guests',
  async collection => {
    const indexInsertionResult = await Result.tryCatch(
      () =>
        collection.createIndexes([
          {
            key: { emailHash: 1 },
            unique: true,
            name: 'uniqueEmailHash',
          },
        ]),
      () => new ServerError(500, 'Unable to create index on guests collection'),
    )

    return indexInsertionResult.map(constVoid)
  },
)
