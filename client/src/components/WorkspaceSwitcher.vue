<template>
  <div class="ws-switcher" v-if="auth.state.workspaces.length > 0">
    <div class="ws-label">当前仓库</div>
    <el-select
      :model-value="auth.state.currentWorkspaceId"
      @update:model-value="handleSwitch"
      size="small"
      style="width: 100%"
    >
      <el-option
        v-for="ws in auth.state.workspaces"
        :key="ws.id"
        :label="ws.name"
        :value="ws.id"
      />
    </el-select>
  </div>
</template>

<script setup>
import { auth } from '../stores/auth'

const emit = defineEmits(['switched'])

function handleSwitch(wsId) {
  auth.switchWorkspace(wsId)
  emit('switched')
}
</script>

<style scoped>
.ws-switcher {
  padding: 8px 10px;
  border-bottom: 1px solid var(--color-sidebar-border);
}
.ws-label {
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.07em;
  color: rgba(255,255,255,0.3);
  margin-bottom: 6px;
  padding: 0 2px;
}
</style>
