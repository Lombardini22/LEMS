import { Guest, hashGuestEmail } from '../../../../shared/models/Guest'
import { Result } from '../../../../shared/Result'
import { database } from '../../resources/database'
import { env } from '../../resources/env'
import { mailchimp } from '../../resources/mailchimp'
import { ServerError } from '../../ServerError'
import { guestsCollection } from './guestsCollection'

interface SyncResponse {
  success: boolean
}

interface Member {
  email_address: string
  merge_fields: {
    FNAME: string
    LNAME: string
    MMERGE4?: string
  }
}

export interface MembersListResult {
  members: Member[]
  total_items: number
}

export function syncGuestsDatabase(): Promise<
  Result<ServerError, SyncResponse>
> {
  return env.use(env =>
    mailchimp.use(async mailchimp => {
      const getMailchimpMembers = async (
        accumulator: Member[],
        offset = 0,
      ): Promise<Result<ServerError, Member[]>> => {
        const currentPage: Result<ServerError, MembersListResult> =
          await Result.tryCatch(
            () =>
              // This call is not part of mailchimp types
              // eslint-disable-next-line @typescript-eslint/ban-ts-comment
              // @ts-ignore
              mailchimp.lists.getListMembersInfo(env.MAILCHIMP_EVENT_LIST_ID, {
                count: 200,
                offset,
              }),
            () => new ServerError(500, 'Unable to get memebers from MailChimp'),
          )

        return currentPage.flatMap(currentPage => {
          const result = [...accumulator, ...currentPage.members]

          if (result.length >= currentPage.total_items) {
            return Result.success(() => result)
          } else {
            return getMailchimpMembers(result, result.length)
          }
        })
      }

      const mailchimpMembers = await getMailchimpMembers([])

      return mailchimpMembers.flatMap(members =>
        database.use(async db => {
          const tmpCollectionName = 'guests_sync'

          const tmpCollectionInsertionResult = await Result.tryCatch(
            () =>
              db.collection(tmpCollectionName).insertMany(
                members.map(
                  (member): Guest => ({
                    ...{
                      firstName: member.merge_fields.FNAME,
                      lastName: member.merge_fields.LNAME,
                      companyName: member.merge_fields.MMERGE4 || null,
                      email: member.email_address,
                      emailHash: hashGuestEmail(member.email_address),
                      source: 'SYNC',
                      status: 'RSVP',
                      accountManager: null,
                      createdAt: new Date(),
                      updatedAt: new Date(),
                    },
                  }),
                ),
              ),
            error =>
              new ServerError(
                500,
                'Unable to create temporary collection for database sync',
                { error },
              ),
          )

          const syncResult = await tmpCollectionInsertionResult.flatMap(() =>
            Result.tryCatch(
              () =>
                db
                  .collection(tmpCollectionName)
                  .aggregate([
                    {
                      $out: {
                        db: env.MONGO_DB_NAME,
                        coll: guestsCollection.name,
                      },
                    },
                  ])
                  .toArray(),
              error =>
                new ServerError(500, 'Unable to sync database', { error }),
            ),
          )

          await syncResult.fold(
            error => console.log(error),
            result => console.log(result),
          )

          // TODO: see where to put this
          await db.collection(tmpCollectionName).drop()

          return await Result.success(() => ({
            success: true,
          }))
        }),
      )
    }),
  )
}
