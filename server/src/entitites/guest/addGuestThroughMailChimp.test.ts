import { addGuestThroughMailChimp } from './addGuestThroughMailChimp'
import { expectResult } from '../../../../shared/testUtils'
import { ObjectId } from 'mongodb'
import { hashGuestEmail } from '../../../../shared/models/Guest'
import { guestsCollection } from './guestsCollection'
import { expectT } from '../../testUtils'
import { AddListMemberBody } from '@mailchimp/mailchimp_marketing'
import { env } from '../../resources/env'
import { Result } from '../../../../shared/Result'
import { ServerError } from '../../ServerError'

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const getListMember = jest.fn(async (listId: string, _emailHash: string) => {
  const result = await env.use(env => {
    if (listId === env.MAILCHIMP_DATABASE_LIST_ID) {
      return Result.success(() => ({
        status: 'subscribed',
        email_address: 'email.address@example.com',
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

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const addListMember = jest.fn((_listId: string, _data: AddListMemberBody) =>
  Promise.resolve({
    status: 'subscribed',
    email_address: 'email.address@example.com',
    merge_fields: {
      FNAME: 'First name',
      LNAME: 'Last name',
      MMERGE7: 'Company name',
    },
  }),
)

jest.mock('../../resources/mailchimp', function () {
  return {
    mailchimp: {
      use: jest.fn(
        <T>(op: (guest: unknown) => Promise<T>): Promise<T> =>
          op({
            lists: {
              getListMember,
              addListMember,
            },
          }),
      ),
    },
  }
})

describe('addGuestThroughMailChimp', () => {
  it('should work', async () => {
    return env.use(async env => {
      const result = await addGuestThroughMailChimp({
        params: { email: 'email' },
        query: {},
        body: {},
      })

      const emailHash = hashGuestEmail('email')

      expect(getListMember).toHaveBeenCalledTimes(2)

      expect(getListMember).toHaveBeenCalledWith(
        env.MAILCHIMP_DATABASE_LIST_ID,
        emailHash,
      )

      expect(getListMember).toHaveBeenCalledWith(
        env.MAILCHIMP_EVENT_LIST_ID,
        emailHash,
      )

      expect(addListMember).toHaveBeenCalledTimes(1)

      expect(addListMember).toHaveBeenCalledWith(env.MAILCHIMP_EVENT_LIST_ID, {
        email_address: 'email.address@example.com',
        merge_fields: {
          FNAME: 'First name',
          LNAME: 'Last name',
          MMERGE4: 'Company name',
        },
        status: 'subscribed',
      })

      expectResult(result).toHaveSucceededWith({
        _id: expect.any(ObjectId),
        firstName: 'First name',
        lastName: 'Last name',
        email: 'email.address@example.com',
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

    const result = await addGuestThroughMailChimp({
      params: { email: 'email' },
      query: {},
      body: {},
    })

    expectResult(result).toHaveSucceeded()
    expectT(result.unsafeGetValue().firstName).toEqual('First name')
    expectT(result.unsafeGetValue().lastName).toEqual('Last name')
    expectT(result.unsafeGetValue().companyName).toEqual('Company name')
  })
})
