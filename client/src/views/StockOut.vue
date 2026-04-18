<template>
  <el-card shadow="never" style="max-width:980px">
    <template #header>
      <div style="display:flex;justify-content:space-between;align-items:center;gap:12px;flex-wrap:wrap">
        <b>{{ $t('stock_out.title') }}</b>
        <el-space>
          <el-button :loading="ocrLoading" icon="Camera" @click="triggerScan">{{ $t('ocr.scan_stock_out') }}</el-button>
        </el-space>
      </div>
    </template>

    <el-form :model="form" :rules="rules" ref="formRef" label-width="90px">
      <el-form-item :label="$t('stock_out.associate_style')" prop="style_id">
        <el-select
          v-model="form.style_id"
          :placeholder="$t('stock_out.select_style')"
          filterable
          clearable
          style="width:100%"
          @change="onStyleChange"
        >
          <el-option
            v-for="s in styles" :key="s.id"
            :label="`${s.name}${s.customer ? ' · ' + s.customer : ''}`"
            :value="s.id"
          />
        </el-select>
      </el-form-item>
      <el-form-item :label="$t('common.po_number')" prop="po_number">
        <el-input v-model="form.po_number" :placeholder="$t('stock_out.select_style')" />
      </el-form-item>
      <el-form-item :label="$t('common.note')">
        <el-input v-model="form.note" :placeholder="$t('common.optional')" />
      </el-form-item>
    </el-form>

    <div v-if="materials.length" style="margin-top:4px">
      <el-divider>{{ $t('stock_out.fill_colors') }}</el-divider>

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
        <el-button size="small" link icon="Plus" @click="addColorRow">{{ $t('stock_out.add_color') }}</el-button>
      </div>

      <el-divider>{{ $t('stock_out.out_details') }}</el-divider>

      <div v-for="mat in materials" :key="mat.cat2_id" style="margin-bottom:24px">
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:10px;flex-wrap:wrap">
          <el-tag type="primary">{{ mat.cat1_name }}/{{ mat.cat2_name }}</el-tag>
          <span style="color:var(--color-text-secondary);font-size:13px">
            {{ mat.usage_source === 'actual' ? '实际' : '估算' }} {{ $t('stock_out.usage_label') }} {{ mat.usage_per_piece }} {{ $t('common.meter_per_piece') }}
          </span>
          <el-tag size="small" :type="hasUnmatched(mat) ? 'danger' : (totalStock(mat) > 0 ? 'info' : 'danger')">
            {{ hasUnmatched(mat) ? '缺少颜色匹配' : '总库存 ' + totalStock(mat) + ' ' + $t('common.meter') }}
          </el-tag>
        </div>

        <div
          v-for="(sel, i) in fabricSelections[mat.cat2_id]"
          :key="i"
          style="display:flex;gap:8px;align-items:center;margin-bottom:6px;margin-left:16px;flex-wrap:wrap"
        >
          <el-input
            v-model="sel.overrideColor"
            size="small"
            style="width:120px"
            @change="onSelColorChange(mat, sel)"
          />
          <span style="font-size:13px;color:var(--color-text-secondary);width:55px">{{ sel.pieces }} {{ $t('common.pieces') }}</span>
          <span style="font-size:13px;min-width:85px">
            = <b style="color:var(--color-primary)">{{ sel.quantity.toFixed(3) }}</b> {{ $t('common.meter') }}
          </span>
          <span style="font-size:13px;flex:1;min-width:60px;color:var(--color-text-secondary);word-break:break-all">
            {{ sel.fabric_name || '未匹配' }}
          </span>
          <el-tag
            v-if="sel.quantity > 0 && sel.fabric_id"
            size="small"
            :type="(sel.stock || 0) >= sel.quantity ? 'success' : 'warning'"
          >
            {{ (sel.stock || 0) >= sel.quantity ? $t('common.sufficient') : '库存不足，将记为负库存' }}
          </el-tag>
          <el-button
            v-if="!sel.fabric_id && sel.overrideColor && sel.pieces > 0"
            size="small" type="warning" plain
            :loading="sel.creating"
            @click="createFabricForColor(mat, sel)"
          >创建面料</el-button>
        </div>

        <div style="margin-left:16px;font-size:13px;color:var(--color-text-secondary);margin-top:4px">
          {{ $t('stock_out.total_label') }}：<b>{{ sumPieces(mat.cat2_id) }}</b> {{ $t('common.pieces') }}  / <b>{{ sumMeters(mat.cat2_id) }}</b> {{ $t('common.meter') }}
        </div>
      </div>

      <el-divider />
      <div style="display:flex;justify-content:space-between;align-items:center;gap:12px;flex-wrap:wrap">
        <span style="color:var(--color-text-secondary);font-size:13px">{{ $t('stock_out.total_items', { n: allItems.length }) }}</span>
        <el-space>
          <el-button @click="reset">{{ $t('stock_out.reset_btn') }}</el-button>
          <el-button type="warning" :loading="saving" @click="submit">{{ $t('stock_out.confirm_btn') }}</el-button>
        </el-space>
      </div>
    </div>

    <div v-else-if="form.style_id && !loadingMaterials" style="color:var(--color-text-tertiary);padding:20px;text-align:center">
      该款式暂无用量数据，请先在款式详情中配置面料用量。
    </div>

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
      :title="$t('ocr.dialog_title_out')"
      :width="ocrDialogWidth"
      :close-on-click-modal="false"
    >
      <div v-if="ocrResult">
        <el-form label-width="100px" size="small">
          <el-form-item label="识别款号">
            <div style="display:flex;gap:8px;align-items:center;width:100%">
              <el-input v-model="ocrResult.style_name" size="small" placeholder="未识别" style="flex:1" />
              <el-button
                v-if="ocrResult.style_name"
                size="small"
                :loading="styleCreating"
                @click="handleCreateOrUpdateStyle"
              >创建/更新款式</el-button>
            </div>
          </el-form-item>
          <el-form-item :label="$t('common.po_number')">
            <el-input v-model="ocrResult.po_number" />
          </el-form-item>
        </el-form>

        <el-divider>面料用量</el-divider>
        <div style="margin-bottom:10px;color:var(--color-text-secondary);font-size:13px">
          识别到 {{ totalOcrPieces }} 件，请补充面料分类：
        </div>
        <div style="overflow-x:auto">
        <el-table :data="ocrResult.usage_items" size="small" border style="min-width:600px">
          <el-table-column label="面料类型" prop="fabric_type" min-width="120">
            <template #default="{ row, $index }">
              <div style="display:flex;gap:4px;align-items:center">
                <el-input v-model="row.fabric_type" size="small" style="flex:1" />
                <el-button icon="Delete" size="small" type="danger" plain circle @click="ocrResult.usage_items.splice($index, 1)" />
              </div>
            </template>
          </el-table-column>
          <el-table-column label="面料分类" min-width="150">
            <template #default="{ row }">
              <div style="display:flex;gap:6px;align-items:center">
                <el-select v-model="row.cat1_id" filterable size="small" style="flex:1" placeholder="大类" @change="onOcrCat1Change(row)">
                  <el-option v-for="c in catTree" :key="c.id" :label="c.name" :value="c.id" />
                </el-select>
                <el-button size="small" link @click="openAddCatDialog('cat1', row)">+新建</el-button>
              </div>
            </template>
          </el-table-column>
          <el-table-column label="面料细类" min-width="170">
            <template #default="{ row }">
              <div style="display:flex;gap:6px;align-items:center">
                <el-select v-model="row.cat2_id" filterable size="small" style="flex:1" placeholder="细类">
                  <el-option v-for="c in getCat2OptionsByCat1(row.cat1_id)" :key="c.id" :label="c.name" :value="c.id" />
                </el-select>
                <el-button size="small" link @click="openAddCatDialog('cat2', row)">+新建</el-button>
              </div>
            </template>
          </el-table-column>
          <el-table-column label="OCR用量" width="120">
            <template #default="{ row }">
              <el-input-number v-model="row.quantity" :min="0" :precision="2" size="small" style="width:100px" />
            </template>
          </el-table-column>
          <el-table-column :label="$t('common.unit')" width="80">
            <template #default="{ row }">
              <el-input v-model="row.unit" size="small" />
            </template>
          </el-table-column>
          <el-table-column label="估算 m/件" width="130">
            <template #default="{ row }">
              {{ estimatedPerPiece(row) }}
            </template>
          </el-table-column>
        </el-table>
        </div>
        <el-button size="small" link icon="Plus" style="margin-top:8px" @click="addOcrUsageItem">添加用量行</el-button>

        <el-divider>{{ $t('ocr.color_pieces') }}</el-divider>
        <el-table :data="ocrResult.colors" size="small" border>
          <el-table-column :label="$t('common.color')" prop="color">
            <template #default="{ row, $index }">
              <div style="display:flex;gap:4px;align-items:center">
                <el-input v-model="row.color" size="small" style="flex:1" />
                <el-button icon="Delete" size="small" type="danger" plain circle @click="ocrResult.colors.splice($index, 1)" />
              </div>
            </template>
          </el-table-column>
          <el-table-column :label="$t('common.pieces')" prop="pieces" width="140">
            <template #default="{ row }">
              <el-input-number v-model="row.pieces" :min="0" :precision="0" size="small" style="width:110px" />
            </template>
          </el-table-column>
        </el-table>
        <el-button size="small" link icon="Plus" style="margin-top:6px" @click="ocrResult.colors.push({ color: '', pieces: 0 })">{{ $t('common.add') }}</el-button>
      </div>

      <template #footer>
        <el-button @click="ocrDialogVisible = false">{{ $t('common.cancel') }}</el-button>
        <el-button type="primary" :loading="ocrApplying" @click="applyOcrToForm">应用到表单</el-button>
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
import { ref, reactive, computed, watch, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { ElMessage } from 'element-plus'
import { stylesApi, fabricsApi, stockApi, ocrApi, categoriesApi } from '../api'

const { t } = useI18n()

const styles = ref([])
const materials = ref([])
const fabrics = ref([])
const catTree = ref([])
const saving = ref(false)
const loadingMaterials = ref(false)
const ocrApplying = ref(false)

const ocrDialogWidth = computed(() =>
  typeof window !== 'undefined' && window.innerWidth < 700 ? '98vw' : '1100px'
)
const formRef = ref()

const form = ref({ style_id: null, po_number: '', note: '' })
const rules = computed(() => ({
  style_id: [{ required: true, message: t('stock_out.val_style') }],
  po_number: [{ required: true, message: t('stock_out.val_po') }]
}))

const colorRows = reactive([{ colorName: null, pieces: 0 }])
const fabricSelections = reactive({})

const ocrFileInput = ref(null)
const ocrLoading = ref(false)
const ocrDialogVisible = ref(false)
const ocrResult = ref(null)
const styleCreating = ref(false)

const allCat2Options = computed(() =>
  catTree.value.flatMap(cat1 => (cat1.children || []).map(cat2 => ({
    ...cat2,
    cat1_id: cat1.id,
    cat1_name: cat1.name
  })))
)

const allColors = computed(() => {
  const set = new Set()
  for (const mat of materials.value) {
    for (const f of mat.fabrics) if (f.color) set.add(f.color)
  }
  return [...set]
})

const totalStock = (mat) =>
  parseFloat(mat.fabrics.reduce((s, f) => s + f.current_stock, 0).toFixed(3))

const sumPieces = (cat2_id) =>
  (fabricSelections[cat2_id] || []).reduce((s, r) => s + (r.pieces || 0), 0)

const sumMeters = (cat2_id) =>
  parseFloat((fabricSelections[cat2_id] || []).reduce((s, r) => s + (r.quantity || 0), 0).toFixed(3))

const totalOcrPieces = computed(() =>
  (ocrResult.value?.colors || []).reduce((sum, row) => sum + (Number(row.pieces) || 0), 0)
)

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
        fabric_name: fabric ? `${fabric.cat1_name}/${fabric.cat2_name}${fabric.color ? ' / ' + fabric.color : ''}` : '',
        stock: fabric?.current_stock || 0,
        color: row.colorName || '',
        overrideColor: row.colorName || '',
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

const addColorRow = () => { colorRows.push({ colorName: null, pieces: 0 }) }
const removeColorRow = (i) => { colorRows.splice(i, 1); syncMappings() }

const hasUnmatched = (mat) =>
  (fabricSelections[mat.cat2_id] || []).some(r => r.pieces > 0 && !r.fabric_id)

const allItems = computed(() =>
  Object.values(fabricSelections).flat().filter(r => r.fabric_id && r.quantity > 0)
)

const getCat2OptionsByCat1 = (cat1Id) =>
  catTree.value.find(c => c.id === cat1Id)?.children || []

const guessCat = (fabricType) => {
  const needle = String(fabricType || '').trim().toLowerCase()
  if (!needle) return { cat1_id: null, cat2_id: null }
  const match = allCat2Options.value.find(c => {
    const name = String(c.name || '').toLowerCase()
    return name.includes(needle) || needle.includes(name)
  })
  return { cat1_id: match?.cat1_id || null, cat2_id: match?.id || null }
}

const estimatedPerPiece = (row) => {
  if (!Number(row.quantity)) return '-'
  return `${parseFloat(Number(row.quantity).toFixed(6))}${t('common.meter_per_piece')}`
}

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

const onStyleChange = async () => {
  if (!form.value.style_id) { materials.value = []; return }
  loadingMaterials.value = true
  try {
    const style = await stylesApi.get(form.value.style_id)
    materials.value = style.materials
      .filter(m => m.actual_usage_per_piece != null || m.estimated_usage_per_piece != null)
      .map(m => ({
        cat2_id: m.cat2_id,
        cat2_name: m.cat2_name,
        cat1_name: m.cat1_name,
        usage_per_piece: m.actual_usage_per_piece ?? m.estimated_usage_per_piece,
        usage_source: m.actual_usage_per_piece != null ? 'actual' : 'estimated',
        fabrics: fabrics.value.filter(f => f.cat2_id === m.cat2_id)
      }))
    syncMappings()
  } finally {
    loadingMaterials.value = false
  }
}

function cropImageByBbox(dataUrl, bbox) {
  return new Promise((resolve) => {
    const img = new Image()
    img.onload = () => {
      const sx = Math.round(img.naturalWidth * bbox.x)
      const sy = Math.round(img.naturalHeight * bbox.y)
      const sw = Math.round(img.naturalWidth * bbox.w)
      const sh = Math.round(img.naturalHeight * bbox.h)
      const canvas = document.createElement('canvas')
      canvas.width = sw
      canvas.height = sh
      canvas.getContext('2d').drawImage(img, sx, sy, sw, sh, 0, 0, sw, sh)
      resolve(canvas.toDataURL('image/jpeg', 0.92))
    }
    img.onerror = () => resolve(dataUrl)
    img.src = dataUrl
  })
}

const createOrUpdateEstimatedStyle = async () => {
  const styleName = ocrResult.value?.style_name?.trim()
  if (!styleName) {
    ElMessage.error('未识别到款号')
    return null
  }

  const materialsPayload = (ocrResult.value.usage_items || [])
    .filter(row => row.cat2_id && Number(row.quantity) > 0)
    .map(row => ({
      cat2_id: row.cat2_id,
      estimated_usage_per_piece: parseFloat(Number(row.quantity).toFixed(6))
    }))

  if (!materialsPayload.length) {
    ElMessage.error('请先补充面料分类和用量')
    return null
  }

  const srcImg = ocrResult.value.source_images?.[0]
  const fullDataUrl = srcImg?.data_base64 && srcImg.mime_type?.startsWith('image/')
    ? `data:${srcImg.mime_type};base64,${srcImg.data_base64}`
    : ''
  const bbox = ocrResult.value.style_image_bbox
  const image_base64 = fullDataUrl
    ? (bbox?.found ? await cropImageByBbox(fullDataUrl, bbox) : fullDataUrl)
    : ''
  let styleId = styles.value.find(s => s.name === styleName)?.id || null
  if (!styleId) {
    const created = await stylesApi.create({
      name: styleName,
      customer: '',
      note: `OCR导入，共${totalOcrPieces.value}件`,
      image_base64,
      materials: materialsPayload
    })
    styleId = created.id
    ElMessage.success(`款式「${styleName}」已创建`)
  } else {
    await stylesApi.appendEstimates(styleId, { materials: materialsPayload })
    ElMessage.success(`款式「${styleName}」用量已更新`)
  }
  styles.value = await stylesApi.list()
  return styleId
}

const handleCreateOrUpdateStyle = async () => {
  styleCreating.value = true
  try {
    await createOrUpdateEstimatedStyle()
  } catch (e) {
    ElMessage.error(e.message)
  } finally {
    styleCreating.value = false
  }
}

const addOcrUsageItem = () => {
  if (ocrResult.value) {
    ocrResult.value.usage_items.push({ fabric_type: '', cat1_id: null, cat2_id: null, quantity: 0, unit: '米' })
  }
}

const createFabricForColor = async (mat, sel) => {
  sel.creating = true
  try {
    const created = await fabricsApi.create({ cat2_id: mat.cat2_id, color: sel.overrideColor, unit: '米' })
    if (!created?.id) throw new Error('创建失败')
    ElMessage.success(`面料「${mat.cat2_name} / ${sel.overrideColor}」已创建，当前库存 0`)
    const freshFabrics = await fabricsApi.list()
    fabrics.value = freshFabrics
    for (const m of materials.value) {
      m.fabrics = fabrics.value.filter(f => f.cat2_id === m.cat2_id)
    }
    syncMappings()
  } catch (e) {
    ElMessage.error(e.message)
  } finally {
    sel.creating = false
  }
}

const onSelColorChange = (mat, sel) => {
  const fabric = pickFabric(mat, sel.overrideColor)
  sel.fabric_id = fabric?.id || null
  sel.fabric_name = fabric ? `${fabric.cat1_name}/${fabric.cat2_name}${fabric.color ? ' / ' + fabric.color : ''}` : ''
  sel.stock = fabric?.current_stock || 0
}

const submit = async () => {
  await formRef.value.validate()
  const items = allItems.value
  if (!items.length) { ElMessage.warning(t('stock_out.warn_pieces')); return }
  const unmatchedMats = materials.value.filter(mat => hasUnmatched(mat))
  if (unmatchedMats.length) {
    ElMessage.warning(`${unmatchedMats.map(m => m.cat2_name).join('、')} 有颜色未匹配面料，这些颜色将跳过出库`)
  }
  saving.value = true
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
      po_number: form.value.po_number,
      note: form.value.note,
      images: attachedImages.value
    })
    ElMessage.success(t('stock_out.success'))
    await refreshBaseData()
    await onStyleChange()
    form.value.po_number = ''
    form.value.note = ''
  } catch (e) {
    ElMessage.error(e.message)
  } finally {
    saving.value = false
  }
}

const attachedImages = ref([])

const reset = () => {
  form.value = { style_id: null, po_number: '', note: '' }
  materials.value = []
  colorRows.splice(0, colorRows.length, { colorName: null, pieces: 0 })
  Object.keys(fabricSelections).forEach(k => delete fabricSelections[k])
  attachedImages.value = []
  formRef.value?.clearValidate()
}

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
    const data = await ocrApi.stockOut(files)
    data.colors = Array.isArray(data.colors) ? data.colors : []
    data.usage_items = Array.isArray(data.usage_items) ? data.usage_items.map(item => ({
      ...item,
      ...guessCat(item.fabric_type)
    })) : []
    if (!data.po_number) data.po_number = ''
    ocrResult.value = data
    ocrDialogVisible.value = true
  } catch (err) {
    ElMessage.error(err.message || t('ocr.error'))
  } finally {
    ocrLoading.value = false
  }
}

const applyOcrToForm = async () => {
  if (!ocrResult.value) return
  ocrApplying.value = true
  try {
    const styleId = await createOrUpdateEstimatedStyle()
    if (styleId) {
      form.value.style_id = styleId
      await onStyleChange()
    }
    form.value.po_number = ocrResult.value.po_number || ''
    attachedImages.value = ocrResult.value.source_images || []
    if (ocrResult.value.colors?.length) {
      colorRows.splice(0, colorRows.length,
        ...ocrResult.value.colors.map(c => ({ colorName: c.color, pieces: c.pieces || 0 }))
      )
      syncMappings()
    }
    ocrDialogVisible.value = false
    ElMessage.success(t('ocr.applied'))
  } catch (e) {
    ElMessage.error(e.message)
  } finally {
    ocrApplying.value = false
  }
}

const refreshBaseData = async () => {
  const [styleList, fabricList, categories] = await Promise.all([
    stylesApi.list(),
    fabricsApi.list(),
    categoriesApi.tree()
  ])
  styles.value = styleList
  fabrics.value = fabricList
  catTree.value = categories
}

onMounted(async () => {
  await refreshBaseData()
})
</script>
