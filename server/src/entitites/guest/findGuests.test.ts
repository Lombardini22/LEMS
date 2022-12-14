import { hashGuestEmail } from '../../../../shared/models/Guest'
import { Result } from '../../../../shared/Result'
import { expectResult } from '../../../../shared/testUtils'
import { ServerError } from '../../ServerError'
import { expectT } from '../../testUtils'
import { findGuests } from './findGuests'
import { guestsCollection } from './guestsCollection'

describe('findGuests', () => {
  beforeAll(() =>
    guestsCollection.raw(collection =>
      Result.tryCatch(
        () =>
          collection.insertMany([
            {
              firstName: 'John',
              lastName: 'Doe',
              email: 'john.doe@example.com',
              emailHash: hashGuestEmail('john.doe@example.com'),
              companyName: null,
              source: 'MANUAL',
              status: 'RSVP',
              accountManager: null,
              createdAt: new Date(),
              updatedAt: new Date(),
            },
            {
              firstName: 'Jane',
              lastName: 'Doe',
              email: 'jane.doe@example.com',
              emailHash: hashGuestEmail('jane.doe@example.com'),
              companyName: null,
              source: 'MANUAL',
              status: 'RSVP',
              accountManager: null,
              createdAt: new Date(),
              updatedAt: new Date(),
            },
          ]),
        () => new ServerError(500, 'Failed to insert test data'),
      ),
    ),
  )

  it('should find by full name', async () => {
    const result = await findGuests({
      params: {},
      query: {
        order: 'ASC',
        query: 'ne do',
        first: '1',
        after: null,
      },
      body: {},
    })

    expectResult(result).toHaveSucceeded()
    expectT(result.unsafeGetValue().edges.length).toEqual(1)
    expectT(result.unsafeGetValue().edges[0]?.cursor).toEqual('Jane Doe')
  })

  it('should find by other fields', async () => {
    const result = await findGuests({
      params: {},
      query: {
        searchField: 'email',
        order: 'ASC',
        query: 'jane',
        first: '1',
        after: null,
      },
      body: {},
    })

    expectResult(result).toHaveSucceeded()
    expectT(result.unsafeGetValue().edges.length).toEqual(1)
    expectT(result.unsafeGetValue().edges[0]?.cursor).toEqual(
      'jane.doe@example.com',
    )
  })
})
