<template>
  <el-card shadow="never" style="max-width:860px">
    <template #header>
      <div style="display:flex;justify-content:space-between;align-items:center;gap:12px;flex-wrap:wrap">
        <b>{{ $t('stock_in.title') }}</b>
        <el-space wrap>
          <el-radio-group v-model="mode" size="small">
            <el-radio-button value="existing">{{ $t('stock_in.existing_fabric') }}</el-radio-button>
            <el-radio-button value="new">{{ $t('stock_in.new_and_stock') }}</el-radio-button>
          </el-radio-group>
          <el-button :loading="ocrLoading" icon="Camera" @click="triggerScan">{{ $t('ocr.scan_stock_in') }}</el-button>
        </el-space>
      </div>
    </template>

    <el-form v-if="mode === 'existing'" :model="form" :rules="rules" ref="formRef" label-width="90px">
      <el-form-item :label="$t('common.fabric')" prop="fabric_id">
        <el-select v-model="form.fabric_id" :placeholder="$t('stock_in.select_fabric')" filterable style="width:100%">
          <el-option
            v-for="f in fabrics" :key="f.id"
            :label="`${f.cat1_name}/${f.cat2_name}${f.color ? '·' + f.color : ''}（${f.current_stock}${f.unit}）`"
            :value="f.id"
          />
        </el-select>
      </el-form-item>
      <el-form-item :label="$t('stock_in.stock_qty')" prop="quantity">
        <div style="display:flex;align-items:center;gap:8px;width:100%">
          <el-input-number v-model="form.quantity" :min="0.01" :precision="2" style="flex:1" />
          <span style="color:var(--color-text-secondary);font-size:13px">{{ selectedFabric?.unit || $t('common.meter') }}</span>
        </div>
      </el-form-item>
      <el-form-item :label="$t('common.note')">
        <el-input v-model="form.note" :placeholder="$t('stock_in.note_placeholder')" />
      </el-form-item>
      <el-form-item>
        <el-button v-if="auth.canWrite.value" type="success" :loading="saving" @click="submitExisting">{{ $t('stock_in.confirm_btn') }}</el-button>
        <el-button @click="resetExisting">{{ $t('stock_in.reset_btn') }}</el-button>
      </el-form-item>
    </el-form>

    <el-form v-else :model="newForm" :rules="newRules" ref="newFormRef" label-width="90px">
      <el-form-item :label="$t('stock_in.cat1')" prop="cat1_id">
        <div style="display:flex;gap:8px;width:100%">
          <el-select v-model="newForm.cat1_id" :placeholder="$t('stock_in.select_cat1')" style="flex:1" @change="newForm.cat2_id = null">
            <el-option v-for="c in cat1List" :key="c.id" :label="c.name" :value="c.id" />
          </el-select>
          <el-button @click="addCat1ForNewForm">+{{ $t('common.add') }}</el-button>
        </div>
      </el-form-item>
      <el-form-item :label="$t('stock_in.cat2')" prop="cat2_id">
        <div style="display:flex;gap:8px;width:100%">
          <el-select v-model="newForm.cat2_id" :placeholder="$t('stock_in.select_cat2')" style="flex:1" :disabled="!newForm.cat1_id">
            <el-option v-for="c in cat2Options" :key="c.id" :label="c.name" :value="c.id" />
          </el-select>
          <el-button :disabled="!newForm.cat1_id" @click="addCat2ForNewForm">+{{ $t('common.add') }}</el-button>
        </div>
      </el-form-item>
      <el-form-item :label="$t('common.color')">
        <el-input v-model="newForm.color" :placeholder="$t('stock_in.color_placeholder')" />
      </el-form-item>
      <el-form-item :label="$t('stock_in.stock_qty')" prop="quantity">
        <div style="display:flex;align-items:center;gap:8px;width:100%">
          <el-input-number v-model="newForm.quantity" :min="0.01" :precision="2" style="flex:1" />
          <span style="color:var(--color-text-secondary);font-size:13px">{{ $t('common.meter') }}</span>
        </div>
      </el-form-item>
      <el-form-item :label="$t('stock_in.alert_threshold')">
        <div style="display:flex;align-items:center;gap:8px;width:100%">
          <el-input-number v-model="newForm.alert_threshold" :min="0" :precision="2" style="flex:1" />
          <span style="color:var(--color-text-secondary);font-size:13px">{{ $t('common.meter') }}</span>
        </div>
      </el-form-item>
      <el-form-item :label="$t('common.note')">
        <el-input v-model="newForm.note" :placeholder="$t('common.optional')" />
      </el-form-item>
      <el-form-item>
        <el-button v-if="auth.canWrite.value" type="success" :loading="saving" @click="submitNew">{{ $t('stock_in.new_and_stock_btn') }}</el-button>
        <el-button @click="resetNew">{{ $t('stock_in.reset_btn') }}</el-button>
      </el-form-item>
    </el-form>

    <input
      ref="ocrFileInput"
      type="file"
      multiple
      accept="image/*,.pdf,application/pdf"
      capture="environment"
      style="display:none"
      @change="handleOcrFile"
    />

    <el-dialog
      v-model="ocrDialogVisible"
      :title="$t('ocr.dialog_title_in')"
      :width="dialogWidth"
      :close-on-click-modal="false"
    >
      <div v-if="ocrResult">
        <!-- 原图预览 -->
        <div v-if="ocrResult.source_images?.length" class="ocr-image-strip">
          <el-image
            v-for="(img, i) in ocrResult.source_images"
            :key="i"
            :src="`data:${img.mime_type};base64,${img.data_base64}`"
            :preview-src-list="ocrResult.source_images.map(m => `data:${m.mime_type};base64,${m.data_base64}`)"
            :initial-index="i"
            fit="cover"
            preview-teleported
            class="ocr-thumb"
          />
        </div>

        <el-descriptions :column="1" border size="small" style="margin-bottom:16px">
          <el-descriptions-item :label="$t('ocr.supplier')">
            <el-input v-model="ocrResult.supplier" size="small" />
          </el-descriptions-item>
        </el-descriptions>

        <!-- 桌面表格 -->
        <div style="overflow-x:auto">
        <el-table class="ocr-items-table" :data="ocrResult.items" size="small" border style="min-width:700px">
          <el-table-column :label="$t('stock_in.cat1')" min-width="170">
            <template #default="{ row }">
              <div style="display:flex;gap:6px;align-items:center">
                <el-select
                  v-model="row.cat1_id"
                  filterable
                  style="flex:1"
                  :placeholder="$t('stock_in.select_cat1')"
                  @change="onOcrCat1Change(row)"
                >
                  <el-option v-for="c in cat1List" :key="c.id" :label="c.name" :value="c.id" />
                </el-select>
                <el-button size="small" link @click="openAddCatDialog('cat1', row)">+{{ $t('common.add') }}</el-button>
              </div>
            </template>
          </el-table-column>
          <el-table-column :label="$t('stock_in.fabric_category')" min-width="180">
            <template #default="{ row }">
              <div style="display:flex;gap:6px;align-items:center">
                <el-select v-model="row.cat2_id" filterable style="flex:1" :placeholder="$t('stock_in.select_cat2_for_ocr')">
                  <el-option
                    v-for="c in getCat2OptionsByCat1(row.cat1_id)"
                    :key="c.id"
                    :label="c.name"
                    :value="c.id"
                  />
                </el-select>
                <el-button size="small" link @click="openAddCatDialog('cat2', row)">+{{ $t('common.add') }}</el-button>
              </div>
            </template>
          </el-table-column>
          <el-table-column :label="$t('ocr.fabric_type')" prop="fabric_type" min-width="110">
            <template #default="{ row }">
              <el-input v-model="row.fabric_type" size="small" />
            </template>
          </el-table-column>
          <el-table-column :label="$t('common.color')" min-width="120">
            <template #default="{ row }">
              <el-select
                v-model="row.color"
                size="small"
                filterable
                allow-create
                clearable
                default-first-option
                style="width:100%"
                :placeholder="$t('stock_in.select_or_create_color')"
              >
                <el-option v-for="c in getColorsByCat2(row.cat2_id)" :key="c" :label="c" :value="c" />
              </el-select>
            </template>
          </el-table-column>
          <el-table-column :label="$t('stock_in.stock_qty')" prop="quantity" width="110">
            <template #default="{ row }">
              <el-input-number v-model="row.quantity" :min="0" :precision="2" size="small" style="width:98px" />
            </template>
          </el-table-column>
          <el-table-column :label="$t('common.unit')" prop="unit" width="85">
            <template #default="{ row }">
              <el-input v-model="row.unit" size="small" />
            </template>
          </el-table-column>
          <el-table-column :label="$t('common.note')" prop="note" min-width="120">
            <template #default="{ row }">
              <el-input v-model="row.note" size="small" />
            </template>
          </el-table-column>
        </el-table>
        </div>

        <!-- 移动端卡片 -->
        <div class="ocr-item-cards">
          <div v-for="(row, idx) in ocrResult.items" :key="idx" class="ocr-item-card">
            <div class="card-row">
              <span class="card-lbl">{{ $t('ocr.fabric_type') }}</span>
              <el-input v-model="row.fabric_type" size="small" style="flex:1" />
            </div>
            <div class="card-row">
              <span class="card-lbl">{{ $t('stock_in.cat1') }}</span>
              <el-select v-model="row.cat1_id" filterable size="small" style="flex:1" :placeholder="$t('stock_in.select_cat1')" @change="onOcrCat1Change(row)">
                <el-option v-for="c in cat1List" :key="c.id" :label="c.name" :value="c.id" />
              </el-select>
              <el-button size="small" link @click="openAddCatDialog('cat1', row)">+</el-button>
            </div>
            <div class="card-row">
              <span class="card-lbl">{{ $t('stock_in.fabric_category') }}</span>
              <el-select v-model="row.cat2_id" filterable size="small" style="flex:1" :placeholder="$t('stock_in.select_cat2_for_ocr')">
                <el-option v-for="c in getCat2OptionsByCat1(row.cat1_id)" :key="c.id" :label="c.name" :value="c.id" />
              </el-select>
              <el-button size="small" link @click="openAddCatDialog('cat2', row)">+</el-button>
            </div>
            <div class="card-row">
              <span class="card-lbl">{{ $t('common.color') }}</span>
              <el-select v-model="row.color" size="small" filterable allow-create clearable default-first-option style="flex:1" :placeholder="$t('stock_in.select_or_create_color')">
                <el-option v-for="c in getColorsByCat2(row.cat2_id)" :key="c" :label="c" :value="c" />
              </el-select>
            </div>
            <div class="card-row">
              <span class="card-lbl">{{ $t('stock_in.stock_qty') }}</span>
              <el-input-number v-model="row.quantity" :min="0" :precision="2" size="small" style="width:100px" />
              <el-input v-model="row.unit" size="small" style="width:56px;margin-left:4px" />
            </div>
            <div class="card-row">
              <span class="card-lbl">{{ $t('common.note') }}</span>
              <el-input v-model="row.note" size="small" style="flex:1" />
            </div>
          </div>
        </div>
      </div>

      <template #footer>
        <el-button :loading="exportingExcel" @click="exportExcel">{{ $t('ocr.export_excel') }}</el-button>
        <el-button @click="ocrDialogVisible = false">{{ $t('common.cancel') }}</el-button>
        <el-button type="primary" :loading="savingOcrRecords" @click="applyOcrToForm">{{ $t('stock_in.batch_confirm_btn') }}</el-button>
      </template>
    </el-dialog>

    <el-dialog
      v-model="addCatDialog.visible"
      :title="addCatDialog.type === 'cat1' ? '新增大类' : '新增小类'"
      width="min(360px, 95vw)"
      @closed="addCatDialog.name = ''"
    >
      <el-input
        v-model="addCatDialog.name"
        placeholder="输入类目名称"
        autofocus
        @keyup.enter="confirmAddCat"
      />
      <template #footer>
        <el-button @click="addCatDialog.visible = false">{{ $t('common.cancel') }}</el-button>
        <el-button type="primary" :loading="addCatDialog.saving" @click="confirmAddCat">{{ $t('common.save') }}</el-button>
      </template>
    </el-dialog>
  </el-card>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { ElMessage } from 'element-plus'
import { auth } from '../stores/auth'
import { fabricsApi, categoriesApi, stockApi, ocrApi } from '../api'

const { t } = useI18n()

const mode = ref('existing')
const fabrics = ref([])
const catTree = ref([])
const saving = ref(false)
const savingOcrRecords = ref(false)

const formRef = ref()
const form = ref({ fabric_id: null, quantity: 1, note: '' })
const rules = computed(() => ({
  fabric_id: [{ required: true, message: t('stock_in.val_fabric') }],
  quantity: [{ required: true, message: t('stock_in.val_qty') }]
}))
const selectedFabric = computed(() => fabrics.value.find(f => f.id === form.value.fabric_id))

const newFormRef = ref()
const newForm = ref({ cat1_id: null, cat2_id: null, color: '', quantity: 1, alert_threshold: 20, note: '' })
const newRules = computed(() => ({
  cat1_id: [{ required: true, message: t('stock_in.val_cat1') }],
  cat2_id: [{ required: true, message: t('stock_in.val_cat2') }],
  quantity: [{ required: true, message: t('stock_in.val_new_qty') }]
}))

const cat1List = computed(() => catTree.value)
const cat2Options = computed(() =>
  catTree.value.find(c => c.id === newForm.value.cat1_id)?.children || []
)
const allCat2Options = computed(() =>
  catTree.value.flatMap(cat1 => (cat1.children || []).map(cat2 => ({
    ...cat2,
    cat1_name: cat1.name
  })))
)

const ocrFileInput = ref(null)
const ocrLoading = ref(false)
const ocrDialogVisible = ref(false)
const ocrResult = ref(null)
const exportingExcel = ref(false)

const dialogWidth = computed(() => {
  if (typeof window !== 'undefined' && window.innerWidth < 640) return '98%'
  return '980px'
})

const guessCat2 = (fabricType) => {
  const needle = String(fabricType || '').trim().toLowerCase()
  if (!needle) return { cat1_id: null, cat2_id: null }
  const match = allCat2Options.value.find(c => {
    const name = String(c.name || '').toLowerCase()
    return name.includes(needle) || needle.includes(name)
  })
  return {
    cat1_id: match?.cat1_id || null,
    cat2_id: match?.id || null
  }
}

const getColorsByCat2 = (cat2Id) => {
  const colors = fabrics.value
    .filter(f => f.cat2_id === cat2Id && f.color)
    .map(f => f.color)
  return [...new Set(colors)]
}

const getCat2OptionsByCat1 = (cat1Id) =>
  catTree.value.find(c => c.id === cat1Id)?.children || []

const onOcrCat1Change = (row) => {
  const options = getCat2OptionsByCat1(row.cat1_id)
  if (!options.find(c => c.id === row.cat2_id)) row.cat2_id = null
}

const addCatDialog = reactive({ visible: false, type: '', name: '', saving: false, row: null })

const openAddCatDialog = (type, row) => {
  if (type === 'cat2' && !row.cat1_id) {
    ElMessage.error(t('stock_in.val_cat1'))
    return
  }
  addCatDialog.type = type
  addCatDialog.name = ''
  addCatDialog.row = row
  addCatDialog.visible = true
}

const confirmAddCat = async () => {
  if (!addCatDialog.name.trim()) return
  addCatDialog.saving = true
  try {
    if (addCatDialog.type === 'cat1') {
      const created = await categoriesApi.createCat1({ name: addCatDialog.name.trim() })
      catTree.value = await categoriesApi.tree()
      addCatDialog.row.cat1_id = created.id
      addCatDialog.row.cat2_id = null
    } else {
      const created = await categoriesApi.createCat2({ cat1_id: addCatDialog.row.cat1_id, name: addCatDialog.name.trim() })
      catTree.value = await categoriesApi.tree()
      addCatDialog.row.cat2_id = created.id
    }
    ElMessage.success(t('common.create_success'))
    addCatDialog.visible = false
  } catch (e) {
    ElMessage.error(e.message)
  } finally {
    addCatDialog.saving = false
  }
}

const addCat1ForNewForm = () => openAddCatDialog('cat1', newForm.value)
const addCat2ForNewForm = () => openAddCatDialog('cat2', newForm.value)

const triggerScan = () => ocrFileInput.value.click()

const handleOcrFile = async (e) => {
  const files = Array.from(e.target.files || [])
  if (!files.length) return
  e.target.value = ''
  if (files.some(file => file.type !== 'application/pdf' && file.size > 4 * 1024 * 1024)) {
    ElMessage.warning(t('ocr.image_too_large'))
  }
  ocrLoading.value = true
  try {
    const data = await ocrApi.stockIn(files)
    data.items = (data.items || []).map(item => ({
      ...item,
      ...guessCat2(item.fabric_type)
    }))
    if (!data.items.length) {
      data.items = [{ fabric_type: '', color: '', quantity: 0, unit: '米', note: '', cat2_id: null }]
    }
    ocrResult.value = data
    ocrDialogVisible.value = true
  } catch (err) {
    ElMessage.error(err.message || t('ocr.error'))
  } finally {
    ocrLoading.value = false
  }
}

const resolveOrCreateFabricId = async (row) => {
  const existing = fabrics.value.find(f =>
    f.cat2_id === row.cat2_id && (f.color || '') === (row.color || '')
  )
  if (existing) return existing.id

  const created = await fabricsApi.create({
    cat2_id: row.cat2_id,
    color: row.color || '',
    unit: row.unit || '米',
    current_stock: 0,
    alert_threshold: 20
  })
  return created.id
}

const applyOcrToForm = async () => {
  const items = ocrResult.value?.items || []
  if (!items.length) return

  const invalid = items.find(item => !item.cat2_id || !(Number(item.quantity) > 0))
  if (invalid) {
    ElMessage.error(t('stock_in.ocr_invalid_items'))
    return
  }

  savingOcrRecords.value = true
  try {
    for (const row of items) {
      const fabricId = await resolveOrCreateFabricId(row)
      const note = [ocrResult.value.supplier, row.note].filter(Boolean).join(' / ')
      await stockApi.in({
        fabric_id: fabricId,
        quantity: Number(row.quantity),
        note,
        images: ocrResult.value.source_images || []
      })
    }
    ElMessage.success(t('stock_in.batch_success', { n: items.length }))
    ocrDialogVisible.value = false
    ocrResult.value = null
    fabrics.value = await fabricsApi.list()
    catTree.value = await categoriesApi.tree()
  } catch (e) {
    ElMessage.error(e.message)
  } finally {
    savingOcrRecords.value = false
  }
}

const exportExcel = async () => {
  if (!ocrResult.value?.items?.length) return
  exportingExcel.value = true
  try {
    const scanTime = new Date().toLocaleString('zh-CN')
    const res = await fetch('/api/ocr/stock-in/export', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        supplier: ocrResult.value.supplier || '',
        scan_time: scanTime,
        items: ocrResult.value.items
      })
    })
    if (!res.ok) {
      ElMessage.error(t('stock_in.export_failed'))
      return
    }
    const blob = await res.blob()
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `stock_in_ocr_${Date.now()}.xlsx`
    a.click()
    URL.revokeObjectURL(url)
  } finally {
    exportingExcel.value = false
  }
}

const submitExisting = async () => {
  await formRef.value.validate()
  saving.value = true
  try {
    await stockApi.in(form.value)
    ElMessage.success(t('stock_in.success'))
    resetExisting()
    fabrics.value = await fabricsApi.list()
  } catch (e) {
    ElMessage.error(e.message)
  } finally {
    saving.value = false
  }
}

const resetExisting = () => {
  form.value = { fabric_id: null, quantity: 1, note: '' }
  formRef.value?.clearValidate()
}

const submitNew = async () => {
  await newFormRef.value.validate()
  saving.value = true
  try {
    const created = await fabricsApi.create({
      cat2_id: newForm.value.cat2_id,
      color: newForm.value.color || '',
      unit: '米',
      current_stock: 0,
      alert_threshold: newForm.value.alert_threshold
    })
    await stockApi.in({ fabric_id: created.id, quantity: newForm.value.quantity, note: newForm.value.note })
    ElMessage.success(t('stock_in.fabric_created_success'))
    resetNew()
    fabrics.value = await fabricsApi.list()
    catTree.value = await categoriesApi.tree()
  } catch (e) {
    ElMessage.error(e.message)
  } finally {
    saving.value = false
  }
}

const resetNew = () => {
  newForm.value = { cat1_id: null, cat2_id: null, color: '', quantity: 1, alert_threshold: 20, note: '' }
  newFormRef.value?.clearValidate()
}

onMounted(async () => {
  const [f, c] = await Promise.all([fabricsApi.list(), categoriesApi.tree()])
  fabrics.value = f
  catTree.value = c
})
</script>

<style scoped>
.ocr-image-strip {
  display: flex;
  gap: 8px;
  overflow-x: auto;
  margin-bottom: 14px;
  padding-bottom: 4px;
  scrollbar-width: none;
}
.ocr-thumb {
  width: 80px;
  height: 80px;
  border-radius: 6px;
  flex-shrink: 0;
  cursor: zoom-in;
  border: 1px solid var(--color-border);
}
.ocr-item-cards { display: none; flex-direction: column; gap: 10px; }
.ocr-item-card {
  border: 1px solid var(--color-border);
  border-radius: 8px;
  padding: 10px 12px;
  background: var(--color-bg-surface);
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.card-row { display: flex; align-items: center; gap: 6px; }
.card-lbl { font-size: 12px; color: var(--color-text-secondary); width: 52px; flex-shrink: 0; }
@media (max-width: 640px) {
  :deep(.ocr-items-table) { display: none; }
  .ocr-item-cards { display: flex; }
}
</style>
