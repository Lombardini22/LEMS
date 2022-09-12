<template>
  <ion-page>
    <ion-content>
      <div id="block">
        <h1 class="title">Grazie per esserti registrato, Ti aspettiamo!</h1>
        <Tilt data-tilt data-tilt-full-page-listening gyroscope="false">
          <div class="ticket ticket-1">
            <div class="details-block">
              <div class="logos-block">
                <img src="../../public/assets/logos/logo-foresight.png" class="logo-img" />
                <img src="../../public/assets/logos/Lombardini22.png" class="logo-lomb" />
              </div>

              <div class="guest">
                <span class="name">
                  {{ ticket.firstName }} {{ ticket.lastName }}</span>
                <br />
                <span class="company small">{{ ticket.company }}</span>
              </div>

              <div class="location-block">
                <span class="location">05. 10. 2022 ore 9:00</span>
                <br />
                <span class="location">Auditorium Fondazione Cariplo Largo G. Mahler, Milano</span>
              </div>
              <img src="../../public/assets/logos/Lombardini22.png" class="logo-lomb-mob" />

              <!-- <div class="rip"></div> -->
            </div>
            <div class="qr-block">
              <div class="upper_block">
                <img :src="qrResult" alt="QR Code" class="qr-img" />
                <h3>
                  Biglietto <br />#{{ tktNumber }}
                </h3>
              </div>
              <div class="lower_block">
                <span class="disclaimer">Il biglietto e' strettamente personale</span>
              </div>
            </div>
          </div>
        </Tilt>
        <div class="footer">
          <AddToCalendar />
          <ManualAddGuest :refererEmail="params.email" />
        </div>
        <h2 id="believers">Our Believers</h2>
        <img src="../../public/assets/logos/foresight-supporters1.png" alt="believers" width="700" />
      </div>
    </ion-content>
  </ion-page>
</template>

<script lang="ts" setup>
import { IonContent, IonPage } from '@ionic/vue'
import { ref } from 'vue'
import { MD5 } from 'crypto-js'
import Tilt from 'vanilla-tilt-vue'
import axios from 'axios'
import AddToCalendar from './components/AddToCalendar.vue'
import ManualAddGuest from './components/ManualAddGuest.vue'
const params = ref({
  listId: window.location.href.split('/')[4] || '4cdec2dac7',
  email: window.location.href.split('/')[5]?.toLowerCase() || '',
})


const ticket = ref({
  id: MD5(params.value.email).toString(),
  firstName: 'Test',
  lastName: 'Test',
  email: params.value.email,
  company: 'Test SPA',
})
const tktNumber = ref(ticket.value.id)

console.log(params.value)

axios
  .get(
    `http://localhost:5000/api/guests/${params.value.listId}/${params.value.email}`,
  )
  .then(response => {
    console.log('data:', response.data)
  })
  .catch(error => {
    console.log(error)
  })

axios
  .get(`http://localhost:5000/api/guests/${ticket.value.id}`)
  .then(res => {
    ticket.value.firstName = res.data.firstName
    ticket.value.lastName = res.data.lastName
    ticket.value.company = res.data.company
  })
  .catch(err => {
    console.log(err)
  })

const qrResult = ref('')
qrResult.value = `http://localhost:5000/api/guests/qr/${ticket.value.id}`
const qrcode = ref('')
qrcode.value = ticket.value.id
console.log(qrcode.value)
</script>

<style scoped>
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
  color: #fff;
}

.footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin: 1rem;
}

#block {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100%;
  color: #999999;
  background-color: #f4f5f6;
  background-image: linear-gradient(to bottom left, #abb5ba, #d5dadd);
  flex-direction: column;
}

body {
  background-color: #436ea5;
}

.ticket {
  font-family: sans-serif;
  background-repeat: no-repeat;
  background-position: top;
  background-size: 100%;
  width: 700px;
  height: 300px;
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
  background-image: url('../../public/assets/media/bg-1.png');
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
  font-size: 9px;
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
    height: 600px;
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
    background-image: url('../../public/assets/media/bg-1.png');
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
    font-size: 10px;
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
