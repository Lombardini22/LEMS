import {State } from './state'

export type Getters = ReturnType<typeof useGetters>

export function useGetters(state: State) {
  const getters = {
    isInitialized: () => state.initialized,
    getGuests: () => {
      return state.guests
    },
    getGuestById: (id: string) => {
      return state.guests.find((item) => item.node._id === id)
    },
    getGuestByEmail: (email: string) => {
      return state.guests.find((item) => item.node.email === email)
    },
    getWaitingList: () => {
      return state.guests.find((item) => item.node.status === "WAITING") || []
    },
    getTotalGuests: () => {
      return state.guests.length
    },
  }
  return getters
}
