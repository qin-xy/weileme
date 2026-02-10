const express = require('express');
const router = express.Router();
const db = require('../db');

// 上门人登记（新建）
router.post('/', (req, res) => {
  try {
    const { address, latitude, longitude } = req.body;
    if (latitude == null || longitude == null) {
      return res.status(400).json({ code: 400, message: '需要 latitude、longitude' });
    }
    const worker = db.createWorker({
      address: address || '当前定位位置',
      latitude: Number(latitude),
      longitude: Number(longitude)
    });
    res.json({ code: 0, data: worker });
  } catch (e) {
    res.status(500).json({ code: 500, message: e.message });
  }
});

// 上门人更新位置
router.put('/:id', (req, res) => {
  const id = Number(req.params.id);
  const { address, latitude, longitude } = req.body;
  if (latitude == null || longitude == null) {
    return res.status(400).json({ code: 400, message: '需要 latitude、longitude' });
  }
  const worker = db.updateWorker(id, {
    address: address || '当前定位位置',
    latitude: Number(latitude),
    longitude: Number(longitude)
  });
  if (!worker) return res.status(404).json({ code: 404, message: '上门人不存在' });
  res.json({ code: 0, data: worker });
});

// 上门人详情
router.get('/:id', (req, res) => {
  const worker = db.getWorkerById(Number(req.params.id));
  if (!worker) return res.status(404).json({ code: 404, message: '上门人不存在' });
  res.json({ code: 0, data: worker });
});

module.exports = router;
