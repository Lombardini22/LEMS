import { Router } from '../../routing/Router'
import { findGuest, findGuestPath } from './findGuest'
import { checkInGuest, checkInGuestPath } from './checkInGuest'
import { findGuests, findGuestsPath } from './findGuests'
import { sendQrCode, sendQrCodePath } from './generateQrCode'
import { getStats, getStatsPath } from './getStats'
import { updateGuest, updateGuestPath } from './updateGuest'
import { createGuest, createGuestPath } from './createGuest'
import { deleteGuest, deleteGuestPath } from './deleteGuest'
import { countRsvp, countRsvpPath } from './countRsvp'
import { addToWaitlist, addToWaitlistPath } from './addToWaitlist'

export const guestsRouter = Router.make('/guests')
  .post(createGuestPath, createGuest)
  .get(findGuestsPath, findGuests)
  .get(findGuestPath, findGuest)
  .get(addToWaitlistPath, addToWaitlist)
  .get(countRsvpPath, countRsvp)
  .get(getStatsPath, getStats)
  .get(checkInGuestPath, checkInGuest)
  .put(updateGuestPath, updateGuest)
  .custom('GET', sendQrCodePath, sendQrCode)
  .delete(deleteGuestPath, deleteGuest)
