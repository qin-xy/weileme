# 萌宠日记 - 后端服务 (mengchongriji-server)

一个基于 Node.js + Express + SQLite 的轻量级宠物日记后台，支持宠物档案管理、行为记录、统计与提醒功能。

## 🌟 核心特性

- **多端兼容**：提供标准 RESTful API，完美适配 uni-app。
- **自动初始化**：首次启动会自动创建 SQLite 数据库及其表结构。
- **静态资源托管**：自动处理宠物头像、记录图片的静态访问。
- **健康监控**：提供 API 健康检查接口。

## 🚀 快速启动

```bash
cd server
npm install
# 修改 .env 配置文件（可选）
npm start
```
默认服务端口：`3000`。

## 📋 核心 API

### 1. 宠物管理 (Pets)
- `GET /api/pets?userId=xxx` - 获取宠物列表
- `GET /api/pets/:id` - 获取宠物详情
- `POST /api/pets` - 新增宠物
- `PUT /api/pets/:id` - 更新宠物信息
- `DELETE /api/pets/:id` - 删除宠物档案

### 2. 行为记录 (Records)
- `GET /api/records?petId=xxx&userId=xxx` - 获取行为记录列表（按日期倒序）
- `POST /api/records` - 添加行为记录（支持多图、备注、体重、下次提醒日期）
- `GET /api/records/statistics?userId=xxx` - 获取当月各类型行为次数统计

### 3. 待办提醒 (Reminders)
- `GET /api/reminders?userId=xxx&status=pending` - 获取未处理提醒
- `POST /api/reminders` - 创建新提醒
- `PUT /api/reminders/:id` - 更新提醒状态（如：标记为已完成）
- `DELETE /api/reminders/:id` - 移除提醒

### 4. 文件上传 (Upload)
- `POST /api/upload` - 通用上传接口，上传后返回公网 URL。

## 💾 数据库设计

本项目使用 **SQLite**，数据库文件位于 `data/weileme.db`。核心表包括：
- `pets`: 存储名字、品种、性别、生日、体重、头像等档案信息。
- `records`: 存储喂食、遛弯、就医等全量行为数据及备注。
- `reminders`: 记录待办事项。
- `users`: 管理用户唯一标识及基础信息。

## ⚙️ 环境配置 (.env)

| 变量名 | 说明 | 默认值 |
| :--- | :--- | :--- |
| PORT | 服务监听端口 | 3000 |
| CORS_ORIGIN | 允许跨域来源 | * |
| UPLOAD_DIR | 图片/文件上传目录 | uploads |

---
萌宠日记，记录每一刻的温馨。
