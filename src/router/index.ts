import { createRouter, createWebHistory } from '@ionic/vue-router'
import { RouteRecordRaw } from 'vue-router'
import ScanPage from '../views/ScanPage.vue'
import TabsPage from '../views/TabsPage.vue'
import ManualPage from '../views/ManualPage.vue'
import QuasarPage from '../views/QuasarPage.vue'
// import TicketPage from '../views/TicketPage.vue'
import TicketPage2 from '../views/TicketPage2.vue'
import AddPlusOne from '@/views/AddPlusOne.vue'

const routes: Array<RouteRecordRaw> = [
  {
    path: '/lems/management',
    component: TabsPage,
    children: [
      {
        path: '/lems/management',
        redirect: '/lems/management/scan',
      },
      {
        path: 'scan',
        name: 'scan',
        component: ScanPage,
      },
      {
        path: 'manual',
        component: ManualPage,
        // beforeEnter: authCheck,
      },
      {
        path: 'quasar',
        component: QuasarPage,
        // beforeEnter: authCheck,
      },
    ],
  },
  // {
  //   path: "/ticket2/:listId/:email",
  //   component: TicketPage,
  // },
  {
    path: '/ticket/:email',
    component: TicketPage2,
  },{
    path: '/plusOne',
    component: AddPlusOne,
  },
]

const router = createRouter({
  history: createWebHistory(process.env.BASE_URL),
  routes,
})

export default router
