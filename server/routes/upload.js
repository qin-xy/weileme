const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// 确保上传目录存在
const uploadDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// 配置multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 限制5MB
  },
  fileFilter: (req, file, cb) => {
    // 只允许图片
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('只允许上传图片文件'), false);
    }
  }
}).single('file');

// 上传单个图片
router.post('/', (req, res) => {
  upload(req, res, (err) => {
    if (err) {
      return res.json({ code: 1, message: err.message || '上传失败' });
    }

    if (!req.file) {
      return res.json({ code: 1, message: '没有上传文件' });
    }

    // 返回文件访问URL
    const fileUrl = `/uploads/${req.file.filename}`;
    res.json({
      code: 0,
      data: {
        url: fileUrl,
        filename: req.file.filename,
        size: req.file.size
      }
    });
  });
});

module.exports = router;
