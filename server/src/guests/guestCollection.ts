import { Collection } from '../database/Collection'
import { Guest } from '../../../shared/models/Guest'

export const guestCollection = new Collection<Guest>('guests')
