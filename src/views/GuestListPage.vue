<template>
  <ion-page>
    <ion-header :translucent="true" :fullscreen="false">
      <ion-toolbar>
        <ion-buttons slot="primary">
          <ion-button @click="setOpen(!isOpen)">
            <ion-icon slot="icon-only" :icon="addOutline"></ion-icon>
          </ion-button>
        </ion-buttons>
        <ion-title>Guest List - {{ count }} </ion-title>
      </ion-toolbar>
      <ion-toolbar>
        <ion-searchbar animated v-model="search"></ion-searchbar>
        <ion-buttons slot="end">
          <ion-label>Guests Only</ion-label>
          <ion-toggle color="primary" :checked="guestsOnly" @ionChange="guestsOnly = !guestsOnly" value="true">
          </ion-toggle>
        </ion-buttons>
      </ion-toolbar>
      <ion-toolbar>
        <ion-segment :value="segment" @ionChange="segmentChanged($event)">
          <ion-segment-button value="registrati">
            <ion-label>Registrati ({{ totalRegistrati }})</ion-label>
          </ion-segment-button>
          <ion-segment-button value="checkedIn">
            <ion-label>Checked-In ({{ totalCheckedIn }})</ion-label>
          </ion-segment-button>
          <ion-segment-button value="waiting">
            <ion-label>Waiting ({{ waitingCount }})</ion-label>
          </ion-segment-button>
        </ion-segment>
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
            <ion-item-sliding v-for="item in infiniteItems" :key="item.node._id">
              <ion-item-options side="start" @click="removeGuest(item)">
                <ion-item-option color="danger">ELIMINA</ion-item-option>
              </ion-item-options>

              <ion-item :color="item.node.status === 'RSVP' ? '' : 'success'" @click="guestInfo(item)"
                class="list-item">
                <ion-label class="guest-name">{{ item.node.firstName }} {{ item.node.lastName }} <span class="company"
                    v-if="!!item.node.companyName">- {{ item.node.companyName }} </span>
                </ion-label>
                <ion-button slot="end" @click="guestInfo(item)">
                  <ion-icon :icon="personOutline" />
                </ion-button>
              </ion-item>

              <ion-item v-if="search && !infiniteItems.length">
                <p>No results found!</p>
              </ion-item>

              <ion-item-options side="end">
                <ion-item-option color="warning" v-if="segment === 'waiting'" @click="approveGuest(item)">Approva</ion-item-option>
                <ion-item-option color="primary" v-else @click="changeCheckin(item)">Check In</ion-item-option>
              </ion-item-options>
            </ion-item-sliding>
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
import { ref, watch } from 'vue'
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
  IonSegment, IonSegmentButton,
  IonItemOption, IonItemOptions, IonItemSliding
} from '@ionic/vue'
import { personOutline, addOutline, chevronDownCircleOutline } from 'ionicons/icons'
import { computed } from '@vue/reactivity';
import InfiniteGuest from './components/InfiniteGuest.vue';
import { useStoreGuest } from '@/stores';
import { GuestNode } from '@/stores/guest/state';

const serverUrl = process.env.VUE_APP_SERVER_URL
const store = useStoreGuest()

const data = computed(() => store.getters.getGuests())
const search = ref()
const isOpen = ref(false)
const guestsOnly = ref(false)

// Print
const alert = ref(false)
const alertMsg = ref()
const alertTitle = ref()
const alertSubTitle = ref()

// Counts
const totalCount = computed(() => store.getters.getTotalGuests())
const filteredCount = ref(0)

// Form
const firstName = ref('')
const lastName = ref('')
const email = ref('')
const company = ref('')

// infinite scroll
const infiniteItems = ref<GuestNode[]>([])
const onInfinite = (items: GuestNode[]) => {
  infiniteItems.value = items
}

// segment
const segment = ref('registrati');

const segmentChanged = (ev: CustomEvent) => {
  segment.value = ev.detail.value;
}
store.getters.getWaitingList()

// search results count
const totalRegistrati = computed(() => {
  return prefilter().filter((item: any) => item.node.status === 'RSVP').length
})
const totalCheckedIn = computed(() => {
  return prefilter().filter((item: any) => item.node.status === 'CHECKED_IN').length
})

const waitingCount = computed(() => {
  return prefilter().filter((item: any) => item.node.status === 'WAITING').length
})

// doCheckin

const changeCheckin = async (item: GuestNode) => {
  try {
    store.actions.changeCheckin(item)
  }
  catch (err) {
    console.error(err)
    presentToast('bottom', `Errore! qualcosa è andato storto! - ${err}`, 'danger', 3000)
  }

}

const approveGuest = async (item: GuestNode) => {
  try {
    store.actions.changeWaitingList(item)
  }
  catch (err) {
    console.error(err)
    presentToast('bottom', `Errore! qualcosa è andato storto! - ${err}`, 'danger', 3000)
  }

}


const removeGuest = async (item: GuestNode) => {
  try {
    store.actions.removeGuest(item)
  }
  catch (err) {
    console.error(err)
    presentToast('bottom', `Errore! qualcosa è andato storto! - ${err}`, 'danger', 3000)
  }

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


const guestInfo = (item: GuestNode) => {
  setAlertStatus(true)
  alertTitle.value = `${item.node.firstName} ${item.node.lastName}`
  alertSubTitle.value = `Azienda: ${item.node.companyName || '---'}`
  alertMsg.value = `email: ${item.node.email} <br/>
  Referente: ${item.node.accountManager} `
}

const prefilter = () => {
  if (search.value) {
    return data.value.filter((item) => {
      if (guestsOnly.value == true) {
        const fullName = `${item.node.firstName} ${item.node.lastName} ${item.node.email} ${item.node.companyName}`
        return !fullName.toLowerCase().includes('lombardini22') && fullName.toLowerCase().includes(search.value.toLowerCase())
      } else {
        const fullName = `${item.node.firstName} ${item.node.lastName} ${item.node.email} ${item.node.companyName}`
        return fullName.toLowerCase().includes(search.value.toLowerCase())
      }
    })
  } else if (guestsOnly.value) {
    return data.value.filter((item) => {

      const fullName = `${item.node.firstName} ${item.node.lastName} ${item.node.email} ${item.node.companyName}`
      return !fullName.toLowerCase().includes('lombardini22')

    })
  } else {
    return data.value
  }
}

const filteredData = computed(() => {
  return prefilter().filter((item) => {
    switch (segment.value) {
      case 'registrati':
        return item.node.status === 'RSVP'
      case 'checked-in':
        return item.node.status === 'CHECKED_IN'
      case 'waiting':
        return item.node.status === 'WAITING'
      default:
        return item.node.status === 'RSVP'
    }
  })

})

const doRefresh = (event: CustomEvent & { target: { complete: () => void } }) => {
  event.target?.complete();
}


watch(filteredData, (val) => {
  filteredCount.value = val.length
})


const count = computed(() => {
  return `${filteredCount.value} of ${totalCount.value} guests`
})

const presentToast = async (position: "bottom" | "top" | "middle", message: string, color: string, duration: number) => {
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
}

const setAlertStatus = (value: boolean) => {
  alert.value = value
}


</script>

<style scoped>
.guest-name {
  /* color: rgb(56,128,255); */
  font-weight: 700;
  /* vertical-align: middle; */
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
