// 喂了么前端环境配置
const config = {
  // 后台接口基础地址
  // 如果你在本地开发且后端自动递增了端口，请确保此处端口号与后端一致
  BASE_URL: 'http://weileme.cloud:3000',

  // 是否启用 API 接口 (true: 使用后台接口, false: 使用本地存储)
  // 留空或设置为 false 时，前端将继续使用本地存储
  USE_API: true
};

export default config;
