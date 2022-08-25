<template>
  <ion-page>
    <ion-header :translucent="true">
      <ion-toolbar>
        <ion-title>Manual Entry</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content :fullscreen="true">
      <ion-header collapse="condense">
        <ion-toolbar>
          <ion-title size="large">Manual Entry</ion-title>
        </ion-toolbar>
      </ion-header>

      <ion-content
        :scroll-events="true"
        @ionScrollStart="logScrollStart()"
        @ionScrollEnd="logScrollEnd()"
      >
        <div >
          <h1>Lists</h1>

          <!-- List of Input Items -->
          <ion-list>
            <ion-item v-for="item in data" :key="item.id">
              <ion-label
                >{{ item.name.firstname }} {{ item.name.lastname }}</ion-label
              >
              <ion-button slot="end">
                Print <ion-icon :icon="printOutline" />
              </ion-button>
            </ion-item>
          </ion-list>

          <!-- List of Sliding Items -->
          <ion-list>
            <ion-item-sliding v-for="item in data" :key="item.id">
              <ion-item>
                <ion-label
                  >{{ item.name.firstname }} {{ item.name.lastname }}</ion-label
                >
              </ion-item>
              <ion-item-options side="end">
                <ion-item-option @click="print(item.id)">PRINT</ion-item-option>
              </ion-item-options>
            </ion-item-sliding>
          </ion-list>
        </div>
      </ion-content>
    </ion-content>
  </ion-page>
</template>

<script lang="ts" setup>
import { ref } from 'vue'
import axios from 'axios'
import {
  IonContent,
  IonHeader,
  IonPage,
  IonTitle,
  IonToolbar,
  IonItem,
  IonItemOption,
  IonItemOptions,
  IonItemSliding,
  IonList,
  IonLabel,
  IonButton,
} from '@ionic/vue'
import { printOutline } from 'ionicons/icons'
const data = ref([] as any[])

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

// const logScrolling = (event: CustomEvent) => {
//   console.log('scrolling', event.detail.currentY)
// }

const logScrollEnd = () => {
  console.log('scrolling ended')
}
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
