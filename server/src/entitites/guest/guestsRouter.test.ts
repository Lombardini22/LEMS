import { ObjectId, WithId } from 'mongodb'
import { Cursor } from '../../../../shared/Cursor'
import { Guest, hashGuestEmail } from '../../../../shared/models/Guest'
import { Result } from '../../../../shared/Result'
import { expectResult } from '../../../../shared/testUtils'
import { constVoid } from '../../../../shared/utils'
import { Server } from '../../resources/Server'
import { expectT, sendHttpRequest } from '../../testUtils'
import { guestsRouter } from './guestsRouter'

interface GuestResult extends Omit<Guest, '_id'> {
  _id: string
}

jest.mock('../../resources/mailchimp', function () {
  return {
    mailchimp: {
      use: jest.fn(<T>(op: () => T): T => op()),
    },
  }
})

jest.mock('./utils/subscribeGuest', () => ({
  subscribeGuest: (guest: WithId<Guest>) => Result.success(() => guest),
}))

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
        const data = {
          firstName: 'John',
          lastName: 'Doe',
          email: 'john.doe@example.com',
          emailHash: hashGuestEmail('john.doe@example.com'),
          companyName: 'ACME Inc.',
          source: 'MANUAL' as const,
          status: 'RSVP' as const,
          accountManager: null,
        }

        const insertionResult = await sendHttpRequest<
          Omit<Guest, 'createdAt' | 'updatedAt'>,
          GuestResult
        >('POST', '/api/guests', data)

        expectResult(insertionResult).toHaveSucceededWith({
          status: 200,
          data: expect.objectContaining(data),
        })

        const emailHash = insertionResult.unsafeGetValue().data.emailHash

        const findOneResult = await sendHttpRequest<GuestResult>(
          'GET',
          `/api/guests/${emailHash}`,
        )

        expectResult(findOneResult).toHaveSucceeded()
        expectT(findOneResult.unsafeGetValue().data.emailHash).toEqual(
          emailHash,
        )

        const guest: Guest = {
          // Not true, but YOLO
          ...(findOneResult.unsafeGetValue().data as unknown as Guest),
          _id: new ObjectId(findOneResult.unsafeGetValue().data._id),
        }

        const findresult = await sendHttpRequest<Cursor<GuestResult>>(
          'GET',
          '/api/guests/?order=ASC&query=john+doe&first=1',
        )

        expectResult(findresult).toHaveSucceeded()
        expectT(findresult.unsafeGetValue().data.edges.length).toEqual(1)
        expectT(
          findresult.unsafeGetValue().data.edges[0]?.node.emailHash,
        ).toEqual(emailHash)

        const updateResult = await sendHttpRequest<Guest, GuestResult>(
          'PUT',
          `/api/guests/${emailHash}`,
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

        const checkInResult = await sendHttpRequest<GuestResult>(
          'GET',
          `/api/guests/${emailHash}/check-in`,
        )

        expectResult(checkInResult).toHaveSucceeded()
        expectT(checkInResult.unsafeGetValue().data.status).toEqual(
          'CHECKED_IN',
        )

        const deletionResult = await sendHttpRequest<GuestResult>(
          'DELETE',
          `/api/guests/${emailHash}`,
        )

        expectResult(deletionResult).toHaveSucceeded()
        expectT(deletionResult.unsafeGetValue().data.emailHash).toEqual(
          emailHash,
        )

        return Result.success(constVoid)
      }))
  })
})
