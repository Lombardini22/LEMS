import { Router } from '../../routing/Router'
import { findGuest, findGuestPath } from './findGuest'
import { checkInGuest, checkInGuestPath } from './checkInGuest'
import { findGuests, findGuestsPath } from './findGuests'
import { sendQrCode, sendQrCodePath } from './generateQrCode'
import { getStats, getStatsPath } from './getStats'
import { updateGuest, updateGuestPath } from './updateGuest'

export const guestsRouter = Router.make('/guests')
  .get(findGuestsPath, findGuests)
  .get(getStatsPath, getStats)
  .get(checkInGuestPath, checkInGuest)
  .put(updateGuestPath, updateGuest)
  .custom('GET', sendQrCodePath, sendQrCode)
  .get(findGuestPath, findGuest)
