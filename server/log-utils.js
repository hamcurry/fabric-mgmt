function sanitizeImages(images = []) {
  if (!Array.isArray(images)) return []
  return images
    .filter(img => img && typeof img === 'object')
    .map(img => ({
      name: String(img.name || ''),
      mime_type: String(img.mime_type || ''),
      data_base64: String(img.data_base64 || '')
    }))
    .filter(img => img.data_base64)
}

function serializeImages(images = []) {
  return JSON.stringify(sanitizeImages(images))
}

function parseImages(raw) {
  if (!raw) return []
  try {
    return sanitizeImages(JSON.parse(raw))
  } catch {
    return []
  }
}

function withParsedImages(log) {
  if (!log) return log
  const { images_json, ...rest } = log
  return { ...rest, images: parseImages(images_json) }
}

function withParsedImagesList(logs = []) {
  return logs.map(withParsedImages)
}

module.exports = {
  sanitizeImages,
  serializeImages,
  withParsedImagesList
}
