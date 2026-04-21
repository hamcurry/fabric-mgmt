<template>
  <div>
    <!-- Toolbar -->
    <div class="fabrics-toolbar">
      <div style="display:flex;gap:8px;flex-wrap:wrap">
        <el-button v-if="auth.canWrite.value" type="primary" icon="Plus" @click="openFabricDialog()">{{ $t('fabrics.add_fabric') }}</el-button>
        <el-button v-if="auth.canWrite.value" icon="Setting" @click="catDialogVisible = true">{{ $t('fabrics.manage_categories') }}</el-button>
        <el-button icon="Refresh" @click="loadTree">{{ $t('common.refresh') }}</el-button>
      </div>
      <el-input
        v-model="searchQuery"
        :placeholder="$t('common.color') + '...'"
        prefix-icon="Search"
        clearable
        style="width:200px"
      />
    </div>

    <div v-loading="loading">
      <div v-if="!tree.length" style="color:var(--color-text-tertiary);padding:40px;text-align:center">{{ $t('fabrics.no_data') }}</div>

      <template v-else>
        <!-- Cat1 pill tabs -->
        <div class="cat1-tabs">
          <button
            v-for="cat1 in tree"
            :key="cat1.id"
            class="cat1-tab"
            :class="{ active: activeCat1Id === cat1.id }"
            @click="activeCat1Id = cat1.id; activeCat2Id = null"
          >{{ cat1.name }}</button>
        </div>

        <template v-if="activeCat1Node">
          <!-- Cat2 chip filter -->
          <div class="cat2-chips">
            <span
              class="cat2-chip"
              :class="{ active: activeCat2Id === null }"
              @click="activeCat2Id = null"
            >全部</span>
            <span
              v-for="cat2 in activeCat1Node.children"
              :key="cat2.id"
              class="cat2-chip"
              :class="{ active: activeCat2Id === cat2.id }"
              @click="activeCat2Id = cat2.id"
            >{{ cat2.name }}</span>
            <el-button
              v-if="auth.canWrite.value"
              size="small" icon="Plus" link
              @click="openFabricDialog({ cat1_id: activeCat1Node.id })"
            >{{ $t('fabrics.add_color') }}</el-button>
          </div>

          <!-- Fabric list -->
          <div v-for="cat2 in visibleCat2" :key="cat2.id" style="margin-bottom:16px">
            <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px">
              <el-tag type="info" size="small">{{ cat2.name }}</el-tag>
              <el-button
                v-if="auth.canWrite.value"
                size="small" icon="Plus" link
                @click="openFabricDialog({ cat1_id: activeCat1Node.id, cat2_id: cat2.id })"
              >{{ $t('fabrics.add_color') }}</el-button>
            </div>

            <el-table class="fabric-desktop-table" :data="cat2.fabrics" size="small" border style="margin-left:16px">
              <el-table-column width="70">
                <template #default="{ row }">
                  <ImageStrip
                    v-if="(row.images||[]).length"
                    :images="row.images"
                    :size="44"
                    :max-visible="1"
                  />
                  <div v-else style="width:44px;height:44px;border-radius:6px;background:var(--color-bg-subtle);display:flex;align-items:center;justify-content:center">
                    <el-icon style="color:#ccc"><Picture /></el-icon>
                  </div>
                </template>
              </el-table-column>
              <el-table-column prop="color" :label="$t('common.color')" min-width="100">
                <template #default="{ row }">
                  <span v-if="row.color">{{ row.color }}</span>
                  <span v-else style="color:var(--color-text-tertiary)">{{ $t('fabrics.unspecified_color') }}</span>
                </template>
              </el-table-column>
              <el-table-column :label="$t('fabrics.current_stock')" width="140">
                <template #default="{ row }">
                  <el-tag :type="row.is_alert ? 'danger' : 'success'">
                    <el-icon style="vertical-align:-2px;margin-right:2px">
                      <component :is="row.is_alert ? 'WarningFilled' : 'CircleCheckFilled'" />
                    </el-icon>
                    {{ row.current_stock }} {{ row.unit }}
                  </el-tag>
                </template>
              </el-table-column>
              <el-table-column :label="$t('fabrics.alert_threshold')" width="110">
                <template #default="{ row }">{{ row.alert_threshold }} {{ row.unit }}</template>
              </el-table-column>
              <el-table-column prop="unit" :label="$t('common.unit')" width="70" />
              <el-table-column prop="created_at" :label="$t('common.created_at')" width="155" />
              <el-table-column v-if="auth.canWrite.value" :label="$t('common.operation')" width="60" fixed="right">
                <template #default="{ row }">
                  <el-dropdown trigger="click">
                    <el-button size="small" circle icon="MoreFilled" />
                    <template #dropdown>
                      <el-dropdown-menu>
                        <el-dropdown-item @click="openFabricDialog(row, activeCat1Node.id, cat2.id)">{{ $t('common.edit') }}</el-dropdown-item>
                        <el-dropdown-item class="danger-item" @click="confirmRemoveFabric(row.id)">{{ $t('common.delete') }}</el-dropdown-item>
                      </el-dropdown-menu>
                    </template>
                  </el-dropdown>
                </template>
              </el-table-column>
            </el-table>

            <!-- Mobile cards -->
            <div class="fabric-mobile-cards">
              <div v-for="row in cat2.fabrics" :key="row.id" class="fabric-card">
                <div class="fabric-thumb-wrap">
                  <ImageStrip v-if="(row.images||[]).length" :images="row.images" :size="48" :max-visible="1" />
                  <div v-else class="fabric-thumb fabric-thumb-empty">
                    <el-icon style="color:#ddd"><Picture /></el-icon>
                  </div>
                </div>
                <div style="display:flex;align-items:center;gap:8px;flex:1;min-width:0">
                  <el-tag :type="row.is_alert ? 'danger' : 'success'" style="flex-shrink:0">
                    {{ row.current_stock }} {{ row.unit }}
                  </el-tag>
                  <span style="font-size:14px;font-weight:500">
                    {{ row.color || $t('fabrics.unspecified_color') }}
                  </span>
                  <span style="font-size:12px;color:var(--color-text-tertiary);margin-left:auto;flex-shrink:0">
                    预警 {{ row.alert_threshold }}{{ row.unit }}
                  </span>
                </div>
                <el-dropdown v-if="auth.canWrite.value" trigger="click" size="small">
                  <el-button size="small" circle icon="MoreFilled" />
                  <template #dropdown>
                    <el-dropdown-menu>
                      <el-dropdown-item @click="openFabricDialog(row, activeCat1Node.id, cat2.id)">{{ $t('common.edit') }}</el-dropdown-item>
                      <el-dropdown-item class="danger-item" @click="confirmRemoveFabric(row.id)">{{ $t('common.delete') }}</el-dropdown-item>
                    </el-dropdown-menu>
                  </template>
                </el-dropdown>
              </div>
            </div>
          </div>

          <div v-if="!activeCat1Node.children.length" style="color:var(--color-text-tertiary);font-size:13px;padding:8px 0">
            {{ $t('fabrics.no_sub_cats') }}
          </div>
        </template>
      </template>
    </div>

    <!-- Add/Edit fabric dialog -->
    <el-dialog v-model="fabricDialogVisible" :title="fabricForm.id ? $t('fabrics.edit_fabric') : $t('fabrics.new_fabric')" width="min(480px,96vw)">
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

        <!-- Fabric images -->
        <el-form-item label="面料图片">
          <input ref="fabricImageInput" type="file" accept="image/*" multiple style="display:none" @change="handleFabricImage" />
          <input ref="fabricCameraInput" type="file" accept="image/*" capture="environment" style="display:none" @change="handleFabricImage" />
          <div style="width:100%">
            <div v-if="fabricForm.images.length" class="img-edit-grid">
              <div v-for="(src, i) in fabricForm.images" :key="i" class="img-edit-thumb">
                <img :src="src" />
                <el-button size="small" type="danger" circle icon="Close" class="img-edit-del" @click.stop="fabricForm.images.splice(i,1)" />
              </div>
            </div>
            <div
              ref="fabricPasteZone"
              tabindex="0"
              class="paste-zone"
              :class="{ active: pasteActive }"
              @click="fabricPasteZone.focus()"
              @focus="pasteActive=true"
              @blur="pasteActive=false"
              @paste="handleFabricPaste"
            >
              <el-icon style="font-size:22px"><Picture /></el-icon>
              <div style="font-size:12px;margin-top:4px">{{ fabricForm.images.length ? '继续粘贴可添加更多图片' : '点击后可粘贴截图' }}</div>
            </div>
            <div style="display:flex;gap:8px;margin-top:6px">
              <el-button size="small" icon="Camera" @click="fabricCameraInput.click()">拍照</el-button>
              <el-button size="small" icon="Picture" @click="fabricImageInput.click()">从相册选择</el-button>
            </div>
          </div>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="fabricDialogVisible = false">{{ $t('common.cancel') }}</el-button>
        <el-button type="primary" :loading="saving" @click="saveFabric">{{ $t('common.save') }}</el-button>
      </template>
    </el-dialog>

    <!-- Category management dialog -->
    <el-dialog v-model="catDialogVisible" :title="$t('fabrics.manage_cats_title')" width="min(560px,96vw)">
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
import { Picture } from '@element-plus/icons-vue'
import { auth } from '../stores/auth'
import { fabricsApi, categoriesApi } from '../api'
import { compressFile, compressBlob } from '../utils/image'
import ImageStrip from '../components/ImageStrip.vue'

const { t } = useI18n()

const tree = ref([])
const catTree = ref([])
const loading = ref(false)
const saving = ref(false)
const fabricDialogVisible = ref(false)
const catDialogVisible = ref(false)
const fabricFormRef = ref()
const selectedCat1Id = ref(null)
const activeCat1Id = ref(null)
const activeCat2Id = ref(null)
const pasteActive = ref(false)
const fabricImageInput = ref()
const fabricCameraInput = ref()
const fabricPasteZone = ref()
const searchQuery = ref('')

const defaultFabricForm = () => ({
  id: null, cat1_id: null, cat2_id: null, color: '', unit: '米',
  current_stock: 0, alert_threshold: 20, images: []
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

const activeCat1Node = computed(() =>
  tree.value.find(c => c.id === activeCat1Id.value) || null
)

const visibleCat2 = computed(() => {
  if (!activeCat1Node.value) return []
  let cats = activeCat2Id.value === null
    ? activeCat1Node.value.children
    : activeCat1Node.value.children.filter(c => c.id === activeCat2Id.value)

  const q = searchQuery.value.trim().toLowerCase()
  if (!q) return cats
  return cats
    .map(cat => ({ ...cat, fabrics: cat.fabrics.filter(f => (f.color || '').toLowerCase().includes(q)) }))
    .filter(cat => cat.fabrics.length > 0)
})

const getCat1Name = (id) => catTree.value.find(c => c.id === id)?.name || ''

const loadTree = async () => {
  loading.value = true
  tree.value = await fabricsApi.tree().finally(() => loading.value = false)
  if (!activeCat1Id.value && tree.value.length) {
    activeCat1Id.value = tree.value[0].id
  }
}
const loadCatTree = async () => {
  catTree.value = await categoriesApi.tree()
}

const onCat1Change = () => { fabricForm.value.cat2_id = null }

const handleFabricImage = async (e) => {
  const files = Array.from(e.target.files || [])
  for (const file of files) {
    const dataUrl = await compressFile(file)
    fabricForm.value.images.push(dataUrl)
  }
  e.target.value = ''
}

const handleFabricPaste = async (e) => {
  const items = e.clipboardData?.items || []
  for (const item of items) {
    if (item.type.startsWith('image/')) {
      const blob = item.getAsFile()
      const dataUrl = await compressBlob(blob)
      fabricForm.value.images.push(dataUrl)
      break
    }
  }
}

const openFabricDialog = (row = null, cat1_id = null, cat2_id = null) => {
  if (row?.id) {
    fabricForm.value = {
      id: row.id,
      cat1_id: cat1_id || row.cat1_id || null,
      cat2_id: cat2_id || row.cat2_id || null,
      color: row.color,
      unit: row.unit,
      current_stock: row.current_stock,
      alert_threshold: row.alert_threshold,
      images: row.images || (row.image_base64 ? [row.image_base64] : [])
    }
  } else {
    fabricForm.value = {
      ...defaultFabricForm(),
      cat1_id: row?.cat1_id || cat1_id || null,
      cat2_id: row?.cat2_id || cat2_id || null
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
      alert_threshold: fabricForm.value.alert_threshold,
      images: fabricForm.value.images
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

const confirmRemoveFabric = async (id) => {
  try {
    await ElMessageBox.confirm(t('fabrics.confirm_delete_fabric'), t('common.confirm'), { type: 'warning' })
    await removeFabric(id)
  } catch {}
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

<style scoped>
:deep(.img-hover-popper) { padding: 4px; }

/* Toolbar */
.fabrics-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 16px;
  flex-wrap: wrap;
}

/* Cat1 pill tabs */
.cat1-tabs {
  display: flex;
  gap: 4px;
  flex-wrap: wrap;
  margin-bottom: 12px;
  background: var(--color-bg-subtle);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  padding: 4px;
  width: fit-content;
  max-width: 100%;
}
.cat1-tab {
  padding: 5px 14px;
  border-radius: var(--radius-md);
  border: none;
  background: transparent;
  color: var(--color-text-secondary);
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all var(--dur-fast) var(--ease-standard);
  white-space: nowrap;
}
.cat1-tab:hover {
  background: var(--color-bg-surface);
  color: var(--color-text-primary);
}
.cat1-tab.active {
  background: var(--color-bg-surface);
  color: var(--color-primary);
  box-shadow: var(--shadow-xs);
}

/* Cat2 chip filter */
.cat2-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-bottom: 12px;
  align-items: center;
}
.cat2-chip {
  padding: 3px 12px;
  border-radius: var(--radius-full);
  border: 1px solid var(--color-border);
  background: var(--color-bg-surface);
  color: var(--color-text-secondary);
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all var(--dur-fast) var(--ease-standard);
  user-select: none;
}
.cat2-chip:hover {
  border-color: var(--color-primary);
  color: var(--color-primary);
  background: var(--color-primary-bg);
}
.cat2-chip.active {
  border-color: var(--color-primary);
  background: var(--color-primary);
  color: #fff;
}

/* Paste zone */
.paste-zone {
  width: 100%;
  border: 2px dashed var(--color-border);
  border-radius: var(--radius-base);
  padding: 12px;
  cursor: pointer;
  outline: none;
  transition: border-color var(--dur-fast) var(--ease-standard);
  min-height: 60px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: var(--color-text-tertiary);
}
.paste-zone.active, .paste-zone:focus { border-color: var(--color-primary); color: var(--color-primary); }

/* Multi-image edit grid */
.img-edit-grid { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 10px; }
.img-edit-thumb { position: relative; width: 80px; height: 80px; border-radius: var(--radius-base); flex-shrink: 0; }
.img-edit-thumb img { width: 80px; height: 80px; object-fit: cover; border-radius: var(--radius-base); display: block; border: 1px solid var(--color-border); }
.img-edit-del { position: absolute; top: -8px; right: -8px; z-index: 1; }

/* Mobile cards */
.fabric-mobile-cards { display: none; flex-direction: column; gap: 8px; margin-left: 16px; margin-top: 4px; }
.fabric-card {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  border: 1px solid var(--color-border);
  border-radius: 8px;
  background: var(--color-bg-surface);
}
.fabric-thumb-wrap { flex-shrink: 0; width: 48px; height: 48px; }
.fabric-thumb {
  width: 48px;
  height: 48px;
  border-radius: 6px;
  flex-shrink: 0;
  object-fit: cover;
}
.fabric-thumb-empty {
  width: 48px;
  height: 48px;
  border-radius: 6px;
  background: var(--color-bg-subtle);
  display: flex;
  align-items: center;
  justify-content: center;
}
:deep(.danger-item) { color: var(--el-color-danger) !important; }

@media (max-width: 640px) {
  :deep(.fabric-desktop-table) { display: none; }
  .fabric-mobile-cards { display: flex; }
  .fabrics-toolbar { gap: 8px; }
  .fabrics-toolbar .el-input { width: 100% !important; }
}
</style>
