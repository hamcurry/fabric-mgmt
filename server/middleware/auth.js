const jwt = require('jsonwebtoken')

const JWT_SECRET = process.env.JWT_SECRET || 'fabric-secret-change-me'

function optionalAuth(req, res, next) {
  const header = req.headers.authorization
  if (!header || !header.startsWith('Bearer ')) {
    req.user = null
    return next()
  }
  try {
    req.user = jwt.verify(header.slice(7), JWT_SECRET)
  } catch {
    req.user = null
  }
  next()
}

function requireAuth(req, res, next) {
  if (!req.user) return res.status(401).json({ error: '请先登录' })
  next()
}

function requireAdmin(req, res, next) {
  if (!req.user) return res.status(401).json({ error: '请先登录' })
  if (req.user.role !== 'admin') return res.status(403).json({ error: '需要管理员权限' })
  next()
}

function resolveWorkspace(req) {
  const wsId = parseInt(req.query.workspace_id || req.body?.workspace_id) || 1
  if (!req.user) return wsId
  if (req.user.role === 'admin') return wsId
  if (req.user.workspaceIds && req.user.workspaceIds.includes(wsId)) return wsId
  return req.user.workspaceIds?.[0] || 1
}

module.exports = { optionalAuth, requireAuth, requireAdmin, resolveWorkspace, JWT_SECRET }
