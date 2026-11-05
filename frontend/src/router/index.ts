import { createRouter, createWebHistory } from 'vue-router'
import LoginView from '../views/LoginView.vue'
import DashboardView from '../views/DashboardView.vue'
import RoomStaysView from '../views/RoomStaysView.vue'
import CustomersView from '../views/CustomersView.vue'
import RoomsView from '../views/RoomsView.vue'
import { useAuthStore } from '../stores/auth'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', redirect: '/dashboard' },
    { path: '/login', component: LoginView, meta: { public: true } },
    { path: '/dashboard', component: DashboardView },
    { path: '/stays', component: RoomStaysView },
    { path: '/customers', component: CustomersView },
    { path: '/rooms', component: RoomsView },
    { path: '/:pathMatch(.*)*', redirect: '/dashboard' },
  ],
})

router.beforeEach(async (to) => {
  const auth = useAuthStore()
  const signedIn = await auth.restore()
  if (!to.meta.public && !signedIn) return { path: '/login', query: { redirect: to.fullPath } }
  if (to.path === '/login' && signedIn) return '/dashboard'
})

export default router
