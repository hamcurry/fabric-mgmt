const express = require('express')
const router = express.Router()
const db = require('../db')
const { getFabricFullName } = require('./fabrics')
const { serializeImages, sanitizeImages, withParsedImagesList } = require('../log-utils')

const insertStockLog = db.prepare(`
  INSERT INTO stock_logs(
    type,fabric_id,fabric_name,quantity,pieces,style_id,style_name,po_number,note,images_json,
    usage_source,usage_per_piece_snapshot,style_material_cat2_id,calc_snapshot_json
  )
  VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?)
`)

router.post('/in', (req, res) => {
  const { fabric_id, quantity, note = '', images = [] } = req.body
  if (!fabric_id || !quantity || quantity <= 0) {
    return res.status(400).json({ error: '参数错误' })
  }
  const fabric = db.prepare('SELECT * FROM fabrics WHERE id=?').get(fabric_id)
  if (!fabric) return res.status(404).json({ error: '面料不存在' })

  const imagesJson = serializeImages(images)

  db.transaction(() => {
    db.prepare('UPDATE fabrics SET current_stock = current_stock + ? WHERE id=?')
      .run(quantity, fabric_id)
    insertStockLog.run('in', fabric_id, getFabricFullName(fabric_id), quantity, null, null, '', '', note, imagesJson, '', null, null, '')
  })()

  res.json({ ok: true })
})

router.post('/out', (req, res) => {
  const {
    fabric_id,
    quantity,
    style_id,
    po_number = '',
    note = '',
    pieces = null,
    images = [],
    usage_source = '',
    usage_per_piece_snapshot = null,
    style_material_cat2_id = null,
    calc_snapshot = []
  } = req.body
  if (!fabric_id || !quantity || quantity <= 0) {
    return res.status(400).json({ error: '参数错误' })
  }
  if (style_id && !po_number.trim()) {
    return res.status(400).json({ error: '关联款式时 PO 号不能为空' })
  }

  const fabric = db.prepare('SELECT * FROM fabrics WHERE id=?').get(fabric_id)
  if (!fabric) return res.status(404).json({ error: '面料不存在' })

  let styleName = ''
  if (style_id) {
    const style = db.prepare('SELECT name FROM styles WHERE id=?').get(style_id)
    if (!style) return res.status(404).json({ error: '款式不存在' })
    styleName = style.name
  }

  const imagesJson = serializeImages(images)
  const snapshotJson = JSON.stringify(Array.isArray(calc_snapshot) ? calc_snapshot : [])

  try {
    db.transaction(() => {
      if (fabric.current_stock < quantity) throw new Error('库存不足')
      db.prepare('UPDATE fabrics SET current_stock = current_stock - ? WHERE id=?')
        .run(quantity, fabric_id)
      insertStockLog.run(
        'out',
        fabric_id,
        getFabricFullName(fabric_id),
        quantity,
        pieces ?? null,
        style_id || null,
        styleName,
        po_number,
        note,
        imagesJson,
        usage_source || '',
        usage_per_piece_snapshot,
        style_material_cat2_id,
        snapshotJson
      )
    })()
    res.json({ ok: true })
  } catch (e) {
    res.status(400).json({ error: e.message })
  }
})

router.post('/out/batch', (req, res) => {
  const { items, style_id, po_number = '', note = '', images = [] } = req.body
  if (!items || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: '参数错误' })
  }
  if (style_id && !po_number.trim()) {
    return res.status(400).json({ error: '关联款式时 PO 号不能为空' })
  }

  const style = style_id ? db.prepare('SELECT name FROM styles WHERE id=?').get(style_id) : null
  if (style_id && !style) return res.status(404).json({ error: '款式不存在' })
  const styleName = style ? style.name : ''
  const sanitizedImages = sanitizeImages(images)
  const imagesJson = JSON.stringify(sanitizedImages)

  try {
    db.transaction(() => {
      for (const item of items) {
        const fabric = db.prepare('SELECT * FROM fabrics WHERE id=?').get(item.fabric_id)
        if (!fabric) throw new Error(`面料 ID ${item.fabric_id} 不存在`)
        const fullName = getFabricFullName(item.fabric_id)
        db.prepare('UPDATE fabrics SET current_stock = current_stock - ? WHERE id=?')
          .run(item.quantity, item.fabric_id)
        insertStockLog.run(
          'out',
          item.fabric_id,
          fullName,
          item.quantity,
          item.pieces ?? null,
          style_id || null,
          styleName,
          po_number,
          item.note || note,
          imagesJson,
          item.usage_source || '',
          item.usage_per_piece_snapshot ?? null,
          item.style_material_cat2_id ?? null,
          JSON.stringify(Array.isArray(item.calc_snapshot) ? item.calc_snapshot : [])
        )
      }
    })()
    res.json({ ok: true })
  } catch (e) {
    res.status(400).json({ error: e.message })
  }
})

router.delete('/logs/:id', (req, res) => {
  const log = db.prepare('SELECT * FROM stock_logs WHERE id=?').get(req.params.id)
  if (!log) return res.status(404).json({ error: '记录不存在' })
  try {
    db.transaction(() => {
      const delta = log.type === 'in' ? -log.quantity : log.quantity
      db.prepare('UPDATE fabrics SET current_stock = current_stock + ? WHERE id=?')
        .run(delta, log.fabric_id)
      db.prepare('DELETE FROM stock_logs WHERE id=?').run(log.id)
    })()
    res.json({ ok: true })
  } catch (e) {
    res.status(400).json({ error: e.message })
  }
})

router.get('/logs', (req, res) => {
  const { type, fabric_id, style_id, date_from, date_to } = req.query
  let sql = 'SELECT * FROM stock_logs WHERE 1=1'
  const params = []
  if (type) { sql += ' AND type=?'; params.push(type) }
  if (fabric_id) { sql += ' AND fabric_id=?'; params.push(fabric_id) }
  if (style_id) { sql += ' AND style_id=?'; params.push(style_id) }
  if (date_from) { sql += ' AND operated_at >= ?'; params.push(date_from) }
  if (date_to) { sql += ' AND operated_at <= ?'; params.push(date_to + ' 23:59:59') }
  sql += ' ORDER BY operated_at DESC'
  const logs = db.prepare(sql).all(...params)
  res.json(withParsedImagesList(logs))
})

module.exports = router
