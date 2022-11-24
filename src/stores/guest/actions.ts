import { Getters } from './getters'
import { GuestNode, State } from './state'
import axios from 'axios'

const serverUrl = process.env.VUE_APP_SERVER_URL

export function useActions(state: State, getters: Getters) {
  const actions = {
    initData: async () => {
      try {
        if (getters.isInitialized() === true)
          return { initialized: getters.isInitialized() }
        state.initialized = true

        console.log({ store: 'guest', initialized: getters.isInitialized() })
        return { initialized: getters.isInitialized() }
      } catch (e) {
        console.error(e)
        return { initialized: getters.isInitialized() }
      }
    },
    setStore: (data: GuestNode[]) => {
      state.guests = [...data]
    },
    changeCheckin: async (item: GuestNode) => {
      try {
        await axios.put(`${serverUrl}api/guests/${item.node.emailHash}`, {
          status: item.node.status === 'RSVP' ? 'CHECKED_IN' : 'RSVP',
        })
        item.node.status = item.node.status === 'RSVP' ? 'CHECKED_IN' : 'RSVP'
      } catch (e) {
        console.error({ e })
      }
    },
    changeWaitingList: async (item: GuestNode) => {
      try {
        console.log('TODO: changeWaitingList', item)

        // await axios.put(`${serverUrl}api/guests/${item.node.emailHash}`, {
        //   status: item.node.status === 'RSVP' ? 'CHECKED_IN' : 'RSVP',
        // })
        // item.node.status = item.node.status === 'RSVP' ? 'CHECKED_IN' : 'RSVP'
      } catch (e) {
        console.error({ e })
      }
    },
    isTicketAvailable: async (): Promise<boolean> => {
      try {
        const { data } = await axios.get<{ count: number }>(
          `${serverUrl}api/guests/count-rsvp`,
        )
        return data.count < 0 ? true : false
      } catch (e) {
        console.error({ e })
        return false
      }
    },
    addGuestToWaitinglist: async (email: string) => {
      try {
        console.log('TODO: addGuestToWaitinglist', email)
        const { data } = await axios.get<GuestNode['node']>(
          `${serverUrl}api/guests/${email}/waitlist/`,
        )
        return data
      } catch (e) {
        console.error({ e })
        throw new Error(`${e}`)
      }
    },
    getGuest: async (email: string) => {
      try {
        const { data } = await axios.get<GuestNode['node']>(
          serverUrl + `api/guests/${email}/rsvp/`,
        )
        return data
      } catch (e) {
        throw new Error(`${e}`)
      }
    },
  }
  return actions
}
