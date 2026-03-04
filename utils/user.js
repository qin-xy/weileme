let cachedUserId = '';
let cachedUserInfo = null;

const STORAGE_KEY = 'userId';

function buildUserId(userInfo = {}) {
  const raw = `${userInfo.nickName || ''}|${userInfo.avatarUrl || ''}|${userInfo.gender || ''}`;
  let hash = 0;
  for (let i = 0; i < raw.length; i++) {
    hash = ((hash << 5) - hash) + raw.charCodeAt(i);
    hash |= 0;
  }
  return `wx_${Math.abs(hash)}`;
}

function requestUserProfile() {
    debugger
  return new Promise((resolve, reject) => {
    const getProfile = uni.getUserProfile || (typeof wx !== 'undefined' && wx.getUserProfile);
    if (getProfile) {
      getProfile({
        desc: '用于同步宠物数据与提醒信息',
        success: (res) => resolve(res.userInfo || res),
        fail: reject
      });
      return;
    }

    if (uni.getUserInfo) {
      uni.getUserInfo({
        success: (res) => resolve(res.userInfo || res),
        fail: reject
      });
      return;
    }

    reject(new Error('当前环境不支持获取用户信息'));
  });
}

export async function getUserInfo() {
    debugger
  if (cachedUserInfo) return cachedUserInfo;
  const userInfo = await requestUserProfile();
  cachedUserInfo = userInfo || {};
  return cachedUserInfo;
}

export async function getUserId() {
  if (cachedUserId) return cachedUserId;
  const storedId = uni.getStorageSync(STORAGE_KEY);
  if (storedId) {
    cachedUserId = storedId;
    return cachedUserId;
  }

  let userInfo = null;
  const shouldUseProfile = !!(uni.getUserProfile || (typeof wx !== 'undefined' && wx.getUserProfile));
  if (shouldUseProfile) {
    try {
      userInfo = await getUserInfo();
    } catch (error) {
      userInfo = null;
    }
  }

  cachedUserId = userInfo ? buildUserId(userInfo) : `anon_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
  try {
    uni.setStorageSync(STORAGE_KEY, cachedUserId);
  } catch (error) {
    // ignore storage errors
  }
  return cachedUserId;
}

export function clearUserCache() {
  cachedUserId = '';
  cachedUserInfo = null;
  try {
    uni.removeStorageSync(STORAGE_KEY);
  } catch (error) {
    // ignore storage errors
  }
}
