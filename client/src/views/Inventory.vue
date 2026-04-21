<template>
  <div>
    <el-card shadow="never">
      <template #header>
        <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:12px">
          <b>{{ $t('inventory.title') }}</b>
          <el-space wrap>
            <el-input
              v-model="search" :placeholder="$t('inventory.search_placeholder')" clearable style="width:160px"
              prefix-icon="Search"
            />
            <el-select v-model="filterCat1" :placeholder="$t('inventory.cat1_filter')" clearable style="width:110px">
              <el-option v-for="c in cat1Options" :key="c" :label="c" :value="c" />
            </el-select>
            <el-button type="primary" icon="Download" @click="exportAll">{{ $t('inventory.export_all') }}</el-button>
          </el-space>
        </div>
      </template>

      <!-- Mobile card list (≤640px) -->
      <div class="mobile-fabric-list" v-loading="loading">
        <div v-for="row in filtered" :key="row.id" class="fabric-card">
          <div class="fabric-card-left">
            <div class="fabric-card-name">{{ row.cat1_name }} / {{ row.cat2_name }}</div>
            <div class="fabric-card-color">{{ row.color || '-' }}</div>
          </div>
          <div class="fabric-card-right">
            <el-tag :type="row.is_alert ? 'danger' : 'success'" style="font-variant-numeric:tabular-nums">
              {{ row.current_stock }} {{ row.unit }}
            </el-tag>
            <el-button size="small" @click="openHistory(row)">{{ $t('inventory.history') }}</el-button>
          </div>
        </div>
        <div v-if="!filtered.length && !loading" style="padding:32px;text-align:center;color:var(--color-text-tertiary)">
          {{ $t('inventory.total', { n: 0 }) }}
        </div>
      </div>

      <el-table :data="filtered" v-loading="loading" border style="width:100%" class="desktop-table">
        <el-table-column prop="cat1_name" :label="$t('inventory.cat1')" min-width="70" />
        <el-table-column prop="cat2_name" :label="$t('inventory.cat2')" min-width="70" />
        <el-table-column prop="color" :label="$t('common.color')" min-width="70">
          <template #default="{ row }">{{ row.color || '-' }}</template>
        </el-table-column>
        <el-table-column :label="$t('inventory.current_stock')" min-width="110">
          <template #default="{ row }">
            <el-tag :type="row.is_alert ? 'danger' : 'success'" style="font-variant-numeric:tabular-nums">
              {{ row.current_stock }} {{ row.unit }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="alert_threshold" :label="$t('inventory.alert_threshold')" width="110" class-name="hide-xs">
          <template #default="{ row }">{{ row.alert_threshold }} {{ row.unit }}</template>
        </el-table-column>
        <el-table-column :label="$t('common.status')" width="80" class-name="hide-xs">
          <template #default="{ row }">
            <el-tag :type="row.is_alert ? 'danger' : 'success'" size="small">
              {{ row.is_alert ? $t('common.alert') : $t('common.normal') }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column :label="$t('common.operation')" width="155" fixed="right">
          <template #default="{ row }">
            <el-space :size="6">
              <el-button size="small" @click="openHistory(row)">{{ $t('inventory.history') }}</el-button>
              <el-button size="small" type="success" icon="Download" @click="exportFabric(row)">{{ $t('common.export') }}</el-button>
            </el-space>
          </template>
        </el-table-column>
      </el-table>

      <div style="margin-top:12px;color:#9CA3AF;font-size:13px">
        {{ $t('inventory.total', { n: filtered.length }) }} · {{ $t('inventory.alert_count', { n: alertCount }) }}
      </div>
    </el-card>

    <el-dialog v-model="historyVisible" :title="$t('inventory.history_title', { name: historyFabric?.name || '' })" width="min(680px, 98vw)">
      <div v-loading="historyLoading">
        <el-table :data="historyLogs" size="small" border max-height="420">
          <el-table-column prop="operated_at" :label="$t('common.created_at')" width="155" />
          <el-table-column :label="$t('common.type')" width="80">
            <template #default="{ row }">
              <el-tag :type="row.type==='in'?'success':'warning'" size="small">
                {{ row.type==='in' ? $t('common.stock_in') : $t('common.stock_out') }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column :label="$t('common.quantity')" width="85">
            <template #default="{ row }">
              <span :style="{color: row.type==='in'?'#059669':'#D97706', fontWeight:'600'}">
                {{ row.type==='in'?'+':'-' }}{{ row.quantity }}{{ $t('common.meter') }}
              </span>
            </template>
          </el-table-column>
          <el-table-column prop="style_name" :label="$t('common.style')" min-width="100" show-overflow-tooltip />
          <el-table-column prop="po_number" label="PO" min-width="110" show-overflow-tooltip />
          <el-table-column prop="note" :label="$t('common.note')" min-width="100" show-overflow-tooltip />
          <el-table-column :label="$t('inventory.images')" width="90">
            <template #default="{ row }">
              <el-button v-if="row.images?.length" size="small" link @click="openImages(row)">
                {{ $t('inventory.image_count', { n: row.images.length }) }}
              </el-button>
              <span v-else style="color:var(--color-text-tertiary)">-</span>
            </template>
          </el-table-column>
        </el-table>
      </div>
      <template #footer>
        <el-button icon="Download" type="primary" @click="exportFabric(historyFabric)">{{ $t('inventory.export_history') }}</el-button>
        <el-button @click="historyVisible = false">{{ $t('common.close') }}</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="imageDialogVisible" :title="$t('inventory.image_preview_title')" width="760px">
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

const historyVisible = ref(false)
const historyFabric = ref(null)
const historyLogs = ref([])
const historyLoading = ref(false)
const imageDialogVisible = ref(false)
const imageDialogImages = ref([])

const imageSrc = (img) => `data:${img.mime_type};base64,${img.data_base64}`
const imagePreviewList = computed(() => imageDialogImages.value.map(imageSrc))

const openHistory = async (fabric) => {
  historyFabric.value = fabric
  historyVisible.value = true
  historyLoading.value = true
  historyLogs.value = await stockApi.logs({ fabric_id: fabric.id })
    .finally(() => historyLoading.value = false)
}

const openImages = (row) => {
  imageDialogImages.value = row.images || []
  imageDialogVisible.value = true
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

<style scoped>
@media (max-width: 640px) {
  :deep(.hide-xs) { display: none; }
  .desktop-table { display: none; }
  .mobile-fabric-list { display: block; }
}
@media (min-width: 641px) {
  .mobile-fabric-list { display: none; }
}

.mobile-fabric-list {
  border-radius: var(--radius-lg);
  border: 1px solid var(--color-border);
  overflow: hidden;
  background: var(--color-bg-surface);
}
.fabric-card {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
  padding: 12px 14px;
  border-bottom: 1px solid var(--color-border-subtle);
}
.fabric-card:last-child { border-bottom: none; }
.fabric-card-left { flex: 1; min-width: 0; }
.fabric-card-name { font-weight: 600; font-size: 14px; color: var(--color-text-primary); }
.fabric-card-color { font-size: 12px; color: var(--color-text-secondary); margin-top: 2px; }
.fabric-card-right { display: flex; align-items: center; gap: 6px; flex-shrink: 0; }
</style>
