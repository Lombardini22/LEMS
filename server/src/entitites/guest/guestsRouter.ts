import { Router } from '../../routing/Router'
import {
  addGuestThroughMailChimp,
  addGuestThroughMailChimpPath,
} from './addGuestThroughMailChimp'
import { createGuest, createGuestPath } from './createGuest'
import { deleteGuest, deleteGuestPath } from './deleteGuest'
import { findGuestById, findGuestByIdPath } from './findGuestById'
import { findGuests, findGuestsPath } from './findGuests'
import { sendQrCode, sendQrCodePath } from './generateQrCode'
import { updateGuest, updateGuestPath } from './updateGuest'

export const guestsRouter = Router.make('/guests')
  .post(createGuestPath, createGuest)
  .get(findGuestsPath, findGuests)
  .get(findGuestByIdPath, findGuestById)
  .put(updateGuestPath, updateGuest)
  .delete(deleteGuestPath, deleteGuest)
  .get(addGuestThroughMailChimpPath, addGuestThroughMailChimp)
  .custom('GET', sendQrCodePath, sendQrCode)
