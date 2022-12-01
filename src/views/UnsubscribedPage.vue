<template>
    <ion-page>
        <ion-content>
            <div id="block">
                <img src="../../public/assets/logos/Lombardini22.png" alt="Lombardini" class="logo" />
                <h1 id="believers" class="pad-20 mar-bot-20">Ci mancherai!</h1>
                <!-- <img src="https://media.tenor.com/BsKYBPwg6oAAAAAC/christmas-grinch.gif" alt="grinch" class="grinch" /> -->
                <!-- <model-viewer src="/assets/3d/Santa_Claus_walk.gltf" ar loop
                    ar-modes="webxr scene-viewer quick-look" camera-controls poster="poster.webp" shadow-intensity="1"
                    autoplay min-camera-orbit="auto 38deg auto" max-camera-orbit="auto 85deg auto">
                    <div class="progress-bar hide" slot="progress-bar">
                        <div class="update-bar"></div>
                    </div>
                    <button slot="ar-button" id="ar-button">
                        View in your space
                    </button>
                 <div id="ar-prompt">
        <img src="https://modelviewer.dev/shared-assets/icons/hand.png">
    </div>
                </model-viewer> -->

                <model-viewer class="Model3d" src="santa_claus_walk.glb" ar ar-modes="scene-viewer webxr quick-look"
                    camera-controls poster="poster.webp" shadow-intensity="1" autoplay
                    camera-orbit="-89.13deg 72deg 3.945m" field-of-view="30deg" camera-target="0.002791m 0.9288m 0.72m"
                    min-camera-orbit="auto 50deg auto" max-camera-orbit="auto 72deg auto">
                    <div class="progress-bar hide" slot="progress-bar">
                        <div class="update-bar"></div>
                    </div>
                    <button slot="ar-button" id="ar-button">
                        View in your space
                    </button>
                    <div id="ar-prompt">
                        <img src="https://modelviewer.dev/shared-assets/icons/hand.png">
                    </div>
                </model-viewer>

                <p class="testo mar-20">
                    Ci dispiace, non sarai con noi al Christmas Party di quest’anno!
                    <br />
                    Ma non preoccuparti, ci saranno altre occasioni per festeggiare insieme. <br /><br />
                    Buone feste, a presto!

                </p>
            </div>
        </ion-content>
    </ion-page>
</template>

<script lang="ts" setup>
import { useStoreGuest } from '@/stores';
import { onBeforeMount, onMounted, defineProps } from 'vue';
import { useRouter } from 'vue-router';
import { snow } from './utils/confetti'

type Props = {
    query?: string
}

const props = defineProps<Props>()

const store = useStoreGuest()

const email = props.query?.toLowerCase() || '';



onBeforeMount(async () => {
    if (email.length > 0) {
        await store.actions.addTag(email, 'NON PRESENTE')
    } else {
        useRouter().push({ name: 'ticketPage' })
    }

})

onMounted(() => {
    snow()
})
</script>
  

<style scoped>
.Model3d {
    height: 400px;

}

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
  