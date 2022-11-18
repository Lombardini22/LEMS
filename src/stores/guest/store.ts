import { defineStore } from "pinia";
import { useState } from "./state";
import { useGetters } from "./getters";
import { useActions } from "./actions";
import { toRefs } from "vue";

export const useStoreGuest = defineStore("guest", () => {
  const state = useState();
  const getters = useGetters(state);
  const actions = useActions(state, getters);

  if (!getters.isInitialized()) actions.initData();

  return { ...toRefs(state), getters, actions };
});
