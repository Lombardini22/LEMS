import { WithId } from 'mongodb'
import { Guest, hashGuestEmail } from '../../../../shared/models/Guest'
import { Result } from '../../../../shared/Result'
import { constVoid } from '../../../../shared/utils'
import { database } from '../../resources/database'
import { env } from '../../resources/env'
import { mailchimp } from '../../resources/mailchimp'
import { Path } from '../../routing/Path'
import { Request } from '../../routing/Router'
import { ServerError } from '../../ServerError'
import {
  createGuestsCollectionIndexes,
  guestsCollection,
  UNIQUE_EMAIL_HASH_INDEX_NAME,
} from './guestsCollection'
import { fetchMailchimpMembers } from './utils/fetchMailchimpMembers'
import { MailchimpBatchListMembersResponse } from './utils/mailchimpTypes'

interface SyncSecretInput {
  secret: string
}

interface CleanShowTargetInput extends SyncSecretInput {
  delete: false
}

interface CleanDeleteInput extends SyncSecretInput {
  delete: true
}

interface CleanResponse {
  deleted: number
}

interface UpsertResponse {
  success: true
}

interface SyncTagInput extends SyncSecretInput {
  tag?: string
}

export const cleanGuestsDatabasePath = Path.start()
  .literal('sync')
  .literal('clean')

export const upsertGuestsDatabasePath = Path.start()
  .literal('sync')
  .literal('upsert')

export const syncMailchimpTagPath = Path.start().literal('sync').literal('tags')

export async function cleanGuestsDatabase(
  request: Request<unknown, unknown, CleanShowTargetInput>,
): Promise<Result<ServerError, WithId<Guest>[]>>
export async function cleanGuestsDatabase(
  request: Request<unknown, unknown, CleanDeleteInput>,
): Promise<Result<ServerError, CleanResponse>>
export async function cleanGuestsDatabase(
  request: Request<unknown, unknown, CleanShowTargetInput | CleanDeleteInput>,
): Promise<Result<ServerError, CleanResponse | WithId<Guest>[]>> {
  const guardResult = await verifySecretRequest(request)

  return guardResult.flatMap(() =>
    env.use(async env => {
      const mailchimpMembers =
        await fetchMailchimpMembers<MailchimpEventListMember>(
        env.MAILCHIMP_EVENT_LIST_ID,
      )

      if (request.body.delete) {
        const result = await mailchimpMembers.flatMap(members =>
          guestsCollection.raw(collection =>
            Result.tryCatch(
              () =>
                collection.deleteMany({
                  emailHash: {
                    $nin: members.map(_ => hashGuestEmail(_.email_address)),
                  },
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
      } else {
        return mailchimpMembers.flatMap(members =>
          guestsCollection.raw(collection =>
            Result.tryCatch(
              () =>
                collection
                  .find({
                    emailHash: {
                      $nin: members.map(_ => hashGuestEmail(_.email_address)),
                    },
                  })
                  .toArray(),
              error =>
                new ServerError(500, 'Unable to clean guests database', {
                  error,
                }),
            ),
          ),
        )
      }
    }),
  )
}

export async function upsertGuestsDatabase(
  request: Request<unknown, unknown, SyncSecretInput>,
): Promise<Result<ServerError, UpsertResponse>> {
  const guardResult = await verifySecretRequest(request)

  return guardResult.flatMap(() =>
    env.use(async env => {
      const mailchimpMembers =
        await fetchMailchimpMembers<MailchimpEventListMember>(
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
                              email: '$$new.email',
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

          // This needs to happen no matter which failures happened, and we don't care if it fails
          // We just really need to drop the temporary collection
          await db.collection(tmpCollectionName).drop()

          return upsertResult.map(() => ({ success: true }))
        }),
      )
    }),
  )
}

export async function syncMailchimpTag(
  request: Request<unknown, unknown, SyncTagInput>,
): Promise<Result<ServerError, MailchimpBatchListMembersResponse>> {
  const guardResult = await verifySecretRequest(request)

  return guardResult.flatMap(() =>
    env.use(env =>
      mailchimp.use(async mailchimp => {
        const tag = request.body.tag || env.MAILCHIMP_RSVP_TAG_NAME

        const members = await fetchMailchimpMembers<MailchimpEventListMember>(
          env.MAILCHIMP_EVENT_LIST_ID,
        )

        const result: Result<ServerError, MailchimpBatchListMembersResponse> =
          await members.flatMap(members =>
            Result.tryCatch(
              () =>
                // Not typed in MailChimp lib, but this exists
                // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                // @ts-ignore
                mailchimp.lists.batchListMembers(
                  env.MAILCHIMP_DATABASE_LIST_ID,
                  {
                    members: members.map(member => ({
                      email_address: member.email_address,
                      tags: [tag],
                    })),
                    skip_merge_validation: true,
                    update_existing: true,
                  },
                ),
              error =>
                new ServerError(500, 'Unable to add tags to MailChimp list', {
                  error,
                  tag,
                }),
            ),
          )

        return result
      }),
    ),
  )
}

function verifySecretRequest(
  request: Request<unknown, unknown, SyncSecretInput>,
): Promise<Result<ServerError, void>> {
  return env.use(env => {
    if (request.body.secret === env.SYNC_SECRET) {
      return Result.success(constVoid)
    } else {
      return Result.failure(() => new ServerError(401, 'Invalid credentials'))
    }
  })
}
