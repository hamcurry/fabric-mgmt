<template>
  <div>
    <!-- 过滤栏 -->
    <el-card shadow="never" style="margin-bottom:16px">
      <div style="display:flex;flex-wrap:wrap;gap:10px;align-items:center">
        <el-select v-model="filters.type" placeholder="类型" clearable style="width:90px">
          <el-option label="入库" value="in" />
          <el-option label="出库" value="out" />
        </el-select>
        <el-select v-model="filters.fabric_id" placeholder="面料" clearable filterable style="width:180px">
          <el-option
            v-for="f in fabrics" :key="f.id"
            :label="`${f.cat1_name}/${f.cat2_name}${f.color ? '·'+f.color : ''}`"
            :value="f.id"
          />
        </el-select>
        <el-select v-model="filters.style_id" placeholder="款式" clearable filterable style="width:150px">
          <el-option v-for="s in styles" :key="s.id" :label="s.name" :value="s.id" />
        </el-select>
        <el-date-picker
          v-model="dateRange"
          type="daterange"
          range-separator="—"
          start-placeholder="开始"
          end-placeholder="结束"
          value-format="YYYY-MM-DD"
          style="width:220px"
        />
        <el-button type="primary" @click="load" icon="Search">筛选</el-button>
        <el-button @click="resetFilters">重置</el-button>
        <span style="margin-left:auto;color:var(--color-text-tertiary);font-size:13px">共 {{ logs.length }} 条</span>
      </div>
    </el-card>

    <!-- 按日期分组的紧凑列表 -->
    <div v-loading="loading">
      <div v-if="!groupedLogs.length && !loading" style="color:var(--color-text-tertiary);padding:40px;text-align:center;background:var(--color-bg-surface);border-radius:10px;border:1px solid var(--color-border)">
        暂无记录
      </div>

      <div v-for="group in groupedLogs" :key="group.date" style="margin-bottom:16px">
        <!-- 日期头 -->
        <div style="font-size:12px;font-weight:700;color:var(--color-text-tertiary);letter-spacing:0.04em;text-transform:uppercase;margin-bottom:6px;padding-left:2px">
          {{ group.date }}
        </div>

        <!-- 条目列表 -->
        <div style="background:var(--color-bg-surface);border:1px solid var(--color-border);border-radius:10px;overflow:hidden">
          <div
            v-for="(log, i) in group.items"
            :key="log.id"
            :style="{
              display:'flex',alignItems:'center',gap:'10px',
              padding:'10px 16px',
              borderBottom: i < group.items.length - 1 ? '1px solid var(--color-border-subtle)' : 'none',
              fontSize:'13px'
            }"
          >
            <!-- 类型徽章 -->
            <el-tag
              size="small"
              :type="log.type === 'in' ? 'success' : 'warning'"
              style="min-width:36px;text-align:center;flex-shrink:0"
            >
              {{ log.type === 'in' ? '入库' : '出库' }}
            </el-tag>

            <!-- 时间 -->
            <span style="color:var(--color-text-tertiary);font-size:12px;flex-shrink:0;width:52px">
              {{ log.operated_at.slice(11,16) }}
            </span>

            <!-- 面料名 -->
            <span style="font-weight:600;color:var(--color-text-primary);min-width:100px">{{ log.fabric_name }}</span>

            <!-- 数量 -->
            <span :style="{fontWeight:'700',color: log.type==='in' ? 'var(--color-success-text)' : 'var(--color-warning-text)',minWidth:'60px'}">
              {{ log.type === 'in' ? '+' : '-' }}{{ log.quantity }}米
            </span>

            <!-- 款式 & PO -->
            <template v-if="log.style_name">
              <span style="color:var(--color-text-secondary)">{{ log.style_name }}</span>
            </template>
            <el-tag v-if="log.po_number" type="info" size="small">{{ log.po_number }}</el-tag>

            <!-- 件数 -->
            <span v-if="log.pieces != null" style="color:var(--color-text-tertiary);font-size:12px">{{ log.pieces }}件</span>

            <!-- 备注 -->
            <span v-if="log.note" style="color:var(--color-text-tertiary);font-size:12px;flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">
              {{ log.note }}
            </span>
            <span v-else style="flex:1"></span>

            <!-- 删除 -->
            <el-popconfirm title="删除后将同步回滚库存，确认？" @confirm="deleteLog(log.id)">
              <template #reference>
                <el-button size="small" type="danger" plain style="flex-shrink:0">删除</el-button>
              </template>
            </el-popconfirm>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { timelineApi, fabricsApi, stylesApi, stockApi } from '../api'

const logs = ref([])
const fabrics = ref([])
const styles = ref([])
const loading = ref(false)
const dateRange = ref([])
const filters = ref({ type: '', fabric_id: null, style_id: null })

// 按日期分组
const groupedLogs = computed(() => {
  const map = {}
  for (const log of logs.value) {
    const date = log.operated_at.slice(0, 10)
    if (!map[date]) map[date] = { date, items: [] }
    map[date].items.push(log)
  }
  return Object.values(map)
})

const load = async () => {
  loading.value = true
  const params = {}
  if (filters.value.type) params.type = filters.value.type
  if (filters.value.fabric_id) params.fabric_id = filters.value.fabric_id
  if (filters.value.style_id) params.style_id = filters.value.style_id
  if (dateRange.value?.length === 2) {
    params.date_from = dateRange.value[0]
    params.date_to = dateRange.value[1]
  }
  logs.value = await timelineApi.list(params).finally(() => loading.value = false)
}

const resetFilters = () => {
  filters.value = { type: '', fabric_id: null, style_id: null }
  dateRange.value = []
  load()
}

const deleteLog = async (id) => {
  try {
    await stockApi.deleteLog(id)
    ElMessage.success('已删除，库存已回滚')
    load()
  } catch (e) {
    ElMessage.error(e.message)
  }
}

onMounted(async () => {
  const [f, s] = await Promise.all([fabricsApi.list(), stylesApi.list()])
  fabrics.value = f
  styles.value = s
  load()
})
</script>
