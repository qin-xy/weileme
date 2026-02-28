const express = require('express');
const router = express.Router();
const { getPets, getPetById, createPet, updatePet, deletePet } = require('../db');

// 获取宠物列表
router.get('/', (req, res) => {
  try {
    const { userId } = req.query;
    if (!userId) {
      return res.json({ code: 1, message: '缺少用户ID' });
    }
    const pets = getPets(userId);
    res.json({ code: 0, data: pets });
  } catch (err) {
    res.json({ code: 1, message: err.message });
  }
});

// 获取宠物详情
router.get('/:id', (req, res) => {
  try {
    const pet = getPetById(req.params.id);
    if (!pet) {
      return res.json({ code: 1, message: '宠物不存在' });
    }
    res.json({ code: 0, data: pet });
  } catch (err) {
    res.json({ code: 1, message: err.message });
  }
});

// 创建宠物
router.post('/', (req, res) => {
  try {
    const { userId, name, type, breed, gender, birthday, weight, avatar } = req.body;
    if (!userId || !name || !type) {
      return res.json({ code: 1, message: '缺少必要参数' });
    }
    const pet = createPet({ userId, name, type, breed, gender, birthday, weight, avatar });
    res.json({ code: 0, data: pet });
  } catch (err) {
    res.json({ code: 1, message: err.message });
  }
});

// 更新宠物
router.put('/:id', (req, res) => {
  try {
    const pet = updatePet(req.params.id, req.body);
    if (!pet) {
      return res.json({ code: 1, message: '宠物不存在' });
    }
    res.json({ code: 0, data: pet });
  } catch (err) {
    res.json({ code: 1, message: err.message });
  }
});

// 删除宠物
router.delete('/:id', (req, res) => {
  try {
    const result = deletePet(req.params.id);
    res.json({ code: 0, data: { success: result.changes > 0 } });
  } catch (err) {
    res.json({ code: 1, message: err.message });
  }
});

module.exports = router;
