const express = require('express')
const router = express.Router()
const db = require('../db')
const { withParsedImagesList } = require('../log-utils')
const {
  getMaterials,
  upsertStyleMaterials,
  appendStyleMaterials,
  recalculateStyleEstimatedLogs
} = require('../style-usage')

router.get('/', (req, res) => {
  const { q } = req.query
  let sql = 'SELECT id,name,customer,note,image_base64,created_at FROM styles WHERE 1=1'
  const params = []
  if (q) { sql += ' AND (name LIKE ? OR customer LIKE ?)'; params.push(`%${q}%`, `%${q}%`) }
  sql += ' ORDER BY created_at DESC'
  const styles = db.prepare(sql).all(...params)
  const result = styles.map(s => ({ ...s, materials: getMaterials(s.id) }))
  res.json(result)
})

router.get('/:id', (req, res) => {
  const style = db.prepare('SELECT * FROM styles WHERE id=?').get(req.params.id)
  if (!style) return res.status(404).json({ error: '款式不存在' })
  style.materials = getMaterials(style.id)
  res.json(style)
})

router.get('/:id/timeline', (req, res) => {
  const style = db.prepare('SELECT id,name FROM styles WHERE id=?').get(req.params.id)
  if (!style) return res.status(404).json({ error: '款式不存在' })
  const logs = db.prepare(`
    SELECT * FROM stock_logs
    WHERE type='out' AND style_id=?
    ORDER BY operated_at DESC
  `).all(req.params.id)
  res.json({ style, logs: withParsedImagesList(logs) })
})

router.post('/', (req, res) => {
  const { name, customer = '', note = '', image_base64 = '', materials = [] } = req.body
  if (!name) return res.status(400).json({ error: '款式名称不能为空' })

  const insertStyle = db.prepare(
    'INSERT INTO styles(name,customer,note,image_base64) VALUES(?,?,?,?)'
  )

  const styleId = db.transaction(() => {
    const { lastInsertRowid: id } = insertStyle.run(name, customer, note, image_base64)
    upsertStyleMaterials(id, materials)
    return id
  })()

  res.json({ id: styleId })
})

router.put('/:id', (req, res) => {
  const { name, customer = '', note = '', image_base64, materials = [] } = req.body
  const existing = db.prepare('SELECT id,image_base64 FROM styles WHERE id=?').get(req.params.id)
  if (!existing) return res.status(404).json({ error: '款式不存在' })

  const imgVal = image_base64 !== undefined ? image_base64 : existing.image_base64

  const result = db.transaction(() => {
    db.prepare('UPDATE styles SET name=?,customer=?,note=?,image_base64=? WHERE id=?')
      .run(name, customer, note, imgVal, req.params.id)
    db.prepare('DELETE FROM style_materials WHERE style_id=?').run(req.params.id)
    upsertStyleMaterials(req.params.id, materials)
    return recalculateStyleEstimatedLogs(req.params.id)
  })()

  res.json({ ok: true, recalculated_logs: result })
})

router.post('/:id/append-estimates', (req, res) => {
  const existing = db.prepare('SELECT id FROM styles WHERE id=?').get(req.params.id)
  if (!existing) return res.status(404).json({ error: '款式不存在' })
  const { materials = [] } = req.body
  db.transaction(() => {
    appendStyleMaterials(req.params.id, materials)
  })()
  res.json({ ok: true })
})

router.post('/:id/recalculate-usage', (req, res) => {
  const existing = db.prepare('SELECT id FROM styles WHERE id=?').get(req.params.id)
  if (!existing) return res.status(404).json({ error: '款式不存在' })
  const recalculated = db.transaction(() => recalculateStyleEstimatedLogs(req.params.id))()
  res.json({ ok: true, recalculated_logs: recalculated })
})

router.delete('/:id', (req, res) => {
  db.prepare('DELETE FROM styles WHERE id=?').run(req.params.id)
  res.json({ ok: true })
})

module.exports = router
