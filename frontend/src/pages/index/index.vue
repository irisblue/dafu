<template>
  <view class="app-bg">
    <view class="mobile-shell">
      <view class="header">
        <view class="icon-btn" @click="isMenuOpen = true">☰</view>
        <view class="brand">
          <view class="brand-icon">♥</view>
          <text class="brand-title">大福</text>
        </view>
        <view class="spacer"></view>
      </view>

      <view v-if="isMenuOpen" class="menu-mask" @click="isMenuOpen = false"></view>
      <view :class="['menu-drawer', isMenuOpen ? 'menu-open' : 'drawer-close']">
        <view class="menu-top">
          <view class="menu-close-btn" @click="isMenuOpen = false">✕</view>
          <view class="menu-avatar">♥</view>
          <text class="menu-title">大福的宇宙</text>
          <view class="menu-line"></view>
        </view>

        <view class="menu-list">
          <view :class="['menu-item', activeTab === 'daily' ? 'menu-item-active' : '']" @click="switchTab('daily')">
            <text class="menu-item-icon">◉</text>
            <text class="menu-item-label">今日指引</text>
            <text v-if="activeTab === 'daily'" class="menu-dot"></text>
          </view>
          <view :class="['menu-item', activeTab === 'tarot' ? 'menu-item-active' : '']" @click="switchTab('tarot')">
            <text class="menu-item-icon">✦</text>
            <text class="menu-item-label">塔罗占卜</text>
            <text v-if="activeTab === 'tarot'" class="menu-dot"></text>
          </view>
          <view :class="['menu-item', activeTab === 'astro' ? 'menu-item-active' : '']" @click="switchTab('astro')">
            <text class="menu-item-icon">✧</text>
            <text class="menu-item-label">星盘解析</text>
            <text v-if="activeTab === 'astro'" class="menu-dot"></text>
          </view>
        </view>

        <view class="menu-footer">你的专属心理疗愈伴侣</view>
      </view>

      <scroll-view class="content" scroll-y>
        <DailyView v-if="activeTab === 'daily'" />
        <TarotView v-else-if="activeTab === 'tarot'" />
        <AstroView v-else />
      </scroll-view>
    </view>
  </view>
</template>

<script setup>
import { ref } from 'vue';
import AstroView from '../../components/AstroView.vue';
import DailyView from '../../components/DailyView.vue';
import TarotView from '../../components/TarotView.vue';

const activeTab = ref('daily');
const isMenuOpen = ref(false);

function switchTab(tab) {
  activeTab.value = tab;
  isMenuOpen.value = false;
}
</script>

<style scoped lang="scss">
.app-bg {
  min-height: 100vh;
  background: linear-gradient(145deg, #e8f0f2, #e6c5d4 150%);
  display: flex;
  justify-content: center;
}

.mobile-shell {
  width: 100%;
  max-width: 760rpx;
  min-height: 100vh;
  background: rgba(232, 240, 242, 0.52);
  border-left: 1rpx solid rgba(255, 255, 255, 0.4);
  border-right: 1rpx solid rgba(255, 255, 255, 0.4);
  position: relative;
  overflow: hidden;
}

.header {
  padding: 86rpx 24rpx 16rpx;
  display: flex;
  align-items: center;
  justify-content: space-between;
  position: relative;
  z-index: 30;
}

.icon-btn {
  width: 64rpx;
  height: 64rpx;
  border-radius: 999rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #6b8287;
  font-size: 34rpx;
}

.brand {
  display: flex;
  align-items: center;
  gap: 12rpx;
}

.brand-icon {
  width: 36rpx;
  height: 36rpx;
  border-radius: 999rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(139, 168, 159, 0.22);
  color: #3a5358;
  font-size: 20rpx;
}

.brand-title {
  color: #3a5358;
  font-size: 36rpx;
  font-weight: 600;
}

.spacer {
  width: 64rpx;
}

.menu-mask {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.12);
  z-index: 40;
}

.menu-drawer {
  position: absolute;
  top: 0;
  left: 0;
  bottom: 0;
  width: 80%;
  max-width: 580rpx;
  background: rgba(232, 240, 242, 0.95);
  border-right: 1rpx solid rgba(255, 255, 255, 0.5);
  z-index: 50;
  display: flex;
  flex-direction: column;
  transition: transform 0.28s ease;
}

.menu-open {
  transform: translateX(0);
}

.drawer-close {
  transform: translateX(-100%);
}

.menu-top {
  padding: 118rpx 24rpx 28rpx;
  position: relative;
  text-align: center;
}

.menu-close-btn {
  position: absolute;
  top: 26rpx;
  right: 26rpx;
  color: #6b8287;
  font-size: 30rpx;
}

.menu-avatar {
  width: 88rpx;
  height: 88rpx;
  border-radius: 999rpx;
  margin: 0 auto 20rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(139, 168, 159, 0.2);
  color: #3a5358;
  font-size: 36rpx;
}

.menu-title {
  font-size: 34rpx;
  color: #3a5358;
  font-weight: 600;
  letter-spacing: 2rpx;
}

.menu-line {
  width: 52rpx;
  height: 2rpx;
  background: rgba(139, 168, 159, 0.6);
  margin: 20rpx auto 0;
}

.menu-list {
  flex: 1;
  padding: 14rpx 18rpx;
  display: flex;
  flex-direction: column;
  gap: 12rpx;
}

.menu-item {
  border-radius: 24rpx;
  padding: 24rpx 20rpx;
  display: flex;
  align-items: center;
  gap: 14rpx;
  color: #6b8287;
}

.menu-item-active {
  background: rgba(255, 255, 255, 0.8);
  color: #3a5358;
  border: 1rpx solid rgba(255, 255, 255, 0.9);
}

.menu-item-icon {
  font-size: 28rpx;
}

.menu-item-label {
  font-size: 28rpx;
  flex: 1;
}

.menu-dot {
  width: 10rpx;
  height: 10rpx;
  border-radius: 999rpx;
  background: #8ba89f;
}

.menu-footer {
  padding: 24rpx;
  text-align: center;
  font-size: 22rpx;
  color: #6b8287;
  border-top: 1rpx solid rgba(255, 255, 255, 0.35);
}

.content {
  height: calc(100vh - 146rpx);
  padding: 0 24rpx 24rpx;
  box-sizing: border-box;
}
</style>
