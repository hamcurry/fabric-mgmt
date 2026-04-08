<template>
  <div>
    <!-- Download -->
    <el-card shadow="never" style="margin-bottom:16px">
      <template #header><b>{{ $t('backup.download_title') }}</b></template>
      <p style="color:var(--color-text-secondary);font-size:13px;margin-bottom:16px">
        {{ $t('backup.download_desc') }}
      </p>
      <el-button type="primary" icon="Download" @click="downloadBackup">
        {{ $t('backup.download_btn') }}
      </el-button>
    </el-card>

    <!-- Restore -->
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
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { ElMessage, ElMessageBox } from 'element-plus'

const { t } = useI18n()

const fileInput = ref(null)
const selectedFile = ref(null)
const restoring = ref(false)

const downloadBackup = () => {
  window.open('/api/backup/download', '_blank')
}

const onFileSelect = (e) => {
  const file = e.target.files[0]
  if (file) selectedFile.value = file
  e.target.value = ''
}

const confirmRestore = async () => {
  if (!selectedFile.value) {
    ElMessage.warning(t('backup.select_first'))
    return
  }
  try {
    await ElMessageBox.confirm(t('backup.confirm_msg'), t('backup.confirm_title'), {
      confirmButtonText: t('backup.confirm_btn'),
      cancelButtonText: t('common.cancel'),
      type: 'warning',
      dangerouslyUseHTMLString: false
    })
  } catch {
    return
  }

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
</script>
