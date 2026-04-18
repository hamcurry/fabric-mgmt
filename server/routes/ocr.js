const express = require('express')
const router = express.Router()
const multer = require('multer')
const ExcelJS = require('exceljs')
const { getConfig, isConfigured } = require('../ai-config')
const { sanitizeImages } = require('../log-utils')

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 20 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'application/pdf']
    cb(null, allowed.includes(file.mimetype))
  }
})

const STOCK_IN_PROMPT = `你是一个仓库管理助手，负责从来料单图片中提取结构化信息。
请只返回 JSON，不要输出 markdown 代码块或解释说明。

格式：
{
  "supplier": "供应商名称，未识别到则为空字符串",
  "items": [
    {
      "fabric_type": "面料品类或名称线索，如色丁、雪纺、棉布",
      "color": "颜色，未识别到则为空字符串",
      "quantity": 120.5,
      "unit": "单位，如米、码、公斤，默认米",
      "note": "备注，如批次号，未识别到则为空字符串"
    }
  ]
}

要求：
- items 必须是数组，即使只有一条
- quantity 必须是数字，无法识别时填 0
- unit 无法识别时填 "米"
- 不要添加任何解释性文本`

const STOCK_OUT_PROMPT = `你是一个服装工厂仓库助手，负责从出货单、生产单或订单图片中提取结构化信息。
请只返回 JSON，不要输出 markdown 代码块或解释说明。

格式：
{
  "style_name": "款号，未识别到则为空字符串",
  "po_number": "PO号或订单号，未识别到则为空字符串",
  "colors": [
    {
      "color": "颜色名称",
      "pieces": 120
    }
  ],
  "usage_items": [
    {
      "fabric_type": "面料名称或品类线索，未识别到则为空字符串",
      "color": "颜色，未识别到则为空字符串",
      "quantity": 35.5,
      "unit": "单位，如米、码、公斤，默认米",
      "note": "备注，未识别到则为空字符串"
    }
  ],
  "style_image_region": {
    "found": true,
    "x": 0.6,
    "y": 0.05,
    "w": 0.35,
    "h": 0.4
  }
}

要求：
- colors 和 usage_items 都必须是数组
- 如果图片里出现颜色件数，请尽量提取到 colors
- 如果图片里出现面料用量、裁数、需求数、实际出库量等，请尽量提取到 usage_items
- pieces 必须是整数，无法识别时填 0
- quantity 必须是数字，无法识别时填 0
- unit 无法识别时填 "米"
- style_image_region：如果图片中包含服装/款式效果图或产品照片，返回其在整张图中的位置（归一化坐标0-1，x/y为左上角，w/h为宽高）；如果没有产品图则 found 填 false，其余字段省略
- 不要添加任何解释性文本`

async function callAI(file, prompt, cfgOverride) {
  const cfg = cfgOverride || (() => {
    if (!isConfigured()) throw new Error('AI 未配置，请先在”备份/设置”页配置 API Key 和模型')
    return getConfig()
  })()
  const base64 = file.buffer.toString('base64')
  const isPdf = file.mimetype === 'application/pdf'

  if (cfg.sdk_type === 'anthropic') {
    const Anthropic = require('@anthropic-ai/sdk')
    const client = new Anthropic({ apiKey: cfg.api_key })

    const contentBlock = isPdf
      ? { type: 'document', source: { type: 'base64', media_type: 'application/pdf', data: base64 } }
      : { type: 'image', source: { type: 'base64', media_type: file.mimetype, data: base64 } }

    const params = {
      model: cfg.model,
      max_tokens: 2048,
      messages: [{ role: 'user', content: [contentBlock, { type: 'text', text: prompt }] }]
    }
    if (isPdf) params.betas = ['pdfs-2024-09-25']

    const msg = await client.messages.create(params)
    return msg.content[0].text
  }

  const OpenAI = require('openai')
  const client = new OpenAI({
    apiKey: cfg.api_key || 'none',
    baseURL: cfg.base_url || undefined
  })

  if (isPdf) {
    throw new Error('当前 AI 供应商不支持 PDF，请将 PDF 转为图片后上传，或改用 Anthropic Claude')
  }

  const resp = await client.chat.completions.create({
    model: cfg.model,
    max_tokens: 2048,
    messages: [{
      role: 'user',
      content: [
        { type: 'image_url', image_url: { url: `data:${file.mimetype};base64,${base64}` } },
        { type: 'text', text: prompt }
      ]
    }]
  })
  const choice = resp.choices[0]
  if (!choice.message.content && choice.message.refusal) {
    throw new Error(`模型拒绝处理：${choice.message.refusal}`)
  }
  if (!choice.message.content) {
    console.error('[OCR] empty response:', JSON.stringify({ finish_reason: choice.finish_reason, message: choice.message }))
    throw new Error(`模型返回空内容（finish_reason: ${choice.finish_reason}）`)
  }
  return choice.message.content
}

function parseJSON(raw) {
  const cleaned = (raw || '').replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/i, '').trim()
  if (!cleaned) throw new Error(`模型返回空内容（原始：${JSON.stringify(raw?.slice(0, 200))}）`)
  try {
    return JSON.parse(cleaned)
  } catch (e) {
    throw new Error(`JSON 解析失败：${e.message}（原始内容：${JSON.stringify(cleaned.slice(0, 300))}）`)
  }
}

function normalizeStockInItem(item = {}) {
  return {
    fabric_type: String(item.fabric_type || '').trim(),
    color: String(item.color || '').trim(),
    quantity: Number(item.quantity) || 0,
    unit: String(item.unit || '米').trim() || '米',
    note: String(item.note || '').trim()
  }
}

function normalizeStockOutColor(item = {}) {
  return {
    color: String(item.color || '').trim(),
    pieces: Math.max(0, parseInt(item.pieces, 10) || 0)
  }
}

function normalizeUsageItem(item = {}) {
  return {
    fabric_type: String(item.fabric_type || '').trim(),
    color: String(item.color || '').trim(),
    quantity: Number(item.quantity) || 0,
    unit: String(item.unit || '米').trim() || '米',
    note: String(item.note || '').trim()
  }
}

function buildSourceImages(files = []) {
  return sanitizeImages(files.map(file => ({
    name: file.originalname || '',
    mime_type: file.mimetype || '',
    data_base64: file.buffer.toString('base64')
  })))
}

function mergeStockInItems(items = []) {
  const merged = new Map()
  for (const rawItem of items) {
    const item = normalizeStockInItem(rawItem)
    const key = [item.fabric_type, item.color, item.unit].join('||').toLowerCase()
    const existing = merged.get(key)
    if (existing) {
      existing.quantity = parseFloat((existing.quantity + item.quantity).toFixed(3))
      if (item.note) {
        existing.note = existing.note ? `${existing.note}；${item.note}` : item.note
      }
    } else {
      merged.set(key, { ...item })
    }
  }
  return [...merged.values()]
}

function normalizeStyleImageRegion(regions = []) {
  for (const r of regions) {
    if (!r || !r.found) continue
    const x = Number(r.x), y = Number(r.y), w = Number(r.w), h = Number(r.h)
    if ([x, y, w, h].every(v => Number.isFinite(v) && v >= 0 && v <= 1) && w > 0.01 && h > 0.01) {
      return { found: true, x, y, w, h }
    }
  }
  return null
}

function detectStockOutMode(data, allResults) {
  const usageItems = Array.isArray(data.usage_items) ? data.usage_items.map(normalizeUsageItem) : []
  const hasUsage = usageItems.some(item => item.quantity > 0)
  const colors = Array.isArray(data.colors) ? data.colors.map(normalizeStockOutColor) : []
  const styleImageBbox = normalizeStyleImageRegion(
    allResults.map(r => r.style_image_region).filter(Boolean)
  )
  return {
    style_name: String(data.style_name || '').trim(),
    po_number: String(data.po_number || '').trim(),
    colors,
    usage_items: usageItems,
    recognized_mode: hasUsage ? 'usage' : 'style_colors',
    style_image_bbox: styleImageBbox
  }
}

async function recognizeFiles(files, prompt, cfgOverride) {
  const results = []
  for (const file of files) {
    const raw = await callAI(file, prompt, cfgOverride)
    results.push(parseJSON(raw))
  }
  return results
}

router.post('/stock-in', upload.array('files', 10), async (req, res) => {
  const files = req.files || []
  if (!files.length) return res.status(400).json({ error: '请上传图片或 PDF 文件' })
  try {
    const results = await recognizeFiles(files, STOCK_IN_PROMPT, null)
    const supplier = results.map(r => String(r.supplier || '').trim()).find(Boolean) || ''
    const items = mergeStockInItems(results.flatMap(r => Array.isArray(r.items) ? r.items : []))
    res.json({
      supplier,
      items,
      source_images: buildSourceImages(files)
    })
  } catch (e) {
    res.status(500).json({ error: 'OCR识别失败：' + e.message })
  }
})

router.post('/stock-out', upload.array('files', 10), async (req, res) => {
  const files = req.files || []
  if (!files.length) return res.status(400).json({ error: '请上传图片或 PDF 文件' })
  try {
    const results = await recognizeFiles(files, STOCK_OUT_PROMPT, null)
    const merged = {
      style_name: results.map(r => String(r.style_name || '').trim()).find(Boolean) || '',
      po_number: results.map(r => String(r.po_number || '').trim()).find(Boolean) || '',
      colors: results.flatMap(r => Array.isArray(r.colors) ? r.colors : []).map(normalizeStockOutColor),
      usage_items: results.flatMap(r => Array.isArray(r.usage_items) ? r.usage_items : []).map(normalizeUsageItem)
    }
    const normalized = detectStockOutMode(merged, results)
    res.json({
      ...normalized,
      source_images: buildSourceImages(files)
    })
  } catch (e) {
    res.status(500).json({ error: 'OCR识别失败：' + e.message })
  }
})

router.post('/stock-in/export', express.json(), async (req, res) => {
  const { supplier = '', scan_time = '', items = [] } = req.body
  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: '无可导出的数据' })
  }

  const wb = new ExcelJS.Workbook()
  const ws = wb.addWorksheet('来料单识别结果')

  ws.columns = [
    { header: '扫描时间', key: 'scan_time', width: 22 },
    { header: '供应商', key: 'supplier', width: 18 },
    { header: '面料品类', key: 'fabric_type', width: 16 },
    { header: '颜色', key: 'color', width: 12 },
    { header: '数量', key: 'quantity', width: 10 },
    { header: '单位', key: 'unit', width: 8 },
    { header: '备注', key: 'note', width: 24 }
  ]
  ws.getRow(1).font = { bold: true }

  for (const item of items) {
    ws.addRow({
      scan_time,
      supplier,
      fabric_type: item.fabric_type || '',
      color: item.color || '',
      quantity: item.quantity || 0,
      unit: item.unit || '米',
      note: item.note || ''
    })
  }

  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
  res.setHeader('Content-Disposition', `attachment; filename="stock_in_ocr_${Date.now()}.xlsx"`)
  await wb.xlsx.write(res)
  res.end()
})

module.exports = router
