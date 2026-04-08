const express = require('express')
const cors = require('cors')
const path = require('path')
const app = express()

app.use(cors())
app.use(express.json())

app.use('/api/fabrics',    require('./routes/fabrics'))
app.use('/api/categories', require('./routes/categories'))
app.use('/api/styles',   require('./routes/styles'))
app.use('/api/stock',    require('./routes/stock'))
app.use('/api/calc',     require('./routes/calc'))
app.use('/api/timeline', require('./routes/timeline'))
app.use('/api/reports',  require('./routes/reports'))
app.use('/api/export',   require('./routes/export'))

// 托管前端构建产物（生产模式 / PM2 模式）
const distPath = path.join(__dirname, '../client/dist')
app.use(express.static(distPath))
app.get('*', (req, res) => {
  res.sendFile(path.join(distPath, 'index.html'))
})

const PORT = process.env.PORT || 3000
app.listen(PORT, () => console.log(`Server running at http://localhost:${PORT}`))
