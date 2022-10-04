<template>
  <ion-page>
    <ion-header :translucent="true" :fullscreen="false">
      <ion-toolbar>
        <ion-buttons slot="primary">
          <ion-button @click="setOpen(!isOpen)">
            <ion-icon slot="icon-only" :icon="addOutline"></ion-icon>
          </ion-button>
        </ion-buttons>
        <ion-title>Guest List - {{count}} </ion-title>
      </ion-toolbar>
      <ion-toolbar>
        <ion-searchbar animated v-model="search"></ion-searchbar>
        <ion-buttons slot="end">
          <ion-label>Guests Only</ion-label>
          <ion-toggle color="primary" :checked="guestsOnly" @ionChange="guestsOnly = !guestsOnly" value="true">
          </ion-toggle>
        </ion-buttons>
      </ion-toolbar>

    </ion-header>


    <ion-content :fullscreen="true">

      <ion-content :scroll-events="true">
        <ion-refresher slot="fixed" @ionRefresh="doRefresh($event)">
          <ion-refresher-content :pulling-icon="chevronDownCircleOutline" pulling-text="Pull to refresh"
            refreshing-spinner="circles" refreshing-text="Refreshing...">
          </ion-refresher-content>
        </ion-refresher>
        <div>
          <!-- List of Input Items -->
          <ion-list>
            <ion-item v-for="item in infiniteItems" :key="item.id" :color="item.node.status==='RSVP'?'' : 'success'"
              @click="guestInfo(item.node)" class="list-item">
              <ion-label class="guest-name">{{ item.node.firstName }} {{ item.node.lastName }} <span class="company"
                  v-if="!!item.node.companyName">- {{item.node.companyName}} </span>
              </ion-label>
              <ion-button slot="end" @click="guestInfo(item.node)">
                <ion-icon :icon="personOutline" />
              </ion-button>
            </ion-item>
            <ion-item v-if="search&&!infiniteItems.length">
              <p>No results found!</p>
            </ion-item>
            <!-- <ion-item v-for="item in infiniteItems" :key="item" class="list-item">
              {{item}}
            </ion-item> -->
          </ion-list>

          <infinite-guest @moreData="onInfinite" :all-items="filteredData"></infinite-guest>

        </div>
        <!-- ALERT -->
        <ion-alert :is-open="alert" :header="alertTitle" :sub-header="alertSubTitle" :message="alertMsg"
          :buttons="['OK']" @didDismiss="setAlertStatus(false)"></ion-alert>
        <!-- MODAL  -->
        <ion-modal :is-open="isOpen">
          <ion-header>
            <ion-toolbar>
              <ion-title>Add Guest</ion-title>
              <ion-buttons slot="end">
                <ion-button @click="submit">Confirm</ion-button>
              </ion-buttons>
              <ion-buttons slot="start">
                <ion-button @click="setOpen(false)">Cancel</ion-button>
              </ion-buttons>
            </ion-toolbar>
          </ion-header>
          <ion-content class="ion-padding">
            <ion-input v-model="firstName" placeholder="Nome*" class="input" required></ion-input>
            <ion-input v-model="lastName" placeholder="Cognome*" class="input" required></ion-input>
            <ion-input v-model="email" placeholder="Email*" class="input" required></ion-input>
            <ion-input v-model="company" placeholder="Azienda*" class="input" required></ion-input>
          </ion-content>
        </ion-modal>
      </ion-content>
    </ion-content>
    <!-- <ion-button expand="block" @click="presentToast('bottom')">Present Toast At the Bottom</ion-button> -->

  </ion-page>
</template>

<script lang="ts" setup>
import { onBeforeMount, ref, watch } from 'vue'
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
  IonAlert,
  IonToggle,
  IonRefresher,
  IonRefresherContent,
  toastController,

} from '@ionic/vue'
import { personOutline, addOutline, chevronDownCircleOutline } from 'ionicons/icons'
import { computed } from '@vue/reactivity';
import InfiniteGuest from './components/InfiniteGuest.vue';

const serverUrl = process.env.VUE_APP_SERVER_URL
// console.log({"serverUrl": serverUrl})
const data = ref([] as any[])
const search = ref()
const isOpen = ref(false)
const guestsOnly = ref(false)

// Print
const alert = ref(false)
const alertMsg = ref()
const alertTitle = ref()
const alertSubTitle = ref()

// Counts
const totalCount = ref(0)
const filteredCount = ref(0)

// Form
const firstName = ref('')
const lastName = ref('')
const email = ref('')
const company = ref('')

// infinite scroll
const infiniteItems = ref([] as any[])
const onInfinite = (items: any[]) => {
  console.log('onInfinite')
  infiniteItems.value = items
}

// Submit function
const submit = async () => {
  const newGuest = {
    firstName: firstName.value,
    lastName: lastName.value,
    email: email.value,
    companyName: company.value,
  }

  if (firstName.value == '' || lastName.value == '' || email.value == '' || company.value == '') {
    presentToast('bottom', 'Tutti i campi sono obbligatori', 'danger', 2000)
  }
  else {
    try {
      await axios
        .post(serverUrl + 'api/guests', newGuest)
        .then(res => {
          console.log(res)
          setTimeout(() => {
            newGuest.firstName = ''
            newGuest.lastName = ''
            newGuest.email = ''
            newGuest.companyName = ''
            setOpen(false)
            presentToast('bottom', 'Guest Registrato con Successo!', 'success', 2000)
          }, 2000)
        })
        .catch(err => {
          console.error({ 'userCreation': err })
          presentToast('bottom', `Errore! qualcosa è andato storto! - ${err}`, 'danger', 3000)
        })
    } catch (err) {
      presentToast('bottom', `Errore! qualcosa è andato storto! - ${err}`, 'danger', 3000)
    }
  }
}

// test
const getList = async () => {
  await axios.get(serverUrl + 'api/guests/?order=ASC&first=5000').then(res => {
    data.value = res.data.edges
    totalCount.value = res.data.pageInfo.totalCount
  })

}

const guestInfo = (item: any) => {
  // console.log(item)
  setAlertStatus(true)
  alertTitle.value = `${item.firstName} ${item.lastName}`
  alertSubTitle.value = `Azienda: ${item.companyName || '---'}`
  alertMsg.value = `email: ${item.email} <br/>
  Referente: ${item.accountManager} `
}

const filteredData = computed(() => {
  if (search.value) {
    return data.value.filter((item: any) => {
      if (guestsOnly.value == true) {
        const fullName = `${item.node.firstName} ${item.node.lastName} ${item.node.email} ${item.node.companyName}`
        return !fullName.toLowerCase().includes('lombardini22') && fullName.toLowerCase().includes(search.value.toLowerCase())
      } else {
        const fullName = `${item.node.firstName} ${item.node.lastName} ${item.node.email} ${item.node.companyName}`
        return fullName.toLowerCase().includes(search.value.toLowerCase())
      }

    })
  } else if (guestsOnly.value) {
    return data.value.filter((item: any) => {

      const fullName = `${item.node.firstName} ${item.node.lastName} ${item.node.email} ${item.node.companyName}`
      return !fullName.toLowerCase().includes('lombardini22')

    })
  } else {
    return data.value
  }

})

const doRefresh = (event: CustomEvent) => {
  // console.log('Begin async operation');
  getList()
  event.target?.complete();
}



watch(filteredData, (val) => {
  filteredCount.value = val.length
})
// watch(guestsOnly, (val) => {
//   console.log(val)
// })

const count = computed(() => {
  return `${filteredCount.value} of ${totalCount.value} guests`
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

const setOpen = (value: boolean) => {
  isOpen.value = value
  // console.log({ isOpen: isOpen.value })
}

const setAlertStatus = (value: boolean) => {
  alert.value = value
  // console.log({ alert: alert.value })
}

onBeforeMount(() => {
  getList()
})

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

/* .list-item {
  padding-top: 5px;
  padding-bottom: 01px;
} */

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

.guest-name {
  /* color: rgb(56,128,255); */
  font-weight: 700;
  vertical-align: middle;
  padding-top: 10px;
  padding-bottom: 10px;
}

.company {
  font-size: 12px;
  color: #7c7c7c;
  font-weight: 600;
}

.input {
  background: rgb(158, 200, 255, 0.3);
  border-radius: 10px;
  border: none;
  color: black;
  margin-bottom: 5px;
  margin-top: 2px;
}
</style>
