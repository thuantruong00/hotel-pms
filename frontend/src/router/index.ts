import { createRouter, createWebHistory } from 'vue-router'
import LoginView from '../views/LoginView.vue'
import DashboardView from '../views/DashboardView.vue'
import RoomStaysView from '../views/RoomStaysView.vue'
import CustomersView from '../views/CustomersView.vue'
import RoomsView from '../views/RoomsView.vue'
import AccountsView from '../views/AccountsView.vue'
import ChangePasswordView from '../views/ChangePasswordView.vue'
import type { PageKey } from '../api/types'
import { useAuthStore } from '../stores/auth'

declare module 'vue-router' {
  interface RouteMeta {
    public?: boolean
    /** Page key checked against the role's pages from role-access.json. */
    page?: PageKey
  }
}

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', redirect: '/dashboard' },
    { path: '/login', component: LoginView, meta: { public: true } },
    { path: '/dashboard', component: DashboardView, meta: { page: 'dashboard' } },
    { path: '/stays', component: RoomStaysView, meta: { page: 'stays' } },
    { path: '/customers', component: CustomersView, meta: { page: 'customers' } },
    { path: '/rooms', component: RoomsView, meta: { page: 'rooms' } },
    { path: '/accounts', component: AccountsView, meta: { page: 'accounts' } },
    { path: '/change-password', component: ChangePasswordView, meta: { page: 'change-password' } },
    { path: '/:pathMatch(.*)*', redirect: '/dashboard' },
  ],
})

router.beforeEach(async (to) => {
  const auth = useAuthStore()
  const signedIn = await auth.restore()
  if (to.meta.public) return signedIn && to.path === '/login' ? auth.homePath : true
  if (!signedIn) return { path: '/login', query: { redirect: to.fullPath } }
  // Pages the role may not see send the user to their home page.
  if (to.meta.page && !auth.canSee(to.meta.page)) {
    return auth.homePath === to.path ? '/change-password' : auth.homePath
  }
})

export default router
