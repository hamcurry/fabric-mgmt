<template>
  <div>
    <el-card shadow="never">
      <template #header>
        <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:12px">
          <b>库存总览</b>
          <el-space wrap>
            <el-input
              v-model="search" placeholder="搜索面料名称/颜色" clearable style="width:200px"
              prefix-icon="Search"
            />
            <el-select v-model="filterCat1" placeholder="一级类目" clearable style="width:110px">
              <el-option v-for="c in cat1Options" :key="c" :label="c" :value="c" />
            </el-select>
            <el-button type="primary" icon="Download" @click="exportAll">导出全部</el-button>
          </el-space>
        </div>
      </template>

      <el-table :data="filtered" v-loading="loading" border>
        <el-table-column prop="cat1_name" label="大类" width="80" />
        <el-table-column prop="cat2_name" label="品类" width="80" />
        <el-table-column prop="color" label="颜色" width="80">
          <template #default="{ row }">{{ row.color || '-' }}</template>
        </el-table-column>
        <el-table-column label="当前库存" width="120">
          <template #default="{ row }">
            <el-tag :type="row.is_alert ? 'danger' : 'success'" style="font-variant-numeric:tabular-nums">
              {{ row.current_stock }} {{ row.unit }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="alert_threshold" label="预警阈值" width="90">
          <template #default="{ row }">{{ row.alert_threshold }} {{ row.unit }}</template>
        </el-table-column>
        <el-table-column label="状态" width="75">
          <template #default="{ row }">
            <el-tag :type="row.is_alert ? 'danger' : 'success'" size="small">
              {{ row.is_alert ? '预警' : '正常' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="130" fixed="right">
          <template #default="{ row }">
            <el-space :size="6">
              <el-button size="small" @click="openHistory(row)">流水</el-button>
              <el-button size="small" type="success" icon="Download" @click="exportFabric(row)">导出</el-button>
            </el-space>
          </template>
        </el-table-column>
      </el-table>

      <div style="margin-top:12px;color:#9CA3AF;font-size:13px">
        共 {{ filtered.length }} 条 · 预警 {{ alertCount }} 条
      </div>
    </el-card>

    <!-- 单条面料流水弹窗 -->
    <el-dialog v-model="historyVisible" :title="historyFabric?.name + ' · 出入库流水'" width="680px">
      <div v-loading="historyLoading">
        <el-table :data="historyLogs" size="small" border max-height="420">
          <el-table-column prop="operated_at" label="时间" width="155" />
          <el-table-column label="类型" width="65">
            <template #default="{ row }">
              <el-tag :type="row.type==='in'?'success':'warning'" size="small">
                {{ row.type==='in'?'入库':'出库' }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="数量" width="85">
            <template #default="{ row }">
              <span :style="{color: row.type==='in'?'#059669':'#D97706', fontWeight:'600'}">
                {{ row.type==='in'?'+':'-' }}{{ row.quantity }}米
              </span>
            </template>
          </el-table-column>
          <el-table-column prop="style_name" label="款式" min-width="100" show-overflow-tooltip />
          <el-table-column prop="po_number" label="PO" min-width="110" show-overflow-tooltip />
          <el-table-column prop="note" label="备注" min-width="100" show-overflow-tooltip />
        </el-table>
      </div>
      <template #footer>
        <el-button icon="Download" type="primary" @click="exportFabric(historyFabric)">导出此面料流水</el-button>
        <el-button @click="historyVisible = false">关闭</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { reportsApi, stockApi, exportUrl } from '../api'

const fabrics = ref([])
const loading = ref(false)
const search = ref('')
const filterCat1 = ref('')

const cat1Options = computed(() => [...new Set(fabrics.value.map(f => f.cat1_name))])
const alertCount = computed(() => filtered.value.filter(f => f.is_alert).length)

const filtered = computed(() => {
  let list = fabrics.value
  if (filterCat1.value) list = list.filter(f => f.cat1_name === filterCat1.value)
  if (search.value) {
    const q = search.value.toLowerCase()
    list = list.filter(f =>
      f.cat1_name.toLowerCase().includes(q) ||
      f.cat2_name.toLowerCase().includes(q) ||
      (f.color || '').toLowerCase().includes(q)
    )
  }
  return list
})

// 单条面料流水弹窗
const historyVisible = ref(false)
const historyFabric = ref(null)
const historyLogs = ref([])
const historyLoading = ref(false)

const openHistory = async (fabric) => {
  historyFabric.value = fabric
  historyVisible.value = true
  historyLoading.value = true
  historyLogs.value = await stockApi.logs({ fabric_id: fabric.id })
    .finally(() => historyLoading.value = false)
}

const exportFabric = (fabric) => {
  if (!fabric) return
  window.open(exportUrl({ fabric_id: fabric.id }), '_blank')
}

const exportAll = () => window.open(exportUrl({}), '_blank')

onMounted(async () => {
  loading.value = true
  fabrics.value = await reportsApi.stock().finally(() => loading.value = false)
})
</script>
