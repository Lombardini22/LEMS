<template>
  <ion-page>
    <ion-tabs>
      <ion-router-outlet></ion-router-outlet>
      <ion-tab-bar slot="bottom">
        <ion-tab-button tab="tab1" href="/tabs/home">
          <ion-icon :icon="qrCodeOutline" />
          <ion-label>QR Scan</ion-label>
        </ion-tab-button>

        <ion-tab-button tab="tab2" href="/tabs/manual">
          <ion-icon :icon="listOutline" />
          <ion-label>List / Manual</ion-label>
        </ion-tab-button>
         <ion-tab-button tab="tab3" href="/tabs/quasar">
          <ion-icon :icon="atCircle" />
          <ion-label>Quasar</ion-label>
        </ion-tab-button>
      </ion-tab-bar>
    </ion-tabs>
  </ion-page>
</template>

<script lang="ts" setup>
import {
  IonTabBar,
  IonTabButton,
  IonTabs,
  IonLabel,
  IonIcon,
  IonPage,
  IonRouterOutlet,
} from '@ionic/vue'
import { atCircle, listOutline,  qrCodeOutline } from 'ionicons/icons'
</script>
