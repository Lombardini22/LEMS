import { hashGuestEmail } from '../../../../shared/models/Guest'
import { Result } from '../../../../shared/Result'
import { expectResult } from '../../../../shared/testUtils'
import { constVoid } from '../../../../shared/utils'
import { env } from '../../resources/env'
import { ServerError } from '../../ServerError'
import { expectT } from '../../testUtils'
import { addToWaitlist } from './addToWaitlist'
import { guestsCollection } from './guestsCollection'

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const getListMember = jest.fn(async (_listId: string, _emailHash: string) => ({
  status: 'subscribed',
  email_address: 'mailchimp.user@example.com',
  merge_fields: {
    FNAME: 'First name',
    LNAME: 'Last name',
    AZIENDA: 'Company name',
  },
}))

const updateListMemberTags = jest.fn(
  (
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _listId: string,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _emailHash: string,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _options: { tags: Array<{ name: string; status: 'active' }> },
  ) => Promise.resolve(),
)

jest.mock('../../resources/mailchimp', function () {
  return {
    mailchimp: {
      use: jest.fn(
        <T>(op: (guest: unknown) => Promise<T>): Promise<T> =>
          op({ lists: { getListMember, updateListMemberTags } }),
      ),
    },
  }
})

describe('addToWaitlist', () => {
  beforeEach(async () => {
    await guestsCollection.raw(collection =>
      Result.tryCatch(
        () => collection.deleteMany({}),
        error => new ServerError(500, 'Unable to cleanup database', { error }),
      ),
    )

    updateListMemberTags.mockClear()
  })

  it('should leave alone already existing guests', async () => {
    const insertionResult = await guestsCollection.insert({
      firstName: 'John',
      lastName: 'Doe',
      email: 'john.doe@example.com',
      emailHash: hashGuestEmail('john.doe@example.com'),
      companyName: null,
      accountManager: null,
      source: 'RSVP',
      status: 'RSVP',
    })

    expectResult(insertionResult).toHaveSucceeded()

    const response = await addToWaitlist({
      query: {},
      body: {},
      params: { email: insertionResult.unsafeGetValue().email },
    })

    expectResult(response).toHaveSucceeded()
    expectT(response.unsafeGetValue().status).toEqual('RSVP')
    expect(updateListMemberTags).not.toHaveBeenCalled()
  })

  it('should set new guests to waiting and add tag to MailChimp', () => {
    return env.use(async env => {
      const response = await addToWaitlist({
        query: {},
        body: {},
        params: { email: 'mailchimp.user@example.com' },
      })

      expectResult(response).toHaveSucceeded()
      expectT(response.unsafeGetValue().status).toEqual('WAITING')
      expect(updateListMemberTags).toHaveBeenCalledTimes(1)
      expect(updateListMemberTags).toHaveBeenCalledWith(
        env.MAILCHIMP_DATABASE_LIST_ID,
        response.unsafeGetValue().emailHash,
        {
          tags: [
            {
              name: env.MAILCHIMP_WAITING_LIST_TAG_NAME,
              status: 'active',
            },
          ],
        },
      )

      return Result.success(constVoid)
    })
  })
})
