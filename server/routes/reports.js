const express = require('express')
const router = express.Router()
const db = require('../db')

// 库存汇总（含分类名称）
router.get('/stock', (req, res) => {
  const fabrics = db.prepare(`
    SELECT f.*,
           c2.name AS cat2_name,
           c1.name AS cat1_name,
           (c1.name || '/' || c2.name || CASE WHEN f.color != '' THEN '·' || f.color ELSE '' END) AS name,
           (f.current_stock <= f.alert_threshold) AS is_alert
    FROM fabrics f
    JOIN fabric_cat2 c2 ON c2.id = f.cat2_id
    JOIN fabric_cat1 c1 ON c1.id = c2.cat1_id
    ORDER BY c1.sort, c1.id, c2.sort, c2.id, f.color
  `).all()
  res.json(fabrics)
})

module.exports = router
