const Database = require('better-sqlite3');
const path = require('path');

const dataDir = path.join(__dirname, '..', 'data');
const dbPath = path.join(dataDir, 'weileme.db');
const db = new Database(dbPath);

console.log('开始数据库迁移...');

try {
  // 检查是否存在 customers 表
  const customerTableExists = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='customers'").get();
  if (!customerTableExists) {
    console.log('创建 customers 表...');
    db.exec(`
      CREATE TABLE customers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        wechat_id TEXT UNIQUE NOT NULL,
        wechat_name TEXT,
        wechat_avatar TEXT,
        created_at TEXT NOT NULL DEFAULT (datetime('now','localtime')),
        updated_at TEXT NOT NULL DEFAULT (datetime('now','localtime'))
      );
    `);
  }

  // 检查是否存在 workers 表的新字段
  const workersTable = db.prepare("PRAGMA table_info(workers)").all();
  const hasWechatId = workersTable.some(col => col.name === 'wechat_id');

  if (!hasWechatId) {
    console.log('修改 workers 表结构...');
    db.exec(`
      ALTER TABLE workers ADD COLUMN wechat_id TEXT;
      ALTER TABLE workers ADD COLUMN wechat_name TEXT;
      ALTER TABLE workers ADD COLUMN wechat_avatar TEXT;
      ALTER TABLE workers ADD COLUMN service_status TEXT NOT NULL DEFAULT 'offline';
    `);
  }

  // 检查是否存在 orders 表的新字段
  const ordersTable = db.prepare("PRAGMA table_info(orders)").all();
  const hasCustomerId = ordersTable.some(col => col.name === 'customer_id');

  if (!hasCustomerId) {
    console.log('修改 orders 表结构...');

    // 创建 orders 表的新结构
    db.exec(`
      CREATE TABLE orders_new (
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
    `);

    // 从旧 orders 表迁移数据
    const orders = db.prepare('SELECT * FROM orders').all();
    orders.forEach(order => {
      // 尝试找到或创建客户
      let customer = db.prepare('SELECT * FROM customers WHERE wechat_id = ?').get(order.wechat_id);
      if (!customer) {
        const customerStmt = db.prepare('INSERT INTO customers (wechat_id, wechat_name, wechat_avatar) VALUES (?, ?, ?)');
        const customerInfo = customerStmt.run(order.wechat_id, '', '');
        customer = { id: customerInfo.lastInsertRowid, wechat_id: order.wechat_id };
      }

      db.prepare(`
        INSERT INTO orders_new (id, date, address, latitude, longitude, customer_id, customer_wechat_id, customer_wechat_name, worker_id, worker_wechat_id, remark, status, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        order.id,
        order.date,
        order.address,
        order.latitude,
        order.longitude,
        customer.id,
        order.wechat_id,
        '',
        order.worker_id,
        '',
        order.remark,
        order.status,
        order.created_at,
        order.updated_at
      );
    });

    // 删除旧表并重命名新表
    db.exec('DROP TABLE orders');
    db.exec('ALTER TABLE orders_new RENAME TO orders');
  }

  // 添加新的索引
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_orders_customer_id ON orders(customer_id);
    CREATE INDEX IF NOT EXISTS idx_orders_customer_wechat_id ON orders(customer_wechat_id);
    CREATE INDEX IF NOT EXISTS idx_workers_wechat_id ON workers(wechat_id);
    CREATE INDEX IF NOT EXISTS idx_customers_wechat_id ON customers(wechat_id);
  `);

  console.log('数据库迁移完成！');

} catch (error) {
  console.error('迁移过程中发生错误:', error);
  process.exit(1);
} finally {
  db.close();
}