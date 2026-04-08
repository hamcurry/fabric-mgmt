import { createRouter, createWebHistory } from 'vue-router'

const routes = [
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
  { path: '/reports', component: () => import('../views/Reports.vue'), meta: { titleKey: 'nav.reports', descKey: 'nav.reports_desc' } }
]

export default createRouter({
  history: createWebHistory(),
  routes
})
