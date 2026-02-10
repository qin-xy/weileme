require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

const db = require('./db');
db.initSchema();

const ordersRouter = require('./routes/orders');
const workersRouter = require('./routes/workers');

const app = express();
const PORT = process.env.PORT || 3000;

const corsOrigin = process.env.CORS_ORIGIN || '*';
app.use(cors({ origin: corsOrigin }));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 静态访问上传目录
const uploadDir = process.env.UPLOAD_DIR || 'uploads';
app.use('/' + uploadDir, express.static(path.join(__dirname, uploadDir)));

app.use('/api/orders', ordersRouter);
app.use('/api/workers', workersRouter);

app.get('/api/health', (req, res) => {
  res.json({ code: 0, message: 'ok', service: 'weileme-server' });
});

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ code: 500, message: err.message || '服务器错误' });
});

app.listen(PORT, () => {
  console.log('喂了么后台服务已启动: http://localhost:' + PORT);
  console.log('  - 订单: GET/POST /api/orders, GET/PATCH /api/orders/:id, PATCH /api/orders/:id/accept, PATCH /api/orders/:id/complete, POST /api/orders/:id/media');
  console.log('  - 上门人: GET/POST /api/workers, GET/PUT /api/workers/:id');
});
