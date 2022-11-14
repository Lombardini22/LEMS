import { Guest } from "./state";

export type Getters = ReturnType<typeof useGetters>;

export function useGetters(state: any) {
  const getters = {
    isInitialized: () => state.initialized,
    getStore: () => {
      try {
        return state.guest;
      } catch (e) {
        console.error(e);
        return [];
      }
    },
    getStoreById: (id: string) => {
      try {
        return state.guest.find((item: Guest) => item.id === id);
      } catch (e) {
        console.error(e);
        return null;
      }
    },
    getStoreByEmail: (email: string) => {
      try {
        return state.guest.find((item: any) => item.email === email);
      } catch (e) {
        console.error(e);
        return null;
      }
    },
  };
  return getters;
}
