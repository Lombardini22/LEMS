<template>
    <ion-page>
        <ion-content>
            <div id="block">
                <img src="../../public/assets/logos/Lombardini22.png" alt="Lombardini" class="logo" />
                <h1 id="believers" class="pad-20 mar-bot-20">Ci mancherai!</h1>
                <img src="https://media.tenor.com/BsKYBPwg6oAAAAAC/christmas-grinch.gif" alt="grinch" class="grinch" />
                <p class="testo mar-20">
                    Ci dispiace, non sarai con noi al Christmas Party di quest’anno!
                    <br />
                    Ma non preoccuparti, ci saranno altre occasioni per festeggiare insieme. <br />
                    Buone feste, a presto!

                </p>
            </div>
        </ion-content>
    </ion-page>
</template>

<script lang="ts" setup>
import { onMounted } from 'vue';
import { snow } from './utils/confetti'

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

#block {
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 100%;
    color: #999999;
    background-color: #002651;
    /* background-color: whitesmoke; */
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
  