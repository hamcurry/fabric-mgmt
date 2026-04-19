const express = require('express')
const router = express.Router()
const bcrypt = require('bcryptjs')
const db = require('../db')
const { requireAdmin } = require('../middleware/auth')

router.use(requireAdmin)

// ── Workspaces ──
router.get('/workspaces', (req, res) => {
  res.json(db.prepare('SELECT id, name, note, created_at FROM workspaces ORDER BY id').all())
})

router.post('/workspaces', (req, res) => {
  const { name, note = '' } = req.body
  if (!name) return res.status(400).json({ error: '名称不能为空' })
  try {
    const r = db.prepare('INSERT INTO workspaces(name, note) VALUES(?, ?)').run(name, note)
    res.json({ id: r.lastInsertRowid })
  } catch {
    res.status(400).json({ error: '名称已存在' })
  }
})

router.put('/workspaces/:id', (req, res) => {
  const { name, note = '' } = req.body
  if (!name) return res.status(400).json({ error: '名称不能为空' })
  db.prepare('UPDATE workspaces SET name=?, note=? WHERE id=?').run(name, note, req.params.id)
  res.json({ ok: true })
})

router.delete('/workspaces/:id', (req, res) => {
  if (Number(req.params.id) === 1) return res.status(400).json({ error: '不能删除默认仓库' })
  db.prepare('DELETE FROM workspaces WHERE id=?').run(req.params.id)
  res.json({ ok: true })
})

// ── Users ──
router.get('/users', (req, res) => {
  const users = db.prepare('SELECT id, username, role, created_at FROM users ORDER BY id').all()
  const wsRows = db.prepare('SELECT user_id, workspace_id FROM user_workspaces').all()
  const wsMap = {}
  for (const r of wsRows) {
    wsMap[r.user_id] = wsMap[r.user_id] || []
    wsMap[r.user_id].push(r.workspace_id)
  }
  res.json(users.map(u => ({ ...u, workspaceIds: wsMap[u.id] || [] })))
})

router.post('/users', (req, res) => {
  const { username, password, role = 'user', workspaceIds = [] } = req.body
  if (!username || !password) return res.status(400).json({ error: '参数不完整' })
  const hash = bcrypt.hashSync(password, 10)
  try {
    const r = db.prepare('INSERT INTO users(username, password_hash, role) VALUES(?, ?, ?)').run(username, hash, role)
    const userId = r.lastInsertRowid
    const ins = db.prepare('INSERT OR IGNORE INTO user_workspaces(user_id, workspace_id) VALUES(?, ?)')
    for (const wsId of workspaceIds) ins.run(userId, wsId)
    res.json({ id: userId })
  } catch {
    res.status(400).json({ error: '用户名已存在' })
  }
})

router.put('/users/:id', (req, res) => {
  const { password, role, workspaceIds } = req.body
  if (password) {
    db.prepare('UPDATE users SET password_hash=? WHERE id=?').run(bcrypt.hashSync(password, 10), req.params.id)
  }
  if (role) {
    db.prepare('UPDATE users SET role=? WHERE id=?').run(role, req.params.id)
  }
  if (Array.isArray(workspaceIds)) {
    db.prepare('DELETE FROM user_workspaces WHERE user_id=?').run(req.params.id)
    const ins = db.prepare('INSERT OR IGNORE INTO user_workspaces(user_id, workspace_id) VALUES(?, ?)')
    for (const wsId of workspaceIds) ins.run(req.params.id, wsId)
  }
  res.json({ ok: true })
})

router.delete('/users/:id', (req, res) => {
  if (Number(req.params.id) === req.user.id) return res.status(400).json({ error: '不能删除自己' })
  db.prepare('DELETE FROM users WHERE id=?').run(req.params.id)
  res.json({ ok: true })
})

module.exports = router
