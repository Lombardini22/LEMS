import { MembersSuccessResponse } from '@mailchimp/mailchimp_marketing'
import {
  Guest,
  GuestCreationInput,
  hashGuestEmail,
} from '../../../../../shared/models/Guest'
import { Result } from '../../../../../shared/Result'
import { expectResult } from '../../../../../shared/testUtils'
import { NoTimestamps } from '../../../database/Collection'
import { ServerError } from '../../../ServerError'
import { expectT } from '../../../testUtils'
import { guestsCollection } from '../guestsCollection'
import { fetchGuest } from './fetchGuest'

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const getListMember = jest.fn((_listId: string, _emailHash: string) => {
  return Promise.resolve({
    status: 'subscribed',
    email_address: 'email.address@example.com',
    merge_fields: {
      FNAME: 'First name',
      LNAME: 'Last name',
      AZIENDA: 'Company name',
    },
  })
})

jest.mock('../../../resources/mailchimp', function () {
  return {
    mailchimp: {
      use: jest.fn(
        <T>(op: (guest: unknown) => Promise<T>): Promise<T> =>
          op({
            lists: {
              getListMember,
            },
          }),
      ),
    },
  }
})

describe('fetchGuest', () => {
  afterEach(async () => {
    await guestsCollection.raw(collection =>
      Result.tryCatch(
        () => collection.deleteMany({}),
        error =>
          new ServerError(500, 'Unable to clean guests collection', { error }),
      ),
    )

    getListMember.mockClear()
  })

  it('should get the guest from the database if found', async () => {
    const guestData: GuestCreationInput = {
      firstName: 'First name',
      lastName: 'Last name',
      email: 'email',
      accountManager: null,
    }

    const emailHash = hashGuestEmail(guestData.email)

    const insertionResult = await guestsCollection.insert({
      ...guestData,
      emailHash,
      companyName: null,
      source: 'RSVP',
      status: 'RSVP',
    })

    expectResult(insertionResult).toHaveSucceeded()

    const result = await fetchGuest(emailHash, 'listId', mailchimpMemberToGuest)

    expectResult(result).toHaveSucceeded()
    expectT(result.unsafeGetValue().emailHash).toEqual(emailHash)
    expect(getListMember).not.toHaveBeenCalled()
  })

  it('should get the guest MailChimp and insert it if not found in the database', async () => {
    // Same returned by the mock of getListMember
    const email = 'email.address@example.com'
    const emailHash = hashGuestEmail(email)
    const result = await fetchGuest(emailHash, 'listId', mailchimpMemberToGuest)

    expectResult(result).toHaveSucceeded()
    expect(getListMember).toHaveBeenCalledTimes(1)
    expect(getListMember).toHaveBeenCalledWith('listId', emailHash)

    const newGuestResult = await guestsCollection.findOne({ emailHash })

    expectResult(newGuestResult).toHaveSucceeded()
    expectT(newGuestResult.unsafeGetValue().email).toEqual(email)
  })
})

function mailchimpMemberToGuest(
  member: MembersSuccessResponse,
): NoTimestamps<Guest> {
  return {
    firstName: member.merge_fields['FNAME'],
    lastName: member.merge_fields['LNAME'],
    email: member.email_address,
    emailHash: hashGuestEmail(member.email_address),
    companyName: member.merge_fields['MMERGEX'],
    status: 'RSVP',
    source: 'RSVP',
    accountManager: null,
  }
}
