<template>
  <ion-page>
    <ion-header :translucent="true">
      <ion-toolbar>
        <ion-title>Scan</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content :fullscreen="true">
      <ion-header collapse="condense">
        <ion-toolbar>
          <ion-title size="large">Scan</ion-title>
        </ion-toolbar>
      </ion-header>

      <div id="container">
        <strong>Please Scan A QRCode to Checkin</strong>
        <div class="q-pa-md q-gutter-sm" style="height: 80px">
          <q-avatar v-for="n in 5" :key="n" size="40px" class="overlapping" :style="`left: ${n * 25}px`">
            <img :src="`https://cdn.quasar.dev/img/avatar${n + 1}.jpg`">
          </q-avatar>
          
        </div>

      </div>
    </ion-content>
  </ion-page>
</template>

<script lang="ts" setup>
import {
  IonContent,
  IonHeader,
  IonPage,
  IonTitle,
  IonToolbar,
} from '@ionic/vue'


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

.overlapping {
  border: 2px solid white;
  position: absolute;
}
</style>
