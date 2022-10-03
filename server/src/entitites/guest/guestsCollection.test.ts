import { hashGuestEmail } from '../../../../shared/models/Guest'
import { Result } from '../../../../shared/Result'
import { expectResult } from '../../../../shared/testUtils'
import { Env } from '../../resources/env'
import { ServerError } from '../../ServerError'
import { expectT } from '../../testUtils'
import { guestsCollection } from './guestsCollection'

let mockEventDate: Date

jest.mock('../../resources/env', () => {
  const { env } = jest.requireActual('../../resources/env')

  return {
    env: {
      ...env,
      use: <T>(callback: (env: Env) => Promise<Result<ServerError, T>>) =>
        env.use((env: Env) =>
          callback({
            ...env,
            EVENT_ISO_DATE: mockEventDate.toISOString(),
          }),
        ),
    },
  }
})

describe('guestsCollection', () => {
  describe('insert override', () => {
    it('should proxy the status of the guest if today is not the day of the event', async () => {
      mockEventDate = new Date(2000, 0, 1)

      const result = await guestsCollection.insert([
        {
          firstName: 'Guests Collection Default RSVP',
          lastName: 'Whatever',
          email: 'guests-collection-default-rsvp@example.com',
          emailHash: hashGuestEmail(
            'guests-collection-default-rsvp@example.com',
          ),
          companyName: null,
          source: 'RSVP',
          accountManager: null,
          status: 'RSVP',
        },
        {
          firstName: 'Guests Collection Default Checked-In',
          lastName: 'Whatever',
          email: 'guests-collection-default-checked-in@example.com',
          emailHash: hashGuestEmail(
            'guests-collection-default-checked-in@example.com',
          ),
          companyName: null,
          source: 'RSVP',
          accountManager: null,
          status: 'CHECKED_IN',
        },
      ])

      expectResult(result).toHaveSucceeded()

      expectT(result.unsafeGetValue().map(doc => doc.status)).toEqual([
        'RSVP',
        'CHECKED_IN',
      ])
    })

    it('should force the status to CHECKED_IN if today is the day of the event', async () => {
      mockEventDate = new Date()

      const result = await guestsCollection.insert([
        {
          firstName: 'Guests Collection Override RSVP',
          lastName: 'Whatever',
          email: 'guests-collection-override-rsvp@example.com',
          emailHash: hashGuestEmail(
            'guests-collection-override-rsvp@example.com',
          ),
          companyName: null,
          source: 'RSVP',
          accountManager: null,
          status: 'RSVP',
        },
        {
          firstName: 'Guests Collection Override Checked-In',
          lastName: 'Whatever',
          email: 'guests-collection-override-checked-in@example.com',
          emailHash: hashGuestEmail(
            'guests-collection-override-checked-in@example.com',
          ),
          companyName: null,
          source: 'RSVP',
          accountManager: null,
          status: 'CHECKED_IN',
        },
      ])

      expectResult(result).toHaveSucceeded()

      expectT(result.unsafeGetValue().map(doc => doc.status)).toEqual([
        'CHECKED_IN',
        'CHECKED_IN',
      ])
    })
  })
})
