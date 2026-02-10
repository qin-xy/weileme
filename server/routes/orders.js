const express = require('express');
const router = express.Router();
const db = require('../db');
const path = require('path');
const fs = require('fs');
const multer = require('multer');

const uploadDir = path.join(__dirname, '..', process.env.UPLOAD_DIR || 'uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const ext = (file.mimetype === 'video/mp4' || file.originalname?.match(/\.(mp4|mov|avi)$/i)) ? path.extname(file.originalname) || '.mp4' : path.extname(file.originalname) || '.jpg';
    cb(null, `order_${req.params.id}_${Date.now()}${ext}`);
  }
});
const upload = multer({ storage, limits: { fileSize: 20 * 1024 * 1024 } });

// 创建订单（客户下单）
router.post('/', (req, res) => {
  try {
    const { date, address, latitude, longitude, wechatId, remark } = req.body;
    if (!date || !address || !wechatId) {
      return res.status(400).json({ code: 400, message: '缺少 date / address / wechatId' });
    }
    const order = db.createOrder({ date, address, latitude, longitude, wechatId, remark });
    res.json({ code: 0, data: order });
  } catch (e) {
    res.status(500).json({ code: 500, message: e.message });
  }
});

// 订单列表（支持按 status / wechatId / workerId 筛选）
router.get('/', (req, res) => {
  try {
    const { status, wechatId, workerId, limit, offset } = req.query;
    const filters = {};
    if (status) filters.status = status;
    if (wechatId) filters.wechatId = wechatId;
    if (workerId !== undefined) filters.workerId = Number(workerId);
    if (limit) filters.limit = Math.min(Number(limit) || 100, 200);
    if (offset) filters.offset = Number(offset) || 0;
    const list = db.getOrders(filters);
    res.json({ code: 0, data: list });
  } catch (e) {
    res.status(500).json({ code: 500, message: e.message });
  }
});

// 单笔订单详情
router.get('/:id', (req, res) => {
  const order = db.getOrderById(Number(req.params.id));
  if (!order) return res.status(404).json({ code: 404, message: '订单不存在' });
  res.json({ code: 0, data: order });
});

// 接单（上门人）
router.patch('/:id/accept', (req, res) => {
  const workerId = req.body.workerId != null ? Number(req.body.workerId) : null;
  if (workerId == null) return res.status(400).json({ code: 400, message: '需要 workerId' });
  const order = db.acceptOrder(Number(req.params.id), workerId);
  if (!order) return res.status(400).json({ code: 400, message: '订单不存在或已被接单' });
  res.json({ code: 0, data: order });
});

// 上传服务过程媒体（单文件，可多次调用）
router.post('/:id/media', upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ code: 400, message: '请上传 file' });
  const orderId = Number(req.params.id);
  const order = db.getOrderById(orderId);
  if (!order) return res.status(404).json({ code: 404, message: '订单不存在' });
  if (order.status !== 'accepted') return res.status(400).json({ code: 400, message: '仅待上门订单可上传' });
  const baseUrl = (process.env.BASE_URL || `http://localhost:${process.env.PORT || 3000}`).replace(/\/$/, '');
  const url = `${baseUrl}/${process.env.UPLOAD_DIR || 'uploads'}/${req.file.filename}`;
  const type = req.file.mimetype && req.file.mimetype.startsWith('video/') ? 'video' : 'image';
  db.addOrderMedia(orderId, url, type);
  res.json({ code: 0, data: { url, type } });
});

// 完成服务（可带已上传的 media 列表，或仅标记完成）
router.patch('/:id/complete', (req, res) => {
  const { media } = req.body || {};
  const order = db.completeOrder(Number(req.params.id), Array.isArray(media) ? media : []);
  if (!order) return res.status(400).json({ code: 400, message: '订单不存在或状态不允许完成' });
  res.json({ code: 0, data: order });
});

module.exports = router;
