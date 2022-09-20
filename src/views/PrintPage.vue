<template>
    <ion-page>
        <ion-content>
            <center>

                <ion-button @click="onPrint">Download PDF
                </ion-button>
            </center>
            <!-- <vue3-simple-html2pdf ref="Vue3SimpleHtml2pdf" id="PageToPrint" :options="pdfOptions" :filename="exportFilename"> -->
            <center>
                <div class="voucher " id="PageToPrint">
                    <center>
                        <h1>Ecco il tuo biglietto, <br /> portalo con te per partecipare allo spettacolo.</h1>

                        <img src="../../public/assets/media/foresight-poster.jpg" alt="poster" class="poster spacer">
                        <span class="spacer"></span>
                        <div class="location">
                            <p><strong>5 ottobre 2022 | 9:00</strong><br />
                                Auditorium Fondazione Cariplo <br />
                                Largo Gustav Mahler, Milano</p>
                            <h3 class="spacer">{{name}}</h3>
                            <center><img class="qrCode" :src="img64" /></center>
                            <p class="footer">Un’iniziativa di</p>
                            <img class="logo" src="../../public/assets/logos/Lombardini22-blk.png" alt="Lombardini22">
                        </div>
                    </center>
                </div>
            </center>
            <!-- </vue3-simple-html2pdf> -->
        </ion-content>
    </ion-page>
</template>
<script lang="ts" setup>
import { IonPage, IonContent, IonButton } from '@ionic/vue';
import { ref, onMounted } from 'vue';
import html2pdf from 'html2pdf.js'
import axios from 'axios';

const name = ref(window.location.href.split('/')[4]?.replace('%20', ' ') || 'Nome Cognome');
const email = ref(window.location.href.split('/').pop()?.toLowerCase() || '')
const qrCode = ref(`${process.env.VUE_APP_SERVER_URL}api/guests/qr/${email.value}`)
const img64 = ref('')

const getBase64 = (url: string) => {
    return axios
        .get(url, {
            responseType: 'arraybuffer'
        })
        .then(response => btoa(
            new Uint8Array(response.data)
                .reduce((data, byte) => data + String.fromCharCode(byte), '')
        ))
}

getBase64(qrCode.value).then(res => {

    img64.value = `data:image/png;base64,${res}`
    console.log(img64.value)
})

const pdfOptions = {
    margin: 0,
    image: {
        type: 'png',
        quality: 2,
    },
    html2canvas: { scale: 2 },
    jsPDF: {
        unit: 'px',
        format: [500, 970],
        orientation: 'p',
        putOnlyUsedFonts: true,
    },
}

const exportFilename = `Foresight 2022 Voucher ${name.value}.pdf`;

const onPrint = () => {
    const el = document.getElementById(`PageToPrint`)
    if (!el) {
        return
    }
    html2pdf().from(el).set(pdfOptions).save(exportFilename);
}

onMounted(() => {
    console.log('before mount')
    onPrint()
})



</script>
<style scoped>
.ion-page,
.md .content-ltr,
#background-content {
    background: whitesmoke !important;
}

.voucher {
    border-top: 5px solid #97f5ff;
    border-bottom: 5px solid #97f5ff;
    margin: 10px;
    padding: 10px;
    max-width: 500px;
    height: 100%;
    background: white;
}

.location {
    font-family: 'Helvetica Neue', Helvetica, Arial, Verdana, sans-serif;
    margin-top: 35px;
}

.spacer {
    margin-top: 35px;
}

p {
    margin: 10px 0;
    padding: 0;
    background: white;

}

.qrCode {
    width: 200px;
    height: 200px;
}

.footer {
    margin-top: 25px;
    font-size: 0.7em;
}
</style>