<template>
  <el-card shadow="never" style="max-width:820px">
    <template #header><b>{{ $t('calc.title') }}</b></template>

    <el-form :model="form" :rules="rules" ref="formRef" label-width="90px">
      <el-form-item :label="$t('calc.select_style')" prop="style_id">
        <el-select
          v-model="form.style_id" :placeholder="$t('calc.select_style_placeholder')" filterable style="width:100%"
          @change="onStyleChange"
        >
          <el-option
            v-for="s in styles" :key="s.id"
            :label="`${s.name}${s.customer ? ' · ' + s.customer : ''}`"
            :value="s.id"
          />
        </el-select>
      </el-form-item>
    </el-form>

    <div v-if="materials.length" style="margin-top:4px">
      <el-divider>{{ $t('calc.fill_colors') }}</el-divider>

      <div style="margin-bottom:20px">
        <div
          v-for="(row, i) in colorRows" :key="i"
          style="display:flex;gap:8px;align-items:center;margin-bottom:8px"
        >
          <el-select
            v-model="row.colorName" :placeholder="$t('common.color')" filterable allow-create
            style="flex:1;min-width:90px" @change="syncMappings"
          >
            <el-option v-for="c in allColors" :key="c" :label="c" :value="c" />
          </el-select>
          <el-input-number
            v-model="row.pieces" :min="0" :precision="0" :step="10"
            style="width:110px" @change="syncMappings"
          />
          <span style="color:var(--color-text-secondary);font-size:13px">{{ $t('common.pieces') }}</span>
          <el-button
            v-if="colorRows.length > 1"
            icon="Delete" size="small" type="danger" plain circle
            @click="removeColorRow(i)"
          />
        </div>
        <el-button size="small" link icon="Plus" @click="addColorRow">{{ $t('calc.add_color') }}</el-button>
      </div>

      <el-divider>{{ $t('calc.usage_analysis') }}</el-divider>
      <div style="display:flex;flex-wrap:wrap;gap:10px;margin-bottom:16px">
        <div
          v-for="mat in materials" :key="mat.cat2_id"
          style="background:var(--color-bg-subtle);border:1px solid var(--color-border);border-radius:8px;padding:10px 14px;min-width:min(220px,45%);flex:1"
        >
          <div style="font-size:12px;color:var(--color-text-secondary);margin-bottom:4px">{{ mat.cat1_name }}/{{ mat.cat2_name }}</div>
          <div style="font-size:12px;color:var(--color-text-tertiary);margin-bottom:6px">
            {{ mat.usage_source === 'actual' ? '按实际用量' : '按客估用量' }} {{ mat.usage_per_piece }}{{ $t('common.meter_per_piece') }}
          </div>
          <div style="display:flex;align-items:baseline;gap:6px">
            <span style="font-size:20px;font-weight:700;color:var(--color-text-primary)">{{ totalRequired(mat) }}</span>
            <span style="font-size:12px;color:var(--color-text-tertiary)">{{ $t('calc.meters_required') }}</span>
          </div>
          <div style="display:flex;align-items:center;gap:6px;margin-top:6px">
            <span style="font-size:12px;color:#6B7280">{{ $t('calc.stock_label') }} {{ totalStock(mat) }}{{ $t('common.meter') }}</span>
            <el-tag size="small" :type="hasUnmatched(mat) ? 'danger' : (totalStock(mat) >= totalRequired(mat) ? 'success' : 'danger')">
              {{ hasUnmatched(mat) ? '缺少颜色匹配' : (totalStock(mat) >= totalRequired(mat) ? $t('common.sufficient') : $t('common.insufficient')) }}
            </el-tag>
          </div>
        </div>
      </div>

      <el-divider>{{ $t('calc.out_details') }}</el-divider>

      <div v-for="mat in materials" :key="mat.cat2_id" style="margin-bottom:24px">
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:10px">
          <el-tag type="primary">{{ mat.cat1_name }}/{{ mat.cat2_name }}</el-tag>
          <span style="color:var(--color-text-secondary);font-size:13px">
            {{ mat.usage_source === 'actual' ? '实际' : '客估' }} {{ mat.usage_per_piece }} {{ $t('common.meter_per_piece') }}
          </span>
        </div>

        <div
          v-for="(sel, i) in fabricSelections[mat.cat2_id]"
          :key="i"
          style="display:flex;gap:8px;align-items:center;margin-bottom:6px;margin-left:16px;flex-wrap:wrap"
        >
          <span style="width:60px;font-size:13px;color:var(--color-text-primary)">{{ colorRows[i]?.colorName || '-' }}</span>
          <span style="font-size:13px;color:var(--color-text-secondary);width:55px">{{ sel.pieces }} {{ $t('common.pieces') }}</span>
          <span style="font-size:13px;min-width:85px">
            = <b style="color:var(--color-primary)">{{ sel.quantity.toFixed(3) }}</b> {{ $t('common.meter') }}
          </span>
          <span style="font-size:13px;min-width:180px;color:var(--color-text-secondary)">
            {{ sel.fabric_name || '未匹配颜色面料' }}
          </span>
          <el-tag v-if="sel.quantity > 0" size="small" :type="sel.fabric_id ? ((sel.stock || 0) >= sel.quantity ? 'success' : 'danger') : 'danger'">
            {{ sel.fabric_id ? (((sel.stock || 0) >= sel.quantity) ? $t('common.sufficient') : $t('common.insufficient')) : '待匹配' }}
          </el-tag>
        </div>
      </div>

      <el-divider />
      <div style="display:flex;justify-content:space-between;align-items:center">
        <span style="color:var(--color-text-secondary);font-size:13px">{{ $t('calc.total_items', { n: allItems.length }) }}</span>
        <el-button type="warning" @click="showDialog = true">{{ $t('calc.quick_out') }}</el-button>
      </div>
    </div>

    <div v-else-if="form.style_id && !loading" style="color:var(--color-text-tertiary);padding:20px;text-align:center">
      {{ $t('calc.not_configured') }}
    </div>

    <el-dialog v-model="showDialog" :title="$t('calc.confirm_out_title')" width="min(400px, 95vw)">
      <el-form ref="deductFormRef" :model="deductForm" :rules="deductRules" label-width="70px">
        <el-form-item :label="$t('common.po_number')" prop="po_number">
          <el-input v-model="deductForm.po_number" :placeholder="$t('calc.po_placeholder')" />
        </el-form-item>
        <el-form-item :label="$t('common.note')">
          <el-input v-model="deductForm.note" :placeholder="$t('calc.note_placeholder')" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showDialog = false">{{ $t('common.cancel') }}</el-button>
        <el-button type="primary" :loading="deducting" @click="deduct">{{ $t('calc.confirm_out_btn') }}</el-button>
      </template>
    </el-dialog>
  </el-card>
</template>

<script setup>
import { ref, reactive, computed, watch, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { ElMessage } from 'element-plus'
import { stylesApi, fabricsApi, stockApi } from '../api'

const { t } = useI18n()

const styles = ref([])
const materials = ref([])
const loading = ref(false)
const form = ref({ style_id: null })
const rules = computed(() => ({
  style_id: [{ required: true, message: t('calc.val_style') }]
}))
const formRef = ref()

const showDialog = ref(false)
const deductForm = ref({ po_number: '', note: '' })
const deductRules = computed(() => ({
  po_number: [{ required: true, message: t('calc.val_po') }]
}))
const deductFormRef = ref()
const deducting = ref(false)

const colorRows = reactive([{ colorName: null, pieces: 0 }])
const fabricSelections = reactive({})

const allColors = computed(() => {
  const set = new Set()
  for (const mat of materials.value) {
    for (const f of mat.fabrics) if (f.color) set.add(f.color)
  }
  return [...set]
})

const totalStock = (mat) =>
  parseFloat(mat.fabrics.reduce((s, f) => s + f.current_stock, 0).toFixed(3))

const totalRequired = (mat) => {
  const total = colorRows.reduce((s, row) => s + (row.pieces || 0), 0)
  return parseFloat((total * mat.usage_per_piece).toFixed(3))
}

const pickFabric = (mat, colorName) => {
  if (!colorName) return null
  const exact = mat.fabrics.filter(f => (f.color || '') === colorName)
  if (!exact.length) return null
  return [...exact].sort((a, b) => b.current_stock - a.current_stock)[0]
}

const syncMappings = () => {
  for (const mat of materials.value) {
    fabricSelections[mat.cat2_id] = colorRows.map(row => {
      const pieces = row.pieces || 0
      const fabric = pickFabric(mat, row.colorName)
      return {
        fabric_id: fabric?.id || null,
        fabric_name: fabric ? `${fabric.cat1_name}/${fabric.cat2_name}${fabric.color ? '·' + fabric.color : ''}` : '',
        stock: fabric?.current_stock || 0,
        color: row.colorName || '',
        pieces,
        quantity: parseFloat((pieces * mat.usage_per_piece).toFixed(3)),
        usage_source: mat.usage_source,
        usage_per_piece_snapshot: mat.usage_per_piece,
        style_material_cat2_id: mat.cat2_id
      }
    })
  }
}

watch(colorRows, syncMappings, { deep: true })

const addColorRow = () => colorRows.push({ colorName: null, pieces: 0 })
const removeColorRow = (i) => { colorRows.splice(i, 1); syncMappings() }

const hasUnmatched = (mat) =>
  (fabricSelections[mat.cat2_id] || []).some(r => r.pieces > 0 && !r.fabric_id)

const allItems = computed(() =>
  Object.values(fabricSelections).flat().filter(r => r.fabric_id && r.quantity > 0)
)

const onStyleChange = async () => {
  if (!form.value.style_id) { materials.value = []; return }
  loading.value = true
  try {
    const style = await stylesApi.get(form.value.style_id)
    const allFabrics = await fabricsApi.list()
    materials.value = style.materials
      .filter(m => m.actual_usage_per_piece != null || m.estimated_usage_per_piece != null)
      .map(m => ({
        cat2_id: m.cat2_id,
        cat2_name: m.cat2_name,
        cat1_name: m.cat1_name,
        usage_per_piece: m.actual_usage_per_piece ?? m.estimated_usage_per_piece,
        usage_source: m.actual_usage_per_piece != null ? 'actual' : 'estimated',
        fabrics: allFabrics.filter(f => f.cat2_id === m.cat2_id)
      }))
    syncMappings()
  } finally {
    loading.value = false
  }
}

const deduct = async () => {
  await deductFormRef.value.validate()
  const items = allItems.value
  if (!items.length) { ElMessage.warning(t('calc.warn_pieces')); return }
  for (const mat of materials.value) {
    if (hasUnmatched(mat)) {
      ElMessage.error(`${mat.cat2_name} 有颜色未匹配到库存面料`)
      return
    }
  }
  deducting.value = true
  try {
    await stockApi.outBatch({
      items: items.map(item => ({
        fabric_id: item.fabric_id,
        quantity: item.quantity,
        pieces: item.pieces,
        usage_source: item.usage_source,
        usage_per_piece_snapshot: item.usage_per_piece_snapshot,
        style_material_cat2_id: item.style_material_cat2_id,
        calc_snapshot: [item]
      })),
      style_id: form.value.style_id,
      po_number: deductForm.value.po_number,
      note: deductForm.value.note
    })
    ElMessage.success(t('calc.success'))
    showDialog.value = false
    deductForm.value = { po_number: '', note: '' }
    await onStyleChange()
  } catch (e) {
    ElMessage.error(e.message)
  } finally {
    deducting.value = false
  }
}

onMounted(async () => { styles.value = await stylesApi.list() })
</script>
