# weileme

一个基于 **uni-app** 的宠物上门服务小程序/应用示例项目，包含：

- **客户端**：下单预约上门喂宠 / 遛狗
- **上门人端**：登记位置、查看待接单任务、接单、记录服务过程
- **后台服务**：Node.js + Express + SQLite，提供订单与上门人管理 API

> 适合作为「下单 + 分单 + 上门服务」类小程序的参考示例。

---

## 功能概览

- **首页**
  - 入口：我是客户 / 我是上门人
  - 展示最近 3 条「我的订单」（支持接入后台后按微信号查询）
- **客户下单**
  - 选择上门日期、定位地址、填写微信号和备注
  - 默认保存在本地存储；配置后台地址后写入后端数据库
- **上门人登记**
  - 通过选点或定位记录常驻位置
  - 使用后台时会创建 `worker` 记录，并保存 `worker_id`
- **任务中心（上门人）**
  - 查看待接单订单列表
  - 接单、查看「我的任务」、导航到客户地址
- **服务过程记录**
  - 上传上门服务的图片 / 视频
  - 完成任务后更新订单状态为 `completed`

---

## 技术栈

- 前端：`uni-app` (Vue 3 Options API)
- 后端：Node.js + Express
- 数据库：SQLite（存储在 `server/data/weileme.db`）

---

## 项目结构

```text
weileme/
├── App.vue
├── pages/                 # 前端页面
│   ├── index/index.vue    # 首页（我是客户 / 我是上门人 + 最近订单）
│   ├── order/create.vue   # 客户下单
│   └── worker/            # 上门人相关
│       ├── register.vue   # 上门人登记
│       ├── orders.vue     # 任务中心（待接单 + 我的任务）
│       └── upload.vue     # 服务过程记录（上传图片/视频）
├── static/                # 静态资源（图标等）
│   ├── logo.png
│   └── weileme-icon.png   # 项目图标
├── utils/                 # 前端请求封装
│   ├── config.js          # BASE_URL 配置，控制是否启用后台
│   └── api.js             # 请求 server 的 API 封装
├── server/                # 后台服务（Node + Express + SQLite）
│   ├── app.js             # 入口
│   ├── db/                # 数据库封装与建表逻辑
│   ├── routes/            # 订单与上门人路由
│   ├── scripts/           # 初始化 / 备份 / 重置脚本
│   └── docs/数据库维护.md # 数据库维护说明
└── .cursor/skills/        # Cursor AI 项目 skill
    └── weileme-project/   # 本项目专用的说明 skill
```

---

## 本地运行

### 1. 启动前端（uni-app）

1. 使用 **HBuilderX** 打开本项目目录 `weileme/`
2. 运行到「微信小程序模拟器」或其它目标平台

> 默认情况下，前端使用 `uni.getStorageSync` / `uni.setStorageSync` 在本地保存订单和上门人信息，不依赖后端。

### 2. 启动后台服务（可选，但推荐）

```bash
cd server
npm install
npm start
```

默认启动在 `http://localhost:3000`，首次运行会自动在 `server/data/` 下创建 `weileme.db` 数据库文件并建好表。

### 3. 前端接入后台 API

1. 修改 `utils/config.js`：

```js
// utils/config.js
export const BASE_URL = 'http://localhost:3000';  // 或你的线上地址
```

2. 保存后重新运行前端。此时：
   - 客户下单会调用 `POST /api/orders` 写入数据库
   - 首页「我的订单」会按最近一次下单的微信号查询最近 3 条
   - 上门人登记会调用 `POST /api/workers` 并在本地保存 `worker_id`
   - 任务中心会调用 `GET /api/orders?status=pending` 和 `GET /api/orders?workerId=...`
   - 服务过程记录会将图片/视频通过 `POST /api/orders/:id/media` 上传，并通过 `PATCH /api/orders/:id/complete` 完成订单

前端代码内部已经根据 `BASE_URL` 是否为空自动选择「本地存储」或「后台 API」模式，你只需要配置 `BASE_URL` 即可。

---

## 后台 API 简要说明

> 更详细的接口文档见 `server/README.md`。

- `GET  /api/health` — 健康检查
- `POST /api/orders` — 创建订单
- `GET  /api/orders` — 订单列表（`status` / `wechatId` / `workerId` 筛选）
- `GET  /api/orders/:id` — 订单详情
- `PATCH /api/orders/:id/accept` — 上门人接单
- `POST /api/orders/:id/media` — 上传服务过程图片 / 视频
- `PATCH /api/orders/:id/complete` — 完成服务（写入媒体并标记完成）
- `POST /api/workers` — 上门人登记
- `PUT  /api/workers/:id` — 更新上门人位置
- `GET  /api/workers/:id` — 上门人详情

---

## 数据库维护

数据库使用 SQLite，位于 `server/data/weileme.db`。维护说明（备份 / 恢复 / 查看 / 重置）见：

- `server/docs/数据库维护.md`

常用命令示例：

```bash
# 手动初始化表结构（通常不需要，首次启动已自动执行）
cd server
npm run init-db

# 备份数据库
npm run backup-db

# 清空并重建数据库表（仅开发环境使用，慎用）
npm run reset-db
```

---

## 项目说明 skill（可选，用于 Cursor / AI 协作）

本仓库在 `.cursor/skills/weileme-project/SKILL.md` 中维护了一份项目说明 skill，用于帮助 AI 理解项目结构与业务逻辑（订单、上门人、分单流程等）。