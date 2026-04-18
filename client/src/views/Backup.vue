<template>
  <div>
    <!-- AI 识别配置 -->
    <el-card shadow="never" style="margin-bottom:16px">
      <template #header>
        <div style="display:flex;justify-content:space-between;align-items:center">
          <b>{{ $t('ai_settings.title') }}</b>
          <el-tag v-if="aiForm.model" type="success" size="small">{{ aiForm.model }}</el-tag>
          <el-tag v-else type="info" size="small">{{ $t('ai_settings.not_configured') }}</el-tag>
        </div>
      </template>

      <el-form :model="aiForm" label-width="90px" style="max-width:520px">
        <!-- 供应商预设 -->
        <el-form-item :label="$t('ai_settings.preset')">
          <el-select
            v-model="aiForm.preset"
            :placeholder="$t('ai_settings.select_preset')"
            style="width:100%"
            @change="onPresetChange"
          >
            <el-option
              v-for="(p, key) in presets"
              :key="key"
              :label="p.label"
              :value="key"
            />
          </el-select>
          <div style="font-size:12px;color:var(--color-text-tertiary);margin-top:4px">
            {{ $t('ai_settings.preset_hint') }}
          </div>
        </el-form-item>

        <!-- API Key -->
        <el-form-item :label="$t('ai_settings.api_key')">
          <el-input
            v-model="aiForm.api_key"
            type="password"
            show-password
            :placeholder="$t('ai_settings.api_key_ph')"
          />
        </el-form-item>

        <!-- 接口地址 -->
        <el-form-item :label="$t('ai_settings.base_url')">
          <el-input
            v-model="aiForm.base_url"
            :placeholder="$t('ai_settings.base_url_ph')"
          />
        </el-form-item>

        <!-- 模型名称 -->
        <el-form-item :label="$t('ai_settings.model')">
          <el-input
            v-model="aiForm.model"
            :placeholder="$t('ai_settings.model_ph')"
          />
        </el-form-item>

        <el-form-item>
          <el-space>
            <el-button type="primary" :loading="aiSaving" @click="saveAiConfig">
              {{ $t('ai_settings.save_btn') }}
            </el-button>
            <el-button :loading="aiTesting" @click="testAiConfig">
              {{ $t('ai_settings.test_btn') }}
            </el-button>
          </el-space>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 下载备份 -->
    <el-card shadow="never" style="margin-bottom:16px">
      <template #header><b>{{ $t('backup.download_title') }}</b></template>
      <p style="color:var(--color-text-secondary);font-size:13px;margin-bottom:16px">
        {{ $t('backup.download_desc') }}
      </p>
      <el-button type="primary" icon="Download" @click="downloadBackup">
        {{ $t('backup.download_btn') }}
      </el-button>
    </el-card>

    <!-- 还原数据 -->
    <el-card shadow="never">
      <template #header><b>{{ $t('backup.restore_title') }}</b></template>
      <el-alert
        type="warning"
        :title="$t('backup.restore_warning')"
        show-icon
        :closable="false"
        style="margin-bottom:16px"
      />
      <p style="color:var(--color-text-secondary);font-size:13px;margin-bottom:20px">
        {{ $t('backup.restore_desc') }}
      </p>

      <div style="display:flex;gap:12px;align-items:center;flex-wrap:wrap">
        <el-button @click="fileInput.click()">
          <span v-if="selectedFile" style="max-width:200px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">
            {{ selectedFile.name }}
          </span>
          <span v-else>{{ $t('backup.select_file') }}</span>
        </el-button>
        <input ref="fileInput" type="file" accept=".db" style="display:none" @change="onFileSelect" />
        <el-button type="danger" :disabled="!selectedFile || restoring" :loading="restoring" @click="confirmRestore">
          {{ $t('backup.restore_btn') }}
        </el-button>
        <span v-if="selectedFile" style="font-size:12px;color:var(--color-text-tertiary)">
          {{ (selectedFile.size / 1024).toFixed(1) }} KB
        </span>
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { ElMessage, ElMessageBox } from 'element-plus'
import { aiSettingsApi } from '../api'

const { t } = useI18n()

// ── AI 设置 ──────────────────────────────────────────────────────────
const presets   = ref({})
const aiSaving  = ref(false)
const aiTesting = ref(false)
const aiForm    = ref({ preset: '', api_key: '', base_url: '', model: '', sdk_type: 'openai' })

const onPresetChange = (key) => {
  const p = presets.value[key]
  if (!p) return
  aiForm.value.sdk_type = p.sdk_type
  aiForm.value.base_url = p.base_url
  aiForm.value.model    = p.model
}

const saveAiConfig = async () => {
  aiSaving.value = true
  try {
    await aiSettingsApi.save(aiForm.value)
    ElMessage.success(t('ai_settings.save_ok'))
  } catch (e) {
    ElMessage.error(e.message)
  } finally {
    aiSaving.value = false
  }
}

const testAiConfig = async () => {
  aiSaving.value = true
  try {
    await aiSettingsApi.save(aiForm.value)
  } catch {
    aiSaving.value = false
    return
  }
  aiSaving.value = false

  aiTesting.value = true
  try {
    const res = await aiSettingsApi.test()
    ElMessage.success(t('ai_settings.test_ok', { reply: res.reply }))
  } catch (e) {
    ElMessage.error(t('ai_settings.test_fail', { msg: e.message }))
  } finally {
    aiTesting.value = false
  }
}

// ── 备份还原 ─────────────────────────────────────────────────────────
const fileInput   = ref(null)
const selectedFile = ref(null)
const restoring   = ref(false)

const downloadBackup = () => { window.open('/api/backup/download', '_blank') }

const onFileSelect = (e) => {
  const file = e.target.files[0]
  if (file) selectedFile.value = file
  e.target.value = ''
}

const confirmRestore = async () => {
  if (!selectedFile.value) { ElMessage.warning(t('backup.select_first')); return }
  try {
    await ElMessageBox.confirm(t('backup.confirm_msg'), t('backup.confirm_title'), {
      confirmButtonText: t('backup.confirm_btn'),
      cancelButtonText:  t('common.cancel'),
      type: 'warning'
    })
  } catch { return }

  restoring.value = true
  try {
    const buf = await selectedFile.value.arrayBuffer()
    const res = await fetch('/api/backup/restore', {
      method: 'POST',
      headers: { 'Content-Type': 'application/octet-stream' },
      body: buf
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error || 'Restore failed')
    ElMessage.success(t('backup.success'))
    selectedFile.value = null
  } catch (e) {
    ElMessage.error(e.message)
    restoring.value = false
  }
}

onMounted(async () => {
  const [p, cfg] = await Promise.all([aiSettingsApi.presets(), aiSettingsApi.get()])
  presets.value = p
  aiForm.value  = { ...aiForm.value, ...cfg }
})
</script>
