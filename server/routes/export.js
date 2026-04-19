const express = require('express')
const router = express.Router()
const db = require('../db')
const ExcelJS = require('exceljs')
const { resolveWorkspace } = require('../middleware/auth')

// 导出出入库流水 Excel
router.get('/xlsx', async (req, res) => {
  const { type, fabric_id, style_id, date_from, date_to } = req.query
  const wsId = resolveWorkspace(req)
  let sql = 'SELECT * FROM stock_logs WHERE workspace_id=?'
  const params = [wsId]
  if (type) { sql += ' AND type=?'; params.push(type) }
  if (fabric_id) { sql += ' AND fabric_id=?'; params.push(fabric_id) }
  if (style_id) { sql += ' AND style_id=?'; params.push(style_id) }
  if (date_from) { sql += ' AND operated_at >= ?'; params.push(date_from) }
  if (date_to) { sql += ' AND operated_at <= ?'; params.push(date_to + ' 23:59:59') }
  sql += ' ORDER BY operated_at DESC'
  const logs = db.prepare(sql).all(...params)

  const wb = new ExcelJS.Workbook()
  const ws = wb.addWorksheet('出入库流水')
  ws.columns = [
    { header: '时间', key: 'operated_at', width: 20 },
    { header: '类型', key: 'type', width: 8 },
    { header: '面料', key: 'fabric_name', width: 16 },
    { header: '数量', key: 'quantity', width: 10 },
    { header: '关联款式', key: 'style_name', width: 20 },
    { header: 'PO 号', key: 'po_number', width: 18 },
    { header: '备注', key: 'note', width: 24 }
  ]
  ws.getRow(1).font = { bold: true }

  for (const log of logs) {
    ws.addRow({ ...log, type: log.type === 'in' ? '入库' : '出库' })
  }

  const ws2 = wb.addWorksheet('库存汇总')
  ws2.columns = [
    { header: '面料名称', key: 'name', width: 16 },
    { header: '颜色', key: 'color', width: 10 },
    { header: '单位', key: 'unit', width: 8 },
    { header: '当前库存', key: 'current_stock', width: 12 },
    { header: '预警阈值', key: 'alert_threshold', width: 12 },
    { header: '是否预警', key: 'is_alert', width: 10 }
  ]
  ws2.getRow(1).font = { bold: true }
  const fabrics = db.prepare(`
    SELECT f.*,
           (c1.name || '/' || c2.name || CASE WHEN f.color != '' THEN '·' || f.color ELSE '' END) AS name,
           (f.current_stock <= f.alert_threshold) AS is_alert
    FROM fabrics f
    JOIN fabric_cat2 c2 ON c2.id = f.cat2_id
    JOIN fabric_cat1 c1 ON c1.id = c2.cat1_id
    WHERE f.workspace_id=?
    ORDER BY c1.sort, c1.id, c2.sort, c2.id, f.color
  `).all(wsId)
  for (const f of fabrics) {
    ws2.addRow({ ...f, is_alert: f.is_alert ? '⚠️ 预警' : '正常' })
  }

  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
  res.setHeader('Content-Disposition', `attachment; filename="fabric_report_${Date.now()}.xlsx"`)
  await wb.xlsx.write(res)
  res.end()
})

module.exports = router
