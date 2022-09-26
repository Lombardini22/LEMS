import { createApp } from 'vue'
// import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'

import { IonicVue } from '@ionic/vue'
import { Vue3SimpleHtml2pdf } from "vue3-simple-html2pdf";


/* Core CSS required for Ionic components to work properly */
import '@ionic/vue/css/core.css'

/* Basic CSS for apps built with Ionic */
import '@ionic/vue/css/normalize.css'
import '@ionic/vue/css/structure.css'
import '@ionic/vue/css/typography.css'

/* Optional CSS utils that can be commented out */
import '@ionic/vue/css/padding.css'
import '@ionic/vue/css/float-elements.css'
import '@ionic/vue/css/text-alignment.css'
import '@ionic/vue/css/text-transformation.css'
import '@ionic/vue/css/flex-utils.css'
import '@ionic/vue/css/display.css'

/* Theme variables */
import './theme/variables.css'
import QrReader from 'vue3-qr-reader';


// const pinia = createPinia()

const app = createApp(App).use(IonicVue).use(router).use(Vue3SimpleHtml2pdf).use(QrReader);
// .use(pinia)

router.isReady().then(() => {
  app.mount('#app')
}).catch(e => {
  console.error(e),
  alert(e)
})
