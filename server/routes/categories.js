const express = require('express')
const router = express.Router()
const db = require('../db')
const { requireAuth, resolveWorkspace } = require('../middleware/auth')

// 获取完整分类树（cat1 + cat2）
router.get('/', (req, res) => {
  const wsId = resolveWorkspace(req)
  const cat1List = db.prepare('SELECT * FROM fabric_cat1 WHERE workspace_id=? ORDER BY sort, id').all(wsId)
  const cat2List = db.prepare('SELECT * FROM fabric_cat2 WHERE workspace_id=? ORDER BY sort, id').all(wsId)
  const tree = cat1List.map(c1 => ({
    ...c1,
    children: cat2List.filter(c2 => c2.cat1_id === c1.id)
  }))
  res.json(tree)
})

// 新增一级类目
router.post('/cat1', requireAuth, (req, res) => {
  const { name } = req.body
  if (!name) return res.status(400).json({ error: '类目名不能为空' })
  const wsId = resolveWorkspace(req)
  try {
    const r = db.prepare('INSERT INTO fabric_cat1(name, workspace_id) VALUES(?,?)').run(name, wsId)
    res.json({ id: r.lastInsertRowid })
  } catch (e) {
    res.status(400).json({ error: '类目名已存在' })
  }
})

// 编辑一级类目
router.put('/cat1/:id', requireAuth, (req, res) => {
  const { name } = req.body
  db.prepare('UPDATE fabric_cat1 SET name=? WHERE id=?').run(name, req.params.id)
  res.json({ ok: true })
})

// 删除一级类目（连带删二级和面料）
router.delete('/cat1/:id', requireAuth, (req, res) => {
  const used = db.prepare(`
    SELECT f.id FROM fabrics f
    JOIN fabric_cat2 c2 ON c2.id = f.cat2_id
    WHERE c2.cat1_id = ?
  `).get(req.params.id)
  if (used) return res.status(400).json({ error: '该类目下有面料记录，无法删除' })
  db.prepare('DELETE FROM fabric_cat1 WHERE id=?').run(req.params.id)
  res.json({ ok: true })
})

// 新增二级类目
router.post('/cat2', requireAuth, (req, res) => {
  const { cat1_id, name } = req.body
  if (!cat1_id || !name) return res.status(400).json({ error: '参数不完整' })
  const wsId = resolveWorkspace(req)
  const r = db.prepare('INSERT INTO fabric_cat2(cat1_id, name, workspace_id) VALUES(?,?,?)').run(cat1_id, name, wsId)
  res.json({ id: r.lastInsertRowid })
})

// 编辑二级类目
router.put('/cat2/:id', requireAuth, (req, res) => {
  const { name } = req.body
  db.prepare('UPDATE fabric_cat2 SET name=? WHERE id=?').run(name, req.params.id)
  res.json({ ok: true })
})

// 删除二级类目
router.delete('/cat2/:id', requireAuth, (req, res) => {
  const used = db.prepare('SELECT id FROM fabrics WHERE cat2_id=?').get(req.params.id)
  if (used) return res.status(400).json({ error: '该类目下有面料记录，无法删除' })
  db.prepare('DELETE FROM fabric_cat2 WHERE id=?').run(req.params.id)
  res.json({ ok: true })
})

module.exports = router
