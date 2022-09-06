import { ObjectId } from 'mongodb'

export interface Guest {
  _id?: ObjectId
  email: string
  firstName: string
  lastName: string
  companyName?: string
}
