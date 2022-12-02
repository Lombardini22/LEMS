import { hashGuestEmail } from '../../../../shared/models/Guest'
import { expectResult } from '../../../../shared/testUtils'
import { countRsvp } from './countRsvp'
import { guestsCollection } from './guestsCollection'

describe('countRsvp', () => {
  it('should work', async () => {
    const insertionResult = await guestsCollection.insert([
      {
        firstName: 'Alice',
        lastName: 'Johnson',
        email: 'alice@example.com',
        emailHash: hashGuestEmail('alice@example.com'),
        companyName: null,
        accountManager: null,
        source: 'RSVP',
        status: 'RSVP',
      },
      {
        firstName: 'Bob',
        lastName: 'Johnson',
        email: 'bob@example.com',
        emailHash: hashGuestEmail('bob@example.com'),
        companyName: null,
        accountManager: null,
        source: 'RSVP',
        status: 'CHECKED_IN',
      },
      {
        firstName: 'Charlie',
        lastName: 'Johnson',
        email: 'charlie@example.com',
        emailHash: hashGuestEmail('charlie@example.com'),
        companyName: null,
        accountManager: null,
        source: 'RSVP',
        status: 'WAITING',
      },
    ])

    expectResult(insertionResult).toHaveSucceeded()

    const result = await countRsvp()

    expectResult(result).toHaveSucceededWith({
      count: 1,
    })
  })
})
