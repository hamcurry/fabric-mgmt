<template>
  <div v-loading="loading">
    <div style="margin-bottom:16px">
      <el-button icon="ArrowLeft" @click="$router.back()">{{ $t('common.back') }}</el-button>
    </div>

    <el-card shadow="never" style="margin-bottom:16px" v-if="style">
      <template #header>
        <div style="display:flex;justify-content:space-between;align-items:center">
          <b style="font-size:18px">{{ style.name }}</b>
          <el-button type="primary" @click="$router.push('/calc')">{{ $t('nav.calc') }}</el-button>
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
            <el-descriptions-item :label="$t('common.customer')">{{ style.customer || '-' }}</el-descriptions-item>
            <el-descriptions-item :label="$t('common.created_at')">{{ style.created_at }}</el-descriptions-item>
            <el-descriptions-item :label="$t('common.note')" :span="2">{{ style.note || '-' }}</el-descriptions-item>
            <el-descriptions-item label="款式用量" :span="2">
              <div v-if="style.materials?.length" style="display:flex;flex-wrap:wrap;gap:8px">
                <el-tag v-for="m in style.materials" :key="m.id" style="margin-right:0">
                  {{ materialSummary(m) }}
                </el-tag>
              </div>
              <span v-else style="color:var(--color-text-tertiary)">{{ $t('styles.not_set') }}</span>
            </el-descriptions-item>
          </el-descriptions>
        </el-col>
      </el-row>
    </el-card>

    <el-card shadow="never" v-if="style">
      <template #header>
        <div style="display:flex;justify-content:space-between;align-items:center">
          <b>{{ $t('style_detail.production_records') }}</b>
          <span style="color:var(--color-text-secondary);font-size:13px">{{ $t('style_detail.batch_count', { n: grouped.length }) }}</span>
        </div>
      </template>

      <div v-if="!grouped.length" style="color:#bbb;padding:24px;text-align:center">
        {{ $t('style_detail.no_records') }}
      </div>

      <el-table v-else :data="grouped" border>
        <el-table-column prop="date" :label="$t('style_detail.date')" width="110" />
        <el-table-column prop="po" :label="$t('common.po_number')" width="150" />
        <el-table-column :label="$t('style_detail.out_details')" min-width="260">
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
        <el-table-column prop="usage_source" label="用量来源" width="100" />
        <el-table-column prop="note" :label="$t('common.note')" width="140" show-overflow-tooltip />
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

const materialSummary = (m) => {
  const actual = m.actual_usage_per_piece != null ? `实际 ${m.actual_usage_per_piece}m/件` : ''
  const estimated = m.estimated_usage_per_piece != null ? `客估 ${m.estimated_usage_per_piece}m/件` : ''
  return `${m.cat1_name}/${m.cat2_name} ${[actual, estimated].filter(Boolean).join(' / ')}`
}

const grouped = computed(() => {
  const map = {}
  for (const log of timeline.value) {
    const key = `${log.po_number || `_${log.id}`}_${log.operated_at.slice(0, 10)}`
    if (!map[key]) map[key] = {
      date: log.operated_at.slice(0, 10),
      po: log.po_number || '-',
      items: [],
      note: log.note || '',
      usage_source: log.usage_source || '-'
    }
    const piecesStr = log.pieces != null ? `${log.pieces}pcs · ` : ''
    map[key].items.push(`${log.fabric_name} ${piecesStr}${log.quantity}m`)
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
