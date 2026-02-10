/**
 * 备份数据库到 data/backups/，文件名带时间戳
 * 运行: npm run backup-db
 */
const path = require('path');
const fs = require('fs');

const dbPath = path.join(__dirname, '..', 'data', 'weileme.db');
const backupDir = path.join(__dirname, '..', 'data', 'backups');

if (!fs.existsSync(dbPath)) {
  console.log('数据库文件不存在，跳过备份:', dbPath);
  process.exit(0);
}

if (!fs.existsSync(backupDir)) fs.mkdirSync(backupDir, { recursive: true });

const now = new Date();
const name = 'weileme_' + now.getFullYear() +
  String(now.getMonth() + 1).padStart(2, '0') +
  String(now.getDate()).padStart(2, '0') + '_' +
  String(now.getHours()).padStart(2, '0') +
  String(now.getMinutes()).padStart(2, '0') +
  String(now.getSeconds()).padStart(2, '0') + '.db';
const dest = path.join(backupDir, name);

fs.copyFileSync(dbPath, dest);
console.log('备份已保存:', dest);
