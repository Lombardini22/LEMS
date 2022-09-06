import { ObjectId } from 'mongodb'
import { Cursor } from '../../../../shared/Cursor'
import { Guest } from '../../../../shared/models/Guest'
import { Result } from '../../../../shared/Result'
import { expectResult } from '../../../../shared/testUtils'
import { constVoid } from '../../../../shared/utils'
import { Server } from '../../resources/Server'
import { expectT, sendHttpRequest } from '../../testUtils'
import { guestsRouter } from './guestsRouter'

interface GuestResult extends Omit<Guest, '_id'> {
  _id: string
}

describe('guestRouter', () => {
  let server: Server

  beforeAll(() => {
    server = Server.make().withRouter(guestsRouter)
  })

  afterAll(async () => {
    await server.release()
  })

  describe('happy path', () => {
    it('should provide basic CRUD functionality', () =>
      server.use(async () => {
        const data: Guest = {
          firstName: 'John',
          lastName: 'Doe',
          email: 'john.doe@example.com',
          companyName: 'ACME Inc.',
        }

        const insertionResult = await sendHttpRequest<Guest, GuestResult>(
          'POST',
          '/guests',
          data,
        )

        expectResult(insertionResult).toHaveSucceededWith({
          status: 200,
          data: expect.objectContaining(data),
        })

        const _id = insertionResult.unsafeGetValue().data._id

        const findOneResult = await sendHttpRequest<GuestResult>(
          'GET',
          `/guests/${_id}`,
        )

        expectResult(findOneResult).toHaveSucceeded()
        expectT(findOneResult.unsafeGetValue().data._id).toEqual(_id)

        const guest = {
          ...findOneResult.unsafeGetValue().data,
          _id: new ObjectId(findOneResult.unsafeGetValue().data._id),
        }

        const findresult = await sendHttpRequest<Cursor<GuestResult>>(
          'GET',
          '/guests/?order=ASC&query=john+doe&first=1',
        )

        expectResult(findresult).toHaveSucceeded()
        expectT(findresult.unsafeGetValue().data.edges.length).toEqual(1)
        expectT(findresult.unsafeGetValue().data.edges[0]?.node._id).toEqual(
          _id,
        )

        const updateResult = await sendHttpRequest<Guest, GuestResult>(
          'PUT',
          `/guests/${_id}`,
          {
            ...guest,
            firstName: 'Updated First Name',
            lastName: 'Updated Last Name',
          },
        )

        expectResult(updateResult).toHaveSucceeded()
        expectT(updateResult.unsafeGetValue().data.firstName).toEqual(
          'Updated First Name',
        )
        expectT(updateResult.unsafeGetValue().data.lastName).toEqual(
          'Updated Last Name',
        )

        const deletionResult = await sendHttpRequest<GuestResult>(
          'DELETE',
          `/guests/${_id}`,
        )

        expectResult(deletionResult).toHaveSucceeded()
        expectT(deletionResult.unsafeGetValue().data._id).toEqual(_id)

        return Result.success(constVoid)
      }))
  })
})
