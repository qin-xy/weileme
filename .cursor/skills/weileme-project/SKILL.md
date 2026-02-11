---
name: weileme-project
description: Describes the 喂了么 uniapp project for pet door-to-door service (ordering and order-taking). Use when working in this repo, adding features, fixing bugs, or when the user asks about project structure, pages, or business logic.
---

# 喂了么项目说明 (Weileme Project)

本 skill 以“功能清单”为主线，帮助 Agent 快速理解当前 uniapp 项目的功能、页面与数据约定。涉及页面修改、接单/下单逻辑、接口接入或配置时，请先对齐此说明。

## 项目概览

- **产品名**：喂了么（weileme）
- **定位**：宠物上门服务平台——客户预约上门喂宠/遛狗，上门人接单并上门服务。
- **技术**：uni-app（Vue 3 Options API），多端（含微信小程序 mp-weixin、App）。入口与配置见 `main.js`、`manifest.json`、`pages.json`。
- **数据模式**：默认使用本地存储；若在 `utils/config.js` 配置 `BASE_URL` 且 `USE_API=true`，则请求 `server` 目录下的 Node 后台接口（见 `server/README.md`）。

## 功能清单（与当前实现对齐）

### 一、首页

- 入口：我是客户 / 我是上门人
- 展示最近 3 条「我的订单」（接入后台后按微信号查询）

### 二、客户端

#### 1. 下单/预约

- 选择上门日期
- 选择定位地址
- 填写联系微信号、备注信息
- **自动回填微信号**：进入页面时读取本地保存的微信号
- 下单成功后会保存微信号，便于下次自动带出

#### 2. 数据存储模式

- **本地模式**：使用 `uni.getStorageSync` / `uni.setStorageSync` 保存订单
- **API 模式**：配置 `BASE_URL` 后写入后端数据库（`POST /api/orders`）

### 三、上门人端

#### 1. 上门人登记

- 选点或定位记录常驻位置
- 使用后台时创建 `worker` 记录，并保存 `worker_id`

#### 2. 任务中心

- 待接单列表
- 我的任务列表
- 接单功能（`PATCH /api/orders/:id/accept`）
- 导航到客户地址
- **展示客户微信号**
- **添加微信/去微信对话按钮**
  - 点击复制微信号到剪贴板
  - 未添加：提示“添加微信”，并在本地标记为已添加
  - 已添加：提示“去微信对话”
  - 说明：小程序无法直接跳转微信对话，采用“复制 + 引导提示”方式

#### 3. 服务过程记录

- 上传上门服务图片 / 视频
- 完成任务更新订单状态为 `completed`

### 四、后台服务（Node.js + Express + SQLite）

#### 1. 订单相关

- 创建订单：`POST /api/orders`
- 订单列表：`GET /api/orders`（支持 `status / wechatId / workerId` 筛选）
- 订单详情：`GET /api/orders/:id`
- 接单：`PATCH /api/orders/:id/accept`
- 上传服务过程媒体：`POST /api/orders/:id/media`
- 完成服务：`PATCH /api/orders/:id/complete`

#### 2. 上门人相关

- 登记：`POST /api/workers`
- 更新位置：`PUT /api/workers/:id`
- 详情：`GET /api/workers/:id`

#### 3. 其他

- 健康检查：`GET /api/health`
- 静态资源访问：上传目录通过 `/<UPLOAD_DIR>` 暴露

### 五、配置与运行

- 前端统一配置：根目录 `config.js`（`BASE_URL` / `USE_API`）
- 后端环境配置：`server/.env`
- 数据库：SQLite，文件 `server/data/weileme.db`

## 六、服务器部署与运维（重要存档）

### 1. 线上环境信息
- **服务器 IP**: `119.45.21.242` (腾讯云 Ubuntu 22.04)
- **后端端口**: `3000`
- **代码目录**: `/home/ubuntu/weileme/server`
- **API 地址**: `http://119.45.21.242:3000`
- **文件上传路径**: `http://119.45.21.242:3000/uploads/`

### 2. 常见问题排查 (Troubleshooting)
- **`ERR_DLOPEN_FAILED` / `invalid ELF header`**:
  - **原因**: 将 Windows 下的 `node_modules` 直接上传到了 Linux 服务器，导致 `better-sqlite3` 等原生模块不兼容。
  - **解决**: 在服务器上进入 `server` 目录，删除 `node_modules` 和 `package-lock.json` 后重新执行 `npm install`。
- **公网无法访问 (Connection Timeout)**:
  - **步骤 1**: 服务器自检 `curl http://localhost:3000/api/health`。
  - **步骤 2**: 检查腾讯云安全组，必须放行入站 `TCP 3000` 端口。
  - **步骤 3**: 检查服务器防火墙 `sudo ufw status` (当前为 inactive)。

### 3. 运维常用命令
- **进程管理 (PM2)**:
  - 查看状态: `pm2 list`
  - 查看日志: `pm2 logs weileme-server`
  - 重启服务: `pm2 restart weileme-server`
- **数据库管理 (SQLite)**:
  - 进入数据库: `sqlite3 /home/ubuntu/weileme/server/data/weileme.db`
  - 备份数据库: `sqlite3 data/weileme.db ".backup data/backup.db"`

## 路由与页面

路由在 `pages.json` 中配置，页面文件在 `pages/` 下。

| 路径                     | 说明 |
|--------------------------|------|
| `pages/index/index`      | 首页入口 + 最近 3 条订单 |
| `pages/order/create`     | 客户下单（日期、地址、微信号、备注） |
| `pages/worker/register`  | 上门人登记（定位/选点） |
| `pages/worker/orders`    | 任务中心（待接单 + 我的任务） |
| `pages/worker/upload`    | 服务过程记录（上传图片/视频） |

**入口逻辑**：首页“我是上门人”点击时，若已有 `worker_info` 则跳转任务中心，否则跳转上门人登记。

## 本地存储约定

- **`orders`**（Array）：订单列表。单条订单字段：
  - `id`（number，如 Date.now()）
  - `date`（string，上门日期）
  - `address`（string）
  - `latitude` / `longitude`（number，选点坐标）
  - `wechatId`（string）
  - `remark`（string）
  - `status`：`'pending'` | `'accepted'` | `'completed'`
  - `serviceMedia`（可选，Array，完成服务时上传的图片/视频信息）
- **`worker_info`**（Object）：上门人登记信息
  - `id`（接入后台时保存）
  - `address`、`latitude`、`longitude`、`lastUpdateTime`
- **`my_wechat_id`**（string）：客户微信号自动回填用
- **`added_wechat_ids`**（Array）：上门人端已添加微信的标记

订单状态流：`pending`（待接单）→ `accepted`（待上门）→ `completed`（服务完成）。

## 开发与扩展注意

1. 新增页面需在 `pages.json` 的 `pages` 中注册。
2. 已提供 `server/` 后台（Express + SQLite）与 `utils/api.js`。在 `utils/config.js` 中设置 `BASE_URL` 后，各页面会自动走接口；留空/关闭则继续用本地存储。
3. 任务中心“规划今日路线”目前为前端模拟文案，真实路线可接地图/导航能力。
4. 品牌名与导航栏标题以“喂了么”为准，与 `pages.json` 中 `globalStyle.navigationBarTitleText` 一致。
