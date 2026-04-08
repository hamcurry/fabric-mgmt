<template>
  <el-card shadow="never" style="max-width:560px">
    <template #header>
      <div style="display:flex;justify-content:space-between;align-items:center">
        <b>{{ $t('stock_in.title') }}</b>
        <el-radio-group v-model="mode" size="small">
          <el-radio-button value="existing">{{ $t('stock_in.existing_fabric') }}</el-radio-button>
          <el-radio-button value="new">{{ $t('stock_in.new_and_stock') }}</el-radio-button>
        </el-radio-group>
      </div>
    </template>

    <el-form v-if="mode === 'existing'" :model="form" :rules="rules" ref="formRef" label-width="90px">
      <el-form-item :label="$t('common.fabric')" prop="fabric_id">
        <el-select v-model="form.fabric_id" :placeholder="$t('stock_in.select_fabric')" filterable style="width:100%">
          <el-option
            v-for="f in fabrics" :key="f.id"
            :label="`${f.cat1_name}/${f.cat2_name}${f.color ? '·'+f.color : ''} （${f.current_stock}${f.unit}）`"
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
        <el-button type="success" :loading="saving" @click="submitExisting">{{ $t('stock_in.confirm_btn') }}</el-button>
        <el-button @click="resetExisting">{{ $t('stock_in.reset_btn') }}</el-button>
      </el-form-item>
    </el-form>

    <el-form v-else :model="newForm" :rules="newRules" ref="newFormRef" label-width="90px">
      <el-form-item :label="$t('stock_in.cat1')" prop="cat1_id">
        <el-select v-model="newForm.cat1_id" :placeholder="$t('stock_in.select_cat1')" style="width:100%" @change="newForm.cat2_id = null">
          <el-option v-for="c in cat1List" :key="c.id" :label="c.name" :value="c.id" />
        </el-select>
      </el-form-item>
      <el-form-item :label="$t('stock_in.cat2')" prop="cat2_id">
        <el-select v-model="newForm.cat2_id" :placeholder="$t('stock_in.select_cat2')" style="width:100%" :disabled="!newForm.cat1_id">
          <el-option
            v-for="c in cat2Options" :key="c.id" :label="c.name" :value="c.id"
          />
        </el-select>
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
        <el-button type="success" :loading="saving" @click="submitNew">{{ $t('stock_in.new_and_stock_btn') }}</el-button>
        <el-button @click="resetNew">{{ $t('stock_in.reset_btn') }}</el-button>
      </el-form-item>
    </el-form>
  </el-card>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { ElMessage } from 'element-plus'
import { fabricsApi, categoriesApi, stockApi } from '../api'

const { t } = useI18n()

const mode = ref('existing')
const fabrics = ref([])
const catTree = ref([])
const saving = ref(false)

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
