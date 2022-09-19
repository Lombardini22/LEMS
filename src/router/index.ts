import { createRouter, createWebHistory } from '@ionic/vue-router'
import { RouteRecordRaw } from 'vue-router'
import ScanPage from '../views/ScanPage.vue'
import TabsPage from '../views/TabsPage.vue'
import ManualPage from '../views/ManualPage.vue'
// import QuasarPage from '../views/QuasarPage.vue'
// import TicketPage from '../views/TicketPage.vue'
import TicketPage2 from '../views/TicketPage2.vue'
import AddPlusOne from '@/views/AddPlusOne.vue'
import LoginPage from '@/views/LoginPage.vue'
import {ref} from 'vue'

const authCheck = () =>{
  const isAuth = ref(false)
  const check = () => {
    const token = localStorage.getItem('user')
    if (token) {
      isAuth.value = true
    }
  }
  return {isAuth, check}
}



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
        beforeEnter: () => {
          const {isAuth, check} = authCheck()
          check()
          if (isAuth.value) {
            return true
          } else {
            return '/login'
          }
        }
      },
      {
        path: 'manual',
        component: ManualPage,
        beforeEnter: () => {
          const {isAuth, check} = authCheck()
          check()
          if (isAuth.value) {
            return true
          } else {
            return '/login'
          }
        }
      },
      // {
      //   path: 'quasar',
      //   component: QuasarPage,
      // },
    ],
  },
  // {
  //   path: "/ticket2/:listId/:email",
  //   component: TicketPage,
  // },
  {
    path: '/ticket/:email',
    component: TicketPage2,
  }, {
    path: '/plusOne',
    redirect: '/guest'
  }, {
    path: '/guest',
    component: AddPlusOne,
  },
  {
    path: '/login',
    component: LoginPage,
    beforeEnter: () => {
      const {isAuth, check} = authCheck()
      check()
      if (isAuth.value) {
        return '/lems/management'
      } else {
        return true
      }
    }
  },
]

const router = createRouter({
  history: createWebHistory(process.env.BASE_URL),
  routes,
})

export default router
