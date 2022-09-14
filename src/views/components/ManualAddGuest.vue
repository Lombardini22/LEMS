<template>
    <ion-button @click="setOpen(true)">Invita un ospite</ion-button>
    <!-- Modal -->
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
        </ion-content>
    </ion-modal>

    <!-- ALERT -->
    <ion-alert :is-open="alert" header="Confirm Information" :sub-header="alertSubTitle" :message="alertMsg"
        :buttons="['OK']" @didDismiss="setAlertStatus(false)"></ion-alert>
</template>
<script lang="ts" setup>
import { IonButton, IonButtons, IonContent, IonHeader, IonInput, IonTitle, IonToolbar, IonModal, IonAlert } from '@ionic/vue';
// import { addOutline } from 'ionicons/icons';
import { ref, defineProps } from 'vue';
import axios from 'axios';


const serverUrl = '/'

// Print
const alert = ref(false)
const alertMsg = ref()
const alertTitle = ref()
const alertSubTitle = ref()

// Form
const firstName = ref('')
const lastName = ref('')
const email = ref('')

//  Modal Control
const isOpen = ref(false)

const setOpen = (value: boolean) => {
    isOpen.value = value
    console.log({ isOpen: isOpen.value })
}
const props = defineProps<{
    refererEmail: string
}>()

const submit = async () => {
    try {
        const res = await axios.post(serverUrl + 'api/guests?referrerEmail=' + props.refererEmail, {
            firstName: firstName.value,
            lastName: lastName.value,
            email: email.value,

        })
        if (res.status == 200) {
            alertTitle.value = 'Success'
            alertSubTitle.value = 'Guest added successfully'
            alertMsg.value = 'Il tuo guest riceverà una email di conferma qualche giorno prima dell\'evento'
            alert.value = true
            setTimeout(() => {
                location.reload()
                setOpen(false)
            }, 4000)
        } else {
            alertTitle.value = 'Error'
            alertSubTitle.value = 'Error adding guest'
            alertMsg.value = 'Error adding guest'
            alert.value = true
        }

    } catch (e) {
        console.error(e)
    }
}

const setAlertStatus = (status: boolean) => {
    alert.value = status
}




</script>
