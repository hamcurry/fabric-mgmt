const express = require('express')
const router = express.Router()
const db = require('../db')
const { requireAuth, resolveWorkspace } = require('../middleware/auth')

function parseImages(row) {
  try {
    const arr = JSON.parse(row.images_json || '[]')
    if (arr.length) return arr
  } catch {}
  return row.image_base64 ? [row.image_base64] : []
}

// 查询面料（返回带完整分类路径的列表）
router.get('/', (req, res) => {
  const { cat1_id, cat2_id } = req.query
  const wsId = resolveWorkspace(req)
  let sql = `
    SELECT f.id, f.cat2_id, f.color, f.unit, f.current_stock, f.alert_threshold, f.created_at,
           f.image_base64, f.images_json,
           c2.name AS cat2_name, c2.cat1_id,
           c1.name AS cat1_name,
           (f.current_stock <= f.alert_threshold) AS is_alert
    FROM fabrics f
    JOIN fabric_cat2 c2 ON c2.id = f.cat2_id
    JOIN fabric_cat1 c1 ON c1.id = c2.cat1_id
    WHERE f.workspace_id=?
  `
  const params = [wsId]
  if (cat2_id) { sql += ' AND f.cat2_id=?'; params.push(cat2_id) }
  else if (cat1_id) { sql += ' AND c2.cat1_id=?'; params.push(cat1_id) }
  sql += ' ORDER BY c1.sort, c1.id, c2.sort, c2.id, f.color'
  const rows = db.prepare(sql).all(...params)
  res.json(rows.map(r => ({ ...r, images: parseImages(r) })))
})

// 获取分组树（用于前端树状展示）
router.get('/tree', (req, res) => {
  const wsId = resolveWorkspace(req)
  const rows = db.prepare(`
    SELECT f.id, f.cat2_id, f.color, f.unit, f.current_stock, f.alert_threshold, f.created_at,
           f.image_base64, f.images_json,
           c2.name AS cat2_name, c2.cat1_id,
           c1.name AS cat1_name,
           (f.current_stock <= f.alert_threshold) AS is_alert
    FROM fabrics f
    JOIN fabric_cat2 c2 ON c2.id = f.cat2_id
    JOIN fabric_cat1 c1 ON c1.id = c2.cat1_id
    WHERE f.workspace_id=?
    ORDER BY c1.sort, c1.id, c2.sort, c2.id, f.color
  `).all(wsId)

  const cat1Map = {}
  for (const row of rows) {
    if (!cat1Map[row.cat1_id]) {
      cat1Map[row.cat1_id] = { id: row.cat1_id, name: row.cat1_name, children: {} }
    }
    const c1 = cat1Map[row.cat1_id]
    if (!c1.children[row.cat2_id]) {
      c1.children[row.cat2_id] = { id: row.cat2_id, name: row.cat2_name, fabrics: [] }
    }
    c1.children[row.cat2_id].fabrics.push({
      id: row.id,
      color: row.color,
      unit: row.unit,
      current_stock: row.current_stock,
      alert_threshold: row.alert_threshold,
      is_alert: row.is_alert,
      created_at: row.created_at,
      image_base64: row.image_base64 || '',
      images: parseImages(row),
      full_name: `${row.cat1_name} / ${row.cat2_name} / ${row.color || '无颜色'}`
    })
  }

  const tree = Object.values(cat1Map).map(c1 => ({
    ...c1,
    children: Object.values(c1.children)
  }))
  res.json(tree)
})

// 新建面料
router.post('/', requireAuth, (req, res) => {
  const { cat2_id, color = '', unit = '米', current_stock = 0, alert_threshold = 20, images = [], image_base64 = '' } = req.body
  if (!cat2_id) return res.status(400).json({ error: '请选择二级类目' })
  const wsId = resolveWorkspace(req)
  const imgs = images.length ? images : (image_base64 ? [image_base64] : [])
  const r = db.prepare(
    'INSERT INTO fabrics(cat2_id,color,unit,current_stock,alert_threshold,image_base64,images_json,workspace_id) VALUES(?,?,?,?,?,?,?,?)'
  ).run(cat2_id, color, unit, current_stock, alert_threshold, imgs[0] || '', JSON.stringify(imgs), wsId)
  res.json({ id: r.lastInsertRowid })
})

// 编辑面料
router.put('/:id', requireAuth, (req, res) => {
  const { cat2_id, color, unit, current_stock, alert_threshold, images, image_base64 } = req.body
  const existing = db.prepare('SELECT id,image_base64,images_json FROM fabrics WHERE id=?').get(req.params.id)
  if (!existing) return res.status(404).json({ error: '面料不存在' })

  let imgs
  if (images !== undefined) {
    imgs = images
  } else if (image_base64 !== undefined) {
    imgs = image_base64 ? [image_base64] : []
  } else {
    imgs = parseImages(existing)
  }

  db.prepare(
    'UPDATE fabrics SET cat2_id=?,color=?,unit=?,current_stock=?,alert_threshold=?,image_base64=?,images_json=? WHERE id=?'
  ).run(cat2_id, color, unit, current_stock, alert_threshold, imgs[0] || '', JSON.stringify(imgs), req.params.id)
  res.json({ ok: true })
})

// 删除面料
router.delete('/:id', requireAuth, (req, res) => {
  const usedInLog = db.prepare('SELECT id FROM stock_logs WHERE fabric_id=?').get(req.params.id)
  if (usedInLog) return res.status(400).json({ error: '该面料存在入出库记录，无法删除' })
  try {
    db.prepare('DELETE FROM fabrics WHERE id=?').run(req.params.id)
    res.json({ ok: true })
  } catch (e) {
    res.status(500).json({ error: '删除失败：' + e.message })
  }
})

// 工具函数：获取面料的完整显示名（供其他 route 调用）
function getFabricFullName(fabricId) {
  const row = db.prepare(`
    SELECT c1.name AS c1, c2.name AS c2, f.color
    FROM fabrics f
    JOIN fabric_cat2 c2 ON c2.id = f.cat2_id
    JOIN fabric_cat1 c1 ON c1.id = c2.cat1_id
    WHERE f.id = ?
  `).get(fabricId)
  if (!row) return ''
  return `${row.c1}/${row.c2}${row.color ? '·' + row.color : ''}`
}

module.exports = router
module.exports.getFabricFullName = getFabricFullName
