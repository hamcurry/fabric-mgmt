const express = require('express')
const router = express.Router()
const { getConfig, saveConfig, PRESETS } = require('../ai-config')

// 返回预设列表（供前端下拉用）
router.get('/presets', (req, res) => {
  res.json(PRESETS)
})

// 读取当前配置（API Key 脱敏显示）
router.get('/', (req, res) => {
  const c = getConfig()
  res.json({
    preset:    c.preset    || '',
    sdk_type:  c.sdk_type  || 'openai',
    api_key:   c.api_key   ? '***' : '',
    base_url:  c.base_url  || '',
    model:     c.model     || ''
  })
})

// 保存配置
router.post('/', express.json(), (req, res) => {
  const { preset, sdk_type, api_key, base_url, model } = req.body
  const current = getConfig()

  saveConfig({
    preset:   preset   || '',
    sdk_type: sdk_type || 'openai',
    // '***' 表示前端未修改，保留旧值
    api_key:  api_key === '***' ? current.api_key : (api_key || ''),
    base_url: base_url || '',
    model:    model    || ''
  })
  res.json({ ok: true })
})

// 测试连接：发一条简单文字消息验证 API 是否可用
router.post('/test', express.json(), async (req, res) => {
  const { getConfig } = require('../ai-config')
  const c = getConfig()
  if (!c.api_key || !c.model) {
    return res.status(400).json({ error: '请先保存 API Key 和模型名称' })
  }

  try {
    let reply = ''

    if (c.sdk_type === 'anthropic') {
      const Anthropic = require('@anthropic-ai/sdk')
      const client = new Anthropic({ apiKey: c.api_key })
      const msg = await client.messages.create({
        model: c.model,
        max_tokens: 20,
        messages: [{ role: 'user', content: '请回复"OK"' }]
      })
      reply = msg.content[0].text

    } else {
      const OpenAI = require('openai')
      const client = new OpenAI({
        apiKey: c.api_key,
        baseURL: c.base_url || undefined
      })
      const resp = await client.chat.completions.create({
        model: c.model,
        max_tokens: 20,
        messages: [{ role: 'user', content: '请回复"OK"' }]
      })
      reply = resp.choices[0].message.content
    }

    res.json({ ok: true, reply })
  } catch (e) {
    res.status(400).json({ error: e.message })
  }
})

module.exports = router
