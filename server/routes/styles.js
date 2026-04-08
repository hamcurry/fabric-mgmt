const express = require('express')
const router = express.Router()
const db = require('../db')

// materials 查询（复用）
const getMaterials = (styleId) => db.prepare(`
  SELECT sm.id, sm.cat2_id, sm.usage_per_piece,
         c2.name AS cat2_name, c1.id AS cat1_id, c1.name AS cat1_name
  FROM style_materials sm
  JOIN fabric_cat2 c2 ON c2.id = sm.cat2_id
  JOIN fabric_cat1 c1 ON c1.id = c2.cat1_id
  WHERE sm.style_id = ?
`).all(styleId)

// 获取所有款式（不含 image_base64，列表不需要）
router.get('/', (req, res) => {
  const { q } = req.query
  let sql = 'SELECT id,name,customer,note,created_at FROM styles WHERE 1=1'
  const params = []
  if (q) { sql += ' AND (name LIKE ? OR customer LIKE ?)'; params.push(`%${q}%`, `%${q}%`) }
  sql += ' ORDER BY created_at DESC'
  const styles = db.prepare(sql).all(...params)
  const result = styles.map(s => ({ ...s, materials: getMaterials(s.id) }))
  res.json(result)
})

// 获取单个款式（含图片）
router.get('/:id', (req, res) => {
  const style = db.prepare('SELECT * FROM styles WHERE id=?').get(req.params.id)
  if (!style) return res.status(404).json({ error: '款式不存在' })
  style.materials = getMaterials(style.id)
  res.json(style)
})

// 款式时间线：该款式所有出库记录
router.get('/:id/timeline', (req, res) => {
  const style = db.prepare('SELECT id,name FROM styles WHERE id=?').get(req.params.id)
  if (!style) return res.status(404).json({ error: '款式不存在' })
  const logs = db.prepare(`
    SELECT * FROM stock_logs
    WHERE type='out' AND style_id=?
    ORDER BY operated_at DESC
  `).all(req.params.id)
  res.json({ style, logs })
})

// 新建款式
router.post('/', (req, res) => {
  const { name, customer = '', note = '', image_base64 = '', materials = [] } = req.body
  if (!name) return res.status(400).json({ error: '款式名称不能为空' })

  const insertStyle = db.prepare(
    'INSERT INTO styles(name,customer,note,image_base64) VALUES(?,?,?,?)'
  )
  const insertMat = db.prepare(
    'INSERT INTO style_materials(style_id,cat2_id,usage_per_piece) VALUES(?,?,?)'
  )

  const styleId = db.transaction(() => {
    const { lastInsertRowid: id } = insertStyle.run(name, customer, note, image_base64)
    for (const m of materials) {
      if (!m.cat2_id || !m.usage_per_piece) continue
      insertMat.run(id, m.cat2_id, m.usage_per_piece)
    }
    return id
  })()

  res.json({ id: styleId })
})

// 编辑款式（整体替换 materials）
router.put('/:id', (req, res) => {
  const { name, customer = '', note = '', image_base64, materials = [] } = req.body
  const existing = db.prepare('SELECT id,image_base64 FROM styles WHERE id=?').get(req.params.id)
  if (!existing) return res.status(404).json({ error: '款式不存在' })

  // image_base64 未传则保留原来的
  const imgVal = image_base64 !== undefined ? image_base64 : existing.image_base64

  db.transaction(() => {
    db.prepare('UPDATE styles SET name=?,customer=?,note=?,image_base64=? WHERE id=?')
      .run(name, customer, note, imgVal, req.params.id)
    db.prepare('DELETE FROM style_materials WHERE style_id=?').run(req.params.id)
    const insertMat = db.prepare(
      'INSERT INTO style_materials(style_id,cat2_id,usage_per_piece) VALUES(?,?,?)'
    )
    for (const m of materials) {
      if (!m.cat2_id || !m.usage_per_piece) continue
      insertMat.run(req.params.id, m.cat2_id, m.usage_per_piece)
    }
  })()

  res.json({ ok: true })
})

// 删除款式
router.delete('/:id', (req, res) => {
  db.prepare('DELETE FROM styles WHERE id=?').run(req.params.id)
  res.json({ ok: true })
})

module.exports = router
