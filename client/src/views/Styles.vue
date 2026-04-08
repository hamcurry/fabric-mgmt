<template>
  <el-card shadow="never">
    <template #header>
      <div style="display:flex;justify-content:space-between;align-items:center;gap:12px;flex-wrap:wrap">
        <b>{{ $t('styles.list_title') }}</b>
        <el-space wrap>
          <el-input v-model="searchQ" :placeholder="$t('styles.search_placeholder')" clearable style="width:180px" @keyup.enter="load" />
          <el-button @click="load" icon="Search">{{ $t('common.search') }}</el-button>
          <el-button type="primary" icon="Plus" @click="openDialog()">{{ $t('styles.new_style') }}</el-button>
        </el-space>
      </div>
    </template>

    <el-table :data="styles" v-loading="loading">
      <el-table-column :label="$t('styles.style_image')" width="80">
        <template #default="{ row }">
          <el-image
            v-if="row.image_base64"
            :src="row.image_base64"
            style="width:50px;height:50px;object-fit:cover;border-radius:4px"
            :preview-src-list="[row.image_base64]"
            preview-teleported
          />
          <span v-else style="color:#ddd;font-size:12px">{{ $t('styles.no_image') }}</span>
        </template>
      </el-table-column>
      <el-table-column prop="name" :label="$t('styles.style_name')" min-width="130">
        <template #default="{ row }">
          <el-link @click="$router.push(`/styles/${row.id}`)">{{ row.name }}</el-link>
        </template>
      </el-table-column>
      <el-table-column prop="customer" :label="$t('common.customer')" width="110" />
      <el-table-column :label="$t('styles.materials')" min-width="180">
        <template #default="{ row }">
          <el-tag
            v-for="m in row.materials" :key="m.id"
            size="small" style="margin-right:4px;margin-bottom:2px"
          >{{ m.cat1_name }}/{{ m.cat2_name }} {{ m.usage_per_piece }}{{ $t('common.meter_per_piece') }}</el-tag>
          <span v-if="!row.materials?.length" style="color:#bbb">{{ $t('styles.not_set') }}</span>
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

    <el-dialog v-model="dialogVisible" :title="form.id ? $t('styles.edit_style') : $t('styles.new_style')" width="580px">
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
        </el-form-item>

        <el-form-item :label="$t('styles.materials')">
          <div style="width:100%">
            <div
              v-for="(m, i) in form.materials" :key="i"
              style="display:flex;gap:8px;margin-bottom:8px;align-items:center"
            >
              <el-select
                v-model="m.cat1_id" :placeholder="$t('common.fabric')" style="width:100px"
                @change="m.cat2_id = null"
              >
                <el-option v-for="c1 in catTree" :key="c1.id" :label="c1.name" :value="c1.id" />
              </el-select>
              <el-select v-model="m.cat2_id" :placeholder="$t('common.unit')" style="flex:1" :disabled="!m.cat1_id">
                <el-option
                  v-for="c2 in (catTree.find(c=>c.id===m.cat1_id)?.children||[])"
                  :key="c2.id" :label="c2.name" :value="c2.id"
                />
              </el-select>
              <el-input-number
                v-model="m.usage_per_piece" :min="0.001" :precision="3" :step="0.1"
                style="width:120px"
              />
              <span style="color:#888;white-space:nowrap">{{ $t('common.meter_per_piece') }}</span>
              <el-button icon="Delete" circle size="small" type="danger" plain @click="form.materials.splice(i,1)" />
            </div>
            <el-button
              v-if="form.materials.length < 5"
              size="small" icon="Plus"
              @click="form.materials.push({ cat1_id: null, cat2_id: null, usage_per_piece: 1 })"
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
import { ElMessage } from 'element-plus'
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
const searchQ = ref('')

const defaultForm = () => ({
  id: null, name: '', customer: '', note: '', image_base64: '', materials: []
})
const form = ref(defaultForm())
const rules = computed(() => ({
  name: [{ required: true, message: t('styles.val_name') }]
}))

const load = async () => {
  loading.value = true
  const params = {}
  if (searchQ.value) params.q = searchQ.value
  styles.value = await stylesApi.list(params).finally(() => loading.value = false)
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
        usage_per_piece: m.usage_per_piece
      }))
    }
  } else {
    form.value = defaultForm()
  }
  dialogVisible.value = true
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
      materials: form.value.materials.filter(m => m.cat2_id && m.usage_per_piece)
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

onMounted(async () => {
  load()
  catTree.value = await categoriesApi.tree()
})
</script>
