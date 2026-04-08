<template>
  <div v-loading="loading">
    <div style="margin-bottom:16px">
      <el-button icon="ArrowLeft" @click="$router.back()">返回</el-button>
    </div>

    <el-card shadow="never" style="margin-bottom:16px" v-if="style">
      <template #header>
        <div style="display:flex;justify-content:space-between;align-items:center">
          <b style="font-size:18px">{{ style.name }}</b>
          <el-button type="primary" @click="$router.push('/calc')">用量计算</el-button>
        </div>
      </template>

      <el-row :gutter="16">
        <el-col :span="style.image_base64 ? 8 : 0" v-if="style.image_base64">
          <el-image
            :src="style.image_base64"
            style="width:100%;max-height:300px;object-fit:contain;border-radius:6px;border:1px solid var(--color-border)"
            :preview-src-list="[style.image_base64]"
            preview-teleported
          />
        </el-col>
        <el-col :span="style.image_base64 ? 16 : 24">
          <el-descriptions :column="2" border>
            <el-descriptions-item label="客户">{{ style.customer || '-' }}</el-descriptions-item>
            <el-descriptions-item label="创建时间">{{ style.created_at }}</el-descriptions-item>
            <el-descriptions-item label="备注" :span="2">{{ style.note || '-' }}</el-descriptions-item>
            <el-descriptions-item label="面料用量" :span="2">
              <el-tag v-for="m in style.materials" :key="m.id" style="margin-right:8px">
                {{ m.cat1_name }}/{{ m.cat2_name }} {{ m.usage_per_piece }}米/件
              </el-tag>
              <span v-if="!style.materials?.length" style="color:var(--color-text-tertiary)">未设置</span>
            </el-descriptions-item>
          </el-descriptions>
        </el-col>
      </el-row>
    </el-card>

    <!-- 生产记录 -->
    <el-card shadow="never" v-if="style">
      <template #header>
        <div style="display:flex;justify-content:space-between;align-items:center">
          <b>生产记录</b>
          <span style="color:var(--color-text-secondary);font-size:13px">共 {{ grouped.length }} 批</span>
        </div>
      </template>

      <div v-if="!grouped.length" style="color:#bbb;padding:24px;text-align:center">
        暂无出库记录
      </div>

      <el-table v-else :data="grouped" border>
        <el-table-column prop="date" label="日期" width="110" />
        <el-table-column prop="po" label="PO 号" width="150" />
        <el-table-column label="出库明细" min-width="260">
          <template #default="{ row }">
            <div style="display:flex;flex-wrap:wrap;gap:4px">
              <el-tag
                v-for="(item, i) in row.items" :key="i"
                type="info" size="small"
                style="font-size:12px"
              >{{ item }}</el-tag>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="note" label="备注" width="120" show-overflow-tooltip />
      </el-table>
    </el-card>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { stylesApi } from '../api'

const route = useRoute()
const style = ref(null)
const timeline = ref([])
const loading = ref(false)

// 按 po_number 分组，每批显示一行
const grouped = computed(() => {
  const map = {}
  for (const log of timeline.value) {
    const key = log.po_number || `_${log.id}`
    if (!map[key]) map[key] = {
      date: log.operated_at.slice(0, 10),
      po: log.po_number || '-',
      items: [],
      note: log.note || ''
    }
    const piecesStr = log.pieces != null ? `${log.pieces}件·` : ''
    map[key].items.push(`${log.fabric_name}  ${piecesStr}${log.quantity}米`)
  }
  return Object.values(map)
})

onMounted(async () => {
  loading.value = true
  try {
    const [detail, tl] = await Promise.all([
      stylesApi.get(route.params.id),
      stylesApi.timeline(route.params.id)
    ])
    style.value = detail
    timeline.value = tl.logs
  } finally {
    loading.value = false
  }
})
</script>
