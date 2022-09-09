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
    }

    const result = await createGuest({
      params: {},
      query: {},
      body: data,
    })

    expectResult(result).toHaveSucceeded()
    expectT(result.unsafeGetValue().source).toEqual('MANUAL')
  })

  it('should create a guest with a referrer', async () => {
    const referrerData: Guest = {
      firstName: 'Referrer first name',
      lastName: 'Referrer last name',
      email: 'referrer@example.com',
      emailHash: hashGuestEmail('referrer@example.com'),
      source: 'RSVP',
      status: 'RSVP',
    }

    const referrer = await guestsCollection.insert(referrerData)

    expectResult(referrer).toHaveSucceeded()
    const referrerId = referrer.unsafeGetValue()._id

    const data: GuestCreationInput = {
      firstName: 'John',
      lastName: 'Doe',
      email: 'john.doe@example.com',
      companyName: 'ACME Inc.',
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
})
