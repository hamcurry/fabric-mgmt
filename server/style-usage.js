const db = require('./db')

const styleMaterialColumns = new Set(
  db.prepare('PRAGMA table_info(style_materials)').all().map(column => column.name)
)
const hasLegacyUsageColumn = styleMaterialColumns.has('usage_per_piece')

const insertStyleMaterial = hasLegacyUsageColumn
  ? db.prepare(`
      INSERT INTO style_materials(
        style_id,cat2_id,usage_per_piece,actual_usage_per_piece,estimated_usage_per_piece
      )
      VALUES(?,?,?,?,?)
    `)
  : db.prepare(`
      INSERT INTO style_materials(
        style_id,cat2_id,actual_usage_per_piece,estimated_usage_per_piece
      )
      VALUES(?,?,?,?)
    `)

const updateEstimatedStyleMaterial = hasLegacyUsageColumn
  ? db.prepare(`
      UPDATE style_materials
      SET estimated_usage_per_piece = COALESCE(?, estimated_usage_per_piece),
          usage_per_piece = COALESCE(actual_usage_per_piece, COALESCE(?, estimated_usage_per_piece), usage_per_piece)
      WHERE style_id=? AND cat2_id=?
    `)
  : db.prepare(`
      UPDATE style_materials
      SET estimated_usage_per_piece = COALESCE(?, estimated_usage_per_piece)
      WHERE style_id=? AND cat2_id=?
    `)

function parseNumber(value) {
  if (value === null || value === undefined || value === '') return null
  const num = Number(value)
  return Number.isFinite(num) ? num : null
}

function normalizeMaterialInput(material = {}) {
  return {
    cat2_id: material.cat2_id ? Number(material.cat2_id) : null,
    actual_usage_per_piece: parseNumber(material.actual_usage_per_piece),
    estimated_usage_per_piece: parseNumber(material.estimated_usage_per_piece)
  }
}

function getMaterials(styleId) {
  return db.prepare(`
    SELECT sm.id, sm.cat2_id,
           sm.actual_usage_per_piece,
           sm.estimated_usage_per_piece,
           c2.name AS cat2_name, c1.id AS cat1_id, c1.name AS cat1_name
    FROM style_materials sm
    JOIN fabric_cat2 c2 ON c2.id = sm.cat2_id
    JOIN fabric_cat1 c1 ON c1.id = c2.cat1_id
    WHERE sm.style_id = ?
    ORDER BY c1.sort, c1.id, c2.sort, c2.id
  `).all(styleId)
}

function buildEffectiveMaterial(material) {
  const actual = parseNumber(material.actual_usage_per_piece)
  const estimated = parseNumber(material.estimated_usage_per_piece)
  return {
    ...material,
    actual_usage_per_piece: actual,
    estimated_usage_per_piece: estimated,
    effective_usage_per_piece: actual ?? estimated ?? null,
    effective_usage_source: actual != null ? 'actual' : (estimated != null ? 'estimated' : '')
  }
}

function getEffectiveMaterials(styleId) {
  return getMaterials(styleId).map(buildEffectiveMaterial)
}

function insertMaterialRow(styleId, material) {
  const legacyUsage = material.actual_usage_per_piece ?? material.estimated_usage_per_piece
  if (hasLegacyUsageColumn) {
    insertStyleMaterial.run(
      styleId,
      material.cat2_id,
      legacyUsage,
      material.actual_usage_per_piece,
      material.estimated_usage_per_piece
    )
    return
  }

  insertStyleMaterial.run(
    styleId,
    material.cat2_id,
    material.actual_usage_per_piece,
    material.estimated_usage_per_piece
  )
}

function upsertStyleMaterials(styleId, materials = []) {
  for (const material of materials.map(normalizeMaterialInput)) {
    if (!material.cat2_id) continue
    if (material.actual_usage_per_piece == null && material.estimated_usage_per_piece == null) continue
    insertMaterialRow(styleId, material)
  }
}

function appendStyleMaterials(styleId, materials = []) {
  const existing = new Map(getMaterials(styleId).map(m => [m.cat2_id, m]))

  for (const material of materials.map(normalizeMaterialInput)) {
    if (!material.cat2_id) continue
    const found = existing.get(material.cat2_id)
    if (!found) {
      if (material.actual_usage_per_piece == null && material.estimated_usage_per_piece == null) continue
      insertMaterialRow(styleId, material)
    } else if (material.estimated_usage_per_piece != null) {
      if (hasLegacyUsageColumn) {
        updateEstimatedStyleMaterial.run(
          material.estimated_usage_per_piece,
          material.estimated_usage_per_piece,
          styleId,
          material.cat2_id
        )
      } else {
        updateEstimatedStyleMaterial.run(material.estimated_usage_per_piece, styleId, material.cat2_id)
      }
    }
  }
}

function recalculateStyleEstimatedLogs(styleId) {
  const materials = new Map(getEffectiveMaterials(styleId).map(m => [m.cat2_id, m]))
  const logs = db.prepare(`
    SELECT *
    FROM stock_logs
    WHERE type='out' AND style_id=? AND usage_source='estimated'
    ORDER BY operated_at ASC, id ASC
  `).all(styleId)

  let updated = 0
  for (const log of logs) {
    const cat2Id = log.style_material_cat2_id
    if (!cat2Id) continue
    const material = materials.get(cat2Id)
    if (!material || material.actual_usage_per_piece == null) continue
    const pieces = Number(log.pieces || 0)
    const newQty = parseFloat((pieces * material.actual_usage_per_piece).toFixed(3))
    const delta = Number(log.quantity) - newQty

    db.prepare('UPDATE fabrics SET current_stock = current_stock + ? WHERE id=?')
      .run(delta, log.fabric_id)

    let snapshot = []
    try { snapshot = JSON.parse(log.calc_snapshot_json || '[]') } catch {}
    if (Array.isArray(snapshot)) {
      snapshot = snapshot.map(item => item && item.fabric_id === log.fabric_id
        ? {
            ...item,
            quantity: newQty,
            usage_source: 'actual',
            usage_per_piece_snapshot: material.actual_usage_per_piece
          }
        : item
      )
    }

    const recalcNote = `${log.note || ''}${log.note ? ' | ' : ''}实际用量回算`
    db.prepare(`
      UPDATE stock_logs
      SET quantity=?,
          note=?,
          usage_source='actual',
          usage_per_piece_snapshot=?,
          calc_snapshot_json=?
      WHERE id=?
    `).run(
      newQty,
      recalcNote,
      material.actual_usage_per_piece,
      JSON.stringify(snapshot),
      log.id
    )
    updated += 1
  }
  return updated
}

module.exports = {
  getMaterials,
  getEffectiveMaterials,
  normalizeMaterialInput,
  upsertStyleMaterials,
  appendStyleMaterials,
  recalculateStyleEstimatedLogs
}
