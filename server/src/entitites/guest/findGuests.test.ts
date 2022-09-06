import { Result } from '../../../../shared/Result'
import { expectResult } from '../../../../shared/testUtils'
import { ServerError } from '../../ServerError'
import { expectT } from '../../testUtils'
import { findGuests } from './findGuests'
import { guestsCollection } from './guestsCollection'

describe('findGuests', () => {
  it('should find by full name', async () => {
    await guestsCollection.raw(collection =>
      Result.tryCatch(
        () =>
          collection.insertMany([
            {
              firstName: 'John',
              lastName: 'Doe',
              email: 'john.doe@example.com',
            },
            {
              firstName: 'Jane',
              lastName: 'Doe',
              email: 'jane.doe@example.com',
            },
          ]),
        () => new ServerError(500, 'Failed to insert test data'),
      ),
    )

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
})
