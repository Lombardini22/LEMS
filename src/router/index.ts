import { createRouter, createWebHistory } from '@ionic/vue-router'
import { RouteRecordRaw } from 'vue-router'
import ScanPage from '../views/ScanPage.vue'
import TabsPage from '../views/TabsPage.vue'
import ManualPage from '../views/ManualPage.vue'
import TestPage from '../views/TestPage.vue'
import ReportsPage from '../views/ReportsPage.vue'
import TicketPage2 from '../views/TicketPage2.vue'
import AddPlusOne from '@/views/AddPlusOne.vue'
import LoginPage from '@/views/LoginPage.vue'
import PrintPage from '@/views/PrintPage.vue'
import GuestListPage from '@/views/GuestListPage.vue'
import { ref } from 'vue'
import { isPlatform } from '@ionic/vue'

const authCheck = () => {
  const isAuth = ref(false)
  const check = () => {
    const token = localStorage.getItem('user')
    if (token) {
      isAuth.value = true
    }
  }
  return { isAuth, check }
}

const logout = () => {
  localStorage.removeItem('user')
}

const initialRedirect: Array<RouteRecordRaw> =
  isPlatform('android') || isPlatform('ios')
    ? [
        {
          path: '/',
          redirect: '/login',
        },
      ]
    : []

const routes: Array<RouteRecordRaw> = [
  ...initialRedirect,
  ...[
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
            const { isAuth, check } = authCheck()
            check()
            if (isAuth.value) {
              return true
            } else {
              return '/login'
            }
          },
        },
        {
          path: 'manual',
          component: ManualPage,
          beforeEnter: () => {
            const { isAuth, check } = authCheck()
            check()
            if (isAuth.value) {
              return true
            } else {
              return '/login'
            }
          },
        },
        {
          path: 'list',
          component: GuestListPage,
          beforeEnter: () => {
            const { isAuth, check } = authCheck()
            check()
            if (isAuth.value) {
              return true
            } else {
              return '/login'
            }
          },
        },
        {
          path: 'reports',
          component: ReportsPage,
          beforeEnter: () => {
            const { isAuth, check } = authCheck()
            check()
            if (isAuth.value) {
              return true
            } else {
              return '/login'
            }
          },
        },
        {
          path: 'test',
          component: TestPage,
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
    },
    {
      path: '/ticket',
      component: TicketPage2,
    },
    {
      path: '/plusOne',
      redirect: '/guest',
    },
    {
      path: '/guest',
      component: AddPlusOne,
    },
    {
      path: '/print/:name/:email',
      component: PrintPage,
    },
    {
      path: '/login',
      component: LoginPage,
      beforeEnter: () => {
        const { isAuth, check } = authCheck()
        check()
        if (isAuth.value) {
          return '/lems/management'
        } else {
          return true
        }
      },
    },
    {
      path: '/logout',
      component: LoginPage,
      beforeEnter: () => {
        logout()
        return '/login'
      },
    },
  ],
]

const router = createRouter({
  history: createWebHistory(process.env.BASE_URL),
  routes,
})

export default router
