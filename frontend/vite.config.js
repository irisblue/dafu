import { defineConfig } from 'vite';
import uni from '@dcloudio/vite-plugin-uni';

function rpxToVwPlugin() {
  return {
    postcssPlugin: 'dafu-rpx-to-vw',
    Declaration(decl) {
      if (!decl.value || decl.value.indexOf('rpx') === -1) return;
      decl.value = decl.value.replace(/(-?\d*\.?\d+)rpx/g, (_, value) => {
        const vw = Number.parseFloat(value) / 7.5;
        const normalized = Number.isFinite(vw) ? vw : 0;
        return `${normalized.toFixed(6).replace(/\.?0+$/, '')}vw`;
      });
    }
  };
}
rpxToVwPlugin.postcss = true;

const isH5 = process.env.UNI_PLATFORM === 'h5';

export default defineConfig({
  plugins: [typeof uni === 'function' ? uni() : uni.default()],
  css: {
    postcss: {
      plugins: isH5 ? [rpxToVwPlugin()] : []
    }
  }
});
