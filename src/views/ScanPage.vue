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
        <ion-input rounded outlined v-model="qrString" placeholder="Scan Your QRCode Using the Scanners" autofocus
          ref="qrInput" v-on:focusout="onFocusOut" :maxlength="32"></ion-input>
        <p>
          <ion-button @click="presentAlert">
            <ion-icon :icon="qrCodeOutline" /> Scan
          </ion-button>
        </p>
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
  alertController,
  IonInput,
} from '@ionic/vue'
import { ref } from 'vue'
import { qrCodeOutline } from 'ionicons/icons'
import axios from 'axios';
const qrString = ref('')
const qrInput = ref<HTMLInputElement>()

const onFocusOut = () => {
  if (qrInput.value) {
    // qrInput.value.focus()
    console.log('focusout')
  }
}
const presentAlert = async () => {
  const guest = {
    firstname: '',
    lastname: '',
    email: '',
    company: ''
  }
  await axios.get(process.env.VUE_APP_SERVER_URL + '/api/guests/' + qrString.value).then(res => {
    guest.firstname = res.data.firstName
    guest.lastname = res.data.lastName
    guest.email = res.data.email
    guest.company = res.data.company
  })

  const alert = await alertController.create({
    header: 'Printing...',
    subHeader: `${guest.firstname} ${guest.lastname}`,
    message: `${guest.company}`,
    buttons: ['PRINT'],
  })

  await alert.present()
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
