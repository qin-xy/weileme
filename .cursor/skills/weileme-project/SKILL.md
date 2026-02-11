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

### 一、首页（新增角色选择）

- **角色选择界面**：首次进入时需选择身份（客户/上门人）
- **客户模式**：显示"我要下单"和"切换身份"，展示最近3条订单
- **上门人模式**：显示服务状态、快捷入口（登记位置、任务中心、服务记录）
- **角色切换**：支持在客户和上门人身份之间切换
- 展示最近 3 条「我的订单」（接入后台后按微信号查询）

### 二、客户端（新增微信管理功能）

#### 1. 下单/预约

- 选择上门日期
- 选择定位地址
- **微信自动获取功能**：点击"获取当前微信"按钮，使用微信小程序 `wx.getUserProfile` API 获取当前登录人微信信息
- **微信历史记录管理**：保存最近10个微信用户记录，支持搜索和快速切换
- **微信号选择器**：弹出式选择器，支持显示头像、昵称、微信号
- **客户专用微信字段**：显示"联系微信号"，支持自动获取和历史选择
- **上门人专用微信字段**：显示"客户微信号"，用于记录客户微信以便联系
- 根据角色区分页面标题："填写预约信息"（客户）/"创建服务订单"（上门人）
- **角色区分提交逻辑**：
  - 客户下单：创建status为'pending'的订单
  - 上门人接单：创建status为'accepted'的订单，直接关联客户微信
- 填写备注信息
- **自动回填微信号**：进入页面时读取本地保存的微信号
- 下单成功后会保存微信号，便于下次自动带出

#### 2. 数据存储模式

- **本地模式**：使用 `uni.getStorageSync` / `uni.setStorageSync` 保存订单
- **API 模式**：配置 `BASE_URL` 后写入后端数据库（`POST /api/orders`）

### 三、上门人端（新增接单功能）

#### 1. 上门人登记

- 选点或定位记录常驻位置
- **支持微信信息登记**：可以同时登记微信号、昵称、头像
- 使用后台时创建 `worker` 记录，并保存 `worker_id`
- 支持服务状态管理（online/offline）

#### 2. 任务中心（核心接单功能）

- 待接单列表：显示status为'pending'的订单
- 我的任务列表：显示status为'accepted'的订单
- **接单按钮**：点击后订单状态变为'accepted'，上门人关联订单
- **接单后添加客户微信**：
  - 接单成功后需要添加客户微信号以便上门时联系
  - 复制客户微信号到剪贴板
  - 提示添加微信
- 导航到客户地址
- **展示客户微信号**：所有订单都显示客户微信号
- **添加微信/去微信对话按钮**
  - 点击复制微信号到剪贴板
  - 未添加：提示"添加微信"，并在本地标记为已添加
  - 已添加：提示"去微信对话"
  - 说明：小程序无法直接跳转微信对话，采用"复制 + 引导提示"方式

#### 3. 服务过程记录

- 上传上门服务图片 / 视频
- 完成任务更新订单状态为 `completed`

### 四、后台服务（Node.js + Express + SQLite - v2版本升级）

#### 1. 数据库结构升级（重要）

- **新增customers表**：存储客户微信信息（wechat_id、wechat_name、wechat_avatar）
- **升级workers表**：
  - 新增微信信息字段（wechat_id、wechat_name、wechat_avatar）
  - 新增服务状态字段（service_status：online/offline）
- **升级orders表**：
  - 关联客户ID（customer_id）
  - 存储客户微信信息（customer_wechat_id、customer_wechat_name）
  - 存储上门人微信信息（worker_wechat_id）
  - 新增服务时长和费用字段（service_duration、service_fee）
- **升级order_media表**：新增描述字段（description）

#### 2. 订单相关（支持角色区分）

- 创建订单：`POST /api/orders`（新增role参数区分客户/上门人创建）
  - 客户下单：自动创建或关联customer记录，status为'pending'
  - 上门人接单：直接创建status为'accepted'的订单
  - 新增参数：customerWechatName、customerWechatAvatar、workerWechatId、role
- 订单列表：`GET /api/orders`（支持 `status / wechatId / workerId` 筛选）
- 订单详情：`GET /api/orders/:id`
- 接单：`PATCH /api/orders/:id/accept`
- 上传服务过程媒体：`POST /api/orders/:id/media`
- 完成服务：`PATCH /api/orders/:id/complete`

#### 3. 上门人相关（支持微信管理）

- 登记：`POST /api/workers`（新增微信信息参数）
- 更新位置：`PUT /api/workers/:id`（支持更新所有字段）
- 详情：`GET /api/workers/:id`
- **按微信查询**：`GET /api/workers/wechat/:wechatId`（新增）
- **状态管理**：`PATCH /api/workers/:id/status`（新增）

#### 4. 其他

- 健康检查：`GET /api/health`
- 静态资源访问：上传目录通过 `/<UPLOAD_DIR>` 暴露

#### 5. 数据库迁移

- 迁移脚本：`server/scripts/migrate_to_v2.js`
- 新旧表结构兼容：确保现有数据平滑迁移

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

## 本地存储约定（新增角色管理）

- **`user_role`**（string）：用户角色 'client' | 'worker'
- **`wechat_history`**（Array）：微信历史记录，最近10条
  - `id`（number，时间戳）
  - `name`（string，微信昵称）
  - `wechatId`（string，微信号）
  - `avatar`（string，头像URL）
  - `time`（string，ISO时间）
- **`orders`**（Array）：订单列表。单条订单字段：
  - `id`（number，如 Date.now()）
  - `date`（string，上门日期）
  - `address`（string）
  - `latitude` / `longitude`（number，选点坐标）
  - `wechatId`（string，客户微信号）
  - `remark`（string）
  - `status`：`'pending'` | `'accepted'` | `'completed'`
  - `serviceMedia`（可选，Array，完成服务时上传的图片/视频信息）
- **`worker_info`**（Object）：上门人登记信息
  - `id`（接入后台时保存）
  - `wechatId`（上门人微信号）
  - `wechatName`（上门人昵称）
  - `wechatAvatar`（上门人头像）
  - `address`、`latitude`、`longitude`、`lastUpdateTime`
- **`my_wechat_id`**（string）：当前使用的客户微信号
- **`added_wechat_ids`**（Array）：上门人端已添加微信的标记

订单状态流：`pending`（待接单）→ `accepted`（待上门）→ `completed`（服务完成）。

## 开发与扩展注意（本次重点）

1. **角色选择机制**：
   - 首次使用需选择客户/上门人角色
   - 角色信息保存在 `user_role` 中
   - 各页面根据角色显示不同UI和功能

2. **微信集成要点**：
   - 使用 `wx.getUserProfile` API 获取当前微信用户信息
   - 客户页面支持自动获取和历史选择
   - 上门人接单后需要复制客户微信号并提示添加
   - 微信历史记录保存 `wechat_history`（最近10条）

3. **双角色下单逻辑**：
   - 客户下单：status='pending'，待上门人接单
   - 上门人接单：status='accepted'，直接关联客户微信
   - 前端根据角色传递不同的提交参数

4. **数据库迁移**：
   - 首次运行新版本需执行 `node server/scripts/migrate_to_v2.js`
   - 新版本支持customers表、微信信息关联、角色区分

5. **API兼容性**：
   - `utils/api.js` 已更新支持新数据结构
   - 后台接口向后兼容，支持新旧数据结构
   - 前端自动适配本地存储/API模式

6. **路由与页面**：
   - 新增页面需在 `pages.json` 的 `pages` 中注册。
   - 角色选择后自动跳转相应功能页面
7. 后台接口已升级，支持微信信息关联和角色区分：
   - 订单创建支持role参数（client/worker）
   - 上门人登记支持微信信息
   - 新增微信查询接口：`GET /api/workers/wechat/:wechatId`
8. 任务中心"规划今日路线"目前为前端模拟文案，真实路线可接地图/导航能力。
9. 品牌名与导航栏标题以"喂了么"为准，与 `pages.json` 中 `globalStyle.navigationBarTitleText` 一致。

## 核心功能总结（本次对话重点）

1. **首页角色选择**：客户/上门人身份选择和切换
2. **微信自动获取**：微信小程序环境下使用 `wx.getUserProfile` 获取当前用户
3. **微信历史管理**：保存最近10个微信用户，支持搜索切换
4. **双角色下单**：客户下单（pending状态）和上门人接单（accepted状态）
5. **接单微信管理**：上门人接单后需要添加客户微信以便联系
6. **数据库v2升级**：新增customers表、微信信息关联、服务状态管理
7. **后台接口增强**：支持角色区分、微信信息管理、状态控制
