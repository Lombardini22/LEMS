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
        <ion-tab-button tab="tab4" href="/ticket">
          <ion-icon :icon="ticketOutline" />
          <ion-label>Tickets</ion-label>
        </ion-tab-button>
        <!-- <ion-tab-button tab="tab5" href="reports">
          <ion-icon :icon="pieChartOutline" />
          <ion-label>Reports</ion-label>
        </ion-tab-button> -->
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
import {  listOutline,  pieChartOutline,  qrCodeOutline, ticketOutline } from 'ionicons/icons'
</script>
