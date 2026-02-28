/**
 * 萌宠日记后台 API 封装
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

// 宠物管理
export function getPets(userId) {
  return request({ method: 'GET', url: '/api/pets', data: { userId } });
}

export function getPetById(id) {
  return request({ method: 'GET', url: `/api/pets/${id}` });
}

export function createPet(data) {
  return request({ method: 'POST', url: '/api/pets', data });
}

export function updatePet(id, data) {
  return request({ method: 'PUT', url: `/api/pets/${id}`, data });
}

export function deletePet(id) {
  return request({ method: 'DELETE', url: `/api/pets/${id}` });
}

// 行为记录管理
export function getRecords(params = {}) {
  const query = Object.keys(params)
    .filter(k => params[k] !== undefined && params[k] !== '')
    .map(k => `${k}=${encodeURIComponent(params[k])}`)
    .join('&');
  const url = query ? `/api/records?${query}` : '/api/records';
  return request({ method: 'GET', url });
}

export function getRecordById(id) {
  return request({ method: 'GET', url: `/api/records/${id}` });
}

export function createRecord(data) {
  return request({ method: 'POST', url: '/api/records', data });
}

export function updateRecord(id, data) {
  return request({ method: 'PUT', url: `/api/records/${id}`, data });
}

export function deleteRecord(id) {
  return request({ method: 'DELETE', url: `/api/records/${id}` });
}

export function getRecordStatistics(userId) {
  return request({ method: 'GET', url: `/api/records/statistics?userId=${userId}` });
}

// 提醒管理
export function getReminders(params = {}) {
  const query = Object.keys(params)
    .filter(k => params[k] !== undefined && params[k] !== '')
    .map(k => `${k}=${encodeURIComponent(params[k])}`)
    .join('&');
  const url = query ? `/api/reminders?${query}` : '/api/reminders';
  return request({ method: 'GET', url });
}

export function getReminderById(id) {
  return request({ method: 'GET', url: `/api/reminders/${id}` });
}

export function createReminder(data) {
  return request({ method: 'POST', url: '/api/reminders', data });
}

export function updateReminder(id, data) {
  return request({ method: 'PUT', url: `/api/reminders/${id}`, data });
}

export function deleteReminder(id) {
  return request({ method: 'DELETE', url: `/api/reminders/${id}` });
}

// 图片上传
export function uploadImage(filePath) {
  return new Promise((resolve, reject) => {
    uni.uploadFile({
      url: BASE_URL + '/api/upload',
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
