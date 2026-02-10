const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const dataDir = path.join(__dirname, '..', 'data');
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

const dbPath = path.join(dataDir, 'weileme.db');
const db = new Database(dbPath);

function initSchema() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS workers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      address TEXT NOT NULL,
      latitude REAL NOT NULL,
      longitude REAL NOT NULL,
      last_update_time INTEGER NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now','localtime')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now','localtime'))
    );
    CREATE TABLE IF NOT EXISTS orders (
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
    CREATE TABLE IF NOT EXISTS order_media (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
      url TEXT NOT NULL,
      type TEXT NOT NULL DEFAULT 'image' CHECK (type IN ('image','video')),
      created_at TEXT NOT NULL DEFAULT (datetime('now','localtime'))
    );
    CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
    CREATE INDEX IF NOT EXISTS idx_orders_worker_id ON orders(worker_id);
    CREATE INDEX IF NOT EXISTS idx_orders_wechat_id ON orders(wechat_id);
    CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at);
    CREATE INDEX IF NOT EXISTS idx_order_media_order_id ON order_media(order_id);
  `);
}

// 将订单行转为前端使用的驼峰字段
function rowToOrder(row) {
  if (!row) return null;
  return {
    id: row.id,
    date: row.date,
    address: row.address,
    latitude: row.latitude,
    longitude: row.longitude,
    wechatId: row.wechat_id,
    remark: row.remark || '',
    status: row.status,
    workerId: row.worker_id,
    serviceMedia: row.serviceMedia || [],
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

// 列表查询：可带 serviceMedia（完成单）
function getOrders(filters = {}) {
  const { status, wechatId, workerId, limit = 100, offset = 0 } = filters;
  let sql = `
    SELECT o.id, o.date, o.address, o.latitude, o.longitude, o.wechat_id, o.remark, o.status, o.worker_id, o.created_at, o.updated_at
    FROM orders o
    WHERE 1=1
  `;
  const params = [];
  if (status) { sql += ' AND o.status = ?'; params.push(status); }
  if (wechatId) { sql += ' AND o.wechat_id = ?'; params.push(wechatId); }
  if (workerId != null) { sql += ' AND o.worker_id = ?'; params.push(workerId); }
  sql += ' ORDER BY o.created_at DESC LIMIT ? OFFSET ?';
  params.push(limit, offset);

  const rows = db.prepare(sql).all(...params);
  const list = rows.map(r => rowToOrder(r));
  // 为已完成订单附加 serviceMedia
  const completedIds = list.filter(o => o.status === 'completed').map(o => o.id);
  if (completedIds.length) {
    const mediaRows = db.prepare('SELECT order_id, url, type FROM order_media WHERE order_id IN (' + completedIds.join(',') + ') ORDER BY order_id, id').all();
    const byOrder = {};
    mediaRows.forEach(m => {
      if (!byOrder[m.order_id]) byOrder[m.order_id] = [];
      byOrder[m.order_id].push({ url: m.url, type: m.type });
    });
    list.forEach(o => {
      o.serviceMedia = byOrder[o.id] || [];
    });
  }
  return list;
}

function getOrderById(id) {
  const row = db.prepare('SELECT * FROM orders WHERE id = ?').get(id);
  const order = rowToOrder(row);
  if (order && order.status === 'completed') {
    order.serviceMedia = db.prepare('SELECT url, type FROM order_media WHERE order_id = ? ORDER BY id').all(id).map(m => ({ url: m.url, type: m.type }));
  }
  return order;
}

function createOrder(data) {
  const stmt = db.prepare(`
    INSERT INTO orders (date, address, latitude, longitude, wechat_id, remark, status)
    VALUES (?, ?, ?, ?, ?, ?, 'pending')
  `);
  const info = stmt.run(data.date, data.address, data.latitude ?? null, data.longitude ?? null, data.wechatId, data.remark || '');
  return getOrderById(info.lastInsertRowid);
}

function acceptOrder(orderId, workerId) {
  const stmt = db.prepare('UPDATE orders SET status = ?, worker_id = ?, updated_at = datetime(\'now\',\'localtime\') WHERE id = ? AND status = ?');
  const info = stmt.run('accepted', workerId, orderId, 'pending');
  return info.changes === 1 ? getOrderById(orderId) : null;
}

function completeOrder(orderId, mediaList) {
  const order = getOrderById(orderId);
  if (!order || order.status !== 'accepted') return null;
  db.prepare('UPDATE orders SET status = ?, updated_at = datetime(\'now\',\'localtime\') WHERE id = ?').run('completed', orderId);
  const insertMedia = db.prepare('INSERT INTO order_media (order_id, url, type) VALUES (?, ?, ?)');
  for (const m of mediaList || []) {
    insertMedia.run(orderId, m.url, m.type || 'image');
  }
  return getOrderById(orderId);
}

function addOrderMedia(orderId, url, type) {
  db.prepare('INSERT INTO order_media (order_id, url, type) VALUES (?, ?, ?)').run(orderId, url, type || 'image');
}

// Workers
function rowToWorker(row) {
  if (!row) return null;
  return {
    id: row.id,
    address: row.address,
    latitude: row.latitude,
    longitude: row.longitude,
    lastUpdateTime: row.last_update_time,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

function createWorker(data) {
  const now = Date.now();
  const stmt = db.prepare(`
    INSERT INTO workers (address, latitude, longitude, last_update_time)
    VALUES (?, ?, ?, ?)
  `);
  const info = stmt.run(data.address, data.latitude, data.longitude, now);
  return getWorkerById(info.lastInsertRowid);
}

function updateWorker(id, data) {
  const now = Date.now();
  db.prepare(`
    UPDATE workers SET address = ?, latitude = ?, longitude = ?, last_update_time = ?, updated_at = datetime('now','localtime') WHERE id = ?
  `).run(data.address, data.latitude, data.longitude, now, id);
  return getWorkerById(id);
}

function getWorkerById(id) {
  const row = db.prepare('SELECT * FROM workers WHERE id = ?').get(id);
  return rowToWorker(row);
}

module.exports = {
  db,
  initSchema,
  getOrders,
  getOrderById,
  createOrder,
  acceptOrder,
  completeOrder,
  addOrderMedia,
  createWorker,
  updateWorker,
  getWorkerById
};
