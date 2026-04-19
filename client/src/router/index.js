import { createRouter, createWebHistory } from 'vue-router'
import { auth } from '../stores/auth'

const routes = [
  { path: '/login', component: () => import('../views/Login.vue'), meta: { public: true } },
  { path: '/', redirect: '/dashboard' },
  { path: '/dashboard', component: () => import('../views/Dashboard.vue'), meta: { titleKey: 'nav.dashboard', descKey: 'nav.dashboard_desc' } },
  { path: '/fabrics', component: () => import('../views/Fabrics.vue'), meta: { titleKey: 'nav.fabrics', descKey: 'nav.fabrics_desc' } },
  { path: '/styles', component: () => import('../views/Styles.vue'), meta: { titleKey: 'nav.styles', descKey: 'nav.styles_desc' } },
  { path: '/styles/:id', component: () => import('../views/StyleDetail.vue'), meta: { titleKey: 'nav.style_detail' } },
  { path: '/calc', component: () => import('../views/Calc.vue'), meta: { titleKey: 'nav.calc', descKey: 'nav.calc_desc' } },
  { path: '/stock/in', component: () => import('../views/StockIn.vue'), meta: { titleKey: 'nav.stock_in', descKey: 'nav.stock_in_desc' } },
  { path: '/stock/out', component: () => import('../views/StockOut.vue'), meta: { titleKey: 'nav.stock_out', descKey: 'nav.stock_out_desc' } },
  { path: '/inventory', component: () => import('../views/Inventory.vue'), meta: { titleKey: 'nav.inventory', descKey: 'nav.inventory_desc' } },
  { path: '/timeline', component: () => import('../views/Timeline.vue'), meta: { titleKey: 'nav.timeline', descKey: 'nav.timeline_desc' } },
  { path: '/reports', component: () => import('../views/Reports.vue'), meta: { titleKey: 'nav.reports', descKey: 'nav.reports_desc' } },
  { path: '/backup', component: () => import('../views/Backup.vue'), meta: { titleKey: 'nav.backup', descKey: 'nav.backup_desc' } },
  { path: '/admin', component: () => import('../views/Admin.vue'), meta: { titleKey: 'nav.admin', requireAdmin: true } }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

router.beforeEach(async (to) => {
  if (!auth.state.initialized) await auth.init()
  if (to.meta.public) return true
  if (!auth.state.user && !localStorage.getItem('guest_acknowledged')) return '/login'
  if (to.meta.requireAdmin && auth.state.user?.role !== 'admin') return '/dashboard'
  return true
})

export default router
