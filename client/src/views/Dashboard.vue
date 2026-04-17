<template>
  <div>
    <el-alert
      v-if="alerts.length"
      :title="$t('dashboard.alert_msg', { count: alerts.length })"
      type="warning"
      :closable="false"
      show-icon
      style="margin-bottom:20px"
    />

    <div class="stat-grid">
      <div v-for="stat in stats" :key="stat.label" class="stat-card">
        <div class="stat-label">{{ stat.label }}</div>
        <div class="stat-value" :style="{ color: stat.color || 'var(--color-text-primary)' }">
          {{ stat.value }}
        </div>
        <div v-if="stat.sub" class="stat-sub">{{ stat.sub }}</div>
      </div>
    </div>

    <el-card shadow="never" style="margin-bottom:20px">
      <template #header><b>{{ $t('dashboard.quick_ops') }}</b></template>
      <div class="quick-grid">
        <button class="quick-btn quick-btn--primary" @click="$router.push('/calc')">
          <div class="quick-btn-icon">⚖</div>
          <div>
            <div class="quick-btn-title">{{ $t('dashboard.calc_title') }}</div>
            <div class="quick-btn-sub">{{ $t('dashboard.calc_desc') }}</div>
          </div>
        </button>
        <button class="quick-btn quick-btn--success" @click="$router.push('/stock/in')">
          <div class="quick-btn-icon">↓</div>
          <div>
            <div class="quick-btn-title">{{ $t('dashboard.stock_in_title') }}</div>
            <div class="quick-btn-sub">{{ $t('dashboard.stock_in_desc') }}</div>
          </div>
        </button>
        <button class="quick-btn quick-btn--warning" @click="$router.push('/stock/out')">
          <div class="quick-btn-icon">↑</div>
          <div>
            <div class="quick-btn-title">{{ $t('dashboard.stock_out_title') }}</div>
            <div class="quick-btn-sub">{{ $t('dashboard.stock_out_desc') }}</div>
          </div>
        </button>
        <button class="quick-btn quick-btn--neutral" @click="$router.push('/styles')">
          <div class="quick-btn-icon">＋</div>
          <div>
            <div class="quick-btn-title">{{ $t('dashboard.new_style_title') }}</div>
            <div class="quick-btn-sub">{{ $t('dashboard.new_style_desc') }}</div>
          </div>
        </button>
      </div>
    </el-card>

    <el-card v-if="alerts.length" shadow="never">
      <template #header><b>{{ $t('dashboard.alert_list') }}</b></template>
      <!-- Mobile alert cards -->
      <div class="alert-mobile-list">
        <div v-for="row in alerts" :key="row.id" class="alert-card">
          <div>
            <span style="font-weight:600">{{ row.cat1_name }}/{{ row.cat2_name }}</span>
            <el-tag type="info" size="small" style="margin-left:6px">{{ row.color || $t('dashboard.no_color') }}</el-tag>
          </div>
          <div style="display:flex;align-items:center;gap:8px;margin-top:6px">
            <el-tag type="danger" size="small">{{ row.current_stock }} {{ row.unit }}</el-tag>
            <span style="font-size:11px;color:var(--color-text-tertiary)">阈值 {{ row.alert_threshold }}{{ row.unit }}</span>
            <el-button size="small" type="primary" @click="$router.push('/stock/in')">{{ $t('dashboard.go_stock_in') }}</el-button>
          </div>
        </div>
      </div>
      <el-table :data="alerts" size="small" class="alert-desktop-table">
        <el-table-column :label="$t('dashboard.fabric_col')" min-width="160">
          <template #default="{ row }">
            <span style="font-weight:600">{{ row.cat1_name }}/{{ row.cat2_name }}</span>
            <el-tag type="info" size="small" style="margin-left:6px">{{ row.color || $t('dashboard.no_color') }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column :label="$t('dashboard.current_stock')" width="110">
          <template #default="{ row }">
            <el-tag type="danger">{{ row.current_stock }} {{ row.unit }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column :label="$t('dashboard.alert_threshold')" width="100">
          <template #default="{ row }">{{ row.alert_threshold }} {{ row.unit }}</template>
        </el-table-column>
        <el-table-column :label="$t('common.operation')" width="100">
          <template #default>
            <el-button size="small" type="primary" @click="$router.push('/stock/in')">{{ $t('dashboard.go_stock_in') }}</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { fabricsApi, stylesApi } from '../api'

const { t, locale } = useI18n()
const fabrics = ref([])
const styleCount = ref(0)

const alerts = computed(() => fabrics.value.filter(f => f.is_alert))

const stats = computed(() => {
  const dateLocale = locale.value === 'zh' ? 'zh-CN' : 'en-US'
  const dateStr = new Date().toLocaleDateString(dateLocale, { month: 'long', day: 'numeric' })
  const yearStr = locale.value === 'zh'
    ? new Date().getFullYear() + t('dashboard.year_suffix')
    : String(new Date().getFullYear())
  return [
    { label: t('dashboard.fabric_count'), value: fabrics.value.length, sub: t('dashboard.fabric_unit') },
    { label: t('dashboard.style_count'), value: styleCount.value, sub: t('dashboard.style_unit') },
    { label: t('dashboard.alert_count'), value: alerts.value.length, sub: t('dashboard.fabric_unit'), color: alerts.value.length ? 'var(--color-danger-text)' : 'var(--color-success-text)' },
    { label: t('dashboard.today'), value: dateStr, sub: yearStr }
  ]
})

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
@media (max-width: 640px) {
  .stat-grid {
    display: flex;
    overflow-x: auto;
    scroll-snap-type: x mandatory;
    gap: 10px;
    padding-bottom: 4px;
    scrollbar-width: none;
    -ms-overflow-style: none;
  }
  .stat-grid::-webkit-scrollbar { display: none; }
  .stat-card { min-width: 148px; scroll-snap-align: start; flex-shrink: 0; }
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

.quick-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
}
@media (max-width: 900px) {
  .quick-grid { grid-template-columns: repeat(2, 1fr); }
}
@media (max-width: 480px) {
  .quick-btn { padding: 10px 12px; gap: 8px; }
  .quick-btn-icon { width: 30px; height: 30px; font-size: 15px; }
  .quick-btn-title { font-size: 12.5px; }
  .quick-btn-sub { font-size: 10.5px; }
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

@media (max-width: 640px) {
  .alert-desktop-table { display: none; }
  .alert-mobile-list { display: block; }
}
@media (min-width: 641px) {
  .alert-mobile-list { display: none; }
}

.alert-card {
  padding: 10px 12px;
  border-left: 3px solid var(--color-danger-text);
  background: var(--color-bg-subtle);
  border-radius: var(--radius-base);
  margin-bottom: 8px;
  font-size: 13px;
}
.alert-card:last-child { margin-bottom: 0; }
</style>
