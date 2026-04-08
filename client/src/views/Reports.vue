<template>
  <div>
    <el-card shadow="never" style="margin-bottom:16px">
      <template #header>
        <div style="display:flex;justify-content:space-between;align-items:center">
          <b>{{ $t('reports.stock_summary') }}</b>
          <el-button type="success" icon="Download" @click="exportFile({})">{{ $t('reports.export_all') }}</el-button>
        </div>
      </template>

      <el-table :data="stockReport" v-loading="loadingStock" border>
        <el-table-column prop="name" :label="$t('reports.fabric_name')" min-width="120" />
        <el-table-column prop="color" :label="$t('common.color')" width="80" />
        <el-table-column prop="unit" :label="$t('common.unit')" width="70" />
        <el-table-column prop="current_stock" :label="$t('inventory.current_stock')" width="110">
          <template #default="{ row }">
            <el-tag :type="row.is_alert ? 'danger' : 'success'">
              {{ row.current_stock }} {{ row.unit }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="alert_threshold" :label="$t('inventory.alert_threshold')" width="100">
          <template #default="{ row }">{{ row.alert_threshold }} {{ row.unit }}</template>
        </el-table-column>
        <el-table-column :label="$t('common.status')" width="90">
          <template #default="{ row }">
            <el-tag :type="row.is_alert ? 'danger' : 'success'" size="small">
              {{ row.is_alert ? $t('common.alert') : $t('common.normal') }}
            </el-tag>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-card shadow="never">
      <template #header>
        <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:12px">
          <b>{{ $t('reports.transactions') }}</b>
          <el-space wrap>
            <el-select v-model="logFilters.type" :placeholder="$t('common.type')" clearable style="width:100px">
              <el-option :label="$t('common.stock_in')" value="in" />
              <el-option :label="$t('common.stock_out')" value="out" />
            </el-select>
            <el-date-picker
              v-model="dateRange"
              type="daterange"
              :range-separator="$t('reports.separator')"
              :start-placeholder="$t('reports.start_date')"
              :end-placeholder="$t('reports.end_date')"
              value-format="YYYY-MM-DD"
              style="width:220px"
            />
            <el-button @click="loadLogs" icon="Search">{{ $t('reports.query') }}</el-button>
            <el-button type="primary" icon="Download" @click="exportFile(exportParams)">{{ $t('reports.export_filter') }}</el-button>
          </el-space>
        </div>
      </template>

      <el-table :data="logs" v-loading="loadingLogs" border>
        <el-table-column prop="operated_at" :label="$t('common.created_at')" width="160" />
        <el-table-column prop="type" :label="$t('common.type')" width="70">
          <template #default="{ row }">
            <el-tag :type="row.type === 'in' ? 'success' : 'warning'" size="small">
              {{ row.type === 'in' ? $t('common.stock_in') : $t('common.stock_out') }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="fabric_name" :label="$t('common.fabric')" width="120" />
        <el-table-column prop="quantity" :label="$t('common.quantity')" width="90" />
        <el-table-column prop="style_name" :label="$t('reports.associate_style')" min-width="120" />
        <el-table-column prop="po_number" :label="$t('common.po_number')" min-width="130" />
        <el-table-column prop="note" :label="$t('common.note')" min-width="100" show-overflow-tooltip />
        <el-table-column :label="$t('common.operation')" width="90" fixed="right">
          <template #default="{ row }">
            <el-popconfirm
              :title="$t('reports.delete_confirm')"
              @confirm="deleteLog(row.id)"
            >
              <template #reference>
                <el-button size="small" type="danger">{{ $t('common.delete') }}</el-button>
              </template>
            </el-popconfirm>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { ElMessage } from 'element-plus'
import { reportsApi, stockApi, exportUrl } from '../api'

const { t } = useI18n()

const stockReport = ref([])
const logs = ref([])
const loadingStock = ref(false)
const loadingLogs = ref(false)
const dateRange = ref([])
const logFilters = ref({ type: '' })

const exportParams = computed(() => {
  const p = {}
  if (logFilters.value.type) p.type = logFilters.value.type
  if (dateRange.value?.length === 2) {
    p.date_from = dateRange.value[0]
    p.date_to = dateRange.value[1]
  }
  return p
})

const loadStock = async () => {
  loadingStock.value = true
  stockReport.value = await reportsApi.stock().finally(() => loadingStock.value = false)
}

const loadLogs = async () => {
  loadingLogs.value = true
  const params = { ...logFilters.value }
  if (dateRange.value?.length === 2) {
    params.date_from = dateRange.value[0]
    params.date_to = dateRange.value[1]
  }
  logs.value = await stockApi.logs(params).finally(() => loadingLogs.value = false)
}

const exportFile = (params) => {
  window.open(exportUrl(params), '_blank')
}

const deleteLog = async (id) => {
  try {
    await stockApi.deleteLog(id)
    ElMessage.success(t('reports.delete_success'))
    loadLogs()
    loadStock()
  } catch (e) {
    ElMessage.error(e.message)
  }
}

onMounted(() => {
  loadStock()
  loadLogs()
})
</script>
