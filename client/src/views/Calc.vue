<template>
  <el-card shadow="never" style="max-width:820px">
    <template #header><b>用量计算</b></template>

    <el-form :model="form" :rules="rules" ref="formRef" label-width="90px">
      <el-form-item label="选择款式" prop="style_id">
        <el-select
          v-model="form.style_id" placeholder="请选择款式" filterable style="width:100%"
          @change="onStyleChange"
        >
          <el-option
            v-for="s in styles" :key="s.id"
            :label="`${s.name}${s.customer ? ' · '+s.customer : ''}`"
            :value="s.id"
          />
        </el-select>
      </el-form-item>
    </el-form>

    <div v-if="materials.length" style="margin-top:4px">
      <el-divider>填写各颜色件数</el-divider>

      <!-- 统一颜色件数输入 -->
      <div style="margin-bottom:20px">
        <div
          v-for="(row, i) in colorRows" :key="i"
          style="display:flex;gap:8px;align-items:center;margin-bottom:8px"
        >
          <el-select
            v-model="row.colorName" placeholder="选颜色" filterable allow-create
            style="width:160px" @change="syncMappings"
          >
            <el-option v-for="c in allColors" :key="c" :label="c" :value="c" />
          </el-select>
          <el-input-number
            v-model="row.pieces" :min="0" :precision="0" :step="10"
            style="width:130px" @change="syncMappings"
          />
          <span style="color:var(--color-text-secondary);font-size:13px">件</span>
          <el-button
            v-if="colorRows.length > 1"
            icon="Delete" size="small" type="danger" plain circle
            @click="removeColorRow(i)"
          />
        </div>
        <el-button size="small" link icon="Plus" @click="addColorRow">添加颜色</el-button>
      </div>

      <!-- 用量分析汇总 -->
      <el-divider>用量分析</el-divider>
      <div style="display:flex;flex-wrap:wrap;gap:10px;margin-bottom:16px">
        <div
          v-for="mat in materials" :key="mat.cat2_id"
          style="background:var(--color-bg-subtle);border:1px solid var(--color-border);border-radius:8px;padding:10px 14px;min-width:180px"
        >
          <div style="font-size:12px;color:var(--color-text-secondary);margin-bottom:4px">{{ mat.cat1_name }}/{{ mat.cat2_name }}</div>
          <div style="display:flex;align-items:baseline;gap:6px">
            <span style="font-size:20px;font-weight:700;color:var(--color-text-primary)">{{ totalRequired(mat) }}</span>
            <span style="font-size:12px;color:var(--color-text-tertiary)">米需求</span>
          </div>
          <div style="display:flex;align-items:center;gap:6px;margin-top:6px">
            <span style="font-size:12px;color:#6B7280">库存 {{ totalStock(mat) }} 米</span>
            <el-tag
              size="small"
              :type="totalStock(mat) >= totalRequired(mat) ? 'success' : 'danger'"
            >
              {{ totalStock(mat) >= totalRequired(mat) ? '充足' : '不足' }}
            </el-tag>
          </div>
        </div>
      </div>

      <el-divider>出库明细（自动计算）</el-divider>

      <!-- 每种面料的自动生成明细 -->
      <div v-for="mat in materials" :key="mat.cat2_id" style="margin-bottom:24px">
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:10px">
          <el-tag type="primary">{{ mat.cat1_name }}/{{ mat.cat2_name }}</el-tag>
          <span style="color:var(--color-text-secondary);font-size:13px">用量 {{ mat.usage_per_piece }} 米/件</span>
        </div>

        <div
          v-for="(sel, i) in fabricSelections[mat.cat2_id]"
          :key="i"
          style="display:flex;gap:8px;align-items:center;margin-bottom:6px;margin-left:16px"
        >
          <span style="width:60px;font-size:13px;color:var(--color-text-primary)">{{ colorRows[i]?.colorName || '-' }}</span>
          <span style="font-size:13px;color:var(--color-text-secondary);width:55px">{{ sel.pieces }} 件</span>
          <span style="font-size:13px;min-width:85px">
            = <b style="color:var(--color-primary)">{{ sel.quantity.toFixed(3) }}</b> 米
          </span>
          <el-select v-model="sel.fabric_id" placeholder="选面料" style="width:200px" filterable>
            <el-option
              v-for="f in mat.fabrics" :key="f.id"
              :label="`${f.color || '无颜色'}（${f.current_stock}米）`"
              :value="f.id"
            />
          </el-select>
          <el-tag
            v-if="sel.fabric_id && sel.quantity > 0"
            size="small"
            :type="(mat.fabrics.find(f=>f.id===sel.fabric_id)?.current_stock||0) >= sel.quantity ? 'success' : 'danger'"
          >
            {{ (mat.fabrics.find(f=>f.id===sel.fabric_id)?.current_stock||0) >= sel.quantity ? '充足' : '不足' }}
          </el-tag>
        </div>
      </div>

      <el-divider />
      <div style="display:flex;justify-content:space-between;align-items:center">
        <span style="color:var(--color-text-secondary);font-size:13px">共 {{ allItems.length }} 条出库明细</span>
        <el-button type="warning" @click="showDialog = true">一键出库</el-button>
      </div>
    </div>

    <div v-else-if="form.style_id && !loading" style="color:var(--color-text-tertiary);padding:20px;text-align:center">
      该款式未设置面料用量，请先在款式管理中配置
    </div>

    <!-- 出库确认弹窗（仅填 PO + 备注） -->
    <el-dialog v-model="showDialog" title="确认出库" width="400px">
      <el-form ref="deductFormRef" :model="deductForm" :rules="deductRules" label-width="70px">
        <el-form-item label="PO 号" prop="po_number">
          <el-input v-model="deductForm.po_number" placeholder="如：PO-2024-001" />
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="deductForm.note" placeholder="可选" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showDialog = false">取消</el-button>
        <el-button type="primary" :loading="deducting" @click="deduct">确认出库</el-button>
      </template>
    </el-dialog>
  </el-card>
</template>

<script setup>
import { ref, reactive, computed, watch, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { stylesApi, fabricsApi, stockApi } from '../api'

const styles = ref([])
const materials = ref([])
const loading = ref(false)
const form = ref({ style_id: null })
const rules = { style_id: [{ required: true, message: '请选择款式' }] }
const formRef = ref()

const showDialog = ref(false)
const deductForm = ref({ po_number: '', note: '' })
const deductRules = { po_number: [{ required: true, message: '请输入 PO 号' }] }
const deductFormRef = ref()
const deducting = ref(false)

// 统一颜色件数
const colorRows = reactive([{ colorName: null, pieces: 0 }])
const fabricSelections = reactive({})

const allColors = computed(() => {
  const set = new Set()
  for (const mat of materials.value) {
    for (const f of mat.fabrics) { if (f.color) set.add(f.color) }
  }
  return [...set]
})

const totalStock = (mat) =>
  parseFloat(mat.fabrics.reduce((s, f) => s + f.current_stock, 0).toFixed(3))

const totalRequired = (mat) => {
  const total = colorRows.reduce((s, row) => s + (row.pieces || 0), 0)
  return parseFloat((total * mat.usage_per_piece).toFixed(3))
}

const syncMappings = () => {
  for (const mat of materials.value) {
    fabricSelections[mat.cat2_id] = colorRows.map(row => {
      const pieces = row.pieces || 0
      const matched = mat.fabrics.find(f => f.color === row.colorName)
      return {
        fabric_id: matched?.id || null,
        pieces,
        quantity: parseFloat((pieces * mat.usage_per_piece).toFixed(3))
      }
    })
  }
}

watch(colorRows, syncMappings, { deep: true })

const addColorRow = () => colorRows.push({ colorName: null, pieces: 0 })
const removeColorRow = (i) => { colorRows.splice(i, 1); syncMappings() }

const allItems = computed(() =>
  Object.values(fabricSelections).flat().filter(r => r.fabric_id && r.quantity > 0)
)

const onStyleChange = async () => {
  if (!form.value.style_id) { materials.value = []; return }
  loading.value = true
  try {
    const style = await stylesApi.get(form.value.style_id)
    const allFabrics = await fabricsApi.list()
    materials.value = style.materials.map(m => ({
      cat2_id: m.cat2_id,
      cat2_name: m.cat2_name,
      cat1_name: m.cat1_name,
      usage_per_piece: m.usage_per_piece,
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
  if (!items.length) { ElMessage.warning('请先填写颜色件数'); return }
  for (const mat of materials.value) {
    for (const sel of fabricSelections[mat.cat2_id] || []) {
      if (sel.pieces > 0 && !sel.fabric_id) {
        ElMessage.error(`「${mat.cat2_name}」有颜色未匹配到面料，请手动选择`)
        return
      }
    }
  }
  deducting.value = true
  try {
    await stockApi.outBatch({
      items,
      style_id: form.value.style_id,
      po_number: deductForm.value.po_number,
      note: deductForm.value.note
    })
    ElMessage.success('出库成功')
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
