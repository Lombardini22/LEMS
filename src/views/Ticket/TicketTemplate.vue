<template>
    <div>
        <h1 class="title">Grazie per aver confermato la tua presenza <br /> al nostro Christmas Party!</h1>
        <Tilt data-tilt data-tilt-full-page-listening gyroscope="false">
            <div class="ticket ticket-1">
                <div class="details-block">
                    <div class="logos-block">
                        <img src="/assets/logos/logo-foresight1.png" class="logo-img" />
                        <img src="/assets/logos/Lombardini22.png" class="logo-lomb" />
                    </div>

                    <div class="guest">
                        <span class="name"> {{ ticket.firstName }} {{ ticket.lastName }}</span>
                        <br />
                        <span class="company small">{{ ticket.company }}</span>
                    </div>

                    <div class="location-block">
                        <span class="location">05.10.2022 ore 9:00</span>
                        <br />
                        <span class="location">Auditorium Fondazione Cariplo Largo G. Mahler, Milano</span>
                    </div>
                    <img src="/assets/logos/Lombardini22.png" class="logo-lomb-mob" />

                    <!-- <div class="rip"></div> -->
                </div>
                <div class="qr-block">
                    <div class="upper_block">
                        <img :src="qrCode" alt="QR Code" class="qr-img" />
                        <h3>Biglietto <br />#{{ tktNumber }}</h3>
                    </div>
                    <div class="lower_block">
                        <span class="disclaimer">Il biglietto è strettamente personale</span>
                    </div>
                </div>
            </div>
        </Tilt>

        <div class="footer">
            <AddToCalendar />
            <ion-button class="btn mar-20" :href="printUrl">Salva Voucher in PDF</ion-button>

            <!-- <ion-button class="btn mar-20" :href="plusOne">Invita un ospite</ion-button> -->
            <ManualAddGuest :refererEmail="ticket.email" />
            <ion-button class="btn mar-20" href="mailto:info@foresightmilano.it?subject=FORESIGHT 2022">
                Contattaci Via
                Mail
            </ion-button>
        </div>
    </div>

</template>
  
<script lang="ts" setup>
import { IonButton } from '@ionic/vue'
import { computed,  ref, defineProps } from 'vue'
import Tilt from 'vanilla-tilt-vue'
import { Ticket } from '@/stores/guest/state';
import AddToCalendar from '../components/AddToCalendar.vue'


type Props = {
    ticket: Ticket
}

const props = defineProps<Props>()


const serverUrl = process.env.VUE_APP_SERVER_URL


// const validEmail = ref(false)


const tktNumber = ref(props.ticket.id.slice(0, 5).toUpperCase())
// onBeforeMount(() => {
//     axios
//         .get(serverUrl + `api/guests/${params.value.email}/rsvp/`)
//         .then(response => {
//             ticket.firstName = response.data.firstName
//             ticket.lastName = response.data.lastName
//             ticket.company = response.data.companyName
//             ticket.id = response.data.emailHash
//             console.log('data:', response.data)
//             validEmail.value = true
//         })
//         .catch(error => {
//             console.log({ error })

//         })
// })


const fullName = computed(() => {
    return props.ticket.firstName + ' ' + props.ticket.lastName
})
const qrCode = computed(() => {
    return serverUrl + `api/guests/qr/${props.ticket.email}`
})


// axios
//     .get(serverUrl + `api/guests/${ticket.id}`)
//     .then(res => {
//         ticket.firstName = res.data.firstName
//         ticket.lastName = res.data.lastName
//         ticket.company = res.data.companyName
//     })
//     .catch(err => {
//         console.log(err)
//     })

const printUrl = computed(() => {
    return `/print/${fullName.value}/${props.ticket.email}`
})


  // console.log(qrCode)
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

.input {
    background: rgb(158, 200, 255, 0.3);
    border-radius: 10px;
    border: none;
    color: black;
    margin-bottom: 5px;
    margin-top: 2px;
}

.login-logo {
    padding: 20px 0;
    min-height: 200px;
    text-align: center;
}

.login-logo img {
    max-width: 150px;
}

.cerca {
    margin-top: 15px;
    margin-bottom: 60px;
}

center {
    background: white;
    padding: 25px;
    border-radius: 25px;
    box-shadow: 0 10px 16px 0 rgb(0 0 0 / 20%), 0 6px 20px 0 rgb(0 0 0 / 19%) !important;
}

center strong {
    font-size: 20px;
    line-height: 26px;
    color: black;
}

*,
*::after {
    box-sizing: border-box;
    margin: 0;
    /* text-shadow: 0px 0px 20px black; */
    font-family: helvetica neue, helvetica, arial, verdana, sans-serif;
}

.title {
    text-align: center;
    font-size: 2rem;
    margin: 1rem;
    color: black;
}

.footer {
    display: flex;
    align-items: center;
    margin: 1rem;
    flex-direction: column;
    align-content: stretch;
    justify-content: space-between;
}

.btn {
    background: #a23cfd;
    --background: #a23cfd;
}

#block {
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 100%;
    color: #999999;
    background-color: whitesmoke;
    flex-direction: column;
}

body {
    background-color: #436ea5;
}

.pad-20 {
    padding-top: 20px;
}

.mar-20 {
    margin-top: 20px;
}

.ticket {
    font-family: sans-serif;
    background-repeat: no-repeat;
    background-position: top;
    background-size: 100%;
    width: 700px;
    height: 325px;
    border-radius: 15px;
    -webkit-filter: drop-shadow(1px 1px 3px rgba(0, 0, 0, 0.3));
    filter: drop-shadow(1px 1px 3px rgba(0, 0, 0, 0.3));
    display: inline-flex;
    margin: 10% auto auto auto;
    color: #fff;
    border-radius: 20px;
    margin-bottom: 25px;
}

.details-block {
    display: flex;
    background-image: url('../../../public/assets/media/bg-1.png');
    border-radius: 20px;
    flex-direction: column;
    background-position: center;
    background-size: cover;
    background-repeat: repeat;
    justify-content: space-between;
    height: 100%;
    width: 525px;
}

.logos-block {
    margin-top: 25px;
    display: inline-flex;

    justify-content: space-between;
}

.logo-img {
    height: 100px;
    margin-left: 35px;
}

.logo-lomb {
    height: 35px;
    margin-right: 20px;
}

.logo-lomb-mob {
    display: none;
}

.guest {
    font-size: 30px;
    margin: 20px 25px 0 35px;
    float: left;
    font-weight: bold;
}

.name {
    margin-top: 25px;
    font-size: 30px;
    text-transform: uppercase;
}

.company {
    font-size: 20px;
}

.small {
    font-weight: 200;
}

.location-block {
    float: left;
    margin: 25px 0 25px 35px;
    font-size: 20px;
    -webkit-text-stroke: 0.1px black;
    font-weight: bold;
    /* -webkit-filter: drop-shadow(1px 1px 3px rgba(0, 0, 0, 0.3));
    filter: drop-shadow(1px 1px 3px rgba(0, 0, 0, 0.3)); */
}

.location-block::before {
    background-size: 110px 110px;
    width: 110px;
    height: 110px;
    content: '';
    display: inline-block;
    float: left;
    position: absolute;
    left: -160px;
    bottom: 5px;
    /* -webkit-filter: drop-shadow(1px 1px 3px rgba(0, 0, 0, 0.3));
    filter: drop-shadow(1px 1px 3px rgba(0, 0, 0, 0.3)); */
}

.location {
    font-size: 16px;
    font-weight: 700;
}

.rip {
    border-right: 8px dotted #436ea5;
    height: 300px;
    position: absolute;
    top: 0;
    left: 520px;
}

.qr-block {
    width: 175px;
    height: 100%;
    background-color: #a23cfd;
    border-radius: 20px;
    color: #fff;
    text-decoration: none;
}

.upper_block {
    display: flex;
    margin-top: 25px;
    position: fixed;
    justify-content: center;
    align-items: center;
    right: 25px;
    flex-direction: column;
    align-content: space-between;
}

.lower_block {
    display: flex;
    flex-wrap: nowrap;
    flex-direction: column;
    align-content: space-between;
    justify-content: flex-end;
    align-items: flex-end;
    position: fixed;
    bottom: 25px;
    max-width: 175px;
}

.qr-img {
    width: 125px;
    margin-bottom: 15px;
}

.disclaimer {
    font-size: 12px;
    margin-left: 15px;
    margin-right: 15px;
    text-align: center;
}

h2#believers {
    color: white;
    /* padding-top: 20px; */
    margin: 20px;
    text-shadow: none;
}

/*  
   Responsive design
   */

@media (max-width: 700px) {
    .ticket {
        font-family: sans-serif;
        background-repeat: no-repeat;
        background-position: top;
        background-size: 100%;
        width: 95%;
        height: 680px;
        border-radius: 15px;
        filter: drop-shadow(1px 1px 3px rgba(0, 0, 0, 0.3));
        display: flex;
        margin: 10% auto auto auto;
        color: #fff;
        border-radius: 20px;
        flex-direction: column;
        flex-wrap: nowrap;
        align-items: center;
        margin-bottom: 25px;
    }

    .details-block {
        display: flex;
        background-image: url('../../../public/assets/media/bg-1.png');
        border-radius: 20px;
        flex-direction: column;
        background-position: center;
        background-repeat: repeat;
        background-size: cover;
        justify-content: flex-start;
        height: 75%;
        width: 100%;
        align-items: flex-start;
    }

    .logos-block {
        margin-top: 25px;
        display: inline-flex;

        justify-content: space-between;
    }

    .logo-img {
        height: 100px;
        margin-left: 35px;
    }

    .logo-lomb {
        height: 35px;
        margin-right: 20px;
        display: none;
    }

    .logo-lomb-mob {
        display: block;
        height: 35px;
        margin-top: 60px;
        margin-left: 35px;
    }

    .guest {
        font-size: 25px;
        margin: 20px 25px 0 35px;
        float: left;
        font-weight: bold;
    }

    .name {
        margin-top: 25px;
        font-size: 30px;
        text-transform: uppercase;
    }

    .company {
        font-size: 20px;
    }

    .small {
        font-weight: 200;
    }

    .location-block {
        float: left;
        margin: 25px 35px 25px 35px;
        font-size: 20px;
        -webkit-text-stroke: 0.1px black;
        font-weight: bold;
        /* -webkit-filter: drop-shadow(1px 1px 3px rgba(0, 0, 0, 0.3));
    filter: drop-shadow(1px 1px 3px rgba(0, 0, 0, 0.3)); */
    }

    .location-block::before {
        background-size: 110px 110px;
        width: 110px;
        height: 110px;
        content: '';
        display: inline-block;
        float: left;
        position: absolute;
        left: -160px;
        bottom: 5px;
        /* -webkit-filter: drop-shadow(1px 1px 3px rgba(0, 0, 0, 0.3));
    filter: drop-shadow(1px 1px 3px rgba(0, 0, 0, 0.3)); */
    }

    .location {
        font-size: 16px;
        font-weight: 700;
    }

    .rip {
        border-right: 8px dotted #436ea5;
        height: 300px;
        position: absolute;
        top: 0;
        left: 520px;
    }

    .qr-block {
        width: 100%;
        height: 25%;
        background-color: #a23cfd;
        border-radius: 20px;
        color: #fff;
        text-decoration: none;
        display: flex;
        flex-direction: row-reverse;
        align-content: center;
        justify-content: flex-start;
        align-items: center;
    }

    .upper_block {
        display: flex;
        margin: 15px -15px 0px 15px;
        width: 95%;
        position: fixed;
        justify-content: space-around;
        align-items: flex-start;
        flex-direction: row;
        align-content: flex-start;
        text-align: left;
    }

    .lower_block {
        display: flex;
        flex-wrap: nowrap;
        flex-direction: column;
        align-content: space-between;
        justify-content: flex-end;
        align-items: flex-end;
        position: fixed;
        bottom: 25px;
        max-width: 175px;
    }

    .qr-img {
        width: 125px;
        margin-bottom: 15px;
    }

    .disclaimer {
        font-size: 12px;
        margin-left: 45px;
        margin-right: 15px;
        text-align: left;
    }

    h2#believers {
        color: white;
        /* padding-top: 20px; */
        margin: 20px;
        text-shadow: none;
    }
}
</style>
  