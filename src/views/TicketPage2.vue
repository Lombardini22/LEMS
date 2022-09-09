<template>
  <ion-page>
    <ion-content>
      <div id="block">
        <Tilt data-tilt data-tilt-full-page-listening gyroscope="false">
          <div class="ticket ticket-1">

            <div class="date">
              <span class="day">05</span>
              <span class="month-and-time">OTT<br /><span class="small">9:00</span></span>
            </div>

            <div class="artist">
              <span class="name">FORESIGHT</span>
              <br />
              <span class="place small">2022</span>
            </div>

            <div class="location">
              <span>Auditorium Fondazione Cariplo</span>
              <br />
              <span class="small">Largo Gustav Mahler, 20136 Milano</span>
            </div>

            <div class="rip">
            </div>

            <div class="cta">
              <div class="upper_block">
                <h3>Voucher </h3>
                <img :src="qrResult" alt="QR Code" height="125" paddingBottom="10" />
                🎟️ #{{ (Math.random() * 1000000).toFixed(0) }}
              </div>
              <div class="lower_block">
                <span class="guest_name"><strong>{{ ticket.firstName }} {{ ticket.lastName }}</strong></span>
                <p>{{ ticket.company }}</p>
              </div>
            </div>

          </div>
        </Tilt>
        <AddToCalendar />
        <h2 id="believers">Our Believers</h2>
        <img src="../../public/assets/logos/foresight-supporters.png" alt="believers" />
      </div>

    </ion-content>
  </ion-page>

</template>

<script lang="ts" setup>
import {
IonContent,
IonPage,
} from '@ionic/vue'
import { ref } from 'vue'
import { MD5 } from 'crypto-js'
import Tilt from 'vanilla-tilt-vue'
import axios from 'axios';
import AddToCalendar from './components/AddToCalendar.vue';


const ticket = ref({
id: MD5(window.location.href.split('/')[5] || '').toString(),
firstName: 'Test',
lastName: 'Test',
email: window.location.href.split('/')[5] || '',
company: 'Test SPA',
})

axios.get(`http://localhost:5000/guests/${ticket.value.id}`).then((res) => {
ticket.value.firstName = res.data.firstName
ticket.value.lastName = res.data.lastName
ticket.value.company = res.data.company
}).catch((err) => {
console.log(err)
})


const qrResult = ref('')
qrResult.value = `http://localhost:5000/guests/qr/${ticket.value.id}`
const qrcode = ref('')
qrcode.value = ticket.value.id
console.log(qrcode.value)

</script>

<style scoped>
*,
*::after {
  box-sizing: border-box;
  margin: 0;
  text-shadow: 0px 0px 20px black;
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
  background-color: #04030C;
  width: 700px;
  height: 300px;
  border-radius: 15px;
  -webkit-filter: drop-shadow(1px 1px 3px rgba(0, 0, 0, 0.3));
  filter: drop-shadow(1px 1px 3px rgba(0, 0, 0, 0.3));
  display: block;
  margin: 10% auto auto auto;
  color: #fff;
}

.date {
  margin: 15px;
  -webkit-filter: drop-shadow(1px 1px 3px rgba(0, 0, 0, 0.3));
  filter: drop-shadow(1px 1px 3px rgba(0, 0, 0, 0.3));
}

.date .day {
  font-size: 80px;
  float: left;
}

.date .month-and-time {
  float: left;
  margin: 15px 0 0 0;
  font-weight: bold;
}

.artist {
  font-size: 30px;
  margin: 10px 100px 0 40px;
  float: left;
  font-weight: bold;
  -webkit-filter: drop-shadow(1px 1px 3px rgba(0, 0, 0, 0.3));
  filter: drop-shadow(1px 1px 3px rgba(0, 0, 0, 0.3));
}

.location {
  float: left;
  margin: 135px 0 0 78px;
  font-size: 20px;
  -webkit-text-stroke: 0.1px black;
  font-weight: bold;
  -webkit-filter: drop-shadow(1px 1px 3px rgba(0, 0, 0, 0.3));
  filter: drop-shadow(1px 1px 3px rgba(0, 0, 0, 0.3));
}

.location::before {
  background-image: "../../public/assets/logos/logo-foresight-bk.png";
  background-size: 110px 110px;
  width: 110px;
  height: 110px;
  content: "";
  display: inline-block;
  float: left;
  position: absolute;
  left: -160px;
  bottom: 5px;
  -webkit-filter: drop-shadow(1px 1px 3px rgba(0, 0, 0, 0.3));
  filter: drop-shadow(1px 1px 3px rgba(0, 0, 0, 0.3));
}

.rip {
  border-right: 8px dotted #436ea5;
  height: 300px;
  position: absolute;
  top: 0;
  left: 520px;
}

.cta .buy {
  position: absolute;
  top: 135px;
  right: 15px;
  display: block;
  font-size: 12px;
  font-weight: bold;
  padding: 10px 20px;
  border-radius: 20px;
  color: #fff;
  text-decoration: none;
  -webkit-transform: rotate(-90deg);
  -ms-transform: rotate(-90deg);
  transform: rotate(-90deg);
  -webkit-filter: drop-shadow(1px 1px 3px rgba(0, 0, 0, 0.3));
  filter: drop-shadow(1px 1px 3px rgba(0, 0, 0, 0.3));
}

.small {
  font-weight: 200;
}

.ticket-1 {
  background-image: url(https://mcusercontent.com/37939db51ed309bab9ee19366/images/c4370b25-4a66-5fa7-a655-c39545046902.jpg);
}

.upper_block {
  display: flex;
  padding-left: 30px;
  position: fixed;
  flex-wrap: nowrap;
  flex-direction: column;
  align-content: space-between;
  justify-content: flex-end;
  align-items: center;
  right: 20px;
}

.lower_block {
  display: flex;
  padding-left: 30px;
  flex-wrap: nowrap;
  flex-direction: column;
  align-content: space-between;
  justify-content: flex-start;
  align-items: flex-end;
  right: 20px;
  position: fixed;
  top: 210px;
  max-width: 180px;
}

.guest_name {
  font-size: 18px;
  text-align: right;
  color: black;
}

h2#believers {
  color: white;
  /* padding-top: 20px; */
  margin: 20px;
  text-shadow: none;
}


/* Responive */


@media(max-width:500px) {
  .ticket {
    font-family: sans-serif;
    background-repeat: no-repeat;
    background-position: center;
    background-size: cover;
    background-color: #04030C;
    width: 90%;
    height: 500px;
    border-radius: 15px;
    -webkit-filter: drop-shadow(1px 1px 3px rgba(0, 0, 0, 0.3));
    filter: drop-shadow(1px 1px 3px rgba(0, 0, 0, 0.3));
    display: block;
    margin: 10% auto auto auto;
    color: #fff;
  }

  .date {
    margin: 15px;
    -webkit-filter: drop-shadow(1px 1px 3px rgba(0, 0, 0, 0.3));
    filter: drop-shadow(1px 1px 3px rgba(0, 0, 0, 0.3));
  }

  .date .day {
    font-size: 80px;
    float: left;
  }

  .date .month-and-time {
    float: left;
    margin: 15px 0 0 0;
    font-weight: bold;
  }

  .artist {
    font-size: 30px;
    margin: 10px 100px 0 15px;
    float: left;
    font-weight: bold;
    position: absolute;
    filter: drop-shadow(1px 1px 3px rgba(0, 0, 0, 0.3));
    top: 79px;
  }

  .location {
    float: left;
    margin: 135px 0 0 78px;
    font-size: 20px;
    -webkit-text-stroke: 0.1px black;
    font-weight: bold;
    -webkit-filter: drop-shadow(1px 1px 3px rgba(0, 0, 0, 0.3));
    filter: drop-shadow(1px 1px 3px rgba(0, 0, 0, 0.3));
  }

  .location::before {
    background-image: "../../public/assets/logos/logo-foresight-bk.png";
    background-size: 110px 110px;
    width: 110px;
    height: 110px;
    content: "";
    display: inline-block;
    float: left;
    position: absolute;
    left: -160px;
    bottom: 5px;
    -webkit-filter: drop-shadow(1px 1px 3px rgba(0, 0, 0, 0.3));
    filter: drop-shadow(1px 1px 3px rgba(0, 0, 0, 0.3));
  }

  .rip {
    border-right: 8px dotted #436ea5;
    height: 300px;
    position: absolute;
    top: 0;
    left: 520px;
  }

  .cta .buy {
    position: absolute;
    top: 135px;
    right: 15px;
    display: block;
    font-size: 12px;
    font-weight: bold;
    padding: 10px 20px;
    border-radius: 20px;
    color: #fff;
    text-decoration: none;
    -webkit-transform: rotate(-90deg);
    -ms-transform: rotate(-90deg);
    transform: rotate(-90deg);
    -webkit-filter: drop-shadow(1px 1px 3px rgba(0, 0, 0, 0.3));
    filter: drop-shadow(1px 1px 3px rgba(0, 0, 0, 0.3));
  }

  .small {
    font-weight: 200;
  }

  .ticket-1 {
    background-image: url(https://mcusercontent.com/37939db51ed309bab9ee19366/images/c4370b25-4a66-5fa7-a655-c39545046902.jpg);
  }

  .upper_block {
    display: flex;
    padding-left: 30px;
    position: fixed;
    flex-wrap: nowrap;
    flex-direction: column;
    align-content: space-between;
    justify-content: flex-end;
    align-items: center;
    right: 20px;
  }

  .lower_block {
    display: flex;
    padding-left: 30px;
    flex-wrap: nowrap;
    flex-direction: column;
    align-content: space-between;
    justify-content: flex-start;
    align-items: flex-end;
    right: 20px;
    position: fixed;
    top: 210px;
    max-width: 180px;
  }

  .guest_name {
    font-size: 18px;
    text-align: right;
    color: black;
  }

}
</style>
