const fs = require('fs')
const path = require('path')

// 与数据库放在同一目录
const DB_PATH = process.env.DB_PATH || path.join(__dirname, 'fabric.db')
const CONFIG_PATH = path.join(path.dirname(DB_PATH), 'ai-config.json')

// 预设供应商
// sdk_type: 'anthropic' | 'openai' — 决定使用哪个 SDK
const PRESETS = {
  openai: {
    label: 'OpenAI (GPT)',
    sdk_type: 'openai',
    base_url: 'https://api.openai.com/v1',
    model: 'gpt-4o'
  },
  gemini: {
    label: 'Google Gemini',
    sdk_type: 'openai',
    base_url: 'https://generativelanguage.googleapis.com/v1beta/openai/',
    model: 'gemini-1.5-pro'
  },
  glm: {
    label: '智谱 GLM',
    sdk_type: 'openai',
    base_url: 'https://open.bigmodel.cn/api/paas/v4/',
    model: 'glm-4v'
  },
  qwen: {
    label: '通义千问',
    sdk_type: 'openai',
    base_url: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
    model: 'qwen-vl-max'
  },
  deepseek: {
    label: 'DeepSeek',
    sdk_type: 'openai',
    base_url: 'https://api.deepseek.com',
    model: 'deepseek-chat'
  },
  claude: {
    label: 'Anthropic Claude',
    sdk_type: 'anthropic',
    base_url: '',
    model: 'claude-sonnet-4-6'
  },
  custom: {
    label: '自定义',
    sdk_type: 'openai',
    base_url: '',
    model: ''
  }
}

function getConfig () {
  if (!fs.existsSync(CONFIG_PATH)) {
    return { preset: '', sdk_type: 'openai', api_key: '', base_url: '', model: '' }
  }
  try {
    return JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8'))
  } catch {
    return { preset: '', sdk_type: 'openai', api_key: '', base_url: '', model: '' }
  }
}

function saveConfig (config) {
  const dir = path.dirname(CONFIG_PATH)
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
  fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2), 'utf8')
}

function isConfigured () {
  const c = getConfig()
  return !!(c.api_key && c.model)
}

function getGlmOcrConfig () {
  const main = getConfig()
  if (main.glm_ocr_config) return main.glm_ocr_config
  return { api_key: '', model: 'glm-4v-ocr', base_url: 'https://open.bigmodel.cn/api/paas/v4/', sdk_type: 'openai' }
}

function saveGlmOcrConfig (cfg) {
  const main = getConfig()
  main.glm_ocr_config = {
    api_key:  cfg.api_key  || '',
    model:    cfg.model    || 'glm-4v-ocr',
    base_url: cfg.base_url || 'https://open.bigmodel.cn/api/paas/v4/',
    sdk_type: 'openai'
  }
  const dir = path.dirname(CONFIG_PATH)
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
  fs.writeFileSync(CONFIG_PATH, JSON.stringify(main, null, 2), 'utf8')
}

function isGlmOcrConfigured () {
  const c = getGlmOcrConfig()
  return !!(c.api_key && c.model)
}

module.exports = { getConfig, saveConfig, isConfigured, getGlmOcrConfig, saveGlmOcrConfig, isGlmOcrConfigured, PRESETS }
