const express = require('express')
const router = express.Router()
const path = require('path')
const fs = require('fs')
const db = require('../db')
const { requireAdmin } = require('../middleware/auth')

const DB_PATH = process.env.DB_PATH || path.join(__dirname, '../fabric.db')

// Download database backup
router.get('/download', (req, res) => {
  try { db.pragma('wal_checkpoint(TRUNCATE)') } catch (e) {}
  const date = new Date().toISOString().slice(0, 10)
  const filename = `fabric-backup-${date}.db`
  res.download(DB_PATH, filename, (err) => {
    if (err && !res.headersSent) res.status(500).json({ error: err.message })
  })
})

// Restore database from uploaded file
router.post('/restore', requireAdmin, express.raw({ type: 'application/octet-stream', limit: '200mb' }), (req, res) => {
  if (!Buffer.isBuffer(req.body) || req.body.length < 100) {
    return res.status(400).json({ error: 'Invalid file' })
  }
  // Validate SQLite magic header
  const magic = req.body.slice(0, 15).toString('ascii')
  if (magic !== 'SQLite format 3') {
    return res.status(400).json({ error: 'Not a valid SQLite database file' })
  }
  try {
    db.close()
    fs.writeFileSync(DB_PATH, req.body)
    res.json({ ok: true })
    // Exit so PM2 / Docker restart=unless-stopped brings it back with the new data
    setTimeout(() => process.exit(0), 300)
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

module.exports = router
