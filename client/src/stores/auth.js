import { reactive, computed } from 'vue'

const state = reactive({
  user: null,
  currentWorkspaceId: parseInt(localStorage.getItem('workspace_id')) || 1,
  workspaces: [],
  initialized: false
})

export const auth = {
  state,
  isLoggedIn: computed(() => !!state.user),
  isAdmin:    computed(() => state.user?.role === 'admin'),
  canWrite:   computed(() => !!state.user),

  async init() {
    const token = localStorage.getItem('token')
    if (!token) {
      await auth.loadWorkspaces()
      state.initialized = true
      return
    }
    try {
      const res = await fetch('/api/auth/me', {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (!res.ok) throw new Error('token invalid')
      const user = await res.json()
      state.user = user
      const savedWs = parseInt(localStorage.getItem('workspace_id')) || 1
      if (user.workspaceIds?.includes(savedWs) || user.role === 'admin') {
        state.currentWorkspaceId = savedWs
      } else if (user.workspaceIds?.length) {
        state.currentWorkspaceId = user.workspaceIds[0]
      }
      await auth.loadWorkspaces()
    } catch {
      localStorage.removeItem('token')
      state.user = null
    }
    state.initialized = true
  },

  async loadWorkspaces() {
    try {
      const token = localStorage.getItem('token')
      const headers = token ? { Authorization: `Bearer ${token}` } : {}
      const res = await fetch('/api/auth/workspaces', { headers })
      if (res.ok) state.workspaces = await res.json()
    } catch {}
  },

  login(token, user) {
    localStorage.setItem('token', token)
    state.user = user
    if (user.workspaceIds?.length) {
      state.currentWorkspaceId = user.workspaceIds[0]
      localStorage.setItem('workspace_id', user.workspaceIds[0])
    }
    auth.loadWorkspaces()
  },

  logout() {
    localStorage.removeItem('token')
    state.user = null
    state.workspaces = []
    state.currentWorkspaceId = 1
    localStorage.removeItem('workspace_id')
  },

  switchWorkspace(wsId) {
    state.currentWorkspaceId = wsId
    localStorage.setItem('workspace_id', wsId)
  }
}
