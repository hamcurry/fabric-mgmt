<template>
  <div>
    <!-- 库存汇总 -->
    <el-card shadow="never" style="margin-bottom:16px">
      <template #header>
        <div style="display:flex;justify-content:space-between;align-items:center">
          <b>库存汇总</b>
          <el-button type="success" icon="Download" @click="exportFile({})">导出全部 Excel</el-button>
        </div>
      </template>

      <el-table :data="stockReport" v-loading="loadingStock" border>
        <el-table-column prop="name" label="面料名称" min-width="120" />
        <el-table-column prop="color" label="颜色" width="80" />
        <el-table-column prop="unit" label="单位" width="70" />
        <el-table-column prop="current_stock" label="当前库存" width="110">
          <template #default="{ row }">
            <el-tag :type="row.is_alert ? 'danger' : 'success'">
              {{ row.current_stock }} {{ row.unit }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="alert_threshold" label="预警阈值" width="100">
          <template #default="{ row }">{{ row.alert_threshold }} {{ row.unit }}</template>
        </el-table-column>
        <el-table-column label="状态" width="90">
          <template #default="{ row }">
            <el-tag :type="row.is_alert ? 'danger' : 'success'" size="small">
              {{ row.is_alert ? '预警' : '正常' }}
            </el-tag>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 出入库流水 -->
    <el-card shadow="never">
      <template #header>
        <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:12px">
          <b>出入库流水</b>
          <el-space wrap>
            <el-select v-model="logFilters.type" placeholder="类型" clearable style="width:100px">
              <el-option label="入库" value="in" />
              <el-option label="出库" value="out" />
            </el-select>
            <el-date-picker
              v-model="dateRange"
              type="daterange"
              range-separator="至"
              start-placeholder="开始日期"
              end-placeholder="结束日期"
              value-format="YYYY-MM-DD"
              style="width:220px"
            />
            <el-button @click="loadLogs" icon="Search">查询</el-button>
            <el-button type="primary" icon="Download" @click="exportFile(exportParams)">导出筛选结果</el-button>
          </el-space>
        </div>
      </template>

      <el-table :data="logs" v-loading="loadingLogs" border>
        <el-table-column prop="operated_at" label="时间" width="160" />
        <el-table-column prop="type" label="类型" width="70">
          <template #default="{ row }">
            <el-tag :type="row.type === 'in' ? 'success' : 'warning'" size="small">
              {{ row.type === 'in' ? '入库' : '出库' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="fabric_name" label="面料" width="120" />
        <el-table-column prop="quantity" label="数量" width="90" />
        <el-table-column prop="style_name" label="关联款式" min-width="120" />
        <el-table-column prop="po_number" label="PO 号" min-width="130" />
        <el-table-column prop="note" label="备注" min-width="100" show-overflow-tooltip />
        <el-table-column label="操作" width="90" fixed="right">
          <template #default="{ row }">
            <el-popconfirm
              title="删除后将同步回滚库存，确认？"
              @confirm="deleteLog(row.id)"
            >
              <template #reference>
                <el-button size="small" type="danger">删除</el-button>
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
import { ElMessage } from 'element-plus'
import { reportsApi, stockApi, exportUrl } from '../api'

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
  const url = exportUrl(params)
  window.open(url, '_blank')
}

const deleteLog = async (id) => {
  try {
    await stockApi.deleteLog(id)
    ElMessage.success('已删除，库存已回滚')
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
