import { Result } from '../../../../shared/Result'
import { env } from '../../resources/env'
import { ServerError } from '../../ServerError'
import { guestsCollection } from './guestsCollection'
import { fetchMailchimpMembers } from './utils/fetchMailchimpMembers'

interface CleanResponse {
  deleted: number
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
