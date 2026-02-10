/**
 * 接口与运行配置
 * 留空 BASE_URL 时前端继续使用本地存储；填写后请求后台接口
 */
export const BASE_URL = ''; // 例如: 'http://localhost:3000' 或 'https://your-domain.com'

export function useApi() {
  return !!BASE_URL;
}
