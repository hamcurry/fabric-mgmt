<template>
  <div>
    <el-card shadow="never" style="margin-bottom:16px">
      <div style="display:flex;flex-wrap:wrap;gap:10px;align-items:center">
        <el-select v-model="filters.type" :placeholder="$t('common.type')" clearable style="width:90px">
          <el-option :label="$t('common.stock_in')" value="in" />
          <el-option :label="$t('common.stock_out')" value="out" />
        </el-select>
        <el-select v-model="filters.fabric_id" :placeholder="$t('common.fabric')" clearable filterable style="width:150px">
          <el-option
            v-for="f in fabrics" :key="f.id"
            :label="`${f.cat1_name}/${f.cat2_name}${f.color ? '·'+f.color : ''}`"
            :value="f.id"
          />
        </el-select>
        <el-select v-model="filters.style_id" :placeholder="$t('common.style')" clearable filterable style="width:120px">
          <el-option v-for="s in styles" :key="s.id" :label="s.name" :value="s.id" />
        </el-select>
        <el-date-picker
          v-model="dateRange"
          type="daterange"
          range-separator="—"
          :start-placeholder="$t('timeline.start')"
          :end-placeholder="$t('timeline.end')"
          value-format="YYYY-MM-DD"
          style="width:min(220px,100%)"
        />
        <el-button type="primary" @click="load" icon="Search">{{ $t('timeline.filter') }}</el-button>
        <el-button @click="resetFilters">{{ $t('common.reset') }}</el-button>
        <span style="margin-left:auto;color:var(--color-text-tertiary);font-size:13px">{{ $t('timeline.total', { n: logs.length }) }}</span>
      </div>
    </el-card>

    <div v-loading="loading">
      <div v-if="!groupedLogs.length && !loading" style="color:var(--color-text-tertiary);padding:40px;text-align:center;background:var(--color-bg-surface);border-radius:10px;border:1px solid var(--color-border)">
        {{ $t('timeline.no_records') }}
      </div>

      <div v-for="group in groupedLogs" :key="group.date" style="margin-bottom:16px">
        <div style="font-size:12px;font-weight:700;color:var(--color-text-tertiary);letter-spacing:0.04em;text-transform:uppercase;margin-bottom:6px;padding-left:2px">
          {{ group.date }}
        </div>

        <div style="background:var(--color-bg-surface);border:1px solid var(--color-border);border-radius:10px;overflow:hidden">
          <div
            v-for="(log, i) in group.items"
            :key="log.id"
            :style="{
              display:'flex',alignItems:'center',flexWrap:'wrap',gap:'6px',
              padding:'10px 12px',
              borderBottom: i < group.items.length - 1 ? '1px solid var(--color-border-subtle)' : 'none',
              fontSize:'13px'
            }"
          >
            <el-tag
              size="small"
              :type="log.type === 'in' ? 'success' : 'warning'"
              style="min-width:36px;text-align:center;flex-shrink:0"
            >
              {{ log.type === 'in' ? $t('common.stock_in') : $t('common.stock_out') }}
            </el-tag>

            <span style="color:var(--color-text-tertiary);font-size:12px;flex-shrink:0;width:52px">
              {{ log.operated_at.slice(11,16) }}
            </span>

            <span style="font-weight:600;color:var(--color-text-primary)">{{ log.fabric_name }}</span>

            <span :style="{fontWeight:'700',color: log.type==='in' ? 'var(--color-success-text)' : 'var(--color-warning-text)',minWidth:'60px'}">
              {{ log.type === 'in' ? '+' : '-' }}{{ log.quantity }}{{ $t('common.meter') }}
            </span>

            <template v-if="log.style_name">
              <span style="color:var(--color-text-secondary)">{{ log.style_name }}</span>
            </template>
            <el-tag v-if="log.po_number" type="info" size="small">{{ log.po_number }}</el-tag>

            <span v-if="log.pieces != null" style="color:var(--color-text-tertiary);font-size:12px">{{ log.pieces }}{{ $t('common.pieces') }}</span>

            <span v-if="log.note" style="color:var(--color-text-tertiary);font-size:12px;flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">
              {{ log.note }}
            </span>
            <span v-else style="flex:1"></span>

            <el-button
              v-if="log.images?.length"
              size="small"
              plain
              style="flex-shrink:0"
              @click="openImages(log)"
            >
              {{ $t('timeline.image_count', { n: log.images.length }) }}
            </el-button>

            <el-popconfirm :title="$t('timeline.delete_confirm')" @confirm="deleteLog(log.id)">
              <template #reference>
                <el-button size="small" type="danger" plain style="flex-shrink:0">{{ $t('common.delete') }}</el-button>
              </template>
            </el-popconfirm>
          </div>
        </div>
      </div>
    </div>

    <el-dialog v-model="imageDialogVisible" :title="$t('timeline.image_preview_title')" width="min(760px, 98vw)">
      <div v-if="imageDialogImages.length" style="display:grid;grid-template-columns:repeat(auto-fill,minmax(180px,1fr));gap:12px">
        <el-image
          v-for="(img, i) in imageDialogImages"
          :key="i"
          :src="imageSrc(img)"
          :preview-src-list="imagePreviewList"
          :initial-index="i"
          fit="cover"
          preview-teleported
          style="width:100%;height:180px;border-radius:8px;border:1px solid var(--color-border)"
        />
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { ElMessage } from 'element-plus'
import { timelineApi, fabricsApi, stylesApi, stockApi } from '../api'

const { t } = useI18n()

const logs = ref([])
const fabrics = ref([])
const styles = ref([])
const loading = ref(false)
const dateRange = ref([])
const filters = ref({ type: '', fabric_id: null, style_id: null })
const imageDialogVisible = ref(false)
const imageDialogImages = ref([])

const groupedLogs = computed(() => {
  const map = {}
  for (const log of logs.value) {
    const date = log.operated_at.slice(0, 10)
    if (!map[date]) map[date] = { date, items: [] }
    map[date].items.push(log)
  }
  return Object.values(map)
})

const imageSrc = (img) => `data:${img.mime_type};base64,${img.data_base64}`
const imagePreviewList = computed(() => imageDialogImages.value.map(imageSrc))

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
    ElMessage.success(t('timeline.delete_success'))
    load()
  } catch (e) {
    ElMessage.error(e.message)
  }
}

const openImages = (log) => {
  imageDialogImages.value = log.images || []
  imageDialogVisible.value = true
}

onMounted(async () => {
  const [f, s] = await Promise.all([fabricsApi.list(), stylesApi.list()])
  fabrics.value = f
  styles.value = s
  load()
})
</script>
