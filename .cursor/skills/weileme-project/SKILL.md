---
name: weileme-project
description: Describes the 喂了么 uniapp project for pet door-to-door service (ordering and order-taking). Use when working in this repo, adding features, fixing bugs, or when the user asks about project structure, pages, or business logic.
---

# 喂了么项目说明 (Weileme Project)

本 skill 帮助 Agent 快速理解当前 uniapp 项目的结构、业务角色与数据约定。在修改页面、接单/下单逻辑或存储时请先对齐本说明。

## 项目概览

- **产品名**：喂了么（weileme）
- **定位**：宠物上门服务平台——客户预约上门喂宠/遛狗，上门人接单并上门服务。
- **技术**：uni-app，Vue 3，多端（含微信小程序 mp-weixin、App）。入口与配置见 `main.js`、`manifest.json`、`pages.json`。
- **当前数据**：默认使用本地存储；若在 `utils/config.js` 中配置 `BASE_URL` 为后台地址，则请求 `server` 目录下的 Node 后台接口（见 `server/README.md`）。

## 业务角色与术语

| 角色     | 说明                     | 在项目中的称呼     |
|----------|--------------------------|--------------------|
| 客户     | 下单、预约上门服务的人   | 客户、下单人       |
| 上门人   | 接单并上门服务的人       | 上门人、接单人     |

- **订单**：客户视角的预约单。
- **任务**：接单人视角的同一笔单（任务中心里“我的任务”即已接订单）。

## 路由与页面

路由在 `pages.json` 中配置，页面文件在 `pages/` 下。

| 路径                     | 导航栏标题           | 说明 |
|--------------------------|----------------------|------|
| `pages/index/index`      | 喂了么-首页          | 入口：我是客户 / 我是上门人；展示“我的订单”最近 3 条 |
| `pages/order/create`     | 宠物上门服务下单     | 客户下单：日期、地址、微信号、备注；提交后写入本地 orders |
| `pages/worker/register`  | 上门人登记           | 上门人常驻位置（选点/定位），写入 `worker_info` |
| `pages/worker/orders`    | 任务中心             | 接单人：待接单列表 + 我的任务；接单、导航、去上门、规划路线 |
| `pages/worker/upload`    | 服务过程记录         | 按 orderId 上传现场图片/视频，完成后把订单置为 completed |

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
- **`worker_info`**（Object）：上门人登记信息。
  - `address`、`latitude`、`longitude`、`lastUpdateTime`

订单状态流：`pending`（待接单）→ `accepted`（待上门）→ `completed`（服务完成）。

## 关键实现要点

- **首页**（`pages/index/index.vue`）：`recentOrders` 来自 `(uni.getStorageSync('orders') || []).slice(-3).reverse()`；状态展示用 `getStatusText`（pending→待接单，accepted→待上门，completed→服务完成）。
- **下单**（`pages/order/create.vue`）：地址用 `uni.chooseLocation`；提交时构造 order 并 push 到 `orders` 再 `setStorageSync('orders', orders)`。
- **任务中心**（`pages/worker/orders.vue`）：待接单 = `status === 'pending'`；我的任务 = `accepted` 或 `completed`；接单即改写对应订单 `status` 为 `accepted`；距离展示用当前 `worker_info` 与订单经纬度简单欧式距离（系数 111 换算 km）。
- **服务记录**（`pages/worker/upload.vue`）：`onLoad` 取 `options.orderId`，从 `orders` 中查订单；上传媒体后提交时把该订单 `status` 置为 `completed` 并写入 `serviceMedia`。

## 样式与多端

- 使用 **rpx** 做适配；主题色有橙黄渐变（如 `#ffca28`、`#ff9800`）和蓝色（上门人相关 `#4fc3f7`、`#03a9f4`）。
- 全局样式与变量见 `uni.scss`；各页面为单文件 `.vue` 内 `<style>`。

## 开发与扩展时注意

1. 新增页面需在 `pages.json` 的 `pages` 中注册。
2. 已提供 `server/` 后台（Express + SQLite）与 `utils/api.js`。在 `utils/config.js` 中设置 `BASE_URL` 后，各页面会自动走接口；留空则继续用本地存储。
3. 任务中心“规划今日路线”目前为前端模拟文案，真实路线可接地图/导航能力。
4. 品牌名、导航栏标题以“喂了么”为准，与 `pages.json` 中 `globalStyle.navigationBarTitleText` 一致。
