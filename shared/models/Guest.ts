import { MD5 } from 'crypto-js'
import { ObjectId } from 'mongodb'
import { z } from 'zod'

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

interface Referree extends GuestCommonData {
  source: 'REFERRER'
  referrerId: ObjectId
}

interface Subscriber extends GuestCommonData {
  source: 'MANUAL' | 'RSVP' | 'UPLOAD'
}

type GuestStatus = 'RSVP' | 'CHECKED_IN'

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
      return whenSubscriber(guest)
  }
}

const NonEmptyString = z.string().min(1).brand<'NonEmptyString'>()
const Email = z.string().email().brand<'Email'>()

const GuestItem = z.object({
  firstName: NonEmptyString,
  lastName: NonEmptyString,
  email: Email,
  companyName: z.optional(NonEmptyString),
})
export type GuestItem = z.infer<typeof GuestItem>

export const UploadGuestsFileContent = z.array(GuestItem).min(1)
export type UploadGuestsFileContent = z.infer<typeof UploadGuestsFileContent>

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
