import { hashGuestEmail } from '../../../../shared/models/Guest'
import { Result } from '../../../../shared/Result'
import { expectResult } from '../../../../shared/testUtils'
import { constVoid } from '../../../../shared/utils'
import { env } from '../../resources/env'
import { ServerError } from '../../ServerError'
import { guestsCollection } from './guestsCollection'
import { cleanGuestsDatabase, upsertGuestsDatabase } from './syncGuestsDatabase'
import { MembersListResult } from './utils/fetchMailchimpMembers'

const getListMembersInfo = jest.fn(
  (
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _listId: string,
    options: { count: number; offset?: number },
  ): Promise<MembersListResult> =>
    Promise.resolve({
      members: [
        options.offset
          ? {
              email_address: 'mailchimp-user1@example.com',
              merge_fields: {
                FNAME: 'MailChimp',
                LNAME: 'User1',
                MMERGE4: 'MailChimp Inc',
              },
            }
          : {
              email_address: 'mailchimp-user2@example.com',
              merge_fields: {
                FNAME: 'MailChimp',
                LNAME: 'User2',
                MMERGE4: 'MailChimp Inc',
              },
            },
      ],
      total_items: 2,
    }),
)

jest.mock('../../resources/mailchimp', () => ({
  mailchimp: {
    use: <T>(op: (mailchimp: any) => T): T => {
      return op({
        lists: {
          getListMembersInfo,
        },
      })
    },
  },
}))

describe('syncGuestsDatabase', () => {
  afterEach(() =>
    guestsCollection.raw(collection =>
      Result.tryCatch(
        () => collection.deleteMany({}),
        error =>
          new ServerError(500, 'Unable to clean guests collection', { error }),
      ),
    ),
  )

  it('should create guests that are on MailChimp but not on local DB', () =>
    env.use(async env => {
      const result = await upsertGuestsDatabase({
        body: {
          secret: env.SYNC_SECRET,
        },
        params: {},
        query: {},
      })

      expectResult(result).toHaveSucceeded()

      const guests = await guestsCollection.raw(collection =>
        Result.tryCatch(
          () =>
            collection
              .find({
                email: {
                  $in: [
                    'mailchimp-user1@example.com',
                    'mailchimp-user2@example.com',
                  ],
                },
              })
              .toArray(),
          () => new ServerError(500, 'Unable to find guests after sync'),
        ),
      )

      const emails = await guests.map(guests =>
        guests.map(guest => guest.email),
      )

      expectResult(emails).toHaveSucceededWith([
        'mailchimp-user2@example.com',
        'mailchimp-user1@example.com',
      ])

      return Result.success(constVoid)
    }))

  it('should return guests that are on local DB but not on MailChimp', () =>
    env.use(async env => {
      const oldGuestInsertion = await guestsCollection.insert({
        firstName: 'Old',
        lastName: 'Guest',
        email: 'old-guest@example.com',
        emailHash: hashGuestEmail('old-guest@example.com'),
        companyName: null,
        accountManager: null,
        source: 'MANUAL',
        status: 'RSVP',
      })

      expectResult(oldGuestInsertion).toHaveSucceeded()

      const oldGuest = oldGuestInsertion.unsafeGetValue()

      const result = await cleanGuestsDatabase({
        body: {
          secret: env.SYNC_SECRET,
          delete: false,
        },
        params: {},
        query: {},
      })

      expectResult(result).toHaveSucceededWith([oldGuest])

      return Result.success(constVoid)
    }))

  it('should delete guests that are on local DB but not on MailChimp', () =>
    env.use(async env => {
      const oldGuestInsertion = await guestsCollection.insert({
        firstName: 'Old',
        lastName: 'Guest',
        email: 'old-guest@example.com',
        emailHash: hashGuestEmail('old-guest@example.com'),
        companyName: null,
        accountManager: null,
        source: 'MANUAL',
        status: 'RSVP',
      })

      expectResult(oldGuestInsertion).toHaveSucceeded()
      const _id = oldGuestInsertion.unsafeGetValue()._id

      const result = await cleanGuestsDatabase({
        body: {
          secret: env.SYNC_SECRET,
          delete: true,
        },
        params: {},
        query: {},
      })

      expectResult(result).toHaveSucceededWith({ deleted: 1 })

      const oldGuestAfterSync = await guestsCollection.findById(_id)

      expectResult(oldGuestAfterSync).toHaveFailedWith(
        new ServerError(404, 'Document not found'),
      )

      return Result.success(constVoid)
    }))

  it('should update guests that are on local DB and on MailChimp', () =>
    env.use(async env => {
      const existingGuestInsertion = await guestsCollection.insert({
        firstName: 'Existing',
        lastName: 'Guest',
        email: 'mailchimp-user1@example.com',
        emailHash: hashGuestEmail('mailchimp-user1@example.com'),
        companyName: null,
        accountManager: null,
        source: 'RSVP',
        status: 'RSVP',
      })

      expectResult(existingGuestInsertion).toHaveSucceeded()

      const _id = existingGuestInsertion.unsafeGetValue()._id

      const result = await upsertGuestsDatabase({
        body: {
          secret: env.SYNC_SECRET,
        },
        params: {},
        query: {},
      })

      expectResult(result).toHaveSucceeded()

      const existingGuestAfterSync = await guestsCollection.findById(_id)

      expectResult(existingGuestAfterSync).toHaveSucceededWith(
        expect.objectContaining({
          _id,
          firstName: 'MailChimp',
          lastName: 'User1',
          companyName: 'MailChimp Inc',
          email: 'mailchimp-user1@example.com',
          emailHash: hashGuestEmail('mailchimp-user1@example.com'),
          accountManager: null,
          source: 'RSVP',
          status: 'RSVP',
        }),
      )

      return Result.success(constVoid)
    }))
})
