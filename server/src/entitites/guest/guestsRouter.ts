import { Path } from '../../routing/Path'
import { Router } from '../../routing/Router'
import {
  addGuestThroughMailChimp,
  AddGuestThroughMailChimpParams,
} from './addGuestThroughMailChimp'

const addGuestThroughMailChimpPath = Path.start()
  .param<AddGuestThroughMailChimpParams>('listId')
  .param<AddGuestThroughMailChimpParams>('email')

export const guestsRouter = Router.make('/guests').get(
  addGuestThroughMailChimpPath,
  addGuestThroughMailChimp,
)
