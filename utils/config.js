import config from '../config.js';

/**
 * 接口与运行配置
 * 统一从根目录的 config.js 获取
 */
export const BASE_URL = config.BASE_URL;

export function useApi() {
  return config.USE_API && !!BASE_URL;
}
