import { hashGuestEmail } from '../../../../shared/models/Guest'
import { Result } from '../../../../shared/Result'
import { constVoid } from '../../../../shared/utils'
import { env } from '../../resources/env'
import { mailchimp } from '../../resources/mailchimp'
import { Path } from '../../routing/Path'
import { Request } from '../../routing/Router'
import { ServerError } from '../../ServerError'

type TagMailchimpMemberBody = {
  email: string
  tag: string
}

export const tagMailchimpMemberPath = Path.start().literal('tag')

export function tagMailchimpMember(
  req: Request<unknown, unknown, TagMailchimpMemberBody>,
): Promise<Result<ServerError, void>> {
  const emailHash = hashGuestEmail(req.body.email)

  return env.use(env =>
    mailchimp.use(async mailchimp => {
      const result = await Result.tryCatch(
        () =>
          mailchimp.lists.updateListMemberTags(
            env.MAILCHIMP_DATABASE_LIST_ID,
            emailHash,
            {
              tags: [
                {
                  name: req.body.tag,
                  status: 'active',
                },
              ],
            },
          ),
        error =>
          new ServerError(500, 'Unable to set tag on source list', {
            ...req.body,
            error,
          }),
      )

      return result.map(constVoid)
    }),
  )
}
