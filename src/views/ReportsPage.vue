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
      <ion-card class="pie-chart">
        <ion-card-header>
          <ion-card-title>Registrati</ion-card-title>
        </ion-card-header>
        <ion-card-content>
          <apexchart height="300" :options="chartOptions" :series="series"></apexchart>
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

// Segments for the tabs
const segment = ref('registrati');

const segmentChanged = (ev: CustomEvent) => {
  segment.value = ev.detail.value;
}

// Charts Registrati
// Pie chart

const series = [44, 55, 13, 43, 22]

const chartOptions = {
  chart: {
    type: 'donut',
    height: 350
  },
  // labels: ['Team A', 'Team B', 'Team C', 'Team D', 'Team E'],
  responsive: [{
    breakpoint: 480,
    options: {
      legend: {
        position: 'right'

      }
    }
  }]
}

</script>
<style scoped>
.pie-chart {
  height: 350px;
}
</style>
