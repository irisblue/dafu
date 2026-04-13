import { createSSRApp } from 'vue';
import HomePage from './src/pages/index/index.vue';
import DailyPage from './src/pages/daily/index.vue';
import TarotPage from './src/pages/tarot/index.vue';
import AstroPage from './src/pages/astro/index.vue';
import './src/uni.scss';

function ensureUniFallback() {
  if (typeof globalThis.uni !== 'undefined') return;
  if (typeof window === 'undefined') return;

  globalThis.uni = {
    request({ url, method = 'GET', data = {}, header = {}, success, fail, complete }) {
      const normalizedMethod = String(method).toUpperCase();
      const isGetLike = normalizedMethod === 'GET' || normalizedMethod === 'HEAD';

      let requestUrl = url;
      const fetchOptions = {
        method: normalizedMethod,
        headers: header,
      };

      if (isGetLike && data && typeof data === 'object' && Object.keys(data).length > 0) {
        const query = new URLSearchParams();
        Object.entries(data).forEach(([k, v]) => {
          if (v !== undefined && v !== null) query.append(k, String(v));
        });
        const q = query.toString();
        if (q) {
          requestUrl += (requestUrl.includes('?') ? '&' : '?') + q;
        }
      } else if (!isGetLike) {
        fetchOptions.body = JSON.stringify(data);
        if (!fetchOptions.headers || !fetchOptions.headers['Content-Type']) {
          fetchOptions.headers = {
            ...fetchOptions.headers,
            'Content-Type': 'application/json',
          };
        }
      }

      fetch(requestUrl, fetchOptions)
        .then(async (resp) => {
          const text = await resp.text();
          let parsed = text;
          try {
            parsed = text ? JSON.parse(text) : {};
          } catch (_error) {
            // keep plain text response
          }
          const result = {
            statusCode: resp.status,
            data: parsed,
            header: Object.fromEntries(resp.headers.entries()),
          };
          if (success) success(result);
          if (complete) complete(result);
        })
        .catch((error) => {
          if (fail) fail(error);
          if (complete) complete(error);
        });
    },

    getStorageSync(key) {
      const raw = window.localStorage.getItem(key);
      if (raw == null) return '';
      try {
        return JSON.parse(raw);
      } catch (_error) {
        return raw;
      }
    },

    setStorageSync(key, value) {
      window.localStorage.setItem(key, JSON.stringify(value));
    },

    removeStorageSync(key) {
      window.localStorage.removeItem(key);
    },

    showToast({ title = '' }) {
      if (title) console.warn('[uni.showToast]', title);
    },
  };
}

function normalizePath(pathname) {
  if (!pathname) return '/';
  if (pathname.length > 1 && pathname.endsWith('/')) return pathname.slice(0, -1);
  return pathname;
}

function pickRootComponent() {
  if (typeof window === 'undefined') return HomePage;

  const hash = window.location.hash || '';
  if (hash.startsWith('#/pages/daily/index')) return DailyPage;
  if (hash.startsWith('#/pages/tarot/index')) return TarotPage;
  if (hash.startsWith('#/pages/astro/index')) return AstroPage;
  if (hash.startsWith('#/pages/index/index')) return HomePage;

  const path = normalizePath(window.location.pathname);
  if (path === '/daily' || path === '/pages/daily/index') return DailyPage;
  if (path === '/tarot' || path === '/pages/tarot/index') return TarotPage;
  if (path === '/astro' || path === '/pages/astro/index') return AstroPage;
  return HomePage;
}

export function createApp() {
  const app = createSSRApp(pickRootComponent());
  return { app };
}

if (typeof window !== 'undefined') {
  ensureUniFallback();
  if (!window.__DAFU_H5_MOUNTED__) {
    const { app } = createApp();
    app.mount('#app');
    window.__DAFU_H5_MOUNTED__ = true;
  }
}
