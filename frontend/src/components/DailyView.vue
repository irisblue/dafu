<template>
  <view class="daily-wrap">
    <view class="date-header">
      <text class="date-text">{{ todayText }} · {{ theme.name }}</text>
    </view>

    <view class="glass-panel main-card">
      <view v-if="step === 'loading'" class="state-wrap">
        <view class="spinner"></view>
        <text class="loading-text">大福正在为你感应今日能量...</text>
      </view>

      <view v-else-if="step === 'message' && fortune" class="state-wrap message-wrap">
        <view class="message-image-box">
          <image class="message-image" :src="monetImage" mode="aspectFill" referrer-policy="no-referrer"></image>
          <view class="image-mask"></view>
          <text class="message-text">"{{ fortune.message }}"</text>
        </view>

        <button class="main-btn" @click="step = 'cards'">开启今日指引</button>
      </view>

      <view v-else-if="step === 'cards' && fortune" class="cards-wrap">
        <view class="cards-head">
          <text class="cards-title">今日指引</text>
          <text class="back-btn" @click="step = 'message'">← 返回</text>
        </view>

        <scroll-view class="cards-scroll" scroll-x>
          <view class="cards-row">
            <view class="guide-card">
              <view class="guide-item center">
                <text class="emoji">🎨</text>
                <text class="guide-label">幸运色</text>
                <text class="guide-value">{{ fortune.luckyColor }}</text>
              </view>
              <view class="divider"></view>
              <view class="guide-item center">
                <text class="emoji">🔢</text>
                <text class="guide-label">幸运数字</text>
                <text class="guide-value">{{ fortune.luckyNumber }}</text>
              </view>
            </view>

            <view class="guide-card">
              <view class="guide-item">
                <text class="guide-title">✨ 出行建议</text>
                <text class="guide-desc">{{ fortune.travelAdvice }}</text>
              </view>
              <view class="divider"></view>
              <view class="guide-item">
                <text class="guide-title">👗 着装配饰</text>
                <text class="guide-desc">{{ fortune.outfit }}</text>
              </view>
            </view>

            <view class="guide-card">
              <view class="chip green">
                <text class="chip-title">宜</text>
                <text v-for="(item, idx) in fortune.dos" :key="`do-${idx}`" class="chip-text">{{ item }}</text>
              </view>
              <view class="chip red">
                <text class="chip-title">忌</text>
                <text v-for="(item, idx) in fortune.donts" :key="`dont-${idx}`" class="chip-text">{{ item }}</text>
              </view>
            </view>
          </view>
        </scroll-view>
      </view>
    </view>

    <view class="glass-panel merit-card">
      <view class="merit-head">
        <text class="merit-sub">今日功德 / 平静值</text>
        <text class="merit-num">{{ merit.toLocaleString() }}</text>
      </view>

      <view class="fish-btn" @click="handleMeritClick">
        <view :class="['fish', isHit ? 'fish-hit' : '']">🐟</view>
        <text v-for="item in clicks" :key="item.id" class="float-plus" :style="{ left: item.x + 'px', top: item.y + 'px' }">+1</text>
      </view>
      <text class="merit-tip">点击敲击，沉淀内心</text>
    </view>
  </view>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue';
import { generateDailyFortune } from '../utils/api';

const MONET_PAINTINGS = [
  'https://upload.wikimedia.org/wikipedia/commons/thumb/3/3f/Water_Lilies_by_Claude_Monet_-_1906.jpg/800px-Water_Lilies_by_Claude_Monet_-_1906.jpg',
  'https://upload.wikimedia.org/wikipedia/commons/thumb/f/fd/Claude_Monet_-_Water_Lilies_-_1906%2C_Ryuzo_Ryuzaki.jpg/800px-Claude_Monet_-_Water_Lilies_-_1906%2C_Ryuzo_Ryuzaki.jpg',
  'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a4/Claude_Monet_1899_Nympheas_02.jpg/800px-Claude_Monet_1899_Nympheas_02.jpg',
  'https://upload.wikimedia.org/wikipedia/commons/thumb/1/10/Claude_Monet_-_Water_Lilies_-_1916.jpg/800px-Claude_Monet_-_Water_Lilies_-_1916.jpg',
  'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e0/Claude_Monet_-_Water_Lilies_-_1908.jpg/800px-Claude_Monet_-_Water_Lilies_-_1908.jpg'
];

function getThemeForToday() {
  const date = new Date();
  const month = date.getMonth() + 1;
  const day = date.getDate();

  if (month === 3 && day >= 10 && day <= 15) {
    return { name: '植树节', prompt: '今天是植树节前后，万物生发，充满生机...' };
  }
  if (month === 3 || month === 4) {
    return { name: '春日落樱', prompt: '正值春日，樱花飘落，微风和煦...' };
  }
  if (month === 6 || month === 7) {
    return { name: '夏日微风', prompt: '夏日炎炎，微风拂过，带来清凉...' };
  }
  if (month === 9 || month === 10) {
    return { name: '秋日落叶', prompt: '秋意渐浓，落叶归根，适合沉淀...' };
  }
  if (month === 12 || month === 1) {
    return { name: '冬日初雪', prompt: '冬日初雪，万物纯洁，内心宁静...' };
  }
  return { name: '温柔日常', prompt: '温柔的日常里，充满小确幸...' };
}

const theme = getThemeForToday();
const fortune = ref(null);
const step = ref('loading');
const merit = ref(0);
const clicks = ref([]);
const clickCount = ref(0);
const isHit = ref(false);

const todayText = computed(() => {
  const now = new Date();
  const weekdays = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'];
  const yyyy = now.getFullYear();
  const mm = `${now.getMonth() + 1}`.padStart(2, '0');
  const dd = `${now.getDate()}`.padStart(2, '0');
  return `${yyyy}年${mm}月${dd}日 ${weekdays[now.getDay()]}`;
});

const monetImage = computed(() => {
  const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000);
  return MONET_PAINTINGS[dayOfYear % MONET_PAINTINGS.length];
});

onMounted(async () => {
  merit.value = Number(uni.getStorageSync('user_merit') || 0);

  const todayStr = new Date().toISOString().split('T')[0];
  const cached = uni.getStorageSync(`fortune_${todayStr}`);
  if (cached) {
    fortune.value = cached;
    step.value = 'message';
    return;
  }

  try {
    const result = await generateDailyFortune(theme.prompt);
    if (result) {
      fortune.value = result;
      uni.setStorageSync(`fortune_${todayStr}`, result);
      step.value = 'message';
    }
  } catch (error) {
    uni.showToast({ title: '今日指引生成失败', icon: 'none' });
  }
});

function handleMeritClick(e) {
  const x = 40 + (clickCount.value % 3) * 15;
  const y = 20;

  merit.value += 1;
  uni.setStorageSync('user_merit', merit.value);

  const item = { id: clickCount.value, x, y };
  clicks.value = [...clicks.value, item];
  clickCount.value += 1;

  isHit.value = true;
  setTimeout(() => {
    isHit.value = false;
  }, 140);

  setTimeout(() => {
    clicks.value = clicks.value.filter((c) => c.id !== item.id);
  }, 900);
}
</script>

<style scoped lang="scss">
.daily-wrap { padding-bottom: 24rpx; }
.date-header { text-align: center; margin-top: 8rpx; margin-bottom: 18rpx; }
.date-text { font-size: 22rpx; color: #6b8287; letter-spacing: 1rpx; }
.glass-panel { background: rgba(255,255,255,0.6); border: 1rpx solid rgba(255,255,255,0.82); box-shadow: 0 12rpx 32rpx rgba(140,133,123,0.08); }
.main-card { border-radius: 28rpx; padding: 24rpx; min-height: 720rpx; }
.state-wrap { min-height: 660rpx; display: flex; flex-direction: column; justify-content: center; align-items: center; }
.spinner { width: 56rpx; height: 56rpx; border-radius: 999rpx; border: 4rpx solid rgba(255,255,255,0.6); border-top-color: #8ba89f; animation: spin 1s linear infinite; }
.loading-text { margin-top: 20rpx; color: #5c7a7d; font-size: 24rpx; }
.message-wrap { width: 100%; }
.message-image-box { width: 100%; min-height: 460rpx; border-radius: 28rpx; overflow: hidden; border: 1rpx solid rgba(255,255,255,0.65); position: relative; display: flex; justify-content: center; align-items: center; padding: 28rpx; box-sizing: border-box; }
.message-image { position: absolute; inset: 0; width: 100%; height: 100%; }
.image-mask { position: absolute; inset: 0; background: rgba(255,255,255,0.42); backdrop-filter: blur(2rpx); }
.message-text { position: relative; color: #3a5358; font-size: 36rpx; line-height: 1.6; text-align: center; font-weight: 500; }
.main-btn { margin-top: 28rpx; width: 360rpx; background: #8ba89f; color: #fff; border-radius: 999rpx; font-size: 28rpx; }
.main-btn::after { border: 0; }
.cards-wrap { min-height: 660rpx; }
.cards-head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 18rpx; }
.cards-title { color: #3a5358; font-size: 34rpx; font-weight: 600; }
.back-btn { color: #6b8287; font-size: 22rpx; }
.cards-scroll { width: 100%; white-space: nowrap; }
.cards-row { display: inline-flex; gap: 16rpx; }
.guide-card { width: 540rpx; min-height: 430rpx; border-radius: 24rpx; background: rgba(255,255,255,0.42); border: 1rpx solid rgba(255,255,255,0.6); padding: 20rpx; box-sizing: border-box; display: flex; flex-direction: column; justify-content: center; }
.guide-item.center { align-items: center; text-align: center; }
.guide-item { display: flex; flex-direction: column; }
.emoji { font-size: 34rpx; }
.guide-label { color: #6b8287; font-size: 24rpx; margin-top: 8rpx; }
.guide-value { color: #3a5358; font-size: 34rpx; margin-top: 2rpx; }
.guide-title { color: #3a5358; font-size: 26rpx; }
.guide-desc { color: #2c3e42; font-size: 24rpx; margin-top: 8rpx; line-height: 1.6; }
.divider { height: 1rpx; background: rgba(139,168,159,0.35); margin: 20rpx 0; }
.chip { border-radius: 18rpx; padding: 16rpx; margin-bottom: 12rpx; }
.chip.green { background: rgba(212, 242, 223, 0.65); border: 1rpx solid rgba(146, 197, 165, 0.55); }
.chip.red { background: rgba(246, 217, 217, 0.62); border: 1rpx solid rgba(223, 162, 162, 0.55); }
.chip-title { display: block; font-size: 24rpx; color: #3a5358; margin-bottom: 8rpx; }
.chip-text { display: block; font-size: 23rpx; color: #2c3e42; line-height: 1.55; margin-bottom: 4rpx; }
.merit-card { border-radius: 28rpx; padding: 22rpx; margin-top: 18rpx; display: flex; flex-direction: column; align-items: center; }
.merit-head { text-align: center; }
.merit-sub { font-size: 20rpx; color: #6b8287; letter-spacing: 1rpx; }
.merit-num { display: block; margin-top: 4rpx; font-size: 42rpx; color: #3a5358; }
.fish-btn { position: relative; width: 180rpx; height: 180rpx; display: flex; justify-content: center; align-items: center; }
.fish { font-size: 76rpx; transition: transform 0.18s ease; }
.fish-hit { transform: scale(0.9) rotate(-6deg); }
.float-plus { position: absolute; color: #5c7a7d; font-size: 30rpx; font-weight: 700; animation: floatUp 0.85s ease-out forwards; pointer-events: none; }
.merit-tip { margin-top: 6rpx; color: #6b8287; font-size: 22rpx; }

@keyframes spin { to { transform: rotate(360deg); } }
@keyframes floatUp {
  from { opacity: 1; transform: translateY(0) scale(0.7); }
  to { opacity: 0; transform: translateY(-58rpx) scale(1.1); }
}
</style>
