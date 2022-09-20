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
import { getStats, getStatsPath } from './getStats'
import { updateGuest, updateGuestPath } from './updateGuest'
import { uploadGuests, uploadGuestsPath } from './uploadGuests'

export const guestsRouter = Router.make('/guests')
  .post(createGuestPath, createGuest)
  .post(uploadGuestsPath, uploadGuests)
  .get(findGuestsPath, findGuests)
  .get(getStatsPath, getStats)
  .get(findGuestPath, findGuest)
  .get(checkInGuestPath, checkInGuest)
  .put(updateGuestPath, updateGuest)
  .delete(deleteGuestPath, deleteGuest)
  .custom('GET', sendQrCodePath, sendQrCode)
  .get(addGuestThroughMailChimpPath, addGuestThroughMailChimp)
