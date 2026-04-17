const Database = require('better-sqlite3')
const path = require('path')

const DB_PATH = process.env.DB_PATH || path.join(__dirname, 'fabric.db')
const db = new Database(DB_PATH)

// 开启 WAL 模式，提升并发性能
db.pragma('journal_mode = WAL')
db.pragma('foreign_keys = ON')

db.exec(`
  -- 一级类目（面布/里布/衬布/蕾丝/花边等）
  CREATE TABLE IF NOT EXISTS fabric_cat1 (
    id   INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    sort INTEGER DEFAULT 0
  );

  -- 二级类目（色丁/真丝/棉布等，用户自定义）
  CREATE TABLE IF NOT EXISTS fabric_cat2 (
    id      INTEGER PRIMARY KEY AUTOINCREMENT,
    cat1_id INTEGER NOT NULL REFERENCES fabric_cat1(id) ON DELETE CASCADE,
    name    TEXT NOT NULL,
    sort    INTEGER DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS fabrics (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    cat2_id         INTEGER NOT NULL REFERENCES fabric_cat2(id),
    color           TEXT    DEFAULT '',
    unit            TEXT    DEFAULT '米',
    current_stock   REAL    DEFAULT 0,
    alert_threshold REAL    DEFAULT 20,
    created_at      TEXT    DEFAULT (datetime('now','localtime'))
  );

  CREATE TABLE IF NOT EXISTS styles (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    name          TEXT NOT NULL,
    customer      TEXT DEFAULT '',
    note          TEXT DEFAULT '',
    image_base64  TEXT DEFAULT '',
    created_at    TEXT DEFAULT (datetime('now','localtime'))
  );

  CREATE TABLE IF NOT EXISTS style_materials (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    style_id        INTEGER NOT NULL REFERENCES styles(id) ON DELETE CASCADE,
    cat2_id         INTEGER NOT NULL REFERENCES fabric_cat2(id),
    actual_usage_per_piece    REAL DEFAULT NULL,
    estimated_usage_per_piece REAL DEFAULT NULL
  );

  CREATE TABLE IF NOT EXISTS stock_logs (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    type        TEXT NOT NULL CHECK(type IN ('in','out')),
    fabric_id   INTEGER NOT NULL REFERENCES fabrics(id),
    fabric_name TEXT NOT NULL,
    quantity    REAL NOT NULL,
    pieces      INTEGER DEFAULT NULL,
    style_id    INTEGER REFERENCES styles(id),
    style_name  TEXT DEFAULT '',
    po_number   TEXT DEFAULT '',
    note        TEXT DEFAULT '',
    images_json TEXT DEFAULT '[]',
    usage_source TEXT DEFAULT '',
    usage_per_piece_snapshot REAL DEFAULT NULL,
    style_material_cat2_id INTEGER DEFAULT NULL,
    calc_snapshot_json TEXT DEFAULT '',
    operated_at TEXT DEFAULT (datetime('now','localtime'))
  );

  CREATE TABLE IF NOT EXISTS calc_records (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    style_id    INTEGER REFERENCES styles(id),
    style_name  TEXT NOT NULL,
    quantity    INTEGER NOT NULL,
    result_json TEXT NOT NULL,
    deducted    INTEGER DEFAULT 0,
    calc_at     TEXT DEFAULT (datetime('now','localtime'))
  );
`)

// 旧库迁移：stock_logs 加 pieces 列（幂等）
try { db.exec("ALTER TABLE stock_logs ADD COLUMN pieces INTEGER DEFAULT NULL") } catch {}
try { db.exec("ALTER TABLE stock_logs ADD COLUMN images_json TEXT DEFAULT '[]'") } catch {}
try { db.exec("ALTER TABLE style_materials ADD COLUMN actual_usage_per_piece REAL DEFAULT NULL") } catch {}
try { db.exec("ALTER TABLE style_materials ADD COLUMN estimated_usage_per_piece REAL DEFAULT NULL") } catch {}
try { db.exec("UPDATE style_materials SET actual_usage_per_piece = usage_per_piece WHERE actual_usage_per_piece IS NULL") } catch {}
try { db.exec("UPDATE style_materials SET usage_per_piece = COALESCE(actual_usage_per_piece, estimated_usage_per_piece, usage_per_piece)") } catch {}
try { db.exec("ALTER TABLE stock_logs ADD COLUMN usage_source TEXT DEFAULT ''") } catch {}
try { db.exec("ALTER TABLE stock_logs ADD COLUMN usage_per_piece_snapshot REAL DEFAULT NULL") } catch {}
try { db.exec("ALTER TABLE stock_logs ADD COLUMN style_material_cat2_id INTEGER DEFAULT NULL") } catch {}
try { db.exec("ALTER TABLE stock_logs ADD COLUMN calc_snapshot_json TEXT DEFAULT ''") } catch {}

// 预置一级类目（仅首次）
const presets = ['面布', '里布', '衬布', '蕾丝', '花边', '辅料']
const insertCat1 = db.prepare('INSERT OR IGNORE INTO fabric_cat1(name, sort) VALUES(?, ?)')
presets.forEach((name, i) => insertCat1.run(name, i))

module.exports = db
