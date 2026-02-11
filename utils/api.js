/**
 * 喂了么后台 API 封装（与 server 配套）
 * 仅当 utils/config.js 中 BASE_URL 有值时使用；否则页面仍用本地存储
 */
import { BASE_URL } from './config.js';

function request(options) {
  const url = BASE_URL + (options.url || '');
  return new Promise((resolve, reject) => {
    uni.request({
      ...options,
      url,
      success: (res) => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          const data = res.data;
          if (data && data.code === 0) resolve(data.data);
          else reject(new Error(data?.message || '请求失败'));
        } else reject(new Error(res.data?.message || '网络错误'));
      },
      fail: (err) => reject(err)
    });
  });
}

// 订单
export function createOrder(body) {
  // 添加角色信息
  const data = {
    ...body,
    role: body.role || 'client',
    customerWechatName: body.customerWechatName || '',
    customerWechatAvatar: body.customerWechatAvatar || '',
    workerWechatId: body.workerWechatId || ''
  };
  return request({ method: 'POST', url: '/api/orders', data });
}

export function getOrders(params = {}) {
  const parts = [];
  Object.keys(params).forEach(k => { if (params[k] !== undefined && params[k] !== '') parts.push(k + '=' + encodeURIComponent(params[k])); });
  const q = parts.length ? '?' + parts.join('&') : '';
  return request({ method: 'GET', url: '/api/orders' + q });
}

export function getOrderById(id) {
  return request({ method: 'GET', url: '/api/orders/' + id });
}

export function acceptOrder(orderId, workerId) {
  return request({ method: 'PATCH', url: '/api/orders/' + orderId + '/accept', data: { workerId } });
}

export function completeOrder(orderId, media = []) {
  return request({ method: 'PATCH', url: '/api/orders/' + orderId + '/complete', data: { media } });
}

// 上传单张图片/视频（可多次调用）
export function uploadOrderMedia(orderId, filePath, type = 'image') {
  return new Promise((resolve, reject) => {
    uni.uploadFile({
      url: BASE_URL + '/api/orders/' + orderId + '/media',
      filePath,
      name: 'file',
      success: (res) => {
        try {
          const data = JSON.parse(res.data);
          if (data.code === 0) resolve(data.data);
          else reject(new Error(data.message || '上传失败'));
        } catch (e) {
          reject(e);
        }
      },
      fail: reject
    });
  });
}

// 上门人
export function registerWorker(body) {
  return request({ method: 'POST', url: '/api/workers', data: body });
}

export function updateWorker(id, body) {
  return request({ method: 'PUT', url: '/api/workers/' + id, data: body });
}

export function getWorkerById(id) {
  return request({ method: 'GET', url: '/api/workers/' + id });
}

export function getWorkerByWechatId(wechatId) {
  return request({ method: 'GET', url: '/api/workers/wechat/' + wechatId });
}

export function updateWorkerStatus(id, status) {
  return request({ method: 'PATCH', url: '/api/workers/' + id + '/status', data: { serviceStatus: status } });
}