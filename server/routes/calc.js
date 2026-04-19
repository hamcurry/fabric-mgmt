const express = require('express')
const router = express.Router()
const db = require('../db')
const { getEffectiveMaterials } = require('../style-usage')
const { requireAuth, resolveWorkspace } = require('../middleware/auth')

router.post('/', requireAuth, (req, res) => {
  const { style_id, quantity } = req.body
  if (!style_id || !quantity || quantity <= 0) {
    return res.status(400).json({ error: '参数错误' })
  }

  const style = db.prepare('SELECT id,name FROM styles WHERE id=?').get(style_id)
  if (!style) return res.status(404).json({ error: '款式不存在' })

  const materials = getEffectiveMaterials(style_id)
  if (!materials.length) {
    return res.status(400).json({ error: '该款式未设置面料用量' })
  }

  const usableMaterials = materials.filter(m => m.effective_usage_per_piece != null)
  if (!usableMaterials.length) {
    return res.status(400).json({ error: '该款式暂无可用的实际/客估用量' })
  }

  const wsId = resolveWorkspace(req)
  const getFabrics = db.prepare(`
    SELECT id, color, current_stock, unit, alert_threshold,
           (current_stock <= alert_threshold) AS is_alert
    FROM fabrics WHERE cat2_id = ? AND workspace_id = ?
    ORDER BY current_stock DESC, color
  `)

  const result = usableMaterials.map(m => {
    const required = parseFloat((m.effective_usage_per_piece * quantity).toFixed(3))
    const fabrics = getFabrics.all(m.cat2_id, wsId)
    const totalStock = fabrics.reduce((s, f) => s + f.current_stock, 0)
    return {
      cat2_id: m.cat2_id,
      cat2_name: m.cat2_name,
      cat1_name: m.cat1_name,
      actual_usage_per_piece: m.actual_usage_per_piece,
      estimated_usage_per_piece: m.estimated_usage_per_piece,
      usage_per_piece: m.effective_usage_per_piece,
      usage_source: m.effective_usage_source,
      required,
      total_stock: parseFloat(totalStock.toFixed(3)),
      sufficient: totalStock >= required,
      fabrics
    }
  })

  const { lastInsertRowid: calcId } = db.prepare(
    'INSERT INTO calc_records(style_id,style_name,quantity,result_json,workspace_id) VALUES(?,?,?,?,?)'
  ).run(style_id, style.name, quantity, JSON.stringify(result), wsId)

  res.json({ calc_id: calcId, style, quantity, result })
})

module.exports = router
