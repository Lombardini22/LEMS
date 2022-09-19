<template>
  <ion-page>
    <ion-header :translucent="true">
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
      </ion-toolbar>
    </ion-header>



    <ion-content :fullscreen="true">
      <ion-header collapse="condense">
        <ion-toolbar>
          <ion-title size="large">Guest List</ion-title>
        </ion-toolbar>
      </ion-header>

      <ion-content :scroll-events="true">
        <div>
          <!-- List of Input Items -->
          <ion-list>
            <ion-item v-for="item in filteredData" :key="item">
              <ion-label>{{ item.node.firstName }} {{ item.node.lastName }} ({{item.node.companyName}})</ion-label>
              <!-- <ion-toggle color="primary"  :checked="item.node.status=='CHECKED_IN'"></ion-toggle> -->

              <ion-button slot="end" @click="guestInfo(item.node)">
                Guest Info
                <ion-icon :icon="personOutline" />
              </ion-button>
            </ion-item>
            <ion-item v-if="search&&!filteredData.length">
              <p>No results found!</p>
            </ion-item>
          </ion-list>

        </div>
        <!-- ALERT -->
        <ion-alert :is-open="alert" header="Confirm Information" :sub-header="alertSubTitle" :message="alertMsg"
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
            <ion-input v-model="firstName" placeholder="First Name"></ion-input>
            <ion-input v-model="lastName" placeholder="Last Name"></ion-input>
            <ion-input v-model="email" placeholder="Email"></ion-input>
            <ion-input v-model="company" placeholder="Company"></ion-input>
          </ion-content>
        </ion-modal>
      </ion-content>
    </ion-content>
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
  // IonToggle,
} from '@ionic/vue'
import { personOutline, addOutline } from 'ionicons/icons'
import { computed } from '@vue/reactivity';

const serverUrl = process.env.VUE_APP_SERVER_URL
// console.log({"serverUrl": serverUrl})
const data = ref([] as any[])
const search = ref()
const isOpen = ref(false)
// Print
const alert = ref(false)
const alertMsg = ref()
const alertTitle = ref()
const alertSubTitle = ref()

// Counts
const totalCount = ref(0)
const filteredCount = ref(0)
// const chekedCount = ref(0)

// Form
const firstName = ref('')
const lastName = ref('')
const email = ref('')
const company = ref('')

const submit = async () => {
  console.log('submit')

  const newGuest = {
    firstName: firstName.value,
    lastName: lastName.value,
    email: email.value,
    companyName: company.value,
  }

  console.log(newGuest)
  await axios
    .post(serverUrl + 'api/guests', newGuest)
    .then(res => {
      console.log(res)
    })
    .catch(err => {
      console.log(err)
      alertMsg.value = err
      alertTitle.value = 'Error'
      alertSubTitle.value = 'Error'
      alert.value = true
    })
    .finally(() => {
      setTimeout(() => {
        newGuest.firstName = ''
        newGuest.lastName = ''
        newGuest.email = ''
        newGuest.companyName = ''
        setOpen(false)
      }, 2000)
    })

}

axios.get(serverUrl + 'api/guests/?order=ASC&first=1000').then(res => {
  data.value = res.data.edges
  totalCount.value = res.data.pageInfo.totalCount
  console.table(data.value)
})

const guestInfo = (item: any) => {
  console.log(item)
  setAlertStatus(true)
  alertMsg.value = `${item.email} `
  alertTitle.value = '${item.firstName} ${item.lastName} '
  alertSubTitle.value = `${item.companyName}`
}

const filteredData = computed(() => {
  if (search.value) {
    return data.value.filter((item: any) => {
      const fullName = `${item.node.firstName} ${item.node.lastName} ${item.node.email} ${item.node.companyName}`
      return fullName.toLowerCase().includes(search.value.toLowerCase())

    })
  } else {
    return data.value
  }

})

watch(filteredData, (val) => {
  filteredCount.value = val.length
})

const count = computed(() => {
  return `${filteredCount.value} of ${totalCount.value} guests`
})

// const logScrollStart = () => {
//   console.log('scrolling started')
// }

// const logScrollEnd = () => {
//   console.log('scrolling ended')
// }

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
