import { Result } from '../../../../../shared/Result'
import { mailchimp } from '../../../resources/mailchimp'
import { ServerError } from '../../../ServerError'

interface Member {
  email_address: string
  merge_fields: {
    FNAME: string
    LNAME: string
    MMERGE4?: string
  }
}

export interface MembersListResult {
  members: Member[]
  total_items: number
}

export function fetchMailchimpMembers(
  listId: string,
): Promise<Result<ServerError, Member[]>> {
  return mailchimp.use(async mailchimp => {
    const getMailchimpMembers = async (
      accumulator: Member[],
      offset = 0,
    ): Promise<Result<ServerError, Member[]>> => {
      const currentPage: Result<ServerError, MembersListResult> =
        await Result.tryCatch(
          () =>
            // This call is not part of mailchimp types
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore
            mailchimp.lists.getListMembersInfo(listId, {
              count: 200,
              offset,
            }),
          () => new ServerError(500, 'Unable to get memebers from MailChimp'),
        )

      return currentPage.flatMap(currentPage => {
        const result = [...accumulator, ...currentPage.members]

        if (result.length >= currentPage.total_items) {
          return Result.success(() => result)
        } else {
          return getMailchimpMembers(result, result.length)
        }
      })
    }

    return await getMailchimpMembers([])
  })
}
