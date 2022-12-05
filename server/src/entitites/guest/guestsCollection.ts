import { Collection, NoTimestamps } from '../../database/Collection'
import {
  Collection as MongoCollection,
  Filter,
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
import { Server } from '../../resources/Server'
import {
  WebSocketEvent,
  WebSocketEventType,
} from '../../../../shared/WebSocketEvent'

export const UNIQUE_EMAIL_INDEX_NAME = 'uniqueEmail'
export const UNIQUE_EMAIL_HASH_INDEX_NAME = 'uniqueEmailHash'

class GuestsCollection extends Collection<Guest> {
  /**
   * Insert one or many Guests, setting the status to checked-in if the current event is already started
   * @param doc the Guest or guests to be inserted
   */
  override insert(
    doc: OptionalId<NoTimestamps<Guest>>,
  ): Promise<Result<ServerError, WithId<Guest>>>
  override insert(
    docs: OptionalId<NoTimestamps<Guest>>[],
  ): Promise<Result<ServerError, WithId<Guest>[]>>
  override async insert(
    doc:
      | OptionalUnlessRequiredId<NoTimestamps<Guest>>
      | OptionalUnlessRequiredId<NoTimestamps<Guest>>[],
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

    // This is a side effect, but we don't want to fail if the socket doesn't work
    await result.flatMap(guests =>
      GuestsCollection.sendWebSocketEvent('Insertion', guests),
    )

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

  override async update(
    filter: Filter<Guest>,
    doc: NoTimestamps<Guest>,
  ): Promise<Result<ServerError, WithId<Guest>>> {
    const result = await super.update(filter, doc)

    // This is a side effect, but we don't want to fail if the socket doesn't work
    await result.flatMap(guest =>
      GuestsCollection.sendWebSocketEvent('Update', [guest]),
    )

    return result
  }

  override async delete(
    filter: Filter<Guest>,
  ): Promise<Result<ServerError, WithId<Guest>>> {
    const result = await super.delete(filter)

    // This is a side effect, but we don't want to fail if the socket doesn't work
    await result.flatMap(guest =>
      GuestsCollection.sendWebSocketEvent('Deletion', [guest]),
    )

    return result
  }

  static sendWebSocketEvent<T extends WebSocketEventType>(
    type: T,
    data: WithId<Guest>[],
  ): Promise<Result<ServerError, void>> {
    return Server.useSocket(socket => {
      const event: WebSocketEvent<T, 'Guest', Guest> = {
        type,
        subject: 'Guest',
        data,
      }

      const didSocketWork = socket.emit('update', event)

      if (!didSocketWork) {
        console.error(
          `Unable to send event through WebSocket: ${JSON.stringify(event)}`,
        )
      }

      return Result.success(constVoid)
    })
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

export async function ensureGuestsCollectionIndex(): Promise<
  Result<ServerError, void>
> {
  const guestsHasIndex = await guestsCollection.raw(collection =>
    Result.tryCatch(
      () => collection.indexExists(UNIQUE_EMAIL_HASH_INDEX_NAME),
      error =>
        new ServerError(500, 'Unable to verify index on guests collection', {
          error,
        }),
    ),
  )

  return guestsHasIndex.flatMap(guestsHasIndex => {
    if (!guestsHasIndex) {
      return guestsCollection.raw(createGuestsCollectionIndexes)
    } else {
      return Result.success(constVoid)
    }
  })
}
