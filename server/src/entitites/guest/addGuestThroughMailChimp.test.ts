import { addGuestThroughMailChimp } from './addGuestThroughMailChimp'
import { MD5 } from 'crypto-js'
import { expectResult } from '../../../../shared/testUtils'
import { ObjectId } from 'mongodb'

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const getListMember = jest.fn((_listId: string, _emailHash: string) =>
  Promise.resolve({
    status: 'subscribed',
    email_address: 'email.address@example.com',
    merge_fields: {
      FNAME: 'First name',
      LNAME: 'Last name',
      MMERGE8: 'Company name',
    },
  }),
)

jest.mock('../../resources/mailchimp', () => ({
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
}))

describe('addGuestThroughMailChimp', () => {
  it('should work', async () => {
    const result = await addGuestThroughMailChimp({
      params: {
        listId: 'listId',
        email: 'email',
      },
      query: {},
      body: {},
    })

    expect(getListMember).toHaveBeenCalledTimes(1)
    expect(getListMember).toHaveBeenCalledWith(
      'listId',
      MD5('email'.toLowerCase()).toString(),
    )

    expectResult(result).toHaveSucceededWith({
      _id: expect.any(ObjectId),
      firstName: 'First name',
      lastName: 'Last name',
      email: 'email.address@example.com',
      companyName: 'Company name',
    })
  })
})
