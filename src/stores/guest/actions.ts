import { Guest } from "./state";

export function useActions(state: any, getters: any) {
  const actions = {
    initData: async () => {
      try {
        if (getters.isInitialized() === true) return { initialized: getters.isInitialized() };
        state.initialized = true;

        console.log({ store: "guest", initialized: getters.isInitialized() });
        return { initialized: getters.isInitialized() };
      } catch (e) {
        console.error(e);
        return { initialized: getters.isInitialized() };
      }
    },
    setStore: (data: Guest[]) => {
      [...state.guest] = data;
    },
  };
  return actions;
}
