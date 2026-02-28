require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

const db = require('./db');
db.initSchema();

const petsRouter = require('./routes/pets');
const recordsRouter = require('./routes/records');
const remindersRouter = require('./routes/reminders');
const uploadRouter = require('./routes/upload');

const app = express();
const PORT = process.env.PORT || 3000;

const corsOrigin = process.env.CORS_ORIGIN || '*';
app.use(cors({ origin: corsOrigin }));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 静态访问上传目录
const uploadDir = process.env.UPLOAD_DIR || 'uploads';
app.use('/' + uploadDir, express.static(path.join(__dirname, uploadDir)));

// 注册路由
app.use('/api/pets', petsRouter);
app.use('/api/records', recordsRouter);
app.use('/api/reminders', remindersRouter);
app.use('/api/upload', uploadRouter);

// 健康检查
app.get('/api/health', (req, res) => {
  res.json({ code: 0, message: 'ok', service: 'mengchongriji-server' });
});

// 错误处理
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ code: 500, message: err.message || '服务器错误' });
});

function startServer(port) {
  const server = app.listen(port, () => {
    console.log('萌宠日记后台服务已启动: http://localhost:' + port);
    console.log('  - 宠物: GET/POST/PUT/DELETE /api/pets');
    console.log('  - 记录: GET/POST/PUT/DELETE /api/records, GET /api/records/statistics');
    console.log('  - 提醒: GET/POST/PUT/DELETE /api/reminders');
    console.log('  - 上传: POST /api/upload');
  });

  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.log(`端口 ${port} 已被占用，尝试使用端口 ${port + 1}...`);
      startServer(port + 1);
    } else {
      console.error('服务器启动失败:', err);
    }
  });
}

startServer(parseInt(PORT));
