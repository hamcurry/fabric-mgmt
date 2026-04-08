<template>
  <div>
    <div style="display:flex;gap:10px;margin-bottom:16px;flex-wrap:wrap">
      <el-button type="primary" icon="Plus" @click="openFabricDialog()">{{ $t('fabrics.add_fabric') }}</el-button>
      <el-button icon="Setting" @click="catDialogVisible = true">{{ $t('fabrics.manage_categories') }}</el-button>
      <el-button icon="Refresh" @click="loadTree">{{ $t('common.refresh') }}</el-button>
    </div>

    <div v-loading="loading">
      <div v-if="!tree.length" style="color:var(--color-text-tertiary);padding:40px;text-align:center">{{ $t('fabrics.no_data') }}</div>

      <el-card
        v-for="cat1 in tree"
        :key="cat1.id"
        shadow="never"
        style="margin-bottom:12px"
      >
        <template #header>
          <div style="display:flex;align-items:center;gap:8px">
            <el-tag type="primary" size="large" style="font-size:14px;font-weight:600">{{ cat1.name }}</el-tag>
            <span style="color:var(--color-text-secondary);font-size:13px">{{ $t('fabrics.fabric_count', { n: countFabrics(cat1) }) }}</span>
          </div>
        </template>

        <div
          v-for="cat2 in cat1.children"
          :key="cat2.id"
          style="margin-bottom:16px"
        >
          <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px">
            <el-tag type="info" size="small">{{ cat2.name }}</el-tag>
            <el-button
              size="small" icon="Plus" link
              @click="openFabricDialog({ cat1_id: cat1.id, cat2_id: cat2.id })"
            >{{ $t('fabrics.add_color') }}</el-button>
          </div>

          <el-table :data="cat2.fabrics" size="small" border style="margin-left:16px">
            <el-table-column prop="color" :label="$t('common.color')" min-width="100">
              <template #default="{ row }">
                <span v-if="row.color">{{ row.color }}</span>
                <span v-else style="color:var(--color-text-tertiary)">{{ $t('fabrics.unspecified_color') }}</span>
              </template>
            </el-table-column>
            <el-table-column :label="$t('fabrics.current_stock')" width="130">
              <template #default="{ row }">
                <el-tag :type="row.is_alert ? 'danger' : 'success'">
                  {{ row.current_stock }} {{ row.unit }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column :label="$t('fabrics.alert_threshold')" width="110">
              <template #default="{ row }">{{ row.alert_threshold }} {{ row.unit }}</template>
            </el-table-column>
            <el-table-column prop="unit" :label="$t('common.unit')" width="70" />
            <el-table-column prop="created_at" :label="$t('common.created_at')" width="155" />
            <el-table-column :label="$t('common.operation')" width="140" fixed="right">
              <template #default="{ row }">
                <el-button size="small" @click="openFabricDialog(row, cat1.id, cat2.id)">{{ $t('common.edit') }}</el-button>
                <el-popconfirm :title="$t('fabrics.confirm_delete_fabric')" @confirm="removeFabric(row.id)">
                  <template #reference>
                    <el-button size="small" type="danger">{{ $t('common.delete') }}</el-button>
                  </template>
                </el-popconfirm>
              </template>
            </el-table-column>
          </el-table>
        </div>

        <div v-if="!cat1.children.length" style="color:var(--color-text-tertiary);font-size:13px;padding:8px 0">
          {{ $t('fabrics.no_sub_cats') }}
        </div>
      </el-card>
    </div>

    <!-- 新增/编辑面料弹窗 -->
    <el-dialog v-model="fabricDialogVisible" :title="fabricForm.id ? $t('fabrics.edit_fabric') : $t('fabrics.new_fabric')" width="440px">
      <el-form :model="fabricForm" :rules="fabricRules" ref="fabricFormRef" label-width="100px">
        <el-form-item :label="$t('fabrics.cat1')" prop="cat1_id">
          <el-select v-model="fabricForm.cat1_id" :placeholder="$t('fabrics.select_cat1')" style="width:100%" @change="onCat1Change">
            <el-option v-for="c1 in catTree" :key="c1.id" :label="c1.name" :value="c1.id" />
          </el-select>
        </el-form-item>
        <el-form-item :label="$t('fabrics.cat2')" prop="cat2_id">
          <el-select v-model="fabricForm.cat2_id" :placeholder="$t('fabrics.select_cat2')" style="width:100%" :disabled="!fabricForm.cat1_id">
            <el-option
              v-for="c2 in filteredCat2"
              :key="c2.id" :label="c2.name" :value="c2.id"
            />
          </el-select>
          <el-button
            size="small" link type="primary" style="margin-top:4px"
            @click="quickAddCat2"
          >{{ $t('fabrics.add_sub_cat', { name: fabricForm.cat1_id ? getCat1Name(fabricForm.cat1_id) : '' }) }}</el-button>
        </el-form-item>
        <el-form-item :label="$t('common.color')">
          <el-input v-model="fabricForm.color" :placeholder="$t('fabrics.color_placeholder')" />
        </el-form-item>
        <el-form-item :label="$t('common.unit')">
          <el-select v-model="fabricForm.unit" style="width:100%">
            <el-option :label="$t('common.meter')" value="米" />
            <el-option :label="$t('common.yard')" value="码" />
            <el-option :label="$t('common.kg')" value="千克" />
          </el-select>
        </el-form-item>
        <el-form-item :label="$t('fabrics.current_stock')" prop="current_stock">
          <el-input-number v-model="fabricForm.current_stock" :min="0" :precision="2" style="width:100%" />
        </el-form-item>
        <el-form-item :label="$t('fabrics.alert_threshold')">
          <el-input-number v-model="fabricForm.alert_threshold" :min="0" :precision="2" style="width:100%" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="fabricDialogVisible = false">{{ $t('common.cancel') }}</el-button>
        <el-button type="primary" :loading="saving" @click="saveFabric">{{ $t('common.save') }}</el-button>
      </template>
    </el-dialog>

    <!-- 类目管理弹窗 -->
    <el-dialog v-model="catDialogVisible" :title="$t('fabrics.manage_cats_title')" width="560px">
      <div style="display:flex;gap:16px">
        <div style="flex:1;border-right:1px solid #f0f0f0;padding-right:16px">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px">
            <b>{{ $t('fabrics.cat1_section') }}</b>
            <el-button size="small" icon="Plus" @click="addCat1">{{ $t('common.add') }}</el-button>
          </div>
          <div
            v-for="c1 in catTree"
            :key="c1.id"
            style="display:flex;align-items:center;gap:6px;padding:4px 0;cursor:pointer"
            :style="selectedCat1Id === c1.id ? 'color:#409eff' : ''"
            @click="selectedCat1Id = c1.id"
          >
            <span style="flex:1">{{ c1.name }}</span>
            <el-button size="small" icon="Edit" link @click.stop="editCat1(c1)" />
            <el-button size="small" icon="Delete" link type="danger" @click.stop="delCat1(c1.id)" />
          </div>
        </div>

        <div style="flex:1">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px">
            <b>{{ $t('fabrics.cat2_section') }} <span style="color:#888;font-weight:normal;font-size:12px">{{ $t('fabrics.cat2_hint') }}</span></b>
            <el-button size="small" icon="Plus" :disabled="!selectedCat1Id" @click="addCat2">{{ $t('common.add') }}</el-button>
          </div>
          <div v-if="!selectedCat1Id" style="color:var(--color-text-tertiary);font-size:13px">{{ $t('fabrics.select_cat1_first') }}</div>
          <div
            v-for="c2 in filteredCatTree2"
            :key="c2.id"
            style="display:flex;align-items:center;gap:6px;padding:4px 0"
          >
            <span style="flex:1">{{ c2.name }}</span>
            <el-button size="small" icon="Edit" link @click="editCat2(c2)" />
            <el-button size="small" icon="Delete" link type="danger" @click="delCat2(c2.id)" />
          </div>
        </div>
      </div>
      <template #footer>
        <el-button @click="catDialogVisible = false">{{ $t('common.close') }}</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { ElMessage, ElMessageBox } from 'element-plus'
import { fabricsApi, categoriesApi } from '../api'

const { t } = useI18n()

const tree = ref([])
const catTree = ref([])
const loading = ref(false)
const saving = ref(false)
const fabricDialogVisible = ref(false)
const catDialogVisible = ref(false)
const fabricFormRef = ref()
const selectedCat1Id = ref(null)

const defaultFabricForm = () => ({
  id: null, cat1_id: null, cat2_id: null, color: '', unit: '米', current_stock: 0, alert_threshold: 20
})
const fabricForm = ref(defaultFabricForm())
const fabricRules = computed(() => ({
  cat1_id: [{ required: true, message: t('fabrics.val_cat1') }],
  cat2_id: [{ required: true, message: t('fabrics.val_cat2') }],
  current_stock: [{ required: true, message: t('fabrics.val_stock') }]
}))

const filteredCat2 = computed(() =>
  fabricForm.value.cat1_id
    ? (catTree.value.find(c => c.id === fabricForm.value.cat1_id)?.children || [])
    : []
)
const filteredCatTree2 = computed(() =>
  selectedCat1Id.value
    ? (catTree.value.find(c => c.id === selectedCat1Id.value)?.children || [])
    : []
)

const getCat1Name = (id) => catTree.value.find(c => c.id === id)?.name || ''
const countFabrics = (cat1) => cat1.children.reduce((s, c2) => s + c2.fabrics.length, 0)

const loadTree = async () => {
  loading.value = true
  tree.value = await fabricsApi.tree().finally(() => loading.value = false)
}
const loadCatTree = async () => {
  catTree.value = await categoriesApi.tree()
}

const onCat1Change = () => { fabricForm.value.cat2_id = null }

const openFabricDialog = (row = null, cat1_id = null, cat2_id = null) => {
  if (row?.id) {
    fabricForm.value = {
      id: row.id,
      cat1_id: cat1_id || row.cat1_id || null,
      cat2_id: cat2_id || row.cat2_id || null,
      color: row.color,
      unit: row.unit,
      current_stock: row.current_stock,
      alert_threshold: row.alert_threshold
    }
  } else {
    fabricForm.value = {
      ...defaultFabricForm(),
      cat1_id: row?.cat1_id || null,
      cat2_id: row?.cat2_id || null
    }
  }
  fabricDialogVisible.value = true
}

const saveFabric = async () => {
  await fabricFormRef.value.validate()
  saving.value = true
  try {
    const payload = {
      cat2_id: fabricForm.value.cat2_id,
      color: fabricForm.value.color,
      unit: fabricForm.value.unit,
      current_stock: fabricForm.value.current_stock,
      alert_threshold: fabricForm.value.alert_threshold
    }
    if (fabricForm.value.id) {
      await fabricsApi.update(fabricForm.value.id, payload)
    } else {
      await fabricsApi.create(payload)
    }
    ElMessage.success(t('common.save_success'))
    fabricDialogVisible.value = false
    loadTree()
  } catch (e) {
    ElMessage.error(e.message)
  } finally {
    saving.value = false
  }
}

const removeFabric = async (id) => {
  try {
    await fabricsApi.remove(id)
    ElMessage.success(t('common.delete_success'))
    loadTree()
  } catch (e) {
    ElMessage.error(e.message)
  }
}

const quickAddCat2 = async () => {
  if (!fabricForm.value.cat1_id) return
  const { value } = await ElMessageBox.prompt(t('fabrics.new_sub_cat_prompt'), t('fabrics.new_sub_cat_title'), {
    confirmButtonText: t('common.confirm'), cancelButtonText: t('common.cancel'),
    inputPattern: /\S+/, inputErrorMessage: t('common.name_required')
  })
  try {
    const r = await categoriesApi.createCat2({ cat1_id: fabricForm.value.cat1_id, name: value.trim() })
    await loadCatTree()
    fabricForm.value.cat2_id = r.id
    ElMessage.success(t('common.create_success'))
  } catch (e) {
    ElMessage.error(e.message)
  }
}

const addCat1 = async () => {
  const { value } = await ElMessageBox.prompt(t('fabrics.new_cat1_prompt'), t('fabrics.new_cat1_title'), {
    confirmButtonText: t('common.confirm'), cancelButtonText: t('common.cancel'),
    inputPattern: /\S+/, inputErrorMessage: t('common.name_required')
  })
  try {
    await categoriesApi.createCat1({ name: value.trim() })
    loadCatTree(); loadTree()
    ElMessage.success(t('common.create_success'))
  } catch (e) { ElMessage.error(e.message) }
}
const editCat1 = async (c1) => {
  const { value } = await ElMessageBox.prompt(t('fabrics.edit_name_prompt'), t('fabrics.edit_cat1_title'), {
    confirmButtonText: t('common.confirm'), cancelButtonText: t('common.cancel'),
    inputValue: c1.name
  })
  await categoriesApi.updateCat1(c1.id, { name: value.trim() })
  loadCatTree(); loadTree()
}
const delCat1 = async (id) => {
  await ElMessageBox.confirm(t('fabrics.confirm_del_cat1'), t('fabrics.confirm_del_cat1_title'), { type: 'warning' })
  try {
    await categoriesApi.removeCat1(id)
    selectedCat1Id.value = null
    loadCatTree(); loadTree()
    ElMessage.success(t('common.deleted'))
  } catch (e) { ElMessage.error(e.message) }
}
const addCat2 = async () => {
  const { value } = await ElMessageBox.prompt(t('fabrics.new_cat2_prompt'), t('fabrics.new_cat2_title'), {
    confirmButtonText: t('common.confirm'), cancelButtonText: t('common.cancel'),
    inputPattern: /\S+/, inputErrorMessage: t('common.name_required')
  })
  await categoriesApi.createCat2({ cat1_id: selectedCat1Id.value, name: value.trim() })
  loadCatTree(); loadTree()
}
const editCat2 = async (c2) => {
  const { value } = await ElMessageBox.prompt(t('fabrics.edit_name_prompt'), t('fabrics.edit_cat2_title'), {
    confirmButtonText: t('common.confirm'), cancelButtonText: t('common.cancel'),
    inputValue: c2.name
  })
  await categoriesApi.updateCat2(c2.id, { name: value.trim() })
  loadCatTree(); loadTree()
}
const delCat2 = async (id) => {
  await ElMessageBox.confirm(t('fabrics.confirm_del_cat2'), t('common.confirm'), { type: 'warning' })
  try {
    await categoriesApi.removeCat2(id)
    loadCatTree(); loadTree()
  } catch (e) { ElMessage.error(e.message) }
}

onMounted(() => {
  loadTree()
  loadCatTree()
})
</script>
