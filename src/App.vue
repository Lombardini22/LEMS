<template>
  <ion-app>
    <ion-router-outlet />
  </ion-app>
</template>

<script lang="ts" setup>
import { IonApp, IonRouterOutlet } from '@ionic/vue'
import { useStoreGuest } from '@/stores'
import axios from 'axios'
import { onMounted } from 'vue';

const store = useStoreGuest()

const serverUrl = process.env.VUE_APP_SERVER_URL

const getList = async () => {
  await axios.get(serverUrl + 'api/guests/?order=ASC&first=5000').then(res => {
    store.actions.setStore(res.data.edges)
  })
  console.log("done")
}

onMounted(() => {
  getList()
})


</script>
