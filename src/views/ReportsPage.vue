<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-title>Reports</ion-title>
      </ion-toolbar>
      <ion-toolbar>
        <ion-segment :value="segment" @ionChange="segmentChanged($event)">
          <ion-segment-button value="registrati">
            <ion-label>Registrati</ion-label>
          </ion-segment-button>
          <ion-segment-button value="checkedIn">
            <ion-label>Checked-In</ion-label>
          </ion-segment-button>
        </ion-segment>
      </ion-toolbar>
    </ion-header>

    <ion-content v-if="segment=='registrati'">
      <ion-card>
        <ion-card-header>
          <ion-card-title>Registrati</ion-card-title>
        </ion-card-header>
        <ion-card-content>
          <p>{{segment}}</p>
        </ion-card-content>
      </ion-card>

    </ion-content>

    <ion-content v-if="segment=='checkedIn'">
      <ion-card>
        <ion-card-header>
          <ion-card-title>Checked-In</ion-card-title>
        </ion-card-header>
        <ion-card-content>
          <p>{{segment}}</p>
        </ion-card-content>
      </ion-card>

    </ion-content>
  </ion-page>
</template>

<script lang="ts" setup>
import { ref } from 'vue';
import { IonContent, IonHeader, IonPage, IonCard, IonCardHeader, IonCardTitle, IonCardContent, IonToolbar, IonTitle, IonLabel, IonSegment, IonSegmentButton } from '@ionic/vue';

const segment = ref('registrati');

const segmentChanged = (ev: CustomEvent) => {
  segment.value = ev.detail.value;
}
</script>
<style scoped>

</style>
