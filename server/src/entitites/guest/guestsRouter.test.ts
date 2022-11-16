import { Cursor } from '../../../../shared/Cursor'
import { Guest, hashGuestEmail } from '../../../../shared/models/Guest'
import { Result } from '../../../../shared/Result'
import { expectResult } from '../../../../shared/testUtils'
import { constVoid } from '../../../../shared/utils'
import { Server } from '../../resources/Server'
import { expectT, sendHttpRequest } from '../../testUtils'
import { guestsCollection } from './guestsCollection'
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
        const insertionResult = await guestsCollection.insert({
          firstName: 'John',
          lastName: 'Doe',
          email: 'john.doe@example.com',
          emailHash: hashGuestEmail('john.doe@example.com'),
          companyName: 'ACME Inc.',
          source: 'MANUAL' as const,
          status: 'RSVP' as const,
          accountManager: null,
        })

        expectResult(insertionResult).toHaveSucceeded()

        const emailHash = insertionResult.unsafeGetValue().emailHash
        const guest = insertionResult.unsafeGetValue()

        const findResult = await sendHttpRequest<Cursor<GuestResult>>(
          'GET',
          '/api/guests/?order=ASC&query=john+doe&first=1',
        )

        expectResult(findResult).toHaveSucceeded()
        expectT(findResult.unsafeGetValue().data.edges.length).toEqual(1)
        expectT(
          findResult.unsafeGetValue().data.edges[0]?.node.emailHash,
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

        return Result.success(constVoid)
      }))
  })
})
