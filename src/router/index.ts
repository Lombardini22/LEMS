import { createRouter, createWebHistory } from '@ionic/vue-router'
import { RouteRecordRaw } from 'vue-router'
import ScanPage from '../views/ScanPage.vue'
import TabsPage from '../views/TabsPage.vue'
import ManualPage from '../views/ManualPage.vue'
import QuasarPage from '../views/QuasarPage.vue'
import TicketPage from '../views/TicketPage.vue'

const routes: Array<RouteRecordRaw> = [
  {
    path: '/',
    redirect: '/home',
  },
  {
    path: "/",
    component: TabsPage,
    children: [
      {
        path: "/",
        redirect: "/home",
      },
      {
        path: "home",
        name: "home",
        component: ScanPage,
      },
      {
        path: "manual",
        component: ManualPage,
        // beforeEnter: authCheck,
      },
      {
        path: "quasar",
        component: QuasarPage,
        // beforeEnter: authCheck,
      },

    ],
  },
  {
    path: "/ticket/:listId/:email",
    component: TicketPage,
  },
]

const router = createRouter({
  history: createWebHistory(process.env.BASE_URL),
  routes,
})

export default router
