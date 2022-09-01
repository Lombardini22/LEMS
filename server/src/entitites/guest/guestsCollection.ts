import { Collection } from '../../database/Collection'
import { Guest } from '../../../../shared/models/Guest'

export const guestsCollection = new Collection<Guest>('guests')
