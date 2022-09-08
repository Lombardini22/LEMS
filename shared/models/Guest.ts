import { MD5 } from 'crypto-js'
import { ObjectId } from 'mongodb'

interface GuestCommonData {
  _id?: ObjectId
  email: string
  emailHash: string
  firstName: string
  lastName: string
  companyName?: string
}

interface Referree extends GuestCommonData {
  source: 'REFERRER'
  referrerId: ObjectId
}

interface Subscriber extends GuestCommonData {
  source: 'MANUAL' | 'RSVP'
}

export type Guest = Referree | Subscriber

interface SubscriberCreationInput {
  email: string
  firstName: string
  lastName: string
  companyName?: string
}

interface ReferreeCreationInput extends SubscriberCreationInput {
  referrerEmail: string
}

export type GuestCreationInput = SubscriberCreationInput | ReferreeCreationInput

export function hashGuestEmail(email: string): string {
  return MD5(email.toLowerCase()).toString()
}

export function foldGuestBySource<T>(
  guest: Guest,
  whenReferree: (referree: Referree) => T,
  whenSubscriber: (subscriber: Subscriber) => T,
): T {
  switch (guest.source) {
    case 'REFERRER':
      return whenReferree(guest)
    case 'MANUAL':
    case 'RSVP':
      return whenSubscriber(guest)
  }
}
