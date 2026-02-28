const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const dataDir = path.join(__dirname, '..', 'data');
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

const dbPath = path.join(dataDir, 'weileme.db');
const db = new Database(dbPath);

function initSchema() {
  db.exec(`
    -- 宠物表
    CREATE TABLE IF NOT EXISTS pets (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      type TEXT NOT NULL,
      breed TEXT,
      gender TEXT CHECK (gender IN ('male', 'female', '')),
      birthday TEXT,
      weight REAL,
      avatar TEXT,
      user_id TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now','localtime')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now','localtime'))
    );

    -- 行为记录表
    CREATE TABLE IF NOT EXISTS records (
      id TEXT PRIMARY KEY,
      pet_id TEXT NOT NULL,
      type TEXT NOT NULL,
      date TEXT NOT NULL,
      remark TEXT,
      images TEXT,
      weight REAL,
      next_reminder TEXT,
      user_id TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now','localtime')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now','localtime')),
      FOREIGN KEY (pet_id) REFERENCES pets(id) ON DELETE CASCADE
    );

    -- 提醒表
    CREATE TABLE IF NOT EXISTS reminders (
      id TEXT PRIMARY KEY,
      pet_id TEXT NOT NULL,
      type TEXT NOT NULL,
      title TEXT NOT NULL,
      target_date TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','reminded','completed')),
      user_id TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now','localtime')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now','localtime')),
      FOREIGN KEY (pet_id) REFERENCES pets(id) ON DELETE CASCADE
    );

    -- 用户表
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      openid TEXT UNIQUE,
      nickname TEXT,
      avatar TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now','localtime')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now','localtime'))
    );

    -- 创建索引
    CREATE INDEX IF NOT EXISTS idx_records_pet_id ON records(pet_id);
    CREATE INDEX IF NOT EXISTS idx_records_user_id ON records(user_id);
    CREATE INDEX IF NOT EXISTS idx_records_type ON records(type);
    CREATE INDEX IF NOT EXISTS idx_records_date ON records(date);
    CREATE INDEX IF NOT EXISTS idx_reminders_pet_id ON reminders(pet_id);
    CREATE INDEX IF NOT EXISTS idx_reminders_user_id ON reminders(user_id);
    CREATE INDEX IF NOT EXISTS idx_reminders_status ON reminders(status);
    CREATE INDEX IF NOT EXISTS idx_reminders_target_date ON reminders(target_date);
    CREATE INDEX IF NOT EXISTS idx_pets_user_id ON pets(user_id);
  `);
}

// 宠物相关函数
function rowToPet(row) {
  if (!row) return null;
  return {
    id: row.id,
    name: row.name,
    type: row.type,
    breed: row.breed,
    gender: row.gender,
    birthday: row.birthday,
    weight: row.weight,
    avatar: row.avatar,
    userId: row.user_id,
    createTime: row.created_at,
    updateTime: row.updated_at
  };
}

function getPets(userId) {
  const rows = db.prepare('SELECT * FROM pets WHERE user_id = ? ORDER BY created_at DESC').all(userId);
  return rows.map(rowToPet);
}

function getPetById(id) {
  const row = db.prepare('SELECT * FROM pets WHERE id = ?').get(id);
  return rowToPet(row);
}

function createPet(data) {
  const stmt = db.prepare(`
    INSERT INTO pets (id, name, type, breed, gender, birthday, weight, avatar, user_id)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const info = stmt.run(
    data.id || Date.now().toString(),
    data.name,
    data.type,
    data.breed || '',
    data.gender || '',
    data.birthday || '',
    data.weight || 0,
    data.avatar || '',
    data.userId
  );
  return getPetById(data.id || info.lastInsertRowid.toString());
}

function updatePet(id, data) {
  const fields = [];
  const params = [];

  if (data.name !== undefined) {
    fields.push('name = ?');
    params.push(data.name);
  }
  if (data.type !== undefined) {
    fields.push('type = ?');
    params.push(data.type);
  }
  if (data.breed !== undefined) {
    fields.push('breed = ?');
    params.push(data.breed);
  }
  if (data.gender !== undefined) {
    fields.push('gender = ?');
    params.push(data.gender);
  }
  if (data.birthday !== undefined) {
    fields.push('birthday = ?');
    params.push(data.birthday);
  }
  if (data.weight !== undefined) {
    fields.push('weight = ?');
    params.push(data.weight);
  }
  if (data.avatar !== undefined) {
    fields.push('avatar = ?');
    params.push(data.avatar);
  }

  fields.push('updated_at = datetime(\'now\',\'localtime\')');
  params.push(id);

  if (fields.length > 0) {
    const sql = `UPDATE pets SET ${fields.join(', ')} WHERE id = ?`;
    db.prepare(sql).run(...params);
  }

  return getPetById(id);
}

function deletePet(id) {
  return db.prepare('DELETE FROM pets WHERE id = ?').run(id);
}

// 记录相关函数
function rowToRecord(row) {
  if (!row) return null;
  return {
    id: row.id,
    petId: row.pet_id,
    type: row.type,
    date: row.date,
    remark: row.remark,
    images: row.images ? JSON.parse(row.images) : [],
    weight: row.weight,
    nextReminder: row.next_reminder,
    userId: row.user_id,
    createTime: row.created_at,
    updateTime: row.updated_at
  };
}

function getRecords(filters = {}) {
  const { petId, type, startDate, endDate, userId, limit = 100 } = filters;
  let sql = 'SELECT * FROM records WHERE 1=1';
  const params = [];

  if (petId) {
    sql += ' AND pet_id = ?';
    params.push(petId);
  }
  if (type) {
    sql += ' AND type = ?';
    params.push(type);
  }
  if (startDate) {
    sql += ' AND date >= ?';
    params.push(startDate);
  }
  if (endDate) {
    sql += ' AND date <= ?';
    params.push(endDate);
  }
  if (userId) {
    sql += ' AND user_id = ?';
    params.push(userId);
  }

  sql += ' ORDER BY date DESC LIMIT ?';
  params.push(limit);

  const rows = db.prepare(sql).all(...params);
  return rows.map(rowToRecord);
}

function getRecordById(id) {
  const row = db.prepare('SELECT * FROM records WHERE id = ?').get(id);
  return rowToRecord(row);
}

function createRecord(data) {
  const stmt = db.prepare(`
    INSERT INTO records (id, pet_id, type, date, remark, images, weight, next_reminder, user_id)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const info = stmt.run(
    data.id || Date.now().toString(),
    data.petId,
    data.type,
    data.date,
    data.remark || '',
    JSON.stringify(data.images || []),
    data.weight || 0,
    data.nextReminder || '',
    data.userId
  );
  return getRecordById(data.id || info.lastInsertRowid.toString());
}

function updateRecord(id, data) {
  const fields = [];
  const params = [];

  if (data.type !== undefined) {
    fields.push('type = ?');
    params.push(data.type);
  }
  if (data.date !== undefined) {
    fields.push('date = ?');
    params.push(data.date);
  }
  if (data.remark !== undefined) {
    fields.push('remark = ?');
    params.push(data.remark);
  }
  if (data.images !== undefined) {
    fields.push('images = ?');
    params.push(JSON.stringify(data.images));
  }
  if (data.weight !== undefined) {
    fields.push('weight = ?');
    params.push(data.weight);
  }

  fields.push('updated_at = datetime(\'now\',\'localtime\')');
  params.push(id);

  if (fields.length > 0) {
    const sql = `UPDATE records SET ${fields.join(', ')} WHERE id = ?`;
    db.prepare(sql).run(...params);
  }

  return getRecordById(id);
}

function deleteRecord(id) {
  return db.prepare('DELETE FROM records WHERE id = ?').run(id);
}

function getRecordStatistics(userId) {
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

  const rows = db.prepare(`
    SELECT type, COUNT(*) as count
    FROM records
    WHERE user_id = ? AND date >= ?
    GROUP BY type
  `).all(userId, monthStart);

  return rows.map(r => ({
    type: r.type,
    count: r.count
  }));
}

// 提醒相关函数
function rowToReminder(row) {
  if (!row) return null;
  return {
    id: row.id,
    petId: row.pet_id,
    type: row.type,
    title: row.title,
    targetDate: row.target_date,
    status: row.status,
    userId: row.user_id,
    createTime: row.created_at,
    updateTime: row.updated_at
  };
}

function getReminders(filters = {}) {
  const { petId, userId, status } = filters;
  let sql = 'SELECT * FROM reminders WHERE 1=1';
  const params = [];

  if (petId) {
    sql += ' AND pet_id = ?';
    params.push(petId);
  }
  if (userId) {
    sql += ' AND user_id = ?';
    params.push(userId);
  }
  if (status) {
    sql += ' AND status = ?';
    params.push(status);
  }

  sql += ' ORDER BY target_date ASC';

  const rows = db.prepare(sql).all(...params);
  return rows.map(rowToReminder);
}

function getReminderById(id) {
  const row = db.prepare('SELECT * FROM reminders WHERE id = ?').get(id);
  return rowToReminder(row);
}

function createReminder(data) {
  const stmt = db.prepare(`
    INSERT INTO reminders (id, pet_id, type, title, target_date, status, user_id)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  const info = stmt.run(
    data.id || Date.now().toString(),
    data.petId,
    data.type,
    data.title,
    data.targetDate,
    data.status || 'pending',
    data.userId
  );
  return getReminderById(data.id || info.lastInsertRowid.toString());
}

function updateReminder(id, data) {
  const fields = [];
  const params = [];

  if (data.status !== undefined) {
    fields.push('status = ?');
    params.push(data.status);
  }
  if (data.targetDate !== undefined) {
    fields.push('target_date = ?');
    params.push(data.targetDate);
  }

  fields.push('updated_at = datetime(\'now\',\'localtime\')');
  params.push(id);

  if (fields.length > 0) {
    const sql = `UPDATE reminders SET ${fields.join(', ')} WHERE id = ?`;
    db.prepare(sql).run(...params);
  }

  return getReminderById(id);
}

function deleteReminder(id) {
  return db.prepare('DELETE FROM reminders WHERE id = ?').run(id);
}

// 用户相关函数
function rowToUser(row) {
  if (!row) return null;
  return {
    id: row.id,
    openid: row.openid,
    nickname: row.nickname,
    avatar: row.avatar,
    createTime: row.created_at,
    updateTime: row.updated_at
  };
}

function getOrCreateUser(openid, nickname, avatar) {
  let user = db.prepare('SELECT * FROM users WHERE openid = ?').get(openid);
  if (!user) {
    const stmt = db.prepare('INSERT INTO users (id, openid, nickname, avatar) VALUES (?, ?, ?, ?)');
    const userId = Date.now().toString();
    const info = stmt.run(userId, openid, nickname || '', avatar || '');
    user = { id: userId, openid };
  }
  return rowToUser(user);
}

module.exports = {
  db,
  initSchema,
  // 宠物
  getPets,
  getPetById,
  createPet,
  updatePet,
  deletePet,
  // 记录
  getRecords,
  getRecordById,
  createRecord,
  updateRecord,
  deleteRecord,
  getRecordStatistics,
  // 提醒
  getReminders,
  getReminderById,
  createReminder,
  updateReminder,
  deleteReminder,
  // 用户
  rowToUser,
  getOrCreateUser
};
