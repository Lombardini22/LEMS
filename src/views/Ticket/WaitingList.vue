<template>
    <img src="/assets/logos/Lombardini22.png" alt="Lombardini" class="logo" />

    <h1 id="believers" class="pad-20">Waiting List!</h1>
    <!-- <img src="https://media.tenor.com/S71h7S1QxeYAAAAC/eyes-puss-in-boots.gif" alt="grinch" class="grinch" /> -->
    <model-viewer src="https://rd.lombardini22.com/viewer/models/santa_claus_sad.glb" ar ar-modes="webxr scene-viewer quick-look" camera-controls
        poster="poster.webp" shadow-intensity="1" autoplay min-camera-orbit="auto 38deg auto"
        max-camera-orbit="auto 85deg auto">
        <div class="progress-bar hide" slot="progress-bar">
            <div class="update-bar"></div>
        </div>
        <button slot="ar-button" id="ar-button">
            View in your space
        </button>
        <!-- <div id="ar-prompt">
        <img src="https://modelviewer.dev/shared-assets/icons/hand.png">
    </div> -->
    </model-viewer>



    <p>
        Grazie per aver richiesto di partecipare al Christmas Party di Lombardini22!
        <br />
        <br />
        Al momento purtroppo sono terminati i posti disponibili in Triennale.<br />
        <br />
        Stiamo facendo tutto il possibile per poterti confermare la partecipazione!<br />
        <br />
        Riceverai presto nostre notizie,<br />
        Grazie!
    </p>
</template>
<script lang="ts" setup>
import { onMounted } from 'vue';
import { snow } from '../utils/confetti'

onMounted(() => {
    snow()
})
</script>
<style scoped>
.logo {
    width: 100%;
    max-width: 200px;
    margin: 0 auto;
    display: block;
    position: absolute;
    top: 50px;
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

body {
    background-color: #436ea5;
}

.pad-20 {
    padding-top: 20px;
}

.mar-20 {
    margin-top: 20px;
}

.mar-bot-20 {
    margin-bottom: 20px;
}

.grinch {
    width: 100%;
    max-width: 300px;
    margin-bottom: 30px;
}

.testo {
    text-align: center;
    font-size: 20px;
    line-height: 26px;
    color: white;
    margin: 0;
}

#believers {
    color: white;
    /* padding-top: 20px; */
    margin: 20px;
    text-shadow: none;
}
</style>