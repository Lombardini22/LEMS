import { Result } from '../../../shared/Result'
import { mailchimp } from '../resources/mailchimp'
import { Path } from '../routing/Path'
import { Router } from '../routing/Router'
import { ServerError } from '../ServerError'

type AddGuestThroughMailChimpParams = {
  // Merge tag: ?
  listId: string
  // Merge tag: *|UNIQID|*
  subscriberHash: string
}

const addGuestThroughMailChimpPath = Path.start()
  .param<AddGuestThroughMailChimpParams>('listId')
  .param<AddGuestThroughMailChimpParams>('subscriberHash')

export const guestsRouter = Router.make('/guests').get(
  addGuestThroughMailChimpPath,
  req =>
    mailchimp.use(mailchimp => {
      const { listId, subscriberHash } = req.params

      return Result.tryCatch(
        () => mailchimp.lists.getListMember(listId, subscriberHash),
        error =>
          new ServerError(404, 'MailChimp subscriber not found', {
            error,
            listId,
            subscriberHash,
          }),
      )
    }),
)
