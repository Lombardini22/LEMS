<template>
  <ion-page>
    <ion-header :translucent="true">
      <ion-toolbar>
        <ion-buttons slot="primary">
          <ion-button @click="setOpen(true)">
            <ion-icon slot="icon-only" :icon="addOutline"></ion-icon>
          </ion-button>
        </ion-buttons>

        <ion-title>Guest List</ion-title>
      </ion-toolbar>
      <ion-toolbar>
        <ion-searchbar
          animated
          @input="(e) => search = (e.detail.value!)"
        ></ion-searchbar>
      </ion-toolbar>
    </ion-header>

    <ion-content :fullscreen="true">
      <ion-header collapse="condense">
        <ion-toolbar>
          <ion-title size="large">Guest List</ion-title>
        </ion-toolbar>
      </ion-header>

      <ion-content
        :scroll-events="true"
        @ionScrollStart="logScrollStart()"
        @ionScrollEnd="logScrollEnd()"
      >
        <div>
          <!-- List of Input Items -->
          <ion-list>
            <ion-item v-for="item in data" :key="item.id">
              <ion-label
                >{{ item.name.firstname }} {{ item.name.lastname }}</ion-label
              >
              <ion-button slot="end" @click="print(item)">
                Print
                <ion-icon :icon="printOutline" />
              </ion-button>
            </ion-item>
          </ion-list>
        </div>
        <!-- ALERT -->
        <ion-alert
          :is-open="alert"
          header="Confirm Information"
          :sub-header="alertSubTitle"
          :message="alertMsg"
          :buttons="['OK']"
          @didDismiss="setAlertStatus(false)"
        ></ion-alert>
        <!-- MODAL  -->
        <ion-modal :is-open="isOpen">
          <ion-header>
            <ion-toolbar>
              <ion-title>Add Guest</ion-title>
              <ion-buttons slot="end">
                <ion-button @click="setOpen(false)">Confirm</ion-button>
              </ion-buttons>
              <ion-buttons slot="start">
                <ion-button @click="submit">Cancel</ion-button>
              </ion-buttons>
            </ion-toolbar>
          </ion-header>
          <ion-content class="ion-padding">
            <ion-input v-model="firstname" placeholder="First Name"></ion-input>
            <ion-input v-model="lastname" placeholder="Last Name"></ion-input>
            <ion-input v-model="email" placeholder="Email"></ion-input>
            <ion-input v-model="phone" placeholder="Phone"></ion-input>
            <ion-input v-model="company" placeholder="Company"></ion-input>
          </ion-content>
        </ion-modal>
      </ion-content>
    </ion-content>
  </ion-page>
</template>

<script lang="ts" setup>
import { ref } from 'vue'
import axios from 'axios'
import {
  IonContent,
  IonHeader,
  IonPage,
  IonTitle,
  IonToolbar,
  IonItem,
  IonList,
  IonLabel,
  IonButton,
  IonButtons,
  IonSearchbar,
  IonModal,
  IonIcon,
  IonInput,
  IonAlert
} from '@ionic/vue'
import { printOutline, addOutline } from 'ionicons/icons'

const data = ref([] as any[])
const search = ref()
const isOpen = ref(false)
// Print
const alert = ref(false)
const alertMsg = ref()
const alertTitle = ref()
const alertSubTitle = ref()

// Form
const firstname = ref('')
const lastname = ref('')
const email = ref('')
const phone = ref('')
const company = ref('')

const submit = async () => {
  console.log('submit')
  const newGuest = {
    firstname: firstname.value,
    lastname: lastname.value,
    email: email.value,
    phone: phone.value,
    company: company.value,
  }
  console.log(newGuest)
  await axios
    .post('http://localhost:3000/guests', newGuest)
    .then(res => {
      console.log(res)
    })
    .catch(err => {
      console.log(err)
    })
    .finally(() => {
      setOpen(false)
    })
  setOpen(false)
}

axios.get('https://fakestoreapi.com/users').then(res => {
  data.value = res.data
})

const print = (item: any) => {
  console.log(item)
  setAlertStatus(true)
  alertMsg.value = `${item.name.firstname} ${item.name.lastname}`
  alertTitle.value = 'Print'
  alertSubTitle.value = 'Print this guest?'
}


const logScrollStart = () => {
  console.log('scrolling started')
}

const logScrollEnd = () => {
  console.log('scrolling ended')
}

const setOpen = (value: boolean) => {
  isOpen.value = value
  console.log({ isOpen: isOpen.value })
}

const setAlertStatus = (value: boolean) => {
  alert.value = value
  console.log({ alert: alert.value })
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
