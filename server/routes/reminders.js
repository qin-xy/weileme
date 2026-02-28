const express = require('express');
const router = express.Router();
const { getReminders, getReminderById, createReminder, updateReminder, deleteReminder } = require('../db');

// 获取提醒列表
router.get('/', (req, res) => {
  try {
    const { petId, userId, status } = req.query;
    const reminders = getReminders({ petId, userId, status });
    res.json({ code: 0, data: reminders });
  } catch (err) {
    res.json({ code: 1, message: err.message });
  }
});

// 获取提醒详情
router.get('/:id', (req, res) => {
  try {
    const reminder = getReminderById(req.params.id);
    if (!reminder) {
      return res.json({ code: 1, message: '提醒不存在' });
    }
    res.json({ code: 0, data: reminder });
  } catch (err) {
    res.json({ code: 1, message: err.message });
  }
});

// 创建提醒
router.post('/', (req, res) => {
  try {
    const { userId, petId, type, title, targetDate, status } = req.body;
    if (!userId || !petId || !type || !title || !targetDate) {
      return res.json({ code: 1, message: '缺少必要参数' });
    }
    const reminder = createReminder({
      userId,
      petId,
      type,
      title,
      targetDate,
      status: status || 'pending'
    });
    res.json({ code: 0, data: reminder });
  } catch (err) {
    res.json({ code: 1, message: err.message });
  }
});

// 更新提醒
router.put('/:id', (req, res) => {
  try {
    const reminder = updateReminder(req.params.id, req.body);
    if (!reminder) {
      return res.json({ code: 1, message: '提醒不存在' });
    }
    res.json({ code: 0, data: reminder });
  } catch (err) {
    res.json({ code: 1, message: err.message });
  }
});

// 删除提醒
router.delete('/:id', (req, res) => {
  try {
    const result = deleteReminder(req.params.id);
    res.json({ code: 0, data: { success: result.changes > 0 } });
  } catch (err) {
    res.json({ code: 1, message: err.message });
  }
});

module.exports = router;
