const MAX_SIZE = 1200
const QUALITY = 0.85

function resizeAndEncode(img) {
  let w = img.naturalWidth, h = img.naturalHeight
  if (w > MAX_SIZE || h > MAX_SIZE) {
    if (w > h) { h = Math.round(h * MAX_SIZE / w); w = MAX_SIZE }
    else { w = Math.round(w * MAX_SIZE / h); h = MAX_SIZE }
  }
  const canvas = document.createElement('canvas')
  canvas.width = w; canvas.height = h
  canvas.getContext('2d').drawImage(img, 0, 0, w, h)
  return canvas.toDataURL('image/jpeg', QUALITY)
}

export function compressDataUrl(dataUrl) {
  return new Promise((resolve) => {
    const img = new Image()
    img.onload = () => resolve(resizeAndEncode(img))
    img.src = dataUrl
  })
}

export function compressFile(file) {
  return new Promise((resolve) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const img = new Image()
      img.onload = () => resolve(resizeAndEncode(img))
      img.src = e.target.result
    }
    reader.readAsDataURL(file)
  })
}

export function compressBlob(blob) {
  return compressFile(blob)
}
