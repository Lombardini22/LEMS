import { findGuest } from './findGuest'
import { expectResult } from '../../../../shared/testUtils'
import { ObjectId } from 'mongodb'
import { hashGuestEmail } from '../../../../shared/models/Guest'
import { guestsCollection } from './guestsCollection'
import { expectT } from '../../testUtils'
import { env } from '../../resources/env'
import { Result } from '../../../../shared/Result'
import { ServerError } from '../../ServerError'

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const getListMember = jest.fn(async (listId: string, _emailHash: string) => {
  const result = await env.use(env => {
    if (listId === env.MAILCHIMP_DATABASE_LIST_ID) {
      return Result.success(() => ({
        status: 'subscribed',
        email_address: 'mailchimp.user@example.com',
        merge_fields: {
          FNAME: 'First name',
          LNAME: 'Last name',
          MMERGE7: 'Company name',
        },
      }))
    } else {
      return Result.failure(() => new ServerError(404, 'Not found'))
    }
  })

  if (result.isSuccess()) {
    return Promise.resolve(result.unsafeGetValue())
  } else {
    return Promise.reject(result.unsafeGetError())
  }
})

jest.mock('../../resources/mailchimp', function () {
  return {
    mailchimp: {
      use: jest.fn(
        <T>(op: (guest: unknown) => Promise<T>): Promise<T> =>
          op({ lists: { getListMember } }),
      ),
    },
  }
})

describe('addGuestThroughMailChimp', () => {
  afterEach(() =>
    guestsCollection.raw(collection =>
      Result.tryCatch(
        () => collection.deleteMany({}),
        error =>
          new ServerError(500, 'Unable to clean guests collection', { error }),
      ),
    ),
  )

  it('should work', async () => {
    return env.use(async env => {
      const result = await findGuest({
        params: { email: 'mailchimp.user@example.com' },
        query: {},
        body: {},
      })

      const emailHash = hashGuestEmail('mailchimp.user@example.com')

      expect(getListMember).toHaveBeenCalledTimes(1)

      expect(getListMember).toHaveBeenCalledWith(
        env.MAILCHIMP_DATABASE_LIST_ID,
        emailHash,
      )

      expectResult(result).toHaveSucceededWith({
        _id: expect.any(ObjectId),
        firstName: 'First name',
        lastName: 'Last name',
        email: 'mailchimp.user@example.com',
        emailHash,
        companyName: 'Company name',
        source: 'RSVP',
        status: 'RSVP',
        accountManager: null,
        createdAt: expect.any(Date),
        updatedAt: expect.any(Date),
      })

      return result
    })
  })

  it('should handle existing guests', async () => {
    const data = {
      email: 'email.address@example.com',
      emailHash: hashGuestEmail('email.address@example.com'),
      firstName: 'John',
      lastName: 'Doe',
      companyName: 'ACME Inc.',
      source: 'RSVP' as const,
      status: 'RSVP' as const,
      accountManager: null,
    }

    const insertionResult = await guestsCollection.insert(data)

    expectResult(insertionResult).toHaveSucceeded()

    const result = await findGuest({
      params: { email: 'mailchimp.user@example.com' },
      query: {},
      body: {},
    })

    expectResult(result).toHaveSucceeded()
    expectT(result.unsafeGetValue().firstName).toEqual('First name')
    expectT(result.unsafeGetValue().lastName).toEqual('Last name')
    expectT(result.unsafeGetValue().companyName).toEqual('Company name')
  })
})
