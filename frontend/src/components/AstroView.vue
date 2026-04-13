<template>
  <view class="astro-wrap">
    <view class="head">
      <text class="title">星盘解析</text>
      <text class="sub">探索你灵魂的蓝图</text>
    </view>

    <view v-if="profiles.length > 0" class="profile-picker-wrap">
      <view class="glass-panel profile-picker" @click="isDropdownOpen = !isDropdownOpen">
        <view class="picker-left">
          <image class="avatar" :src="avatarUrl(activeProfile?.avatarSeed || 'dafu')" mode="aspectFill"></image>
          <view>
            <text class="picker-name">{{ activeProfile?.name }}</text>
            <text class="picker-sub">{{ activeProfile?.blessing || '你的专属星盘档案' }}</text>
          </view>
        </view>
        <text class="picker-arrow">{{ isDropdownOpen ? '⌃' : '⌄' }}</text>
      </view>

      <view v-if="isDropdownOpen" class="glass-panel dropdown">
        <view
          v-for="item in profiles"
          :key="item.id"
          :class="['dropdown-item', item.id === activeProfileId ? 'dropdown-item-active' : '']"
          @click="switchProfile(item.id)"
        >
          <image class="avatar-sm" :src="avatarUrl(item.avatarSeed)" mode="aspectFill"></image>
          <text class="dropdown-name">{{ item.name }}</text>
        </view>
        <view class="dropdown-add" @click="openCreateForm">+ 新建星盘档案</view>
      </view>
    </view>

    <view v-if="!activeProfileId" class="glass-panel form-panel">
      <view class="form-head">
        <text class="form-title">新建档案</text>
        <text class="form-sub">输入信息，生成专属星盘</text>
      </view>

      <view class="field">
        <text class="field-label">称呼</text>
        <input v-model="newName" class="input" placeholder="你的名字或昵称" />
      </view>

      <view class="field">
        <text class="field-label">出生日期</text>
        <input v-model="newDate" class="input" placeholder="例如 1999-06-01" />
      </view>

      <view class="field">
        <text class="field-label">出生时间</text>
        <input v-model="newTime" class="input" placeholder="例如 08:30" />
      </view>

      <view class="btn-row">
        <button v-if="profiles.length > 0" class="cancel-btn" @click="activeProfileId = profiles[0].id">取消</button>
        <button class="primary-btn" :loading="isLoading" :disabled="!newName || !newDate || !newTime || isLoading" @click="handleCreateProfile">
          {{ isLoading ? '大福正在计算...' : '生成星盘报告' }}
        </button>
      </view>
    </view>

    <view v-if="activeProfile" class="reading-wrap">
      <view class="glass-panel reading-panel">
        <view class="reading-top">
          <view>
            <text class="reading-title">大福的星盘解析</text>
            <text class="reading-date">{{ activeProfile.date }} {{ activeProfile.time }}</text>
          </view>
        </view>

        <view class="chart">
          <view class="chart-ring ring-1"></view>
          <view class="chart-ring ring-2"></view>
          <text class="chart-core">✦</text>
        </view>

        <view class="tabs">
          <view :class="['tab', activeTab === 'natal' ? 'tab-active' : '']" @click="activeTab = 'natal'">本命星盘</view>
          <view :class="['tab', activeTab === 'transit' ? 'tab-active' : '']" @click="openTransit">流年运势</view>
        </view>

        <view class="reading-content">
          <view v-if="activeTab === 'natal'">
            <text class="reading-text pre">{{ activeProfile.reading || '' }}</text>
          </view>

          <view v-else>
            <view v-if="isTransitLoading" class="loading-wrap">
              <view class="spinner"></view>
              <text class="loading-text">大福正在观测流年星象...</text>
            </view>
            <text v-else class="reading-text pre">{{ activeProfile.transit || '' }}</text>
          </view>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue';
import { generateAstroBlessing, generateAstroReading, generateAstroTransit } from '../utils/api';

const profiles = ref([]);
const activeProfileId = ref(null);
const isDropdownOpen = ref(false);

const newName = ref('');
const newDate = ref('');
const newTime = ref('');

const isLoading = ref(false);
const isTransitLoading = ref(false);
const activeTab = ref('natal');

const activeProfile = computed(() => profiles.value.find((p) => p.id === activeProfileId.value) || null);

onMounted(() => {
  const savedProfiles = uni.getStorageSync('astro_profiles');
  const savedActiveId = uni.getStorageSync('astro_active_profile_id');

  if (savedProfiles && Array.isArray(savedProfiles) && savedProfiles.length > 0) {
    profiles.value = savedProfiles;
    const hasSaved = savedProfiles.some((p) => p.id === savedActiveId);
    activeProfileId.value = hasSaved ? savedActiveId : savedProfiles[0].id;
  }
});

function persistState() {
  uni.setStorageSync('astro_profiles', profiles.value);
  if (activeProfileId.value) {
    uni.setStorageSync('astro_active_profile_id', activeProfileId.value);
  }
}

function avatarUrl(seed) {
  return `https://api.dicebear.com/9.x/notionists/svg?seed=${seed}&backgroundColor=EBE5D9`;
}

async function handleCreateProfile() {
  if (!newName.value || !newDate.value || !newTime.value) return;

  isLoading.value = true;
  try {
    const reading = await generateAstroReading(newName.value, newDate.value, newTime.value);
    const blessing = await generateAstroBlessing(newName.value, newDate.value);

    const profile = {
      id: `${Date.now()}`,
      name: newName.value,
      date: newDate.value,
      time: newTime.value,
      reading,
      transit: null,
      blessing,
      avatarSeed: `${newName.value}-${newDate.value}`
    };

    profiles.value = [...profiles.value, profile];
    activeProfileId.value = profile.id;
    activeTab.value = 'natal';

    newName.value = '';
    newDate.value = '';
    newTime.value = '';
    persistState();
  } catch (error) {
    uni.showToast({ title: '星盘生成失败，请稍后再试', icon: 'none' });
  } finally {
    isLoading.value = false;
  }
}

async function openTransit() {
  activeTab.value = 'transit';
  if (!activeProfile.value || activeProfile.value.transit || isTransitLoading.value) return;

  isTransitLoading.value = true;
  try {
    const transit = await generateAstroTransit(activeProfile.value.name, activeProfile.value.date, activeProfile.value.time);
    profiles.value = profiles.value.map((p) => (p.id === activeProfile.value.id ? { ...p, transit } : p));
    persistState();
  } catch (error) {
    uni.showToast({ title: '流年解析失败，请稍后再试', icon: 'none' });
  } finally {
    isTransitLoading.value = false;
  }
}

function switchProfile(id) {
  activeProfileId.value = id;
  activeTab.value = 'natal';
  isDropdownOpen.value = false;
  persistState();
}

function openCreateForm() {
  activeProfileId.value = null;
  isDropdownOpen.value = false;
}
</script>

<style scoped lang="scss">
.astro-wrap { min-height: 100%; display: flex; flex-direction: column; }
.head { text-align: center; margin-top: 10rpx; margin-bottom: 16rpx; }
.title { display: block; color: #3a5358; font-size: 34rpx; font-weight: 600; }
.sub { display: block; margin-top: 4rpx; color: #6b8287; font-size: 22rpx; }
.glass-panel { background: rgba(255,255,255,0.62); border: 1rpx solid rgba(255,255,255,0.82); box-shadow: 0 12rpx 32rpx rgba(140,133,123,0.08); }
.profile-picker-wrap { position: relative; z-index: 20; margin-bottom: 16rpx; }
.profile-picker { border-radius: 22rpx; padding: 14rpx; display: flex; justify-content: space-between; align-items: center; }
.picker-left { display: flex; align-items: center; gap: 12rpx; min-width: 0; }
.avatar { width: 72rpx; height: 72rpx; border-radius: 999rpx; border: 1rpx solid rgba(139,168,159,0.4); }
.picker-name { display: block; color: #2c3e42; font-size: 26rpx; }
.picker-sub { display: block; margin-top: 2rpx; color: #6b8287; font-size: 20rpx; max-width: 360rpx; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.picker-arrow { color: #6b8287; font-size: 24rpx; }
.dropdown { margin-top: 10rpx; border-radius: 20rpx; overflow: hidden; }
.dropdown-item { padding: 14rpx; display: flex; align-items: center; gap: 10rpx; }
.dropdown-item-active { background: rgba(255,255,255,0.35); }
.avatar-sm { width: 52rpx; height: 52rpx; border-radius: 999rpx; border: 1rpx solid rgba(139,168,159,0.35); }
.dropdown-name { color: #2c3e42; font-size: 24rpx; }
.dropdown-add { padding: 16rpx; border-top: 1rpx solid rgba(255,255,255,0.4); color: #3a5358; font-size: 24rpx; }
.form-panel { border-radius: 28rpx; padding: 24rpx; }
.form-head { text-align: center; margin-bottom: 10rpx; }
.form-title { display: block; color: #3a5358; font-size: 32rpx; }
.form-sub { display: block; margin-top: 4rpx; color: #6b8287; font-size: 22rpx; }
.field { margin-top: 14rpx; }
.field-label { display: block; color: #3a5358; font-size: 22rpx; margin-bottom: 8rpx; }
.input {
  width: 100%;
  height: 88rpx;
  line-height: 88rpx;
  box-sizing: border-box;
  border: 1rpx solid rgba(255,255,255,0.7);
  border-radius: 16rpx;
  background: rgba(255,255,255,0.45);
  color: #2c3e42;
  padding: 0 16rpx;
  font-size: 27rpx;
}
.btn-row { margin-top: 18rpx; display: flex; gap: 10rpx; }
.cancel-btn { flex: 1; background: rgba(255,255,255,0.55); color: #2c3e42; border-radius: 16rpx; font-size: 26rpx; }
.cancel-btn::after { border: 0; }
.primary-btn { flex: 2; background: #8ba89f; color: #fff; border-radius: 16rpx; font-size: 26rpx; }
.primary-btn::after { border: 0; }
.reading-wrap { flex: 1; min-height: 0; }
.reading-panel { border-radius: 28rpx; padding: 22rpx; min-height: 0; }
.reading-top { padding-bottom: 14rpx; border-bottom: 1rpx solid rgba(255,255,255,0.45); }
.reading-title { display: block; color: #3a5358; font-size: 30rpx; }
.reading-date { display: block; margin-top: 4rpx; color: #6b8287; font-size: 20rpx; }
.chart { position: relative; width: 300rpx; height: 300rpx; margin: 24rpx auto; }
.chart-ring { position: absolute; border-radius: 999rpx; border: 1rpx solid rgba(139,168,159,0.45); }
.ring-1 { inset: 0; }
.ring-2 { inset: 26rpx; }
.chart-core { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; color: #5c7a7d; font-size: 38rpx; }
.tabs { display: flex; gap: 8rpx; background: rgba(255,255,255,0.35); border-radius: 14rpx; padding: 6rpx; margin-bottom: 14rpx; }
.tab { flex: 1; text-align: center; padding: 12rpx 0; border-radius: 10rpx; color: #6b8287; font-size: 24rpx; }
.tab-active { background: rgba(255,255,255,0.65); color: #3a5358; }
.reading-content { min-height: 300rpx; }
.reading-text { color: #2c3e42; font-size: 24rpx; line-height: 1.7; }
.loading-wrap { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 80rpx 0; }
.spinner { width: 42rpx; height: 42rpx; border-radius: 999rpx; border: 3rpx solid rgba(255,255,255,0.6); border-top-color: #8ba89f; animation: spin 1s linear infinite; }
.loading-text { margin-top: 12rpx; color: #5c7a7d; font-size: 22rpx; }
.pre { white-space: pre-wrap; }
@keyframes spin { to { transform: rotate(360deg); } }
</style>
