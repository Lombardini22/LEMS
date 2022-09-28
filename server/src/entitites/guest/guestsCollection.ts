import { Collection } from '../../database/Collection'
import { Collection as MongoCollection } from 'mongodb'
import { Guest } from '../../../../shared/models/Guest'
import { Result } from '../../../../shared/Result'
import { ServerError } from '../../ServerError'
import { constVoid } from '../../../../shared/utils'

export const UNIQUE_EMAIL_INDEX_NAME = 'uniqueEmail'
export const UNIQUE_EMAIL_HASH_INDEX_NAME = 'uniqueEmailHash'

export const guestsCollection = new Collection<Guest>(
  'guests',
  createGuestsCollectionIndexes,
)

export async function createGuestsCollectionIndexes(
  collection: MongoCollection<Guest>,
): Promise<Result<ServerError, void>> {
  const indexInsertionResult = await Result.tryCatch(
    () =>
      collection.createIndexes([
        {
          key: { emailHash: 1 },
          unique: true,
          name: UNIQUE_EMAIL_HASH_INDEX_NAME,
        },
        {
          key: { email: 1 },
          unique: true,
          name: UNIQUE_EMAIL_INDEX_NAME,
        },
      ]),
    () => new ServerError(500, 'Unable to create index on guests collection'),
  )

  return indexInsertionResult.map(constVoid)
}
