import {
  GuestCreationInput,
  hashGuestEmail,
} from '../../../../shared/models/Guest'
import { Result } from '../../../../shared/Result'
import { expectResult } from '../../../../shared/testUtils'
import { ServerError } from '../../ServerError'
import { createGuest } from './createGuest'
import { guestsCollection } from './guestsCollection'

const mailchimpKnownEmail = 'known-email@example.com'
const knownEmailHash = hashGuestEmail(mailchimpKnownEmail)

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const getListMember = jest.fn((_listId: string, emailHash: string) => {
  if (emailHash === knownEmailHash) {
    return Promise.resolve({
      status: 'subscribed',
      email_address: 'known-email@example.com',
      merge_fields: {
        FNAME: 'First name',
        LNAME: 'Last name',
        AZIENDA: 'Company name',
      },
    })
  } else {
    return Promise.reject(new Error('Not found'))
  }
})

jest.mock('../../resources/mailchimp', function () {
  return {
    mailchimp: {
      use: jest.fn(
        <T>(op: (guest: unknown) => Promise<T>): Promise<T> =>
          op({
            lists: {
              getListMember,
            },
          }),
      ),
    },
  }
})

describe('createGuest', () => {
  const data: GuestCreationInput = {
    firstName: 'John',
    lastName: 'Doe',
    email: 'john.doe@example.com',
    companyName: 'ACME Inc.',
    accountManager: null,
  }

  afterEach(() =>
    guestsCollection.raw(collection =>
      Result.tryCatch(
        () => collection.deleteMany({}),
        () => new ServerError(500, 'Unable to clear guests collection'),
      ),
    ),
  )

  it('should return a guest if found on MailChimp', async () => {
    getListMember.mockClear()

    const result = await createGuest({
      params: {},
      query: {},
      body: { ...data, email: mailchimpKnownEmail },
    })

    expect(getListMember).toHaveBeenCalled()
    expectResult(result).toHaveSucceeded()
    expect(result.unsafeGetValue().firstName).toBe('First name')
    expect(result.unsafeGetValue().lastName).toBe('Last name')
  })

  it('should return a guest if found on local database', async () => {
    const insertionResult = await guestsCollection.insert({
      ...data,
      companyName: data.companyName || null,
      emailHash: hashGuestEmail(data.email),
      source: 'RSVP',
      status: 'RSVP',
    })

    expectResult(insertionResult).toHaveSucceeded()

    const result = await createGuest({
      params: {},
      query: {},
      body: data,
    })

    expectResult(result).toHaveSucceeded()
    expect(result.unsafeGetValue().source).toBe('RSVP')
    expect(result.unsafeGetValue().status).toBe('RSVP')
  })

  it('should create a new guest if not found', async () => {
    const result = await createGuest({
      params: {},
      query: {},
      body: data,
    })

    expectResult(result).toHaveSucceeded()
    expect(result.unsafeGetValue().source).toBe('MANUAL')
    expect(result.unsafeGetValue().status).toBe('RSVP')
  })
})
