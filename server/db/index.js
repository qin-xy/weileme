const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const dataDir = path.join(__dirname, '..', 'data');
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

const dbPath = path.join(dataDir, 'weileme.db');
const db = new Database(dbPath);

function initSchema() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS customers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      wechat_id TEXT UNIQUE NOT NULL,
      wechat_name TEXT,
      wechat_avatar TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now','localtime')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now','localtime'))
    );

    CREATE TABLE IF NOT EXISTS workers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      wechat_id TEXT UNIQUE,
      wechat_name TEXT,
      wechat_avatar TEXT,
      address TEXT NOT NULL,
      latitude REAL NOT NULL,
      longitude REAL NOT NULL,
      last_update_time INTEGER NOT NULL,
      service_status TEXT NOT NULL DEFAULT 'offline' CHECK (service_status IN ('online','offline')),
      created_at TEXT NOT NULL DEFAULT (datetime('now','localtime')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now','localtime'))
    );

    CREATE TABLE IF NOT EXISTS orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date TEXT NOT NULL,
      address TEXT NOT NULL,
      latitude REAL,
      longitude REAL,
      customer_id INTEGER REFERENCES customers(id),
      customer_wechat_id TEXT NOT NULL,
      customer_wechat_name TEXT,
      worker_id INTEGER REFERENCES workers(id),
      worker_wechat_id TEXT,
      remark TEXT DEFAULT '',
      status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','accepted','completed')),
      service_duration INTEGER DEFAULT 0,
      service_fee REAL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now','localtime')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now','localtime'))
    );

    CREATE TABLE IF NOT EXISTS order_media (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
      url TEXT NOT NULL,
      type TEXT NOT NULL DEFAULT 'image' CHECK (type IN ('image','video')),
      description TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now','localtime'))
    );

    CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
    CREATE INDEX IF NOT EXISTS idx_orders_worker_id ON orders(worker_id);
    CREATE INDEX IF NOT EXISTS idx_orders_customer_id ON orders(customer_id);
    CREATE INDEX IF NOT EXISTS idx_orders_customer_wechat_id ON orders(customer_wechat_id);
    CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at);
    CREATE INDEX IF NOT EXISTS idx_order_media_order_id ON order_media(order_id);
    CREATE INDEX IF NOT EXISTS idx_workers_wechat_id ON workers(wechat_id);
    CREATE INDEX IF NOT EXISTS idx_customers_wechat_id ON customers(wechat_id);
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
    customerId: row.customer_id,
    customerWechatId: row.customer_wechat_id,
    customerWechatName: row.customer_wechat_name,
    workerId: row.worker_id,
    workerWechatId: row.worker_wechat_id,
    remark: row.remark || '',
    status: row.status,
    serviceDuration: row.service_duration,
    serviceFee: row.service_fee,
    serviceMedia: row.serviceMedia || [],
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

// 列表查询：可带 serviceMedia（完成单）
function getOrders(filters = {}) {
  const { status, wechatId, workerId, limit = 100, offset = 0 } = filters;
  let sql = `
    SELECT o.id, o.date, o.address, o.latitude, o.longitude, o.customer_wechat_id, o.remark, o.status, o.worker_id, o.created_at, o.updated_at
    FROM orders o
    WHERE 1=1
  `;
  const params = [];
  if (status) { sql += ' AND o.status = ?'; params.push(status); }
  if (wechatId) { sql += ' AND o.customer_wechat_id = ?'; params.push(wechatId); }
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
  // 查找或创建客户
  let customer = db.prepare('SELECT * FROM customers WHERE wechat_id = ?').get(data.customerWechatId);
  if (!customer) {
    const stmt = db.prepare('INSERT INTO customers (wechat_id, wechat_name, wechat_avatar) VALUES (?, ?, ?)');
    const info = stmt.run(data.customerWechatId, data.customerWechatName || '', data.customerWechatAvatar || '');
    customer = { id: info.lastInsertRowid, wechat_id: data.customerWechatId };
  }

  // 根据角色创建订单
  const status = data.role === 'worker' ? 'accepted' : 'pending';
  const stmt = db.prepare(`
    INSERT INTO orders (date, address, latitude, longitude, customer_id, customer_wechat_id, customer_wechat_name, worker_wechat_id, remark, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const info = stmt.run(
    data.date,
    data.address,
    data.latitude ?? null,
    data.longitude ?? null,
    customer.id,
    data.customerWechatId,
    data.customerWechatName || '',
    data.workerWechatId || '',
    data.remark || '',
    status
  );
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

// Customers
function rowToCustomer(row) {
  if (!row) return null;
  return {
    id: row.id,
    wechatId: row.wechat_id,
    wechatName: row.wechat_name,
    wechatAvatar: row.wechat_avatar,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

function getOrCreateCustomer(wechatId, wechatName, wechatAvatar) {
  let customer = db.prepare('SELECT * FROM customers WHERE wechat_id = ?').get(wechatId);
  if (!customer) {
    const stmt = db.prepare('INSERT INTO customers (wechat_id, wechat_name, wechat_avatar) VALUES (?, ?, ?)');
    const info = stmt.run(wechatId, wechatName || '', wechatAvatar || '');
    customer = { id: info.lastInsertRowid, wechat_id: wechatId };
  }
  return rowToCustomer(customer);
}

// Workers
function rowToWorker(row) {
  if (!row) return null;
  return {
    id: row.id,
    wechatId: row.wechat_id,
    wechatName: row.wechat_name,
    wechatAvatar: row.wechat_avatar,
    address: row.address,
    latitude: row.latitude,
    longitude: row.longitude,
    serviceStatus: row.service_status,
    lastUpdateTime: row.last_update_time,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

function createWorker(data) {
  const now = Date.now();
  const stmt = db.prepare(`
    INSERT INTO workers (wechat_id, wechat_name, wechat_avatar, address, latitude, longitude, service_status, last_update_time)
    VALUES (?, ?, ?, ?, ?, ?, 'offline', ?)
  `);
  const info = stmt.run(
    data.wechatId,
    data.wechatName || '',
    data.wechatAvatar || '',
    data.address,
    data.latitude,
    data.longitude,
    now
  );
  return getWorkerById(info.lastInsertRowid);
}

function updateWorker(id, data) {
  const now = Date.now();
  const fields = [];
  const params = [];

  if (data.wechatId !== undefined) {
    fields.push('wechat_id = ?');
    params.push(data.wechatId);
  }
  if (data.wechatName !== undefined) {
    fields.push('wechat_name = ?');
    params.push(data.wechatName);
  }
  if (data.wechatAvatar !== undefined) {
    fields.push('wechat_avatar = ?');
    params.push(data.wechatAvatar);
  }
  if (data.address !== undefined) {
    fields.push('address = ?');
    params.push(data.address);
  }
  if (data.latitude !== undefined) {
    fields.push('latitude = ?');
    params.push(data.latitude);
  }
  if (data.longitude !== undefined) {
    fields.push('longitude = ?');
    params.push(data.longitude);
  }
  if (data.serviceStatus !== undefined) {
    fields.push('service_status = ?');
    params.push(data.serviceStatus);
  }

  fields.push('last_update_time = ?');
  params.push(now);
  fields.push('updated_at = datetime(\'now\',\'localtime\')');
  params.push(id);

  if (fields.length > 0) {
    const sql = `UPDATE workers SET ${fields.join(', ')} WHERE id = ?`;
    db.prepare(sql).run(...params);
  }

  return getWorkerById(id);
}

function getWorkerById(id) {
  const row = db.prepare('SELECT * FROM workers WHERE id = ?').get(id);
  return rowToWorker(row);
}

function getWorkerByWechatId(wechatId) {
  const row = db.prepare('SELECT * FROM workers WHERE wechat_id = ?').get(wechatId);
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
  getWorkerById,
  getWorkerByWechatId,
  rowToCustomer,
  getOrCreateCustomer
};
