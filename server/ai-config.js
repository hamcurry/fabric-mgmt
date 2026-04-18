const fs = require('fs')
const path = require('path')

// 与数据库放在同一目录
const DB_PATH = process.env.DB_PATH || path.join(__dirname, 'fabric.db')
const CONFIG_PATH = path.join(path.dirname(DB_PATH), 'ai-config.json')

// 预设供应商（仅列支持视觉/OCR的模型）
// sdk_type: 'anthropic' | 'openai' — 决定使用哪个 SDK
const PRESETS = {
  gpt41: {
    label: 'OpenAI GPT-4.1',
    sdk_type: 'openai',
    base_url: 'https://api.openai.com/v1',
    model: 'gpt-4.1'
  },
  gpt41mini: {
    label: 'OpenAI GPT-4.1 Mini',
    sdk_type: 'openai',
    base_url: 'https://api.openai.com/v1',
    model: 'gpt-4.1-mini'
  },
  gpt4o: {
    label: 'OpenAI GPT-4o',
    sdk_type: 'openai',
    base_url: 'https://api.openai.com/v1',
    model: 'gpt-4o'
  },
  gpt4omini: {
    label: 'OpenAI GPT-4o Mini',
    sdk_type: 'openai',
    base_url: 'https://api.openai.com/v1',
    model: 'gpt-4o-mini'
  },
  gemini25pro: {
    label: 'Google Gemini 2.5 Pro',
    sdk_type: 'openai',
    base_url: 'https://generativelanguage.googleapis.com/v1beta/openai/',
    model: 'gemini-2.5-pro'
  },
  gemini25flash: {
    label: 'Google Gemini 2.5 Flash',
    sdk_type: 'openai',
    base_url: 'https://generativelanguage.googleapis.com/v1beta/openai/',
    model: 'gemini-2.5-flash'
  },
  gemini20flash: {
    label: 'Google Gemini 2.0 Flash',
    sdk_type: 'openai',
    base_url: 'https://generativelanguage.googleapis.com/v1beta/openai/',
    model: 'gemini-2.0-flash'
  },
  claudeOpus: {
    label: 'Anthropic Claude Opus 4',
    sdk_type: 'anthropic',
    base_url: '',
    model: 'claude-opus-4-7'
  },
  claudeSonnet: {
    label: 'Anthropic Claude Sonnet 4.6',
    sdk_type: 'anthropic',
    base_url: '',
    model: 'claude-sonnet-4-6'
  },
  claudeHaiku: {
    label: 'Anthropic Claude Haiku 4.5',
    sdk_type: 'anthropic',
    base_url: '',
    model: 'claude-haiku-4-5-20251001'
  },
  glm46v: {
    label: '智谱 GLM-4.6V',
    sdk_type: 'openai',
    base_url: 'https://api.z.ai/api/paas/v4/',
    model: 'glm-4.6v'
  },
  glm4vplus: {
    label: '智谱 GLM-4V-Plus',
    sdk_type: 'openai',
    base_url: 'https://open.bigmodel.cn/api/paas/v4/',
    model: 'glm-4v-plus-0111'
  },
  qwenVlMax: {
    label: '通义千问 Qwen-VL-Max',
    sdk_type: 'openai',
    base_url: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
    model: 'qwen-vl-max'
  },
  qwen25vl72b: {
    label: '通义千问 Qwen2.5-VL-72B',
    sdk_type: 'openai',
    base_url: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
    model: 'qwen2.5-vl-72b-instruct'
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

module.exports = { getConfig, saveConfig, isConfigured, PRESETS }
