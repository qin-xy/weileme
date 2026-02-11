const express = require('express');
const router = express.Router();
const db = require('../db');

// 上门人登记（新建）
router.post('/', (req, res) => {
  try {
    const { wechatId, wechatName, wechatAvatar, address, latitude, longitude } = req.body;
    if (latitude == null || longitude == null) {
      return res.status(400).json({ code: 400, message: '需要 latitude、longitude' });
    }

    // 检查是否已用微信注册过
    let existingWorker = null;
    if (wechatId) {
      existingWorker = db.getWorkerByWechatId(wechatId);
    }

    const worker = db.createWorker({
      wechatId: wechatId || '',
      wechatName: wechatName || '',
      wechatAvatar: wechatAvatar || '',
      address: address || '当前定位位置',
      latitude: Number(latitude),
      longitude: Number(longitude)
    });

    res.json({ code: 0, data: worker });
  } catch (e) {
    res.status(500).json({ code: 500, message: e.message });
  }
});

// 上门人更新位置和服务状态
router.put('/:id', (req, res) => {
  const id = Number(req.params.id);
  const { address, latitude, longitude, serviceStatus, wechatId, wechatName, wechatAvatar } = req.body;
  if (latitude == null || longitude == null) {
    return res.status(400).json({ code: 400, message: '需要 latitude、longitude' });
  }

  const updateData = {
    address: address || '当前定位位置',
    latitude: Number(latitude),
    longitude: Number(longitude)
  };

  if (serviceStatus !== undefined) {
    updateData.serviceStatus = serviceStatus;
  }
  if (wechatId !== undefined) {
    updateData.wechatId = wechatId;
  }
  if (wechatName !== undefined) {
    updateData.wechatName = wechatName;
  }
  if (wechatAvatar !== undefined) {
    updateData.wechatAvatar = wechatAvatar;
  }

  const worker = db.updateWorker(id, updateData);
  if (!worker) return res.status(404).json({ code: 404, message: '上门人不存在' });
  res.json({ code: 0, data: worker });
});

// 上门人详情
router.get('/:id', (req, res) => {
  const worker = db.getWorkerById(Number(req.params.id));
  if (!worker) return res.status(404).json({ code: 404, message: '上门人不存在' });
  res.json({ code: 0, data: worker });
});

// 按微信ID查询上门人
router.get('/wechat/:wechatId', (req, res) => {
  const worker = db.getWorkerByWechatId(req.params.wechatId);
  if (!worker) return res.status(404).json({ code: 404, message: '上门人不存在' });
  res.json({ code: 0, data: worker });
});

// 切换服务状态（上线/下线）
router.patch('/:id/status', (req, res) => {
  const id = Number(req.params.id);
  const { serviceStatus } = req.body;

  if (serviceStatus !== 'online' && serviceStatus !== 'offline') {
    return res.status(400).json({ code: 400, message: 'serviceStatus 必须为 online 或 offline' });
  }

  const worker = db.updateWorker(id, { serviceStatus });
  if (!worker) return res.status(404).json({ code: 404, message: '上门人不存在' });
  res.json({ code: 0, data: worker });
});

module.exports = router;
