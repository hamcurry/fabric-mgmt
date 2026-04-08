<template>
  <el-card shadow="never" style="max-width:560px">
    <template #header>
      <div style="display:flex;justify-content:space-between;align-items:center">
        <b>面料入库</b>
        <el-radio-group v-model="mode" size="small">
          <el-radio-button value="existing">选择现有面料</el-radio-button>
          <el-radio-button value="new">新建并入库</el-radio-button>
        </el-radio-group>
      </div>
    </template>

    <!-- 模式一：现有面料入库 -->
    <el-form v-if="mode === 'existing'" :model="form" :rules="rules" ref="formRef" label-width="90px">
      <el-form-item label="面料" prop="fabric_id">
        <el-select v-model="form.fabric_id" placeholder="选择面料" filterable style="width:100%">
          <el-option
            v-for="f in fabrics" :key="f.id"
            :label="`${f.cat1_name}/${f.cat2_name}${f.color ? '·'+f.color : ''} （${f.current_stock}${f.unit}）`"
            :value="f.id"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="入库数量" prop="quantity">
        <div style="display:flex;align-items:center;gap:8px;width:100%">
          <el-input-number v-model="form.quantity" :min="0.01" :precision="2" style="flex:1" />
          <span style="color:var(--color-text-secondary);font-size:13px">{{ selectedFabric?.unit || '米' }}</span>
        </div>
      </el-form-item>
      <el-form-item label="备注">
        <el-input v-model="form.note" placeholder="可选，如：供应商、批次" />
      </el-form-item>
      <el-form-item>
        <el-button type="success" :loading="saving" @click="submitExisting">确认入库</el-button>
        <el-button @click="resetExisting">重置</el-button>
      </el-form-item>
    </el-form>

    <!-- 模式二：新建面料并入库 -->
    <el-form v-else :model="newForm" :rules="newRules" ref="newFormRef" label-width="90px">
      <el-form-item label="一级类目" prop="cat1_id">
        <el-select v-model="newForm.cat1_id" placeholder="选择类目" style="width:100%" @change="newForm.cat2_id = null">
          <el-option v-for="c in cat1List" :key="c.id" :label="c.name" :value="c.id" />
        </el-select>
      </el-form-item>
      <el-form-item label="二级类目" prop="cat2_id">
        <el-select v-model="newForm.cat2_id" placeholder="选择小类" style="width:100%" :disabled="!newForm.cat1_id">
          <el-option
            v-for="c in cat2Options" :key="c.id" :label="c.name" :value="c.id"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="颜色">
        <el-input v-model="newForm.color" placeholder="如：黑色（可留空）" />
      </el-form-item>
      <el-form-item label="入库数量" prop="quantity">
        <div style="display:flex;align-items:center;gap:8px;width:100%">
          <el-input-number v-model="newForm.quantity" :min="0.01" :precision="2" style="flex:1" />
          <span style="color:var(--color-text-secondary);font-size:13px">米</span>
        </div>
      </el-form-item>
      <el-form-item label="预警阈值">
        <div style="display:flex;align-items:center;gap:8px;width:100%">
          <el-input-number v-model="newForm.alert_threshold" :min="0" :precision="2" style="flex:1" />
          <span style="color:var(--color-text-secondary);font-size:13px">米</span>
        </div>
      </el-form-item>
      <el-form-item label="备注">
        <el-input v-model="newForm.note" placeholder="可选" />
      </el-form-item>
      <el-form-item>
        <el-button type="success" :loading="saving" @click="submitNew">新建并入库</el-button>
        <el-button @click="resetNew">重置</el-button>
      </el-form-item>
    </el-form>
  </el-card>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { fabricsApi, categoriesApi, stockApi } from '../api'

const mode = ref('existing')
const fabrics = ref([])
const catTree = ref([])
const saving = ref(false)

// 现有面料模式
const formRef = ref()
const form = ref({ fabric_id: null, quantity: 1, note: '' })
const rules = {
  fabric_id: [{ required: true, message: '请选择面料' }],
  quantity: [{ required: true, message: '请输入数量' }]
}
const selectedFabric = computed(() => fabrics.value.find(f => f.id === form.value.fabric_id))

// 新建模式
const newFormRef = ref()
const newForm = ref({ cat1_id: null, cat2_id: null, color: '', quantity: 1, alert_threshold: 20, note: '' })
const newRules = {
  cat1_id: [{ required: true, message: '请选择一级类目' }],
  cat2_id: [{ required: true, message: '请选择二级类目' }],
  quantity: [{ required: true, message: '请输入入库数量' }]
}

const cat1List = computed(() => catTree.value)
const cat2Options = computed(() =>
  catTree.value.find(c => c.id === newForm.value.cat1_id)?.children || []
)

const submitExisting = async () => {
  await formRef.value.validate()
  saving.value = true
  try {
    await stockApi.in(form.value)
    ElMessage.success('入库成功')
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
    // 1. 创建面料（初始库存为0，通过入库写入）
    const created = await fabricsApi.create({
      cat2_id: newForm.value.cat2_id,
      color: newForm.value.color || '',
      unit: '米',
      current_stock: 0,
      alert_threshold: newForm.value.alert_threshold
    })
    // 2. 入库
    await stockApi.in({ fabric_id: created.id, quantity: newForm.value.quantity, note: newForm.value.note })
    ElMessage.success('面料已创建并入库')
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
