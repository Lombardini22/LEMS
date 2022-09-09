import { Router } from '../../routing/Router'
import {
  addGuestThroughMailChimp,
  addGuestThroughMailChimpPath,
} from './addGuestThroughMailChimp'
import { checkInGuest, checkInGuestPath } from './checkInGuest'
import { createGuest, createGuestPath } from './createGuest'
import { deleteGuest, deleteGuestPath } from './deleteGuest'
import { findGuest, findGuestPath } from './findGuest'
import { findGuests, findGuestsPath } from './findGuests'
import { sendQrCode, sendQrCodePath } from './generateQrCode'
import { updateGuest, updateGuestPath } from './updateGuest'

export const guestsRouter = Router.make('/guests')
  .post(createGuestPath, createGuest)
  .get(findGuestsPath, findGuests)
  .get(findGuestPath, findGuest)
  .get(checkInGuestPath, checkInGuest)
  .put(updateGuestPath, updateGuest)
  .delete(deleteGuestPath, deleteGuest)
  .custom('GET', sendQrCodePath, sendQrCode)
  .get(addGuestThroughMailChimpPath, addGuestThroughMailChimp)
