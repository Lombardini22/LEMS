import {
  foldGuestBySource,
  Guest,
  GuestCreationInput,
  hashGuestEmail,
} from '../../../../shared/models/Guest'
import { expectResult } from '../../../../shared/testUtils'
import { expectT } from '../../testUtils'
import { createGuest } from './createGuest'
import { guestsCollection } from './guestsCollection'

describe('createGuest', () => {
  it('should create a guest with no referrer', async () => {
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
  })

  it('should update a guest if it already exists', async () => {
    const insertionResult = await guestsCollection.insert({
      firstName: 'First name',
      lastName: 'Last name',
      email: 'email@example.com',
      emailHash: hashGuestEmail('email@example.com'),
      source: 'MANUAL',
      status: 'RSVP',
      accountManager: null,
    })

    expectResult(insertionResult).toHaveSucceeded()

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
    expect(result.unsafeGetValue()).toMatchObject(data)
  })

  it('should create a guest with a referrer', async () => {
    const referrerData: Guest = {
      firstName: 'Referrer first name',
      lastName: 'Referrer last name',
      email: 'create-referrer-test@example.com',
      emailHash: hashGuestEmail('create-referrer-test@example.com'),
      source: 'RSVP',
      status: 'RSVP',
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
  })

  it('should update a guest with a referrer if it already exists', async () => {
    const insertionResult = await guestsCollection.insert({
      firstName: 'First name',
      lastName: 'Last name',
      email: 'email@example.com',
      emailHash: hashGuestEmail('email@example.com'),
      source: 'MANUAL',
      status: 'RSVP',
      accountManager: null,
    })

    expectResult(insertionResult).toHaveSucceeded()

    const referrerData: Guest = {
      firstName: 'Referrer first name',
      lastName: 'Referrer last name',
      email: 'update-referrer-test@example.com',
      emailHash: hashGuestEmail('update-referrer-test@example.com'),
      source: 'RSVP',
      status: 'RSVP',
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

    expect(referree).toMatchObject(data)
    expectT(referree.source).toEqual('REFERRER')
    expectT(referree.referrerId).toEqual(referrerId)
  })
})
