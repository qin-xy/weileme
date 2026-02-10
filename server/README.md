# 喂了么后台服务 (weileme-server)

与 uniapp 前端配套的 Node.js + Express + SQLite 后台，提供订单与上门人 API。

## 环境要求

- Node.js 16+
- npm 或 yarn

## 快速启动

```bash
cd server
npm install
cp .env.example .env   # 可选，修改端口、CORS、上传目录等
npm start
```

服务默认运行在 `http://localhost:3000`。首次启动会自动创建 `data/weileme.db` 及表结构。

## 数据库说明

- **SQLite** 文件：`server/data/weileme.db`
- **表结构**：
  - **workers**：上门人（id, address, latitude, longitude, last_update_time, created_at, updated_at）
  - **orders**：订单（id, date, address, latitude, longitude, wechat_id, remark, status, worker_id, created_at, updated_at）
  - **order_media**：服务过程媒体（id, order_id, url, type, created_at）
- **订单状态**：`pending`（待接单）→ `accepted`（待上门）→ `completed`（服务完成）

手动初始化表（可选）：`npm run init-db`  
数据库维护（备份、恢复、查看、重置）：见 [docs/数据库维护.md](docs/数据库维护.md)。常用命令：`npm run backup-db`、`npm run reset-db`（慎用，会清空数据）。

## API 列表

Base URL: `http://localhost:3000`（或你配置的 `PORT`）

### 健康检查

- `GET /api/health` — 返回 `{ code: 0, message: 'ok' }`

### 订单

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | /api/orders | 创建订单。Body: `{ date, address, latitude?, longitude?, wechatId, remark? }` |
| GET | /api/orders | 列表。Query: `status`, `wechatId`（我的订单）, `workerId`（我的任务）, `limit`, `offset` |
| GET | /api/orders/:id | 订单详情 |
| PATCH | /api/orders/:id/accept | 接单。Body: `{ workerId }` |
| POST | /api/orders/:id/media | 上传服务过程图片/视频。FormData: `file` |
| PATCH | /api/orders/:id/complete | 完成服务。Body: `{ media?: [{ url, type }] }` 可选 |

### 上门人

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | /api/workers | 登记（新建）。Body: `{ address?, latitude, longitude }` |
| PUT | /api/workers/:id | 更新位置。Body: `{ address?, latitude, longitude }` |
| GET | /api/workers/:id | 上门人详情 |

响应格式统一：`{ code: 0, data: ... }` 或 `{ code: 4xx/5xx, message: '...' }`。

## 环境变量（.env）

| 变量 | 说明 | 默认 |
|------|------|------|
| PORT | 服务端口 | 3000 |
| CORS_ORIGIN | 允许的跨域来源，多个逗号分隔，`*` 表示全部 | * |
| UPLOAD_DIR | 上传文件目录（相对 server） | uploads |
| BASE_URL | 访问地址（用于返回媒体 URL） | http://localhost:3000 |

## 前端对接说明

1. 在前端配置接口基础地址（如 `utils/config.js` 中 `BASE_URL = 'http://localhost:3000'` 或你的服务器地址）。
2. 将原先 `uni.getStorageSync('orders')` / `uni.setStorageSync('orders', ...)` 改为请求：
   - 客户「我的订单」：`GET /api/orders?wechatId=xxx&limit=3`
   - 下单：`POST /api/orders`
3. 上门人：
   - 登记：`POST /api/workers`，把返回的 `data.id` 与 address/latitude/longitude 一起存为 `worker_info`（含 `id`）。
   - 任务中心待接单：`GET /api/orders?status=pending`
   - 我的任务：`GET /api/orders?workerId=当前worker_info.id`
   - 接单：`PATCH /api/orders/:id/accept` Body `{ workerId }`
   - 完成服务：先 `POST /api/orders/:id/media` 上传图片/视频，再 `PATCH /api/orders/:id/complete`。

前端已提供 `utils/api.js` 和 `utils/config.js`，可在页面中按需改为调用 api 方法。
