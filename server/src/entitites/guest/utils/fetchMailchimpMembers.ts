import { MailchimpListMembersResult } from './mailchimpTypes'
import { Result } from '../../../../../shared/Result'
import { mailchimp } from '../../../resources/mailchimp'
import { ServerError } from '../../../ServerError'

export function fetchMailchimpMembers<M>(
  listId: string,
): Promise<Result<ServerError, M[]>> {
  return mailchimp.use(async mailchimp => {
    const getMailchimpMembers = async (
      accumulator: M[],
      offset = 0,
    ): Promise<Result<ServerError, M[]>> => {
      const currentPage: Result<
        ServerError,
        MailchimpListMembersResult<M>
      > = await Result.tryCatch(
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

      return currentPage.flatMap(function recurse(currentPage) {
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
