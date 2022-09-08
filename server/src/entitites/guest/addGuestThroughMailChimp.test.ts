import { addGuestThroughMailChimp } from './addGuestThroughMailChimp'
import { expectResult } from '../../../../shared/testUtils'
import { ObjectId } from 'mongodb'
import { Guest, hashGuestEmail } from '../../../../shared/models/Guest'
import { guestsCollection } from './guestsCollection'
import { expectT } from '../../testUtils'
import { env } from '../../resources/env'
import { Result } from '../../../../shared/Result'
import { constVoid } from '../../../../shared/utils'

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const getListMember = jest.fn((_listId: string, _emailHash: string) =>
  Promise.resolve({
    status: 'subscribed',
    email_address: 'email.address@example.com',
    merge_fields: {
      FNAME: 'First name',
      LNAME: 'Last name',
      MMERGE8: 'Company name',
    },
  }),
)

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const trigger = jest.fn((_triggerId, _stepId, _options) => Promise.resolve())

jest.mock('../../resources/mailchimp', function () {
  return {
    mailchimp: {
      use: jest.fn(
        <T>(op: (guest: unknown) => Promise<T>): Promise<T> =>
          op({
            lists: {
              getListMember,
            },
            customerJourneys: {
              trigger,
            },
          }),
      ),
    },
  }
})

describe('addGuestThroughMailChimp', () => {
  beforeEach(() => {
    trigger.mockClear()
  })

  it('should work', async () => {
    expect.assertions(5)

    const result = await addGuestThroughMailChimp({
      params: {
        listId: 'listId',
        email: 'email',
      },
      query: {},
      body: {},
    })

    const emailHash = hashGuestEmail('email')

    expect(getListMember).toHaveBeenCalledTimes(1)
    expect(getListMember).toHaveBeenCalledWith('listId', emailHash)

    expectResult(result).toHaveSucceededWith({
      _id: expect.any(ObjectId),
      firstName: 'First name',
      lastName: 'Last name',
      email: 'email.address@example.com',
      emailHash,
      companyName: 'Company name',
      source: 'RSVP',
    })

    expect(trigger).toHaveBeenCalledTimes(1)

    await env.use(env => {
      expect(trigger).toHaveBeenCalledWith(
        env.MAILCHIMP_JOURNEY_ID,
        env.MAILCHIMP_JOURNEY_TRIGGER_STEP_ID,
        { email_address: 'email.address@example.com' },
      )

      return Result.success(constVoid)
    })
  })

  it('should handle existing guests', async () => {
    const data: Guest = {
      email: 'email.address@example.com',
      emailHash: hashGuestEmail('email.address@example.com'),
      firstName: 'John',
      lastName: 'Doe',
      companyName: 'ACME Inc.',
      source: 'RSVP',
    }

    const insertionResult = await guestsCollection.insert(data)

    expectResult(insertionResult).toHaveSucceeded()

    const result = await addGuestThroughMailChimp({
      params: {
        listId: 'listId',
        email: 'email',
      },
      query: {},
      body: {},
    })

    expectResult(result).toHaveSucceeded()
    expectT(result.unsafeGetValue().firstName).toEqual('First name')
    expectT(result.unsafeGetValue().lastName).toEqual('Last name')
    expectT(result.unsafeGetValue().companyName).toEqual('Company name')
    expect(trigger).toHaveBeenCalledTimes(0)
  })
})
