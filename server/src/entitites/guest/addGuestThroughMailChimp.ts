import { Result } from '../../../../shared/Result'
import { mailchimp } from '../../resources/mailchimp'
import { Request } from '../../routing/Router'
import { ServerError } from '../../ServerError'
import { guestsCollection } from './guestsCollection'
import { WithId } from 'mongodb'
import { Guest, hashGuestEmail } from '../../../../shared/models/Guest'
import { Path } from '../../routing/Path'
import { env } from '../../resources/env'
import { isMailchimpMembersSuccessResponse } from './utils/isMailchimpMembersSuccessResponse'
import { subscribeGuest } from './utils/subscribeGuest'
import { NoTimestamps } from '../../database/Collection'

type AddGuestThroughMailChimpParams = {
  email: string
}

export const addGuestThroughMailChimpPath = Path.start()
  .param<AddGuestThroughMailChimpParams>('email')
  .literal('rsvp')

export function addGuestThroughMailChimp(
  req: Request<AddGuestThroughMailChimpParams>,
): Promise<Result<ServerError, WithId<Guest>>> {
  return env.use(env =>
    mailchimp.use(async mailchimp => {
      const sourceListId = env.MAILCHIMP_DATABASE_LIST_ID
      const { email } = req.params
      const emailHash = hashGuestEmail(email)

      const response = await Result.tryCatch(
        () => mailchimp.lists.getListMember(sourceListId, emailHash),
        error =>
          new ServerError(404, 'MailChimp subscriber not found', {
            error,
            sourceListId,
            email,
          }),
      )

      const guestData = await response.flatMap(response => {
        if (isMailchimpMembersSuccessResponse(response)) {
          return Result.success(() => response)
        } else {
          return Result.failure(
            () =>
              new ServerError(
                500,
                'Error in getting subscriber from MailChimp',
                {
                  response,
                },
              ),
          )
        }
      })

      const localGuest = await guestData.flatMap(async mcGuest => {
        if (!mcGuest.merge_fields['FNAME'] || !mcGuest.merge_fields['LNAME']) {
          return Result.failure(
            () =>
              new ServerError(500, 'Invalid data returned by MailChimp API', {
                guestData: mcGuest,
              }),
          )
        }

        const guestData: NoTimestamps<Guest> = {
          ...{
            firstName: mcGuest.merge_fields['FNAME'],
            lastName: mcGuest.merge_fields['LNAME'],
            email: mcGuest.email_address,
            emailHash,
            companyName: null,
            source: 'RSVP',
            status: 'RSVP',
            accountManager: null,
          },
          ...(mcGuest.merge_fields['MMERGE7']
            ? {
                companyName: mcGuest.merge_fields['MMERGE7'],
              }
            : {}),
        }

        const locallyExistingGuestResult = await guestsCollection.findOne({
          emailHash,
        })

        return locallyExistingGuestResult.fold<
          Result<ServerError, WithId<Guest>>
        >(
          async error => {
            if (error.status === 404) {
              const guest = await guestsCollection.insert(guestData)
              return guest.flatMap(guest => subscribeGuest(guest))
            } else {
              return locallyExistingGuestResult
            }
          },
          guest => guestsCollection.update({ _id: guest._id }, guestData),
        )
      })

      return localGuest
    }),
  )
}
