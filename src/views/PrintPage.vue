<template>
    <ion-page>
        <ion-content>

            <!-- <vue3-simple-html2pdf ref="Vue3SimpleHtml2pdf" id="PageToPrint" :options="pdfOptions" :filename="exportFilename"> -->
            <center>
                <div class="voucher " id="PageToPrint">
                    <center>
                        <!-- <h1>Ecco il tuo biglietto, <br /> portalo con te per partecipare allo spettacolo.</h1> -->

                        <img src="../../public/assets/logos/title_cp_print.png" alt="poster" class="poster spacer">
                        <span class="spacer"></span>
                        <div class="location">
                            <p><strong>22 Dicembre 2022 | 19:00</strong><br />
                                Triennale Milano <br />
                                Viale Alemagna 6</p>
                            <h3 class="spacer">{{name}}</h3>
                            <center><img class="qrCode " :src="img64" id="qr-code" /></center>
                            <!-- <p class="footer">Un’iniziativa di</p> -->
                            <img class="logo spacer" src="../../public/assets/logos/Lombardini22-blk.png" alt="Lombardini22">
                        </div>
                    </center>
                </div>
                <center>
                    <ion-button @click="onPrint">Scarica il biglietto</ion-button>
                </center>
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

// il codice e' troppo veloce e non riesce a caricare l'immagine
const onPrint = () => {
    const el = document.getElementById(`PageToPrint`)
    const qrc = document.getElementById(`qr-code`)
    console.log({ el, qrc })

    if (!el || !qrc) {
        setTimeout(() => {
            onPrint()
        }, 1000)
        return
    }
    html2pdf().from(el).set(pdfOptions).save(exportFilename);
}

onMounted(() => {
    setTimeout(() => {
        onPrint()
    }, 2000)
})



</script>
<style scoped>
.ion-page,
.md .content-ltr,
#background-content {
    background: whitesmoke !important;
}

.voucher {
    border-top: 5px solid #ff5772;
    border-bottom: 5px solid #ff5772;
    margin: 10px;
    padding: 10px;
    max-width: 500px;
    height: 100%;
    background: white;
}
.poster{
    /* background-color: black; */
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
.logo{
    padding-bottom: 120px;
}
</style>