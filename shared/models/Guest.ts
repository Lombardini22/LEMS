import { MD5 } from 'crypto-js'
import { ObjectId } from 'mongodb'
import { z } from 'zod'
import { Email, NonEmptyString } from '../../server/src/globalDomain'

interface GuestCommonData {
  _id?: ObjectId
  email: string
  emailHash: string
  firstName: string
  lastName: string
  companyName: string | null
  status: GuestStatus
  accountManager: string | null
  createdAt: Date
  updatedAt: Date
}

export interface Referree extends GuestCommonData {
  source: 'REFERRER'
  referrerId: ObjectId
}

export interface Subscriber extends GuestCommonData {
  source: 'MANUAL' | 'RSVP' | 'UPLOAD' | 'SYNC'
}

type GuestStatus = 'RSVP' | 'WAITING' | 'CHECKED_IN'

export type Guest = Referree | Subscriber

export interface GuestCreationInput {
  email: string
  firstName: string
  lastName: string
  companyName?: string
  accountManager: string | null
}

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
    case 'UPLOAD':
    case 'SYNC':
      return whenSubscriber(guest)
  }
}

const GuestItem = z.object({
  firstName: NonEmptyString,
  lastName: NonEmptyString,
  email: Email,
  companyName: z.optional(NonEmptyString),
  accountManager: z.optional(Email),
})
export type GuestItem = z.infer<typeof GuestItem>

const UploadGuestsFileContent = z.array(GuestItem).min(1)
const UploadGuestsTagsArray = z.array(z.string())

export const UploadGuestsInput = z.object({
  data: UploadGuestsFileContent,
  tags: UploadGuestsTagsArray,
})
export type UploadGuestsInput = z.infer<typeof UploadGuestsInput>

interface UploadGuestsError {
  email_address: 'string'
  error: 'string'
  error_code: 'ERROR_CONTACT_EXISTS'
  field: 'string'
  field_message: 'string'
}

export interface UploadGuestsResult {
  processedCount: number
  uploadedCount: number
  createdCount: number
  updatedCount: number
  errorsCount: number
  errors: UploadGuestsError[]
}
