import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  { path: '/', redirect: '/dashboard' },
  { path: '/dashboard', component: () => import('../views/Dashboard.vue'), meta: { title: '首页', desc: '仓库概览与快捷操作' } },
  { path: '/fabrics', component: () => import('../views/Fabrics.vue'), meta: { title: '面料管理', desc: '管理面料品类、颜色与库存阈值' } },
  { path: '/styles', component: () => import('../views/Styles.vue'), meta: { title: '款式管理', desc: '录入款式档案与面料用量' } },
  { path: '/styles/:id', component: () => import('../views/StyleDetail.vue'), meta: { title: '款式详情' } },
  { path: '/calc', component: () => import('../views/Calc.vue'), meta: { title: '用量计算', desc: '按件数计算所需面料用量' } },
  { path: '/stock/in', component: () => import('../views/StockIn.vue'), meta: { title: '入库', desc: '记录新到货面料数量' } },
  { path: '/stock/out', component: () => import('../views/StockOut.vue'), meta: { title: '出库', desc: '关联款式扣减库存' } },
  { path: '/inventory', component: () => import('../views/Inventory.vue'), meta: { title: '库存总览', desc: '查看全部面料当前库存状态' } },
  { path: '/timeline', component: () => import('../views/Timeline.vue'), meta: { title: '全局时间线', desc: '所有操作记录与历史流水' } },
  { path: '/reports', component: () => import('../views/Reports.vue'), meta: { title: '报表导出', desc: '导出库存报表为 Excel 文件' } }
]

export default createRouter({
  history: createWebHistory(),
  routes
})
