<template>
  <ion-page>
    <ion-content>
      <div id="block">
        <Tilt class="ticket" data-tilt data-tilt-full-page-listening>
          <header class="ticket_wrapper">
            <div class="ticket_header">

              <div id="header_block">
                <img src="../../public/assets/logos/logo-foresight-bk.png" alt="logo" height="100" paddingBottom="10" />
                <qrcode-vue :value="qrcode"></qrcode-vue>
              </div>
              <div id="header_block">
                <h3>Voucher</h3> 🎟️#{{ (Math.random() * 1000000).toFixed(0) }}
              </div>
            </div>
          </header>
          <div class="ticket_divider">
            <div class="ticket_notch"></div>
            <div class="ticket_notch ticket_notch--right"></div>
          </div>
          <div class="ticket_body">
            <section class="ticket_section">
              <h3><strong>{{ ticket.firstname }} {{ ticket.lastname }}</strong></h3>
              <p>{{ ticket.azienda }}</p>
            </section>
            <section class="ticket_section">
              <h3><strong>Foresight 2022</strong></h3>
              <p>5 Ottobre 2022 | ore 09:00</p>
              <p>Auditorium Fondazione Cariplo</p>
              <p>Largo Gustav Mahler, 20136 Milano MI</p>
            </section>
          </div>
          <footer class="ticket_footer">
            <img src="../../public/assets/logos/foresight-supporters.png" alt="believers" />
          </footer>
        </Tilt>
      </div>

    </ion-content>
  </ion-page>

</template>

<script lang="ts" setup>
import {
  IonContent,
  IonPage,
} from '@ionic/vue'
import QrcodeVue from 'qrcode.vue'
import { ref } from 'vue'
import { MD5 } from 'crypto-js'
import Tilt from 'vanilla-tilt-vue'

const ticket = ref({
  id: MD5(window.location.href.split('/')[5] || '').toString(),
  firstname: 'John',
  lastname: 'Doe',
  email: window.location.href.split('/')[5] || '',
  azienda: 'Foresight',
})

const qrcode = ref('')
qrcode.value = ticket.value.id
console.log(qrcode.value)

</script>

<style scoped>
*,
*::after {
  box-sizing: border-box;
  margin: 0;
}

#block {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100%;
  color: #454f54;
  background-color: #f4f5f6;
  background-image: linear-gradient(to bottom left, #abb5ba, #d5dadd);
}

#header_block {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
  /* align-items: center;
  flex-direction: column; */

}

.ticket {
  display: grid;
  grid-template-rows: auto 1fr auto;
  max-width: 24rem;
}

.ticket_header,
.ticket_body,
.ticket_footer {
  padding: 1.25rem;
  background-color: white;
  border: 1px solid #abb5ba;
  box-shadow: 0 2px 4px rgba(41, 54, 61, 0.25);
}

.ticket_header {
  font-size: 1.5rem;
  border-top: 0.25rem solid #4FF3FD;
  border-bottom: none;
  border-left: none;
  border-right: none;
  box-shadow: none;
  animation: borderPulse 10s infinite;
}

@keyframes borderPulse {
  20% {
    border-color: #bf59ee;
  }

  40% {
    border-color: #4FF3FD;
  }

  60% {
    border-color: #02D3DE;
  }

  80% {
    border-color: #DBA3F5;
  }

  100% {
    border-color: #4FF3FD;
  }
}

.ticket_wrapper {
  box-shadow: 0 2px 4px rgba(41, 54, 61, 0.25);
  border-radius: 0.375em 0.375em 0 0;
  overflow: hidden;
}

.ticket_divider {
  position: relative;
  height: 1rem;
  background-color: white;
  margin-left: 0.5rem;
  margin-right: 0.5rem;
}

.ticket_divider::after {
  content: "";
  position: absolute;
  height: 50%;
  width: 100%;
  top: 0;
  border-bottom: 2px dashed #e9ebed;
}

.ticket_notch {
  position: absolute;
  left: -0.5rem;
  width: 1rem;
  height: 1rem;
  overflow: hidden;
}

.ticket_notch::after {
  content: "";
  position: relative;
  display: block;
  width: 2rem;
  height: 2rem;
  right: 100%;
  top: -50%;
  border: 0.5rem solid white;
  border-radius: 50%;
  box-shadow: inset 0 2px 4px rgba(41, 54, 61, 0.25);
}

.ticket_notch--right {
  left: auto;
  right: -0.5rem;
}

.ticket_notch--right::after {
  right: 0;
}

.ticket_body {
  border-bottom: none;
  border-top: none;
}

.ticket_body>*+* {
  margin-top: 1.5rem;
  padding-top: 1.5rem;
  border-top: 1px solid #e9ebed;
}

.ticket_section>*+* {
  margin-top: 0.25rem;
}

.ticket_section>h3 {
  font-size: 1.125rem;
  margin-bottom: 0.5rem;
}

.ticket_header,
.ticket_footer {
  font-weight: bold;
  font-size: 1.25rem;
  display: block;
  justify-content: space-between;
}

.ticket_footer {
  border-top: 2px dashed #e9ebed;
  border-radius: 0 0 0.325rem 0.325rem;
}
</style>
