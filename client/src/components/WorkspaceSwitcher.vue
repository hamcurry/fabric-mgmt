<template>
  <div class="ws-switcher" v-if="auth.isLoggedIn.value">
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
  <div class="ws-guest" v-else>
    <svg width="12" height="12" viewBox="0 0 20 20" fill="currentColor" style="opacity:0.5">
      <path fill-rule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clip-rule="evenodd"/>
    </svg>
    <span>访客模式</span>
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
.ws-guest {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 10px 12px;
  border-bottom: 1px solid var(--color-sidebar-border);
  font-size: 12px;
  color: rgba(255,255,255,0.4);
}
</style>
