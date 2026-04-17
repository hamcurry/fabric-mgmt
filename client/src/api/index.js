import axios from 'axios'

const http = axios.create({ baseURL: '/api' })

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
  recalcUsage: (id) => http.post(`/styles/${id}/recalculate-usage`),
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
  const qs = new URLSearchParams(params).toString()
  return `/api/export/xlsx${qs ? '?' + qs : ''}`
}

export const ocrApi = {
  stockIn:  (files, opts = {}) => {
    const fd = new FormData()
    ;(Array.isArray(files) ? files : [files]).filter(Boolean).forEach(file => fd.append('files', file))
    if (opts.provider) fd.append('provider', opts.provider)
    return http.post('/ocr/stock-in', fd)
  },
  stockOut: (files, opts = {}) => {
    const fd = new FormData()
    ;(Array.isArray(files) ? files : [files]).filter(Boolean).forEach(file => fd.append('files', file))
    if (opts.provider) fd.append('provider', opts.provider)
    return http.post('/ocr/stock-out', fd)
  }
}

export const aiSettingsApi = {
  presets:     ()     => http.get('/ai-settings/presets'),
  get:         ()     => http.get('/ai-settings'),
  save:        (data) => http.post('/ai-settings', data),
  test:        ()     => http.post('/ai-settings/test'),
  getGlmOcr:   ()     => http.get('/ai-settings/glm-ocr'),
  saveGlmOcr:  (data) => http.post('/ai-settings/glm-ocr', data),
  testGlmOcr:  ()     => http.post('/ai-settings/glm-ocr/test')
}
