import { hashGuestEmail } from '../../../../shared/models/Guest'
import { Result } from '../../../../shared/Result'
import { expectResult } from '../../../../shared/testUtils'
import { ServerError } from '../../ServerError'
import { getStats } from './getStats'
import { guestsCollection } from './guestsCollection'

describe('guests stats', () => {
  beforeEach(() =>
    guestsCollection.raw(collection =>
      Result.tryCatch(
        () => collection.deleteMany({}),
        () => new ServerError(500, 'Unable to clean guests collection'),
      ),
    ),
  )

  it('should work with no data', async () => {
    const stats = await getStats()

    expectResult(stats).toHaveSucceededWith({
      totalCount: 0,
      checkedIn: 0,
      notCheckedIn: 0,
    })
  })

  it('should work with data', async () => {
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
    ])

    expectResult(insertionResult).toHaveSucceeded()

    const stats = await getStats()

    expectResult(stats).toHaveSucceededWith({
      totalCount: 2,
      checkedIn: 1,
      notCheckedIn: 1,
    })
  })
})
