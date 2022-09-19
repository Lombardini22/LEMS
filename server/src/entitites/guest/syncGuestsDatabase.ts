import { Guest, hashGuestEmail } from '../../../../shared/models/Guest'
import { Result } from '../../../../shared/Result'
import { constVoid } from '../../../../shared/utils'
import { database } from '../../resources/database'
import { env } from '../../resources/env'
import { ServerError } from '../../ServerError'
import {
  createGuestsCollectionIndexes,
  guestsCollection,
  UNIQUE_EMAIL_HASH_INDEX_NAME,
} from './guestsCollection'
import { fetchMailchimpMembers } from './utils/fetchMailchimpMembers'

interface CleanResponse {
  deleted: number
}

interface UpsertResponse {
  success: true
}

export function cleanGuestsDatabase(): Promise<
  Result<ServerError, CleanResponse>
> {
  return env.use(async env => {
    const mailchimpMembers = await fetchMailchimpMembers(
      env.MAILCHIMP_EVENT_LIST_ID,
    )

    const result = await mailchimpMembers.flatMap(members =>
      guestsCollection.raw(collection =>
        Result.tryCatch(
          () =>
            collection.deleteMany({
              email: { $nin: members.map(_ => _.email_address) },
            }),
          error =>
            new ServerError(500, 'Unable to clean guests database', {
              error,
            }),
        ),
      ),
    )

    return result.flatMap(result => {
      if (!result.acknowledged) {
        return Result.failure(
          () =>
            new ServerError(
              500,
              'Clean operation was not aknowledged by database',
            ),
        )
      } else {
        return Result.success(() => ({ deleted: result.deletedCount }))
      }
    })
  })
}

export function upsertGuestsDatabase(): Promise<
  Result<ServerError, UpsertResponse>
> {
  return env.use(async env => {
    const mailchimpMembers = await fetchMailchimpMembers(
      env.MAILCHIMP_EVENT_LIST_ID,
    )

    const tmpCollectionName = 'tmp_guests_sync'

    return mailchimpMembers.flatMap(members =>
      database.use(async db => {
        const guestsHasIndex = await guestsCollection.raw(collection =>
          Result.tryCatch(
            () => collection.indexExists(UNIQUE_EMAIL_HASH_INDEX_NAME),
            error =>
              new ServerError(
                500,
                'Unable to verify index on guests collection',
                { error },
              ),
          ),
        )

        const indexCreationResult = await guestsHasIndex.flatMap(
          guestsHasIndex => {
            if (!guestsHasIndex) {
              return guestsCollection.raw(createGuestsCollectionIndexes)
            } else {
              return Result.success(constVoid)
            }
          },
        )

        const insertionResult = await indexCreationResult.flatMap(() =>
          Result.tryCatch(
            () => {
              const now = new Date()

              return db.collection(tmpCollectionName).insertMany(
                members.map(
                  (member): Guest => ({
                    firstName: member.merge_fields.FNAME,
                    lastName: member.merge_fields.LNAME,
                    email: member.email_address,
                    emailHash: hashGuestEmail(member.email_address),
                    companyName: member.merge_fields.MMERGE4 || null,
                    accountManager: null,
                    source: 'SYNC',
                    status: 'RSVP',
                    createdAt: now,
                    updatedAt: now,
                  }),
                ),
              )
            },
            error =>
              new ServerError(
                500,
                'Unable to create temporary collection for upserting',
                { error },
              ),
          ),
        )

        const upsertResult = await insertionResult.flatMap(() =>
          Result.tryCatch(
            () =>
              db
                .collection(tmpCollectionName)
                .aggregate([
                  {
                    $merge: {
                      into: guestsCollection.name,
                      on: 'emailHash',
                      whenMatched: [
                        {
                          $set: {
                            firstName: '$$new.firstName',
                            lastName: '$$new.lastName',
                            companyName: '$$new.companyName',
                            updatedAt: '$$new.updatedAt',
                          },
                        },
                      ],
                      whenNotMatched: 'insert',
                    },
                  },
                ])
                .toArray(),
            error =>
              new ServerError(500, 'Unable to perform upsert aggregation', {
                error,
              }),
          ),
        )

        // This needs to happen no matter which failures happened, and we don't care if it fails. We just
        // really need to drop the temporary collection
        await db.collection(tmpCollectionName).drop()

        return upsertResult.map(() => ({ success: true }))
      }),
    )
  })
}