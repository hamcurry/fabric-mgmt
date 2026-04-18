<template>
  <el-card shadow="never">
    <template #header>
      <div style="display:flex;justify-content:space-between;align-items:center;gap:12px;flex-wrap:wrap">
        <b>{{ $t('styles.list_title') }}</b>
        <el-space wrap>
          <el-input v-model="searchQ" :placeholder="$t('styles.search_placeholder')" clearable style="width:180px" />
          <el-button type="primary" icon="Plus" @click="openDialog()">{{ $t('styles.new_style') }}</el-button>
        </el-space>
      </div>
    </template>

    <!-- 客户 Tab 过滤 -->
    <div v-if="customers.length" style="margin-bottom:12px;display:flex;flex-wrap:wrap;gap:6px;align-items:center">
      <el-button size="small" :type="activeCustomer==='' ? 'primary' : ''" @click="activeCustomer=''">全部</el-button>
      <el-button
        v-for="c in customers" :key="c"
        size="small"
        :type="activeCustomer===c ? 'primary' : ''"
        @click="activeCustomer=c"
      >{{ c }}</el-button>
    </div>

    <el-table class="style-desktop-table" :data="filteredStyles" v-loading="loading">
      <el-table-column :label="$t('styles.style_image')" width="80">
        <template #default="{ row }">
          <el-tooltip
            v-if="row.image_base64"
            effect="light"
            placement="right"
            :show-after="300"
            :hide-after="0"
            popper-class="img-hover-popper"
          >
            <template #content>
              <img :src="row.image_base64" style="max-width:300px;max-height:300px;object-fit:contain;display:block" />
            </template>
            <el-image
              :src="row.image_base64"
              fit="cover"
              style="width:50px;height:50px;border-radius:4px;cursor:zoom-in;display:block"
              :preview-src-list="[row.image_base64]"
              preview-teleported
            />
          </el-tooltip>
          <span v-else style="color:#ddd;font-size:12px">{{ $t('styles.no_image') }}</span>
        </template>
      </el-table-column>
      <el-table-column prop="name" :label="$t('styles.style_name')" min-width="130">
        <template #default="{ row }">
          <el-link @click="$router.push(`/styles/${row.id}`)">{{ row.name }}</el-link>
        </template>
      </el-table-column>
      <el-table-column prop="customer" :label="$t('common.customer')" width="110" />
      <el-table-column label="款式用量" min-width="260">
        <template #default="{ row }">
          <div style="display:flex;flex-wrap:wrap;gap:6px">
            <el-tag
              v-for="m in row.materials"
              :key="m.id"
              size="small"
              style="margin-bottom:2px"
            >
              {{ materialSummary(m) }}
            </el-tag>
            <span v-if="!row.materials?.length" style="color:#bbb">{{ $t('styles.not_set') }}</span>
          </div>
        </template>
      </el-table-column>
      <el-table-column prop="note" :label="$t('common.note')" min-width="100" show-overflow-tooltip />
      <el-table-column prop="created_at" :label="$t('common.created_at')" width="155" />
      <el-table-column :label="$t('common.operation')" width="160" fixed="right">
        <template #default="{ row }">
          <el-button size="small" @click="$router.push(`/styles/${row.id}`)">{{ $t('common.detail') }}</el-button>
          <el-button size="small" @click="openDialog(row)">{{ $t('common.edit') }}</el-button>
          <el-popconfirm :title="$t('styles.confirm_delete')" @confirm="remove(row.id)">
            <template #reference>
              <el-button size="small" type="danger">{{ $t('common.delete') }}</el-button>
            </template>
          </el-popconfirm>
        </template>
      </el-table-column>
    </el-table>

    <!-- 移动端卡片列表 -->
    <div class="style-mobile-cards" v-loading="loading">
      <div v-for="row in filteredStyles" :key="row.id" class="style-card">
        <el-image
          v-if="row.image_base64"
          :src="row.image_base64"
          fit="cover"
          class="style-card-img"
          :preview-src-list="[row.image_base64]"
          preview-teleported
        />
        <div v-else class="style-card-img style-card-no-img">{{ $t('styles.no_image') }}</div>
        <div class="style-card-body">
          <div class="style-card-name">
            <el-link @click="$router.push(`/styles/${row.id}`)">{{ row.name }}</el-link>
          </div>
          <div v-if="row.customer" class="style-card-sub">{{ row.customer }}</div>
          <div style="display:flex;flex-wrap:wrap;gap:3px;margin-top:4px">
            <el-tag v-for="m in (row.materials || []).slice(0, 3)" :key="m.id" size="small">{{ materialSummary(m) }}</el-tag>
            <el-tag v-if="(row.materials || []).length > 3" size="small" type="info">+{{ row.materials.length - 3 }}</el-tag>
          </div>
        </div>
        <el-dropdown trigger="click" size="small" style="flex-shrink:0">
          <el-button size="small" circle icon="MoreFilled" />
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item @click="$router.push(`/styles/${row.id}`)">{{ $t('common.detail') }}</el-dropdown-item>
              <el-dropdown-item @click="openDialog(row)">{{ $t('common.edit') }}</el-dropdown-item>
              <el-dropdown-item class="danger-item" @click="confirmRemove(row.id)">{{ $t('common.delete') }}</el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </div>
      <div v-if="!filteredStyles.length && !loading" style="text-align:center;color:var(--color-text-tertiary);padding:40px">
        {{ $t('styles.no_data') || '暂无款式' }}
      </div>
    </div>

    <el-dialog v-model="dialogVisible" :title="form.id ? $t('styles.edit_style') : $t('styles.new_style')" width="min(760px, 98vw)">
      <el-form :model="form" :rules="rules" ref="formRef" label-width="90px">
        <el-form-item :label="$t('styles.style_name')" prop="name">
          <el-input v-model="form.name" />
        </el-form-item>
        <el-form-item :label="$t('common.customer')">
          <el-input v-model="form.customer" :placeholder="$t('styles.customer_placeholder')" />
        </el-form-item>
        <el-form-item :label="$t('common.note')">
          <el-input v-model="form.note" type="textarea" :rows="2" />
        </el-form-item>

        <el-form-item :label="$t('styles.style_image')">
          <input ref="imageFileInput" type="file" accept="image/*" style="display:none" @change="handleImageFile" />
          <input ref="cameraInput" type="file" accept="image/*" capture="environment" style="display:none" @change="handleImageFile" />
          <div style="width:100%">
            <div
              ref="pasteZoneRef"
              tabindex="0"
              style="width:100%;border:2px dashed var(--color-border);border-radius:8px;padding:12px;cursor:pointer;outline:none;transition:border-color .15s"
              :style="{ borderColor: pasteActive ? 'var(--color-primary)' : 'var(--color-border)' }"
              @click="pasteZoneRef.focus()"
              @focus="pasteActive=true"
              @blur="pasteActive=false"
              @paste="handlePaste"
            >
              <div v-if="!form.image_base64" style="text-align:center;color:var(--color-text-tertiary);padding:8px 0">
                <el-icon style="font-size:24px"><Picture /></el-icon>
                <div style="font-size:13px;margin-top:4px">{{ $t('styles.paste_placeholder') }}</div>
              </div>
              <div v-else style="position:relative;display:inline-block">
                <img :src="form.image_base64" style="max-height:160px;max-width:100%;border-radius:4px" />
                <el-button
                  size="small" type="danger" circle icon="Close"
                  style="position:absolute;top:-8px;right:-8px"
                  @click.stop="form.image_base64=''"
                />
              </div>
            </div>
            <div style="display:flex;gap:8px;margin-top:8px">
              <el-button size="small" icon="Camera" @click="cameraInput.click()">拍照</el-button>
              <el-button size="small" icon="Picture" @click="imageFileInput.click()">从相册选择</el-button>
            </div>
          </div>
        </el-form-item>

        <el-form-item label="款式用量">
          <div style="width:100%">
            <div
              v-for="(m, i) in form.materials" :key="i"
              class="material-row"
            >
              <el-select
                v-model="m.cat1_id"
                :placeholder="$t('fabrics.cat1')"
                @change="m.cat2_id = null"
              >
                <el-option v-for="c1 in catTree" :key="c1.id" :label="c1.name" :value="c1.id" />
              </el-select>
              <el-select v-model="m.cat2_id" :placeholder="$t('fabrics.cat2')" :disabled="!m.cat1_id">
                <el-option
                  v-for="c2 in (catTree.find(c=>c.id===m.cat1_id)?.children||[])"
                  :key="c2.id" :label="c2.name" :value="c2.id"
                />
              </el-select>
              <el-input-number
                v-model="m.actual_usage_per_piece"
                :min="0"
                :precision="3"
                :step="0.1"
                style="width:100%"
                placeholder="实际用量"
              />
              <el-input-number
                v-model="m.estimated_usage_per_piece"
                :min="0"
                :precision="3"
                :step="0.1"
                style="width:100%"
                placeholder="客估用量"
              />
              <el-button icon="Delete" circle size="small" type="danger" plain @click="form.materials.splice(i,1)" />
            </div>

            <div class="material-row-labels" style="color:var(--color-text-tertiary);font-size:12px;margin:-2px 0 8px">
              <span></span>
              <span></span>
              <span>实际用量 m/件</span>
              <span>客估用量 m/件</span>
              <span></span>
            </div>

            <el-button
              v-if="form.materials.length < 8"
              size="small" icon="Plus"
              @click="form.materials.push({ cat1_id: null, cat2_id: null, actual_usage_per_piece: null, estimated_usage_per_piece: null })"
            >{{ $t('styles.add_material') }}</el-button>
          </div>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">{{ $t('common.cancel') }}</el-button>
        <el-button type="primary" :loading="saving" @click="save">{{ $t('common.save') }}</el-button>
      </template>
    </el-dialog>
  </el-card>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { ElMessage, ElMessageBox } from 'element-plus'
import { stylesApi, categoriesApi } from '../api'

const { t } = useI18n()

const styles = ref([])
const catTree = ref([])
const loading = ref(false)
const dialogVisible = ref(false)
const saving = ref(false)
const formRef = ref()
const pasteZoneRef = ref()
const pasteActive = ref(false)
const imageFileInput = ref()
const cameraInput = ref()
const searchQ = ref('')
const activeCustomer = ref('')

const customers = computed(() => {
  const set = new Set(styles.value.map(s => s.customer || '').filter(Boolean))
  return Array.from(set).sort()
})

const filteredStyles = computed(() => {
  const q = searchQ.value.trim().toLowerCase()
  return styles.value.filter(s => {
    if (activeCustomer.value && (s.customer || '') !== activeCustomer.value) return false
    if (q) return s.name.toLowerCase().includes(q) || (s.customer || '').toLowerCase().includes(q)
    return true
  })
})

const defaultForm = () => ({
  id: null, name: '', customer: '', note: '', image_base64: '', materials: []
})
const form = ref(defaultForm())
const rules = computed(() => ({
  name: [{ required: true, message: t('styles.val_name') }]
}))

const materialSummary = (m) => {
  const actual = m.actual_usage_per_piece != null ? `实际 ${m.actual_usage_per_piece}${t('common.meter_per_piece')}` : ''
  const estimated = m.estimated_usage_per_piece != null ? `客估 ${m.estimated_usage_per_piece}${t('common.meter_per_piece')}` : ''
  return `${m.cat1_name}/${m.cat2_name} ${[actual, estimated].filter(Boolean).join(' / ')}`
}

const load = async () => {
  loading.value = true
  styles.value = await stylesApi.list().finally(() => loading.value = false)
}

const openDialog = async (row = null) => {
  catTree.value = await categoriesApi.tree()
  if (row) {
    const detail = await stylesApi.get(row.id)
    form.value = {
      id: detail.id,
      name: detail.name,
      customer: detail.customer || '',
      note: detail.note || '',
      image_base64: detail.image_base64 || '',
      materials: detail.materials.map(m => ({
        cat1_id: m.cat1_id,
        cat2_id: m.cat2_id,
        actual_usage_per_piece: m.actual_usage_per_piece,
        estimated_usage_per_piece: m.estimated_usage_per_piece
      }))
    }
  } else {
    form.value = defaultForm()
  }
  dialogVisible.value = true
}

const handleImageFile = (e) => {
  const file = e.target.files?.[0]
  if (!file) return
  const reader = new FileReader()
  reader.onload = (ev) => {
    const img = new Image()
    img.onload = () => {
      const MAX = 1200
      let w = img.naturalWidth, h = img.naturalHeight
      if (w > MAX || h > MAX) {
        if (w > h) { h = Math.round(h * MAX / w); w = MAX }
        else { w = Math.round(w * MAX / h); h = MAX }
      }
      const canvas = document.createElement('canvas')
      canvas.width = w; canvas.height = h
      canvas.getContext('2d').drawImage(img, 0, 0, w, h)
      form.value.image_base64 = canvas.toDataURL('image/jpeg', 0.85)
    }
    img.src = ev.target.result
  }
  reader.readAsDataURL(file)
  e.target.value = ''
}

const handlePaste = (e) => {
  const items = e.clipboardData?.items || []
  for (const item of items) {
    if (item.type.startsWith('image/')) {
      const blob = item.getAsFile()
      const reader = new FileReader()
      reader.onload = (ev) => { form.value.image_base64 = ev.target.result }
      reader.readAsDataURL(blob)
      break
    }
  }
}

const save = async () => {
  await formRef.value.validate()
  saving.value = true
  try {
    const payload = {
      name: form.value.name,
      customer: form.value.customer,
      note: form.value.note,
      image_base64: form.value.image_base64,
      materials: form.value.materials.filter(m =>
        m.cat2_id && (m.actual_usage_per_piece != null || m.estimated_usage_per_piece != null)
      )
    }
    if (form.value.id) {
      await stylesApi.update(form.value.id, payload)
    } else {
      await stylesApi.create(payload)
    }
    ElMessage.success(t('common.save_success'))
    dialogVisible.value = false
    load()
  } catch (e) {
    ElMessage.error(e.message)
  } finally {
    saving.value = false
  }
}

const remove = async (id) => {
  try {
    await stylesApi.remove(id)
    ElMessage.success(t('common.delete_success'))
    load()
  } catch (e) {
    ElMessage.error(e.message)
  }
}

const confirmRemove = async (id) => {
  try {
    await ElMessageBox.confirm(t('styles.confirm_delete'), t('common.confirm'), { type: 'warning' })
    await remove(id)
  } catch {}
}

onMounted(async () => {
  load()
  catTree.value = await categoriesApi.tree()
})
</script>

<style scoped>
:deep(.img-hover-popper) { padding: 4px; }

.material-row {
  display: grid;
  grid-template-columns: 110px 1fr 150px 150px auto;
  gap: 8px;
  margin-bottom: 8px;
  align-items: center;
}
.material-row-labels {
  display: grid;
  grid-template-columns: 110px 1fr 150px 150px auto;
  gap: 8px;
}

@media (max-width: 600px) {
  .material-row {
    grid-template-columns: 1fr 1fr auto;
    grid-template-rows: auto auto;
  }
  .material-row > :nth-child(1) { grid-column: 1; grid-row: 1; }
  .material-row > :nth-child(2) { grid-column: 2; grid-row: 1; }
  .material-row > :nth-child(5) { grid-column: 3; grid-row: 1; }
  .material-row > :nth-child(3) { grid-column: 1; grid-row: 2; }
  .material-row > :nth-child(4) { grid-column: 2 / span 2; grid-row: 2; }
  .material-row-labels { display: none; }
}

.style-mobile-cards { display: none; flex-direction: column; gap: 10px; }
.style-card { display: flex; align-items: flex-start; gap: 10px; padding: 12px; border: 1px solid var(--color-border); border-radius: 8px; background: var(--color-bg-surface); }
.style-card-img { width: 56px; height: 56px; border-radius: 6px; flex-shrink: 0; object-fit: cover; }
.style-card-no-img { background: var(--color-bg-subtle); display: flex; align-items: center; justify-content: center; color: #ccc; font-size: 11px; }
.style-card-body { flex: 1; min-width: 0; }
.style-card-name { font-weight: 600; font-size: 14px; margin-bottom: 2px; }
.style-card-sub { font-size: 12px; color: var(--color-text-secondary); margin-bottom: 4px; }
:deep(.danger-item) { color: var(--el-color-danger) !important; }
@media (max-width: 640px) {
  :deep(.style-desktop-table) { display: none; }
  .style-mobile-cards { display: flex; }
}
</style>
