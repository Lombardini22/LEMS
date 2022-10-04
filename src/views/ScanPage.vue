<template>
  <ion-page>
    <ion-header :translucent="true">
      <ion-toolbar>
        <ion-title>Scan</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content :fullscreen="true">
      <div id="container">
        <center>
          <strong>Please Scan A QRCode to Checkin</strong>
          <ion-input rounded outlined v-model="qrString" placeholder="Scan Your QRCode Using the Scanners" ref="qrInput"
            class="input" :maxlength="32"></ion-input>
          <div v-if="hasWebcam">
            <qr-stream @decode="onDecode" class="mb" v-if="validRoute">
              <div style="color: red;" class="frame"></div>
            </qr-stream>
          </div>
          <p v-else>
            <em style="color: red;">Webcam not found</em>
          </p>
        </center>
        <p>
          <ion-button @click="searchTicket">
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
import { computed, onBeforeMount, ref, watch } from 'vue'
import { qrCodeOutline } from 'ionicons/icons'
import axios from 'axios';
import { QrStream } from 'vue3-qr-reader'
import { useRoute } from 'vue-router';

const serverUrl = process.env.VUE_APP_SERVER_URL
const qrString = ref('')
const id = ref()
const hasWebcam = ref(false)

const route = useRoute()

const searchTicket = async () => {
  const guest = {
    firstName: '',
    lastName: '',
    email: '',
    company: '',
    status: '',
    accountManager: '',
    source: '',
    previousStatus: '',
  }

  await axios.get(serverUrl + 'api/guests/' + qrString.value)
    .then(res => {
      console.log(res.data)
      guest.firstName = res.data.firstName
      guest.lastName = res.data.lastName
      guest.email = res.data.email
      guest.company = res.data.company
      guest.status = res.data.status
      guest.previousStatus = res.data.previousStatus
      console.log(guest)
      if (res.status === 404) {
        throw new Error('Guest Not Found')
      }
    })
    .then(async () => {
      if (guest.status === 'CHECKED_IN') {
        presentToast('bottom', 'Guest già registrato ', 'warning', 4000)
      } else {
        await axios.get(serverUrl + 'api/guests/' + qrString.value + "/check-in").then(res => {
          console.log(res.data)
          if (res.status === 200)
            presentToast('bottom', 'Guest Checked In con Successo!', 'success', 4000)
        }).catch(() => {
          presentToast('bottom', 'An Error Has Occured!', 'danger', 4000)
        })
      }
    }
    )
    .catch(err => {
      console.error(err)
      presentToast('bottom', `An Error Has Occured! ${err} - Guest Not Found`, 'danger', 4000)
    })
}

watch(qrString, (val: any) => {
  if (val.length === 32) {
    searchTicket()
    console.log(val)
    setTimeout(() => {
      qrString.value = ''
    }, 2000)
  }
})

onBeforeMount(async () => {
  try {
    if (navigator.mediaDevices && await navigator.mediaDevices.getUserMedia({ video: true })) {
      hasWebcam.value = true
    }
  } catch (err) {
    hasWebcam.value = false
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

.input {
  background: rgb(158, 200, 255, 0.3);
  border-radius: 10px;
  border: none;
  color: black;
  margin-bottom: 5px;
  margin-top: 2px;
  max-width: 500px;
}
</style>
