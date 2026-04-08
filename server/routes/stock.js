const express = require('express')
const router = express.Router()
const db = require('../db')
const { getFabricFullName } = require('./fabrics')

// 入库
router.post('/in', (req, res) => {
  const { fabric_id, quantity, note = '' } = req.body
  if (!fabric_id || !quantity || quantity <= 0) {
    return res.status(400).json({ error: '参数错误' })
  }
  const fabric = db.prepare('SELECT * FROM fabrics WHERE id=?').get(fabric_id)
  if (!fabric) return res.status(404).json({ error: '面料不存在' })

  db.transaction(() => {
    db.prepare('UPDATE fabrics SET current_stock = current_stock + ? WHERE id=?')
      .run(quantity, fabric_id)
    db.prepare(
      'INSERT INTO stock_logs(type,fabric_id,fabric_name,quantity,note) VALUES(?,?,?,?,?)'
    ).run('in', fabric_id, getFabricFullName(fabric_id), quantity, note)
  })()

  res.json({ ok: true })
})

// 出库（可选关联款式 + PO号）
router.post('/out', (req, res) => {
  const { fabric_id, quantity, style_id, po_number = '', note = '' } = req.body
  if (!fabric_id || !quantity || quantity <= 0) {
    return res.status(400).json({ error: '参数错误' })
  }
  // 如果关联了款式，PO号必填
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

  try {
    db.transaction(() => {
      if (fabric.current_stock < quantity) throw new Error('库存不足')
      db.prepare('UPDATE fabrics SET current_stock = current_stock - ? WHERE id=?')
        .run(quantity, fabric_id)
      db.prepare(`
        INSERT INTO stock_logs(type,fabric_id,fabric_name,quantity,style_id,style_name,po_number,note)
        VALUES(?,?,?,?,?,?,?,?)
      `).run('out', fabric_id, getFabricFullName(fabric_id), quantity, style_id || null, styleName, po_number, note)
    })()
    res.json({ ok: true })
  } catch (e) {
    res.status(400).json({ error: e.message })
  }
})

// 出库（批量，用于用量计算后一键出库）
router.post('/out/batch', (req, res) => {
  const { items, style_id, po_number = '', note = '' } = req.body
  // items: [{fabric_id, quantity}]
  if (!items || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: '参数错误' })
  }
  if (!po_number.trim()) {
    return res.status(400).json({ error: 'PO 号不能为空' })
  }

  const style = style_id ? db.prepare('SELECT name FROM styles WHERE id=?').get(style_id) : null
  const styleName = style ? style.name : ''

  try {
    db.transaction(() => {
      for (const item of items) {
        const fabric = db.prepare('SELECT * FROM fabrics WHERE id=?').get(item.fabric_id)
        if (!fabric) throw new Error(`面料 ID ${item.fabric_id} 不存在`)
        const fullName = getFabricFullName(item.fabric_id)
        if (fabric.current_stock < item.quantity) {
          throw new Error(`面料「${fullName}」库存不足（当前 ${fabric.current_stock}，需要 ${item.quantity}）`)
        }
        db.prepare('UPDATE fabrics SET current_stock = current_stock - ? WHERE id=?')
          .run(item.quantity, item.fabric_id)
        db.prepare(`
          INSERT INTO stock_logs(type,fabric_id,fabric_name,quantity,pieces,style_id,style_name,po_number,note)
          VALUES(?,?,?,?,?,?,?,?,?)
        `).run('out', item.fabric_id, fullName, item.quantity, item.pieces ?? null, style_id || null, styleName, po_number, note)
      }
    })()
    res.json({ ok: true })
  } catch (e) {
    res.status(400).json({ error: e.message })
  }
})

// 删除流水记录（同步回滚库存）
router.delete('/logs/:id', (req, res) => {
  const log = db.prepare('SELECT * FROM stock_logs WHERE id=?').get(req.params.id)
  if (!log) return res.status(404).json({ error: '记录不存在' })
  try {
    db.transaction(() => {
      // 入库删除→库存减回；出库删除→库存加回
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

// 查询出入库流水
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
  res.json(db.prepare(sql).all(...params))
})

module.exports = router
