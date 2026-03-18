/**
 * 和风天气 API 服务
 * 免费版: 1000次/天
 * 文档: https://dev.qweather.com/docs/api/
 */

const API_KEY = process.env.QWEATHER_KEY;
const BASE_URL = 'https://devapi.qweather.com/v7';

/**
 * 调用和风天气API
 */
async function fetchWeather(endpoint, params) {
  if (!API_KEY) {
    throw new Error('和风天气API Key未配置，请设置 QWEATHER_KEY 环境变量');
  }

  const url = new URL(`${BASE_URL}/${endpoint}`);
  url.searchParams.set('key', API_KEY);
  url.searchParams.set('location', params.location);
  
  // 免费版只能获取基础天气，如果需要更多功能可能需要升级
  
  const response = await fetch(url.toString());
  const data = await response.json();
  
  if (data.code !== '200') {
    throw new Error(`和风天气API错误: ${data.code} - ${data.msg || '未知错误'}`);
  }
  
  return data;
}

/**
 * 获取实时天气
 * @param {string} location - 城市ID或经纬度(格式: 经度,纬度)或城市名
 * @returns {Promise<Object>} 实时天气数据
 */
async function getCurrentWeather(location = 'auto_ip') {
  // 如果location是中文城市名，需要先获取城市ID
  let cityId = location;
  
  // 如果不是纯数字(城市ID)或经纬度格式，尝试搜索城市
  if (!/^\d+$/.test(location) && !/^\d+\.\d+,\d+\.\d+$/.test(location)) {
    cityId = await getCityId(location);
    if (!cityId) {
      throw new Error(`未找到城市: ${location}`);
    }
  }
  
  return await fetchWeather('weather/now', { location: cityId });
}

/**
 * 获取3天天气预报
 */
async function getForecast3d(location = 'auto_ip') {
  let cityId = location;
  
  if (!/^\d+$/.test(location) && !/^\d+\.\d+,\d+\.\d+$/.test(location)) {
    cityId = await getCityId(location);
    if (!cityId) {
      throw new Error(`未找到城市: ${location}`);
    }
  }
  
  return await fetchWeather('weather/3d', { location: cityId });
}

/**
 * 获取7天天气预报
 */
async function getForecast7d(location = 'auto_ip') {
  let cityId = location;
  
  if (!/^\d+$/.test(location) && !/^\d+\.\d+,\d+\.\d+$/.test(location)) {
    cityId = await getCityId(location);
    if (!cityId) {
      throw new Error(`未找到城市: ${location}`);
    }
  }
  
  return await fetchWeather('weather/7d', { location: cityId });
}

/**
 * 城市搜索 - 通过城市名获取城市ID
 * 注意: 免费版可能不支持此API，这里提供一个兼容方案
 */
async function getCityId(cityName) {
  // 使用经纬度查询，或者直接返回城市名(部分API支持)
  // 这里简化处理：返回城市名，让API自动匹配
  return cityName;
}

/**
 * 检查API是否已配置
 */
function isConfigured() {
  return !!API_KEY;
}

module.exports = {
  getCurrentWeather,
  getForecast3d,
  getForecast7d,
  isConfigured
};
