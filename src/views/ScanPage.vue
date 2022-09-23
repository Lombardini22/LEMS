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
          ref="qrInput" :maxlength="32"></ion-input>
        <p>
          <ion-button @click="presentAlert">
            <ion-icon :icon="qrCodeOutline" /> Scan
          </ion-button>
        </p>
        <div>
          <p class="decode-result">Last result: <b>{{ result }}</b></p>


          <qrcode-stream :camera="camera" @decode="onDecode" @init="onInit">
            <div v-show="showScanConfirmation" class="scan-confirmation">
              <img src="../../public/assets/logos/logo-foresight-bk.png" alt="Checkmark" width="128px" />
            </div>
          </qrcode-stream>
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
  // alertController,
  IonInput,
  toastController,
} from '@ionic/vue'
import { ref, watch } from 'vue'
import { qrCodeOutline } from 'ionicons/icons'
import axios from 'axios';
import { QrcodeStream } from 'vue-qrcode-reader'

const qrString = ref('')
// const qrInput = ref<HTMLInputElement>()
const result = ref('')
const showScanConfirmation = ref(false)
const camera = ref('auto')


// const onFocusOut = () => {
//   if (qrInput.value) {
//     // qrInput.value.focus()
//     console.log('focusout')
//   }
// }
const presentAlert = async () => {
  const guest = {
    firstName: '',
    lastName: '',
    email: '',
    company: ''
  }
  await axios.get(process.env.VUE_APP_SERVER_URL + 'api/guests/' + qrString.value)
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
      await axios.get(process.env.VUE_APP_SERVER_URL + 'api/guests/' + qrString.value + "/check-in").then(res => {
        console.log(res.data)
        if (res.status === 200)
          presentToast('bottom', 'Guest Checked In con Successo!', 'success', 2000)
      }).catch(() => {
        presentToast('bottom', 'An Error Has Occured!', 'danger', 2000)
      })
    }
    )
    .catch(err => {
      console.error(err)
      presentToast('bottom', `An Error Has Occured! - Guest Not Found`, 'danger', 2000)
    })

  // const alert = await alertController.create({
  //   header: 'Checking In...',
  //   subHeader: `${guest.firstName} ${guest.lastName}`,
  //   message: `Guest Checked In`,
  //   buttons: ['Ok'],
  // })

  // await alert.present()
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

const onInit = async (promise: any) => {
  try {
    await promise
  } catch (e) {
    console.error(e)
  } finally {
    showScanConfirmation.value = camera.value === "off"
  }
}

const onDecode = (content: any) => {
  result.value = content
  pause()
  unpause()
}
const unpause = () => {
  camera.value = 'auto'
}

const pause = () => {
  camera.value = 'off'
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
