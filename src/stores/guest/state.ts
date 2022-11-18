import { reactive } from 'vue'

export type State = {
  initialized: boolean
  guests: GuestNode[]
}

export type Guest = {
  id: string
  firstName: string
  lastName: string
  email: string
}

export type GuestNode = {
  node: {
    _id: string
    firstName: string
    lastName: string
    email: string
    emailHash: string
    companyName: string
    accountManager: string
    source: string
    status: string
    createdAt: string
    updatedAt: string
    fullName: string
  }
  cursor: string
}

export const useState = () => {
  return reactive<State>({
    initialized: false,
    guests: [],
  })
}
