import { expectResult } from '../../../../shared/testUtils'
import { ServerError } from '../../ServerError'
import { findGuestById } from './findGuestById'

describe('findGuestById', () => {
  describe('error handling', () => {
    it('should fail if _id is an invalid ObjectId', async () => {
      const result = await findGuestById({
        params: {
          _id: 'invalid',
        },
        query: {},
        body: {},
      })

      expectResult(result).toHaveFailedWith(
        new ServerError(400, 'Invalid ObjectId: invalid'),
      )
    })
  })
})
