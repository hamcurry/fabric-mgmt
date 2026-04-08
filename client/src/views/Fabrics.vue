<template>
  <div>
    <!-- 操作栏 -->
    <div style="display:flex;gap:10px;margin-bottom:16px;flex-wrap:wrap">
      <el-button type="primary" icon="Plus" @click="openFabricDialog()">新增面料</el-button>
      <el-button icon="Setting" @click="catDialogVisible = true">管理类目</el-button>
      <el-button icon="Refresh" @click="loadTree">刷新</el-button>
    </div>

    <!-- 三级树状展示 -->
    <div v-loading="loading">
      <div v-if="!tree.length" style="color:var(--color-text-tertiary);padding:40px;text-align:center">暂无数据，请先管理类目再新增面料</div>

      <!-- 一级类目 -->
      <el-card
        v-for="cat1 in tree"
        :key="cat1.id"
        shadow="never"
        style="margin-bottom:12px"
      >
        <template #header>
          <div style="display:flex;align-items:center;gap:8px">
            <el-tag type="primary" size="large" style="font-size:14px;font-weight:600">{{ cat1.name }}</el-tag>
            <span style="color:var(--color-text-secondary);font-size:13px">{{ countFabrics(cat1) }} 种面料</span>
          </div>
        </template>

        <!-- 二级类目 -->
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
            >添加颜色</el-button>
          </div>

          <!-- 三级：颜色 + 库存 -->
          <el-table :data="cat2.fabrics" size="small" border style="margin-left:16px">
            <el-table-column prop="color" label="颜色" min-width="100">
              <template #default="{ row }">
                <span v-if="row.color">{{ row.color }}</span>
                <span v-else style="color:var(--color-text-tertiary)">未指定颜色</span>
              </template>
            </el-table-column>
            <el-table-column label="当前库存" width="130">
              <template #default="{ row }">
                <el-tag :type="row.is_alert ? 'danger' : 'success'">
                  {{ row.current_stock }} {{ row.unit }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="预警阈值" width="110">
              <template #default="{ row }">{{ row.alert_threshold }} {{ row.unit }}</template>
            </el-table-column>
            <el-table-column prop="unit" label="单位" width="70" />
            <el-table-column prop="created_at" label="创建时间" width="155" />
            <el-table-column label="操作" width="140" fixed="right">
              <template #default="{ row }">
                <el-button size="small" @click="openFabricDialog(row, cat1.id, cat2.id)">编辑</el-button>
                <el-popconfirm title="确认删除？" @confirm="removeFabric(row.id)">
                  <template #reference>
                    <el-button size="small" type="danger">删除</el-button>
                  </template>
                </el-popconfirm>
              </template>
            </el-table-column>
          </el-table>
        </div>

        <div v-if="!cat1.children.length" style="color:var(--color-text-tertiary);font-size:13px;padding:8px 0">
          该类目下暂无二级分类，请在「管理类目」中添加
        </div>
      </el-card>
    </div>

    <!-- 新增/编辑面料弹窗 -->
    <el-dialog v-model="fabricDialogVisible" :title="fabricForm.id ? '编辑面料' : '新增面料'" width="440px">
      <el-form :model="fabricForm" :rules="fabricRules" ref="fabricFormRef" label-width="90px">
        <el-form-item label="一级类目" prop="cat1_id">
          <el-select v-model="fabricForm.cat1_id" placeholder="选择大类" style="width:100%" @change="onCat1Change">
            <el-option v-for="c1 in catTree" :key="c1.id" :label="c1.name" :value="c1.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="二级类目" prop="cat2_id">
          <el-select v-model="fabricForm.cat2_id" placeholder="选择小类" style="width:100%" :disabled="!fabricForm.cat1_id">
            <el-option
              v-for="c2 in filteredCat2"
              :key="c2.id" :label="c2.name" :value="c2.id"
            />
          </el-select>
          <el-button
            size="small" link type="primary" style="margin-top:4px"
            @click="quickAddCat2"
          >+ 新建"{{ fabricForm.cat1_id ? getCat1Name(fabricForm.cat1_id) : "" }}"下的小类</el-button>
        </el-form-item>
        <el-form-item label="颜色">
          <el-input v-model="fabricForm.color" placeholder="如：黑色、米白、#123456（可留空）" />
        </el-form-item>
        <el-form-item label="单位">
          <el-select v-model="fabricForm.unit" style="width:100%">
            <el-option label="米" value="米" />
            <el-option label="码" value="码" />
            <el-option label="千克" value="千克" />
          </el-select>
        </el-form-item>
        <el-form-item label="当前库存" prop="current_stock">
          <el-input-number v-model="fabricForm.current_stock" :min="0" :precision="2" style="width:100%" />
        </el-form-item>
        <el-form-item label="预警阈值">
          <el-input-number v-model="fabricForm.alert_threshold" :min="0" :precision="2" style="width:100%" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="fabricDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="saveFabric">保存</el-button>
      </template>
    </el-dialog>

    <!-- 类目管理弹窗 -->
    <el-dialog v-model="catDialogVisible" title="管理类目" width="560px">
      <div style="display:flex;gap:16px">
        <!-- 一级类目 -->
        <div style="flex:1;border-right:1px solid #f0f0f0;padding-right:16px">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px">
            <b>一级类目</b>
            <el-button size="small" icon="Plus" @click="addCat1">新增</el-button>
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

        <!-- 二级类目 -->
        <div style="flex:1">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px">
            <b>二级类目 <span style="color:#888;font-weight:normal;font-size:12px">（选左侧查看）</span></b>
            <el-button size="small" icon="Plus" :disabled="!selectedCat1Id" @click="addCat2">新增</el-button>
          </div>
          <div v-if="!selectedCat1Id" style="color:var(--color-text-tertiary);font-size:13px">请先选择一级类目</div>
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
        <el-button @click="catDialogVisible = false">关闭</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { fabricsApi, categoriesApi } from '../api'

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
const fabricRules = {
  cat1_id: [{ required: true, message: '请选择一级类目' }],
  cat2_id: [{ required: true, message: '请选择二级类目' }],
  current_stock: [{ required: true, message: '请填写库存' }]
}

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
    // 编辑模式：row 来自 tree，需要提供 cat1_id / cat2_id
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
    ElMessage.success('保存成功')
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
    ElMessage.success('删除成功')
    loadTree()
  } catch (e) {
    ElMessage.error(e.message)
  }
}

// 快速新建二级类目（在面料弹窗内）
const quickAddCat2 = async () => {
  if (!fabricForm.value.cat1_id) return
  const { value } = await ElMessageBox.prompt('请输入二级类目名称（如：色丁、真丝）', '新建小类', {
    confirmButtonText: '确定', cancelButtonText: '取消',
    inputPattern: /\S+/, inputErrorMessage: '名称不能为空'
  })
  try {
    const r = await categoriesApi.createCat2({ cat1_id: fabricForm.value.cat1_id, name: value.trim() })
    await loadCatTree()
    fabricForm.value.cat2_id = r.id
    ElMessage.success('创建成功')
  } catch (e) {
    ElMessage.error(e.message)
  }
}

// 类目管理操作
const addCat1 = async () => {
  const { value } = await ElMessageBox.prompt('请输入一级类目名称（如：面布、里布）', '新增一级类目', {
    confirmButtonText: '确定', cancelButtonText: '取消',
    inputPattern: /\S+/, inputErrorMessage: '名称不能为空'
  })
  try {
    await categoriesApi.createCat1({ name: value.trim() })
    loadCatTree(); loadTree()
    ElMessage.success('创建成功')
  } catch (e) { ElMessage.error(e.message) }
}
const editCat1 = async (c1) => {
  const { value } = await ElMessageBox.prompt('修改名称', '编辑一级类目', {
    confirmButtonText: '确定', cancelButtonText: '取消',
    inputValue: c1.name
  })
  await categoriesApi.updateCat1(c1.id, { name: value.trim() })
  loadCatTree(); loadTree()
}
const delCat1 = async (id) => {
  await ElMessageBox.confirm('删除一级类目将同时删除其下所有二级类目（面料记录需先手动删除）', '确认删除', { type: 'warning' })
  try {
    await categoriesApi.removeCat1(id)
    selectedCat1Id.value = null
    loadCatTree(); loadTree()
    ElMessage.success('已删除')
  } catch (e) { ElMessage.error(e.message) }
}
const addCat2 = async () => {
  const { value } = await ElMessageBox.prompt('请输入二级类目名称（如：色丁、棉布）', '新增二级类目', {
    confirmButtonText: '确定', cancelButtonText: '取消',
    inputPattern: /\S+/, inputErrorMessage: '名称不能为空'
  })
  await categoriesApi.createCat2({ cat1_id: selectedCat1Id.value, name: value.trim() })
  loadCatTree(); loadTree()
}
const editCat2 = async (c2) => {
  const { value } = await ElMessageBox.prompt('修改名称', '编辑二级类目', {
    confirmButtonText: '确定', cancelButtonText: '取消',
    inputValue: c2.name
  })
  await categoriesApi.updateCat2(c2.id, { name: value.trim() })
  loadCatTree(); loadTree()
}
const delCat2 = async (id) => {
  await ElMessageBox.confirm('确认删除该二级类目吗？', '确认', { type: 'warning' })
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
