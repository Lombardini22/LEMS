<template>
  <ion-page>
    <ion-tabs>
      <ion-router-outlet></ion-router-outlet>
      <ion-tab-bar slot="bottom">
        <ion-tab-button tab="tab1" href="scan">
          <ion-icon :icon="qrCodeOutline" />
          <ion-label>QR Scan</ion-label>
        </ion-tab-button>

        <!-- <ion-tab-button tab="tab2" href="manual">
          <ion-icon :icon="listOutline" />
          <ion-label>List / Manual</ion-label>
        </ion-tab-button> -->
        <ion-tab-button tab="tab3" href="list">
          <ion-icon :icon="listCircle" />
          <ion-label>Guest List</ion-label>
        </ion-tab-button>
        <ion-tab-button tab="tab4" href="/ticket">
          <ion-icon :icon="ticketOutline" />
          <ion-label>Tickets</ion-label>
        </ion-tab-button>
        <ion-tab-button tab="tab5" href="/logout">
          <ion-icon :icon="logOutOutline" />
          <ion-label>Logout</ion-label>
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
import {  listCircle,  logOutOutline,  qrCodeOutline, ticketOutline } from 'ionicons/icons'
</script>
