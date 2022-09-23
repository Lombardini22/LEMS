import {
  Guest,
  hashGuestEmail,
  UploadGuestsFileContent,
  UploadGuestsResult,
} from '../../../../shared/models/Guest'
import { Result } from '../../../../shared/Result'
import { constVoid } from '../../../../shared/utils'
import { database } from '../../resources/database'
import { env } from '../../resources/env'
import { mailchimp } from '../../resources/mailchimp'
import { Path } from '../../routing/Path'
import { Request } from '../../routing/Router'
import { ServerError } from '../../ServerError'
import { MailchimpBatchListMembersResponse } from './utils/mailchimpTypes'
import {
  createGuestsCollectionIndexes,
  guestsCollection,
  UNIQUE_EMAIL_HASH_INDEX_NAME,
} from './guestsCollection'
import { guestToMailchimpListMember } from './utils/subscribeGuest'

export const uploadGuestsPath = Path.start().literal('upload')

export function uploadGuests(
  req: Request<unknown, unknown, UploadGuestsFileContent>,
): Promise<Result<ServerError, UploadGuestsResult>> {
  const data = UploadGuestsFileContent.safeParse(req.body)

  if (data.success) {
    return env.use(env =>
      mailchimp.use(async mailchimp => {
        const mailchimpResult: Result<
          ServerError,
          MailchimpBatchListMembersResponse
        > = await Result.tryCatch(
          () =>
            // Not typed in MailChimp lib, but this exists
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore
            mailchimp.lists.batchListMembers(env.MAILCHIMP_EVENT_LIST_ID, {
              members: data.data.map(guest =>
                guestToMailchimpListMember({
                  ...guest,
                  emailHash: hashGuestEmail(guest.email),
                  companyName: guest.companyName || null,
                }),
              ),
              update_existing: true,
            }),
          error =>
            new ServerError(500, 'Unable to sync guests with MailChimp API', {
              error,
            }),
        )

        const tmpCollectionName = 'tmp_guests_upload'

        const mailchimpResultAfterLocalInsertion =
          await mailchimpResult.flatMap(async mailchimpResponse =>
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
                      data.data.map(
                        (guest): Guest => ({
                          firstName: guest.firstName,
                          lastName: guest.lastName,
                          email: guest.email,
                          emailHash: hashGuestEmail(guest.email),
                          companyName: guest.companyName || null,
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
                    new ServerError(
                      500,
                      'Unable to perform upsert aggregation',
                      {
                        error,
                      },
                    ),
                ),
              )

              // This needs to happen no matter which failures happened, and we don't care if it fails.
              // We just really need to drop the temporary collection
              await db.collection(tmpCollectionName).drop()

              return upsertResult.map(() => mailchimpResponse)
            }),
          )

        return mailchimpResultAfterLocalInsertion.map(response => ({
          processedCount: data.data.length,
          uploadedCount: response.total_created + response.total_updated,
          createdCount: response.total_created,
          updatedCount: response.total_updated,
          errorsCount: response.error_count,
          errors: response.errors,
        }))
      }),
    )
  } else {
    return Result.failure(
      () => new ServerError(400, 'Invalid data format', { error: data.error }),
    )
  }
}
