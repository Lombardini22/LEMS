import { reactive } from 'vue'

export type State = {
  initialized: boolean
  shops: Array<Guest>
}

export type Guest = {
  id: string
  firstName: string
  lastName: string
  email: string
}

export const useState = () => {
  return reactive({
    guest: [] as Guest[],
  })
}
