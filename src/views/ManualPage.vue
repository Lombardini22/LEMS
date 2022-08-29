<template>
  <ion-page>
    <ion-header :translucent="true">
      <ion-toolbar>
        <ion-title>Guest List</ion-title>
      </ion-toolbar>
      <ion-toolbar>
        <ion-searchbar animated @input="(e) => search = (e.detail.value!)"></ion-searchbar>
      </ion-toolbar>
    </ion-header>

    <ion-content :fullscreen="true">
      <ion-header collapse="condense">
        <ion-toolbar>
          <ion-title size="large">Guest List</ion-title>
        </ion-toolbar>
        <ion-toolbar>
          <ion-searchbar animated @v-model="search"></ion-searchbar>
        </ion-toolbar>
      </ion-header>

      <ion-content :scroll-events="true" @ionScrollStart="logScrollStart()" @ionScrollEnd="logScrollEnd()">
        <div>

          <!-- List of Input Items -->
          <ion-list>
            <ion-item v-for="item in data" :key="item.id">
              <ion-label>{{ item.name.firstname }} {{ item.name.lastname }}</ion-label>
              <ion-button slot="end" @click="print(item)">
                Print
                <ion-icon :icon="printOutline" />
              </ion-button>
            </ion-item>
          </ion-list>

        </div>
      </ion-content>
    </ion-content>
  </ion-page>
</template>

<script lang="ts" setup>
import { ref, watch } from 'vue'
import axios from 'axios'
import {
  IonContent,
  IonHeader,
  IonPage,
  IonTitle,
  IonToolbar,
  IonItem,
  IonList,
  IonLabel,
  IonButton,
  IonSearchbar
} from '@ionic/vue'
import { printOutline } from 'ionicons/icons'
const data = ref([] as any[])
const search = ref()

axios.get('https://fakestoreapi.com/users').then(res => {
  console.table(res.data)
  data.value = res.data
})

const print = (item: any) => {
  console.log(item)
}

const logScrollStart = () => {
  console.log('scrolling started')
}

const logScrollEnd = () => {
  console.log('scrolling ended')
}


watch(search, (value: string) => {
  console.log("search:  ", value)
})
</script>

<style scoped>
#container {
  text-align: center;

  position: absolute;
  left: 0;
  right: 0;
  top: 50%;
  transform: translateY(-50%);
}

#container strong {
  font-size: 20px;
  line-height: 26px;
}

#container p {
  font-size: 16px;
  line-height: 22px;

  color: #8c8c8c;

  margin: 0;
}

#container a {
  text-decoration: none;
}
</style>
