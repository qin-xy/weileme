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
  DROP TABLE IF EXISTS pets;
  DROP TABLE IF EXISTS records;
  DROP TABLE IF EXISTS reminders;
  DROP TABLE IF EXISTS users;

  -- 宠物表
  CREATE TABLE pets (
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
  CREATE TABLE records (
    id TEXT PRIMARY KEY,
    pet_id TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('feed','walk','bath','vaccine','deworm','medical','sleep','weight','other')),
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
  CREATE TABLE reminders (
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
  CREATE TABLE users (
    id TEXT PRIMARY KEY,
    openid TEXT UNIQUE,
    nickname TEXT,
    avatar TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now','localtime')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now','localtime'))
  );

  -- 创建索引
  CREATE INDEX idx_records_pet_id ON records(pet_id);
  CREATE INDEX idx_records_user_id ON records(user_id);
  CREATE INDEX idx_records_type ON records(type);
  CREATE INDEX idx_records_date ON records(date);
  CREATE INDEX idx_reminders_pet_id ON reminders(pet_id);
  CREATE INDEX idx_reminders_user_id ON reminders(user_id);
  CREATE INDEX idx_reminders_status ON reminders(status);
  CREATE INDEX idx_reminders_target_date ON reminders(target_date);
  CREATE INDEX idx_pets_user_id ON pets(user_id);
`);

db.close();
console.log('✅ 数据库已重置（表已清空并重建）:', dbPath);
console.log('✅ 现在可以重新启动服务：npm start');
