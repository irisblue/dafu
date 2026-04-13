<template>
  <view class="page-wrap">
    <TarotView />
  </view>
</template>

<script setup>
import TarotView from '../../components/TarotView.vue';
</script>

<style scoped lang="scss">
.page-wrap {
  min-height: 100vh;
  background: linear-gradient(145deg, #e8f0f2, #e6c5d4 150%);
  padding: 24rpx;
  box-sizing: border-box;
}
</style>
