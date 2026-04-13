const DEV_BASE_URL = 'http://localhost:3001/api';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || (import.meta.env.DEV ? DEV_BASE_URL : '/api');

const TAROT_DECK = [
  '愚者', '魔术师', '女祭司', '皇后', '皇帝', '教皇',
  '恋人', '战车', '力量', '隐士', '命运之轮', '正义',
  '倒吊人', '死神', '节制', '恶魔', '高塔', '星星',
  '月亮', '太阳', '审判', '世界'
];

function request(url, method = 'GET', data = {}) {
  return new Promise((resolve, reject) => {
    uni.request({
      url: `${API_BASE_URL}${url}`,
      method,
      data,
      header: {
        'Content-Type': 'application/json'
      },
      success: (res) => {
        if (res.statusCode !== 200) {
          reject(new Error(`HTTP ${res.statusCode}`));
          return;
        }
        if (res.data?.code !== 200) {
          reject(new Error(res.data?.message || 'Request failed'));
          return;
        }
        resolve(res.data.data);
      },
      fail: reject
    });
  });
}

export function generateDailyFortune(themeContext) {
  return request('/fortune/daily', 'POST', { themeContext });
}

export function determineTarotSpread(question) {
  return request('/tarot/spread', 'POST', { question });
}

export function generateTarotReading(question, spread, cards) {
  return request('/tarot/reading', 'POST', { question, spread, cards }).then((res) => res.reading);
}

export function generateTarotFollowUp(history, question) {
  return request('/tarot/followup', 'POST', { history, question }).then((res) => res.reply);
}

export function generateAstroReading(name, birthDate, birthTime) {
  return request('/astro/reading', 'POST', { name, birthDate, birthTime }).then((res) => res.reading);
}

export function generateAstroTransit(name, birthDate, birthTime) {
  return request('/astro/transit', 'POST', { name, birthDate, birthTime }).then((res) => res.transit);
}

export function generateAstroBlessing(name, birthDate) {
  return request('/astro/blessing', 'POST', { name, birthDate }).then((res) => res.blessing);
}

export function drawRandomTarotCards(count) {
  return [...TAROT_DECK].sort(() => 0.5 - Math.random()).slice(0, count);
}
