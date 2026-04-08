const express = require('express')
const router = express.Router()
const db = require('../db')

// 计算用量（不扣库存）
router.post('/', (req, res) => {
  const { style_id, quantity } = req.body
  if (!style_id || !quantity || quantity <= 0) {
    return res.status(400).json({ error: '参数错误' })
  }

  const style = db.prepare('SELECT id,name FROM styles WHERE id=?').get(style_id)
  if (!style) return res.status(404).json({ error: '款式不存在' })

  // 按 cat2 级别查询用量
  const materials = db.prepare(`
    SELECT sm.cat2_id, sm.usage_per_piece,
           c2.name AS cat2_name, c1.name AS cat1_name
    FROM style_materials sm
    JOIN fabric_cat2 c2 ON c2.id = sm.cat2_id
    JOIN fabric_cat1 c1 ON c1.id = c2.cat1_id
    WHERE sm.style_id = ?
  `).all(style_id)

  if (!materials.length) {
    return res.status(400).json({ error: '该款式未设置面料用量' })
  }

  // 对每个 cat2，查该类目下所有颜色面料的库存
  const getFabrics = db.prepare(`
    SELECT id, color, current_stock, unit, alert_threshold,
           (current_stock <= alert_threshold) AS is_alert
    FROM fabrics WHERE cat2_id = ?
    ORDER BY color
  `)

  const result = materials.map(m => {
    const required = parseFloat((m.usage_per_piece * quantity).toFixed(3))
    const fabrics = getFabrics.all(m.cat2_id)
    const totalStock = fabrics.reduce((s, f) => s + f.current_stock, 0)
    return {
      cat2_id: m.cat2_id,
      cat2_name: m.cat2_name,
      cat1_name: m.cat1_name,
      usage_per_piece: m.usage_per_piece,
      required,
      total_stock: parseFloat(totalStock.toFixed(3)),
      sufficient: totalStock >= required,
      fabrics  // 各颜色明细，出库时选用
    }
  })

  // 存档计算记录
  const { lastInsertRowid: calcId } = db.prepare(
    'INSERT INTO calc_records(style_id,style_name,quantity,result_json) VALUES(?,?,?,?)'
  ).run(style_id, style.name, quantity, JSON.stringify(result))

  res.json({ calc_id: calcId, style, quantity, result })
})

module.exports = router
