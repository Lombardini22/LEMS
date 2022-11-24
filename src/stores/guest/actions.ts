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
    getGuest: async (email: string) => {
      try {
        const {data} = await axios.get<GuestNode['node']>(
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
