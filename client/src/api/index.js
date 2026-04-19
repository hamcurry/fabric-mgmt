import axios from 'axios'

const http = axios.create({ baseURL: '/api' })

// 请求拦截器：注入 JWT token 和 workspace_id
http.interceptors.request.use(config => {
  const token = localStorage.getItem('token')
  if (token) config.headers.Authorization = `Bearer ${token}`

  const isAuthRoute = config.url.startsWith('/auth') || config.url.startsWith('/admin')
  if (!isAuthRoute) {
    const wsId = parseInt(localStorage.getItem('workspace_id')) || 1
    if (config.method === 'get') {
      config.params = { workspace_id: wsId, ...config.params }
    } else if (config.data && !(config.data instanceof FormData)) {
      config.data = { workspace_id: wsId, ...config.data }
    }
  }
  return config
})

http.interceptors.response.use(
  res => res.data,
  err => {
    const msg = err.response?.data?.error || err.message
    return Promise.reject(new Error(msg))
  }
)

export const fabricsApi = {
  list: (params) => http.get('/fabrics', { params }),
  tree: () => http.get('/fabrics/tree'),
  create: (data) => http.post('/fabrics', data),
  update: (id, data) => http.put(`/fabrics/${id}`, data),
  remove: (id) => http.delete(`/fabrics/${id}`)
}

export const categoriesApi = {
  tree: () => http.get('/categories'),
  createCat1: (data) => http.post('/categories/cat1', data),
  updateCat1: (id, data) => http.put(`/categories/cat1/${id}`, data),
  removeCat1: (id) => http.delete(`/categories/cat1/${id}`),
  createCat2: (data) => http.post('/categories/cat2', data),
  updateCat2: (id, data) => http.put(`/categories/cat2/${id}`, data),
  removeCat2: (id) => http.delete(`/categories/cat2/${id}`)
}

export const stylesApi = {
  list: (params) => http.get('/styles', { params }),
  get: (id) => http.get(`/styles/${id}`),
  create: (data) => http.post('/styles', data),
  update: (id, data) => http.put(`/styles/${id}`, data),
  appendEstimates: (id, data) => http.post(`/styles/${id}/append-estimates`, data),
  remove: (id) => http.delete(`/styles/${id}`),
  timeline: (id) => http.get(`/styles/${id}/timeline`)
}

export const stockApi = {
  in: (data) => http.post('/stock/in', data),
  out: (data) => http.post('/stock/out', data),
  outBatch: (data) => http.post('/stock/out/batch', data),
  logs: (params) => http.get('/stock/logs', { params }),
  deleteLog: (id) => http.delete(`/stock/logs/${id}`)
}

export const calcApi = {
  calc: (data) => http.post('/calc', data)
}

export const timelineApi = {
  list: (params) => http.get('/timeline', { params })
}

export const reportsApi = {
  stock: () => http.get('/reports/stock')
}

export const exportUrl = (params) => {
  const wsId = parseInt(localStorage.getItem('workspace_id')) || 1
  const merged = { workspace_id: wsId, ...params }
  const qs = new URLSearchParams(merged).toString()
  return `/api/export/xlsx${qs ? '?' + qs : ''}`
}

export const ocrApi = {
  stockIn: (files) => {
    const fd = new FormData()
    ;(Array.isArray(files) ? files : [files]).filter(Boolean).forEach(file => fd.append('files', file))
    return http.post('/ocr/stock-in', fd)
  },
  stockOut: (files) => {
    const fd = new FormData()
    ;(Array.isArray(files) ? files : [files]).filter(Boolean).forEach(file => fd.append('files', file))
    return http.post('/ocr/stock-out', fd)
  }
}

export const aiSettingsApi = {
  presets: ()     => http.get('/ai-settings/presets'),
  get:     ()     => http.get('/ai-settings'),
  save:    (data) => http.post('/ai-settings', data),
  test:    ()     => http.post('/ai-settings/test')
}

export const authApi = {
  login:          (data) => http.post('/auth/login', data),
  me:             ()     => http.get('/auth/me'),
  changePassword: (data) => http.put('/auth/password', data)
}

export const adminApi = {
  listWorkspaces:  ()         => http.get('/admin/workspaces'),
  createWorkspace: (data)     => http.post('/admin/workspaces', data),
  updateWorkspace: (id, data) => http.put(`/admin/workspaces/${id}`, data),
  deleteWorkspace: (id)       => http.delete(`/admin/workspaces/${id}`),
  listUsers:       ()         => http.get('/admin/users'),
  createUser:      (data)     => http.post('/admin/users', data),
  updateUser:      (id, data) => http.put(`/admin/users/${id}`, data),
  deleteUser:      (id)       => http.delete(`/admin/users/${id}`)
}
