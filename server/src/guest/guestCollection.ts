import { Collection } from '../database/Collection'
import { Guest } from './domain'

export const guestCollection = new Collection<Guest>('guests')
