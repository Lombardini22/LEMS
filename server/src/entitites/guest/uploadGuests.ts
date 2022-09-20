import {
  Guest,
  hashGuestEmail,
  UploadGuestsFileContent,
  UploadGuestsResult,
} from '../../../../shared/models/Guest'
import { Result } from '../../../../shared/Result'
import { NoTimestamps } from '../../database/Collection'
import { env } from '../../resources/env'
import { mailchimp } from '../../resources/mailchimp'
import { Path } from '../../routing/Path'
import { Request } from '../../routing/Router'
import { ServerError } from '../../ServerError'
import { guestsCollection } from './guestsCollection'
import { guestToMailchimpListMember } from './utils/subscribeGuest'

export const uploadGuestsPath = Path.start().literal('upload')

export function uploadGuests(
  req: Request<unknown, unknown, UploadGuestsFileContent>,
): Promise<Result<ServerError, UploadGuestsResult>> {
  const data = UploadGuestsFileContent.safeParse(req.body)

  if (data.success) {
    return env.use(env =>
      mailchimp.use(async mailchimp => {
        const mailchimpResult = await Result.tryCatch(
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
            new ServerError(
              500,
              'Unable to get current guests from MailChimp API',
              { error },
            ),
        )

        const mailchimpResultAfterLocalInsertion =
          await mailchimpResult.flatMap(async mailchimpResponse => {
            const insertResult = await guestsCollection.insert(
              data.data.map(
                (guest): NoTimestamps<Guest> => ({
                  ...guest,
                  companyName: guest.companyName || null,
                  emailHash: hashGuestEmail(guest.email),
                  source: 'UPLOAD',
                  status: 'RSVP',
                  accountManager: null,
                }),
              ),
            )

            return insertResult.map(() => mailchimpResponse)
          })

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
