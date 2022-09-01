import { Result } from '../../../shared/Result'
import { mailchimp } from '../resources/mailchimp'
import { Path } from '../routing/Path'
import { Router } from '../routing/Router'
import { ServerError } from '../ServerError'
import CryptoJS from 'crypto-js'

type AddGuestThroughMailChimpParams = {
  listId: string
  email: string
}

const addGuestThroughMailChimpPath = Path.start()
  .param<AddGuestThroughMailChimpParams>('listId')
  .param<AddGuestThroughMailChimpParams>('email')

export const guestsRouter = Router.make('/guests').get(
  addGuestThroughMailChimpPath,
  req =>
    mailchimp.use(mailchimp => {
      const { listId, email } = req.params

      return Result.tryCatch(
        () =>
          mailchimp.lists.getListMember(listId, CryptoJS.MD5(email).toString()),
        error =>
          new ServerError(404, 'MailChimp subscriber not found', {
            error,
            listId,
            email,
          }),
      )
    }),
)
