/**
 * 清空并重建所有表（会删除全部数据，仅用于开发/测试）
 * 运行: npm run reset-db
 */
const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const dataDir = path.join(__dirname, '..', 'data');
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
const dbPath = path.join(dataDir, 'weileme.db');

const db = new Database(dbPath);

db.exec(`
  DROP TABLE IF EXISTS order_media;
  DROP TABLE IF EXISTS orders;
  DROP TABLE IF EXISTS workers;

  CREATE TABLE workers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    address TEXT NOT NULL,
    latitude REAL NOT NULL,
    longitude REAL NOT NULL,
    last_update_time INTEGER NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now','localtime')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now','localtime'))
  );
  CREATE TABLE orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    date TEXT NOT NULL,
    address TEXT NOT NULL,
    latitude REAL,
    longitude REAL,
    wechat_id TEXT NOT NULL,
    remark TEXT DEFAULT '',
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','accepted','completed')),
    worker_id INTEGER REFERENCES workers(id),
    created_at TEXT NOT NULL DEFAULT (datetime('now','localtime')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now','localtime'))
  );
  CREATE TABLE order_media (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    url TEXT NOT NULL,
    type TEXT NOT NULL DEFAULT 'image' CHECK (type IN ('image','video')),
    created_at TEXT NOT NULL DEFAULT (datetime('now','localtime'))
  );
  CREATE INDEX idx_orders_status ON orders(status);
  CREATE INDEX idx_orders_worker_id ON orders(worker_id);
  CREATE INDEX idx_orders_wechat_id ON orders(wechat_id);
  CREATE INDEX idx_orders_created_at ON orders(created_at);
  CREATE INDEX idx_order_media_order_id ON order_media(order_id);
`);

db.close();
console.log('数据库已重置（表已清空并重建）:', dbPath);
