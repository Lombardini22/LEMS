import { guestsCollection } from './guestsCollection'
import { hashGuestEmail } from '../../../../shared/models/Guest'
import { expectResult } from '../../../../shared/testUtils'
import { expectT } from '../../testUtils'
import { checkInGuest } from './checkInGuest'

describe('checkInGuest', () => {
  it('should return the previous status', async () => {
    const guest = await guestsCollection.insert({
      firstName: 'Check in',
      lastName: 'Test',
      email: 'check-in-test@example.com',
      emailHash: hashGuestEmail('check-in-test@example.com'),
      companyName: null,
      source: 'MANUAL',
      status: 'RSVP',
      accountManager: null,
    })

    expectResult(guest).toHaveSucceeded()

    const result = await checkInGuest({
      params: {
        emailHash: guest.unsafeGetValue().emailHash,
      },
      query: {},
      body: {},
    })

    expectResult(result).toHaveSucceeded()

    expectT(result.unsafeGetValue().previousStatus).toEqual('RSVP')
    expectT(result.unsafeGetValue().status).toEqual('CHECKED_IN')
  })
})
