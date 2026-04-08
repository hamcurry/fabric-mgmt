<template>
  <div>
    <!-- 预警提示条 -->
    <el-alert
      v-if="alerts.length"
      :title="`${alerts.length} 种面料库存低于预警阈值，请及时补货`"
      type="warning"
      :closable="false"
      show-icon
      style="margin-bottom:20px"
    />

    <!-- 统计卡片 -->
    <div class="stat-grid">
      <div v-for="stat in stats" :key="stat.label" class="stat-card">
        <div class="stat-label">{{ stat.label }}</div>
        <div class="stat-value" :style="{ color: stat.color || 'var(--color-text-primary)' }">
          {{ stat.value }}
        </div>
        <div v-if="stat.sub" class="stat-sub">{{ stat.sub }}</div>
      </div>
    </div>

    <!-- 快捷操作 -->
    <el-card shadow="never" style="margin-bottom:20px">
      <template #header><b>快捷操作</b></template>
      <div class="quick-grid">
        <button class="quick-btn quick-btn--primary" @click="$router.push('/calc')">
          <div class="quick-btn-icon">⚖</div>
          <div>
            <div class="quick-btn-title">用量计算</div>
            <div class="quick-btn-sub">按件数计算所需面料</div>
          </div>
        </button>
        <button class="quick-btn quick-btn--success" @click="$router.push('/stock/in')">
          <div class="quick-btn-icon">↓</div>
          <div>
            <div class="quick-btn-title">面料入库</div>
            <div class="quick-btn-sub">记录新到货面料</div>
          </div>
        </button>
        <button class="quick-btn quick-btn--warning" @click="$router.push('/stock/out')">
          <div class="quick-btn-icon">↑</div>
          <div>
            <div class="quick-btn-title">面料出库</div>
            <div class="quick-btn-sub">关联款式出库扣减</div>
          </div>
        </button>
        <button class="quick-btn quick-btn--neutral" @click="$router.push('/styles')">
          <div class="quick-btn-icon">＋</div>
          <div>
            <div class="quick-btn-title">新建款式</div>
            <div class="quick-btn-sub">录入款式面料用量</div>
          </div>
        </button>
      </div>
    </el-card>

    <!-- 预警面料列表 -->
    <el-card v-if="alerts.length" shadow="never">
      <template #header><b>库存预警</b></template>
      <el-table :data="alerts" size="small">
        <el-table-column label="面料" min-width="160">
          <template #default="{ row }">
            <span style="font-weight:600">{{ row.cat1_name }}/{{ row.cat2_name }}</span>
            <el-tag type="info" size="small" style="margin-left:6px">{{ row.color || '无颜色' }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="当前库存" width="110">
          <template #default="{ row }">
            <el-tag type="danger">{{ row.current_stock }} {{ row.unit }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="预警阈值" width="100">
          <template #default="{ row }">{{ row.alert_threshold }} {{ row.unit }}</template>
        </el-table-column>
        <el-table-column label="操作" width="100">
          <template #default>
            <el-button size="small" type="primary" @click="$router.push('/stock/in')">去入库</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { fabricsApi, stylesApi } from '../api'

const fabrics = ref([])
const styleCount = ref(0)

const alerts = computed(() => fabrics.value.filter(f => f.is_alert))

const stats = computed(() => [
  { label: '面料品类', value: fabrics.value.length, sub: '种' },
  { label: '款式档案', value: styleCount.value, sub: '款' },
  { label: '库存预警', value: alerts.value.length, sub: '种', color: alerts.value.length ? 'var(--color-danger-text)' : 'var(--color-success-text)' },
  { label: '今日日期', value: new Date().toLocaleDateString('zh-CN', { month: 'long', day: 'numeric' }), sub: new Date().getFullYear() + '年' }
])

onMounted(async () => {
  fabrics.value = await fabricsApi.list()
  const styles = await stylesApi.list()
  styleCount.value = styles.length
})
</script>

<style scoped>
.stat-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 14px;
  margin-bottom: 20px;
}
@media (max-width: 900px) {
  .stat-grid { grid-template-columns: repeat(2, 1fr); }
}

.stat-card {
  background: var(--color-bg-surface);
  border: 1px solid var(--color-border-subtle);
  border-radius: var(--radius-lg);
  padding: 18px 20px;
  box-shadow: var(--shadow-xs);
}
.stat-label {
  font-size: 12px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--color-text-tertiary);
  margin-bottom: 8px;
}
.stat-value {
  font-size: 30px;
  font-weight: 800;
  letter-spacing: -1px;
  line-height: 1;
  color: var(--color-text-primary);
}
.stat-sub {
  font-size: 12px;
  color: var(--color-text-tertiary);
  margin-top: 4px;
}

/* Quick action buttons */
.quick-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
}
@media (max-width: 900px) {
  .quick-grid { grid-template-columns: repeat(2, 1fr); }
}

.quick-btn {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 16px;
  border-radius: var(--radius-md);
  border: none;
  cursor: pointer;
  text-align: left;
  width: 100%;
  transition: all var(--dur-fast) var(--ease-standard);
}
.quick-btn:active { transform: scale(0.97); }

.quick-btn-icon {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  font-weight: 700;
  flex-shrink: 0;
  color: #fff;
}
.quick-btn-title {
  font-size: 13.5px;
  font-weight: 700;
  margin-bottom: 2px;
}
.quick-btn-sub { font-size: 11.5px; opacity: 0.75; }

.quick-btn--primary { background: var(--prim-orange-50); color: var(--prim-orange-700); }
.quick-btn--primary:hover { background: var(--prim-orange-100); }
.quick-btn--primary .quick-btn-icon { background: var(--color-primary); }

.quick-btn--success { background: var(--color-success-bg); color: var(--prim-green-700); }
.quick-btn--success:hover { background: #DCFCE7; }
.quick-btn--success .quick-btn-icon { background: var(--prim-green-600); }

.quick-btn--warning { background: var(--color-warning-bg); color: #92400E; }
.quick-btn--warning:hover { background: #FEF3C7; }
.quick-btn--warning .quick-btn-icon { background: var(--prim-amber-600); }

.quick-btn--neutral { background: var(--prim-stone-100); color: var(--prim-stone-600); }
.quick-btn--neutral:hover { background: var(--prim-stone-200); }
.quick-btn--neutral .quick-btn-icon { background: var(--prim-stone-400); }
</style>
