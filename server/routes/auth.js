const express = require('express')
const router = express.Router()
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const db = require('../db')
const { JWT_SECRET, requireAuth } = require('../middleware/auth')

function getUserWorkspaceIds(userId) {
  return db.prepare('SELECT workspace_id FROM user_workspaces WHERE user_id=?')
    .all(userId).map(r => r.workspace_id)
}

router.post('/login', (req, res) => {
  const { username, password } = req.body
  if (!username || !password) return res.status(400).json({ error: '参数不完整' })
  const user = db.prepare('SELECT * FROM users WHERE username=?').get(username)
  if (!user || !bcrypt.compareSync(password, user.password_hash)) {
    return res.status(401).json({ error: '用户名或密码错误' })
  }
  const workspaceIds = getUserWorkspaceIds(user.id)
  const payload = { id: user.id, username: user.username, role: user.role, workspaceIds }
  const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' })
  res.json({ token, user: { id: user.id, username: user.username, role: user.role, workspaceIds } })
})

router.get('/me', requireAuth, (req, res) => {
  const workspaceIds = getUserWorkspaceIds(req.user.id)
  res.json({ id: req.user.id, username: req.user.username, role: req.user.role, workspaceIds })
})

// 返回当前用户可访问的仓库列表（WorkspaceSwitcher 用，访客返回全部）
router.get('/workspaces', (req, res) => {
  if (!req.user) {
    return res.json(db.prepare('SELECT id, name FROM workspaces ORDER BY id').all())
  }
  if (req.user.role === 'admin') {
    return res.json(db.prepare('SELECT id, name FROM workspaces ORDER BY id').all())
  }
  const ids = getUserWorkspaceIds(req.user.id)
  if (!ids.length) return res.json([])
  const placeholders = ids.map(() => '?').join(',')
  res.json(db.prepare(`SELECT id, name FROM workspaces WHERE id IN (${placeholders}) ORDER BY id`).all(...ids))
})

// 修改自己的密码
router.put('/password', requireAuth, (req, res) => {
  const { old_password, new_password } = req.body
  if (!old_password || !new_password) return res.status(400).json({ error: '参数不完整' })
  if (new_password.length < 4) return res.status(400).json({ error: '新密码至少4位' })
  const user = db.prepare('SELECT * FROM users WHERE id=?').get(req.user.id)
  if (!user || !bcrypt.compareSync(old_password, user.password_hash)) {
    return res.status(401).json({ error: '当前密码错误' })
  }
  db.prepare('UPDATE users SET password_hash=? WHERE id=?').run(bcrypt.hashSync(new_password, 10), req.user.id)
  res.json({ ok: true })
})

module.exports = router
