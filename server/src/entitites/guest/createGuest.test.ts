import {
  foldGuestBySource,
  Guest,
  GuestCreationInput,
  hashGuestEmail,
} from '../../../../shared/models/Guest'
import { Result } from '../../../../shared/Result'
import { expectResult } from '../../../../shared/testUtils'
import { ServerError } from '../../ServerError'
import { expectT } from '../../testUtils'
import { createGuest } from './createGuest'
import { guestsCollection } from './guestsCollection'
import { subscribeGuest } from './utils/subscribeGuest'

jest.mock('./utils/subscribeGuest', () => ({
  subscribeGuest: jest.fn((guest: Guest) => Result.success(() => guest)),
}))

describe('createGuest', () => {
  afterEach(() => {
    const subscribeGuestMock = subscribeGuest as jest.Mock
    subscribeGuestMock.mockClear()

    return guestsCollection.raw(collection =>
      Result.tryCatch(
        () => collection.deleteMany({}),
        () => new ServerError(500, 'Unable to clear guests collection'),
      ),
    )
  })

  it('should create a guest with no referrer, subscribing it', async () => {
    const data: GuestCreationInput = {
      firstName: 'John',
      lastName: 'Doe',
      email: 'john.doe@example.com',
      companyName: 'ACME Inc.',
      accountManager: null,
    }

    const result = await createGuest({
      params: {},
      query: {},
      body: data,
    })

    expectResult(result).toHaveSucceeded()
    expectT(result.unsafeGetValue().source).toEqual('MANUAL')
    expect(subscribeGuest).toHaveBeenCalledTimes(1)
  })

  it('should update a guest if it already exists, without subscribing it', async () => {
    const data: GuestCreationInput = {
      firstName: 'John',
      lastName: 'Doe',
      email: 'john.doe@example.com',
      companyName: 'ACME Inc.',
      accountManager: null,
    }

    const insertionResult = await guestsCollection.insert({
      ...data,
      emailHash: hashGuestEmail(data.email),
      companyName: null,
      source: 'MANUAL',
      status: 'RSVP',
      accountManager: null,
    })

    expectResult(insertionResult).toHaveSucceeded()

    const result = await createGuest({
      params: {},
      query: {},
      body: data,
    })

    expectResult(result).toHaveSucceeded()
    expect(result.unsafeGetValue()).toMatchObject(data)
    expect(subscribeGuest).not.toHaveBeenCalled()
  })

  it('should create a guest with a referrer, subscribing it', async () => {
    const referrerData = {
      firstName: 'Referrer first name',
      lastName: 'Referrer last name',
      email: 'create-referrer-test@example.com',
      emailHash: hashGuestEmail('create-referrer-test@example.com'),
      companyName: null,
      source: 'RSVP' as const,
      status: 'RSVP' as const,
      accountManager: null,
    }

    const referrer = await guestsCollection.insert(referrerData)

    expectResult(referrer).toHaveSucceeded()
    const referrerId = referrer.unsafeGetValue()._id

    const data: GuestCreationInput = {
      firstName: 'John',
      lastName: 'Doe',
      email: 'john.doe@example.com',
      companyName: 'ACME Inc.',
      accountManager: null,
    }

    const result = await createGuest({
      params: {},
      query: { referrerEmail: referrerData.email },
      body: data,
    })

    expectResult(result).toHaveSucceeded()

    const referree = foldGuestBySource(
      result.unsafeGetValue(),
      _ => _,
      () => {
        throw new Error('Received subscriber when expecting referree')
      },
    )

    expectT(referree.source).toEqual('REFERRER')
    expectT(referree.referrerId).toEqual(referrerId)
    expect(subscribeGuest).toHaveBeenCalledTimes(1)

    const guest = result.unsafeGetValue()

    expect(subscribeGuest).toHaveBeenCalledWith(
      {
        firstName: guest.firstName,
        lastName: guest.lastName,
        email: guest.email,
        emailHash: guest.emailHash,
        companyName: guest.companyName,
      },
      true,
    )
  })

  it('should update a guest with a referrer if it already exists, without subscribing it', async () => {
    const data: GuestCreationInput = {
      firstName: 'John',
      lastName: 'Doe',
      email: 'john.doe@example.com',
      companyName: 'ACME Inc.',
      accountManager: null,
    }

    const insertionResult = await guestsCollection.insert({
      ...data,
      emailHash: hashGuestEmail(data.email),
      companyName: null,
      source: 'MANUAL',
      status: 'RSVP',
    })

    expectResult(insertionResult).toHaveSucceeded()

    const referrerData = {
      firstName: 'Referrer first name',
      lastName: 'Referrer last name',
      email: 'update-referrer-test@example.com',
      emailHash: hashGuestEmail('update-referrer-test@example.com'),
      companyName: null,
      source: 'RSVP' as const,
      status: 'RSVP' as const,
      accountManager: null,
    }

    const referrer = await guestsCollection.insert(referrerData)

    expectResult(referrer).toHaveSucceeded()
    const referrerId = referrer.unsafeGetValue()._id

    const result = await createGuest({
      params: {},
      query: { referrerEmail: referrerData.email },
      body: data,
    })

    expectResult(result).toHaveSucceeded()

    const referree = foldGuestBySource(
      result.unsafeGetValue(),
      _ => _,
      () => {
        throw new Error('Received subscriber when expecting referree')
      },
    )

    expect(referree).toMatchObject(data)
    expectT(referree.source).toEqual('REFERRER')
    expectT(referree.referrerId).toEqual(referrerId)
    expect(subscribeGuest).not.toHaveBeenCalled()
  })
})
