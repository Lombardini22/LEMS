import { Collection } from '../../database/Collection'
import {
  Collection as MongoCollection,
  OptionalId,
  OptionalUnlessRequiredId,
  WithId,
} from 'mongodb'
import { Guest } from '../../../../shared/models/Guest'
import { Result } from '../../../../shared/Result'
import { ServerError } from '../../ServerError'
import { constVoid } from '../../../../shared/utils'
import { env } from '../../resources/env'
import { isSameDay } from '../../utils'

export const UNIQUE_EMAIL_INDEX_NAME = 'uniqueEmail'
export const UNIQUE_EMAIL_HASH_INDEX_NAME = 'uniqueEmailHash'

class GuestsCollection extends Collection<Guest> {
  override insert(
    doc: OptionalId<Omit<Guest, 'createdAt' | 'updatedAt'>>,
  ): Promise<Result<ServerError, WithId<Guest>>>
  override insert(
    docs: OptionalId<Omit<Guest, 'createdAt' | 'updatedAt'>>[],
  ): Promise<Result<ServerError, WithId<Guest>[]>>
  override async insert(
    doc:
      | OptionalUnlessRequiredId<Omit<Guest, 'createdAt' | 'updatedAt'>>
      | OptionalUnlessRequiredId<Omit<Guest, 'createdAt' | 'updatedAt'>>[],
  ): Promise<Result<ServerError, WithId<Guest> | WithId<Guest>[]>> {
    const isDocsArray = Array.isArray(doc)
    const docs = isDocsArray ? doc : [doc]

    const result = await env.use(env => {
      const eventDate = new Date(env.EVENT_ISO_DATE)
      const now = new Date()

      return super.insert(
        docs.map(doc => ({
          ...doc,
          status: isSameDay(eventDate, now) ? 'CHECKED_IN' : doc.status,
        })),
      )
    })

    if (isDocsArray) {
      return result
    } else {
      const singleDocResult = await result.map(docs => docs[0])

      return singleDocResult.flatMap(doc => {
        if (!doc) {
          return Result.failure(
            () => new ServerError(500, 'Unable to insert guest', { result }),
          )
        } else {
          return Result.success(() => doc)
        }
      })
    }
  }
}

export const guestsCollection = new GuestsCollection(
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
