<template>
  <ion-page>
    <ion-tabs>
      <ion-router-outlet></ion-router-outlet>
      <ion-tab-bar slot="bottom">
        <ion-tab-button tab="tab1" href="scan">
          <ion-icon :icon="qrCodeOutline" />
          <ion-label>QR Scan</ion-label>
        </ion-tab-button>

        <ion-tab-button tab="tab2" href="manual">
          <ion-icon :icon="listOutline" />
          <ion-label>List / Manual</ion-label>
        </ion-tab-button>
         <!-- <ion-tab-button tab="tab3" href="quasar">
          <ion-icon :icon="atCircle" />
          <ion-label>Quasar</ion-label>
        </ion-tab-button> -->
        <!-- <ion-tab-button tab="tab4" href="ticket/4cdec2dac7/info@l22.it">
          <ion-icon :icon="ticketOutline" />
          <ion-label>Ticket</ion-label>
        </ion-tab-button> -->
        <ion-tab-button tab="tab4" href="/ticket/info@l22.it">
          <ion-icon :icon="ticketOutline" />
          <ion-label>Ticket</ion-label>
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
import {  listOutline,  qrCodeOutline, ticketOutline } from 'ionicons/icons'
</script>
