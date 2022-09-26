<template>
  <ion-page>
    <ion-header :translucent="true">
      <ion-toolbar>
        <ion-title>Scan</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content :fullscreen="true">
      <div id="container">
        <strong>Please Scan A QRCode to Checkin</strong>
        <ion-input rounded outlined v-model="qrString" placeholder="Scan Your QRCode Using the Scanners" ref="qrInput"
          :maxlength="32"></ion-input>
        <div>
          <center>
            <qr-stream @decode="onDecode" class="mb" v-if="validRoute">
              <div style="color: red;" class="frame"></div>
            </qr-stream>
          </center>
        </div>
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
  IonInput,
  toastController,
} from '@ionic/vue'
import { computed, ref, watch } from 'vue'
import { qrCodeOutline } from 'ionicons/icons'
import axios from 'axios';
import { QrStream } from 'vue3-qr-reader'
import { useRoute } from 'vue-router';

const serverUrl = process.env.VUE_APP_CLIENT_URL
const qrString = ref('')
const id = ref()

const route = useRoute()

const presentAlert = async () => {
  const guest = {
    firstName: '',
    lastName: '',
    email: '',
    company: ''
  }

  await axios.get(serverUrl + 'api/guests/' + qrString.value)
    .then(res => {
      console.log(res.data)
      guest.firstName = res.data.firstName
      guest.lastName = res.data.lastName
      guest.email = res.data.email
      guest.company = res.data.company
      if (res.status === 404) {
        throw new Error('Guest Not Found')
      }
    })
    .then(async () => {
      await axios.get(serverUrl + 'api/guests/' + qrString.value + "/check-in").then(res => {
        console.log(res.data)
        if (res.status === 200)
          presentToast('bottom', 'Guest Checked In con Successo!', 'success', 5000)
      }).catch(() => {
        presentToast('bottom', 'An Error Has Occured!', 'danger', 5000)
      })
    }
    )
    .catch(err => {
      console.error(err)
      presentToast('bottom', `An Error Has Occured! - Guest Not Found`, 'danger', 5000)
    })
}

watch(qrString, (val: any) => {
  if (val.length === 32) {
    presentAlert()
    console.log(val)
    setTimeout(() => {
      qrString.value = ''
    }, 2000)
  }
})

const validRoute = computed(() => {
  return route.name === "scan"

})


const presentToast = async (position: any, message: any, color: any, duration: number) => {
  const toast = await toastController.create({
    message: message,
    duration: duration,
    position: position,
    color: color,
  })
  toast.present()
}

// QRCODE READER CAMERA

const onDecode = (a: any) => {
  try {
    console.log(a);
    qrString.value = a;
    if (id.value) clearTimeout(id.value);

    id.value = setTimeout(() => {
      if (qrString.value === a) {
        qrString.value = "";
      }
    }, 5000);
  } catch (err) {
    alert(err)
  }
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

.decoder {
  width: 350px;
}
</style>
