import { createRouter, createWebHistory } from '@ionic/vue-router'
import { RouteRecordRaw } from 'vue-router'
import ScanPage from '../views/ScanPage.vue'
import TabsPage from '../views/TabsPage.vue'
import ManualPage from '../views/ManualPage.vue'

const routes: Array<RouteRecordRaw> = [
  {
    path: '/',
    redirect: '/tabs/home',
  },
  {
    path: '/home',
    name: 'Home',
    component: ScanPage,
  },
  {
    path: "/",
    redirect: "/tabs/tab1",
  },
  {
    path: "/tabs/",
    component: TabsPage,
    children: [
      {
        path: "",
        redirect: "/tabs/home",
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
    ],
  },
]

const router = createRouter({
  history: createWebHistory(process.env.BASE_URL),
  routes,
})

export default router
