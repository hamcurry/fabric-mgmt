const express = require('express')
const router = express.Router()
const db = require('../db')
const { withParsedImagesList } = require('../log-utils')

// 全局时间线（入库 + 出库，混合排序）
router.get('/', (req, res) => {
  const { type, fabric_id, style_id, date_from, date_to } = req.query
  let sql = 'SELECT * FROM stock_logs WHERE 1=1'
  const params = []
  if (type) { sql += ' AND type=?'; params.push(type) }
  if (fabric_id) { sql += ' AND fabric_id=?'; params.push(fabric_id) }
  if (style_id) { sql += ' AND style_id=?'; params.push(style_id) }
  if (date_from) { sql += ' AND operated_at >= ?'; params.push(date_from) }
  if (date_to) { sql += ' AND operated_at <= ?'; params.push(date_to + ' 23:59:59') }
  sql += ' ORDER BY operated_at DESC'
  res.json(withParsedImagesList(db.prepare(sql).all(...params)))
})

module.exports = router
