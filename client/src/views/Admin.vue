<template>
  <div class="admin-page">
    <el-tabs v-model="activeTab">
      <!-- ── 仓库管理 ── -->
      <el-tab-pane label="仓库管理" name="workspaces">
        <div class="tab-toolbar">
          <el-button type="primary" icon="Plus" @click="openWsDialog()">新增仓库</el-button>
        </div>
        <el-table :data="workspaces" stripe>
          <el-table-column prop="id" label="ID" width="70" />
          <el-table-column prop="name" label="名称" />
          <el-table-column prop="note" label="备注" />
          <el-table-column prop="created_at" label="创建时间" width="160" />
          <el-table-column label="操作" width="120" fixed="right">
            <template #default="{ row }">
              <el-button size="small" @click="openWsDialog(row)">编辑</el-button>
              <el-button size="small" type="danger" :disabled="row.id === 1" @click="removeWorkspace(row.id)">删除</el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-tab-pane>

      <!-- ── 用户管理 ── -->
      <el-tab-pane label="用户管理" name="users">
        <div class="tab-toolbar">
          <el-button type="primary" icon="Plus" @click="openUserDialog()">新增用户</el-button>
        </div>
        <el-table :data="users" stripe>
          <el-table-column prop="id" label="ID" width="70" />
          <el-table-column prop="username" label="用户名" />
          <el-table-column prop="role" label="角色" width="90">
            <template #default="{ row }">
              <el-tag :type="row.role === 'admin' ? 'danger' : 'info'" size="small">
                {{ row.role === 'admin' ? '管理员' : '普通' }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="仓库权限">
            <template #default="{ row }">
              <el-tag
                v-for="wsId in row.workspaceIds"
                :key="wsId"
                size="small"
                style="margin-right:4px"
              >
                {{ wsName(wsId) }}
              </el-tag>
              <span v-if="!row.workspaceIds?.length" style="color:var(--color-text-tertiary);font-size:12px">无</span>
            </template>
          </el-table-column>
          <el-table-column prop="created_at" label="创建时间" width="160" />
          <el-table-column label="操作" width="120" fixed="right">
            <template #default="{ row }">
              <el-button size="small" @click="openUserDialog(row)">编辑</el-button>
              <el-button size="small" type="danger" @click="removeUser(row.id)">删除</el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-tab-pane>
    </el-tabs>

    <!-- 仓库 Dialog -->
    <el-dialog v-model="wsDialogVisible" :title="wsForm.id ? '编辑仓库' : '新增仓库'" width="400px">
      <el-form :model="wsForm" label-width="60px">
        <el-form-item label="名称">
          <el-input v-model="wsForm.name" placeholder="仓库名称" />
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="wsForm.note" placeholder="可选" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="wsDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="saveWorkspace">保存</el-button>
      </template>
    </el-dialog>

    <!-- 用户 Dialog -->
    <el-dialog v-model="userDialogVisible" :title="userForm.id ? '编辑用户' : '新增用户'" width="460px">
      <el-form :model="userForm" label-width="80px">
        <el-form-item label="用户名">
          <el-input v-model="userForm.username" :disabled="!!userForm.id" placeholder="登录用户名" />
        </el-form-item>
        <el-form-item :label="userForm.id ? '新密码' : '密码'">
          <el-input v-model="userForm.password" type="password" show-password :placeholder="userForm.id ? '留空则不修改' : '请输入密码'" />
        </el-form-item>
        <el-form-item label="角色">
          <el-select v-model="userForm.role" style="width:100%">
            <el-option label="普通用户" value="user" />
            <el-option label="管理员" value="admin" />
          </el-select>
        </el-form-item>
        <el-form-item label="仓库权限">
          <el-checkbox-group v-model="userForm.workspaceIds">
            <el-checkbox v-for="ws in workspaces" :key="ws.id" :value="ws.id">{{ ws.name }}</el-checkbox>
          </el-checkbox-group>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="userDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="saveUser">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { adminApi } from '../api/index'

const activeTab = ref('workspaces')
const workspaces = ref([])
const users = ref([])
const saving = ref(false)

const wsDialogVisible = ref(false)
const wsForm = ref({ id: null, name: '', note: '' })

const userDialogVisible = ref(false)
const userForm = ref({ id: null, username: '', password: '', role: 'user', workspaceIds: [] })

function wsName(wsId) {
  return workspaces.value.find(w => w.id === wsId)?.name || wsId
}

async function loadAll() {
  const [ws, us] = await Promise.all([adminApi.listWorkspaces(), adminApi.listUsers()])
  workspaces.value = ws
  users.value = us
}

function openWsDialog(row = null) {
  wsForm.value = row ? { id: row.id, name: row.name, note: row.note || '' } : { id: null, name: '', note: '' }
  wsDialogVisible.value = true
}

async function saveWorkspace() {
  if (!wsForm.value.name) return ElMessage.warning('名称不能为空')
  saving.value = true
  try {
    if (wsForm.value.id) {
      await adminApi.updateWorkspace(wsForm.value.id, { name: wsForm.value.name, note: wsForm.value.note })
    } else {
      await adminApi.createWorkspace({ name: wsForm.value.name, note: wsForm.value.note })
    }
    wsDialogVisible.value = false
    await loadAll()
  } catch (e) {
    ElMessage.error(e.message)
  } finally {
    saving.value = false
  }
}

async function removeWorkspace(id) {
  await ElMessageBox.confirm('确认删除该仓库？', '提示', { type: 'warning' })
  try {
    await adminApi.deleteWorkspace(id)
    await loadAll()
  } catch (e) {
    ElMessage.error(e.message)
  }
}

function openUserDialog(row = null) {
  userForm.value = row
    ? { id: row.id, username: row.username, password: '', role: row.role, workspaceIds: [...(row.workspaceIds || [])] }
    : { id: null, username: '', password: '', role: 'user', workspaceIds: [] }
  userDialogVisible.value = true
}

async function saveUser() {
  if (!userForm.value.id && (!userForm.value.username || !userForm.value.password)) {
    return ElMessage.warning('用户名和密码不能为空')
  }
  saving.value = true
  try {
    if (userForm.value.id) {
      const payload = { role: userForm.value.role, workspaceIds: userForm.value.workspaceIds }
      if (userForm.value.password) payload.password = userForm.value.password
      await adminApi.updateUser(userForm.value.id, payload)
    } else {
      await adminApi.createUser({
        username: userForm.value.username,
        password: userForm.value.password,
        role: userForm.value.role,
        workspaceIds: userForm.value.workspaceIds
      })
    }
    userDialogVisible.value = false
    await loadAll()
  } catch (e) {
    ElMessage.error(e.message)
  } finally {
    saving.value = false
  }
}

async function removeUser(id) {
  await ElMessageBox.confirm('确认删除该用户？', '提示', { type: 'warning' })
  try {
    await adminApi.deleteUser(id)
    await loadAll()
  } catch (e) {
    ElMessage.error(e.message)
  }
}

onMounted(loadAll)
</script>

<style scoped>
.admin-page { max-width: 900px; }
.tab-toolbar { margin-bottom: 16px; }
</style>
