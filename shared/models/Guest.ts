import { MD5 } from 'crypto-js'
import { ObjectId } from 'mongodb'

export interface Guest {
  _id?: ObjectId
  email: string
  emailHash: string
  firstName: string
  lastName: string
  companyName?: string
}

export function hashGuestEmail(email: string): string {
  return MD5(email.toLowerCase()).toString()
}
