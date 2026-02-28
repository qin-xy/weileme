const express = require('express');
const router = express.Router();
const { getRecords, getRecordById, createRecord, updateRecord, deleteRecord, getRecordStatistics } = require('../db');

// 获取记录列表
router.get('/', (req, res) => {
  try {
    const { petId, type, startDate, endDate, userId, limit } = req.query;
    const records = getRecords({
      petId,
      type,
      startDate,
      endDate,
      userId,
      limit: limit ? parseInt(limit) : 100
    });
    res.json({ code: 0, data: records });
  } catch (err) {
    res.json({ code: 1, message: err.message });
  }
});

// 获取统计数据
router.get('/statistics', (req, res) => {
  try {
    const { userId } = req.query;
    if (!userId) {
      return res.json({ code: 1, message: '缺少用户ID' });
    }
    const stats = getRecordStatistics(userId);
    res.json({ code: 0, data: stats });
  } catch (err) {
    res.json({ code: 1, message: err.message });
  }
});

// 获取记录详情
router.get('/:id', (req, res) => {
  try {
    const record = getRecordById(req.params.id);
    if (!record) {
      return res.json({ code: 1, message: '记录不存在' });
    }
    res.json({ code: 0, data: record });
  } catch (err) {
    res.json({ code: 1, message: err.message });
  }
});

// 创建记录
router.post('/', (req, res) => {
  try {
    const { userId, petId, type, date, remark, images, weight, nextReminder } = req.body;
    if (!userId || !petId || !type || !date) {
      return res.json({ code: 1, message: '缺少必要参数' });
    }
    const record = createRecord({
      userId,
      petId,
      type,
      date,
      remark,
      images: images || [],
      weight: weight || 0,
      nextReminder: nextReminder || ''
    });
    res.json({ code: 0, data: record });
  } catch (err) {
    res.json({ code: 1, message: err.message });
  }
});

// 更新记录
router.put('/:id', (req, res) => {
  try {
    const record = updateRecord(req.params.id, req.body);
    if (!record) {
      return res.json({ code: 1, message: '记录不存在' });
    }
    res.json({ code: 0, data: record });
  } catch (err) {
    res.json({ code: 1, message: err.message });
  }
});

// 删除记录
router.delete('/:id', (req, res) => {
  try {
    const result = deleteRecord(req.params.id);
    res.json({ code: 0, data: { success: result.changes > 0 } });
  } catch (err) {
    res.json({ code: 1, message: err.message });
  }
});

module.exports = router;
