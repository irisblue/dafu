<template>
  <view class="tarot-wrap">
    <view class="head">
      <view v-if="view !== 'main'" class="icon-btn" @click="view = 'main'">←</view>
      <view v-else class="spacer"></view>

      <view class="head-center">
        <text class="title">塔罗倾听</text>
        <text class="sub">让潜意识为你指引方向</text>
      </view>

      <view v-if="view === 'main'" class="icon-btn" @click="view = 'history'">🕘</view>
      <view v-else class="spacer"></view>
    </view>

    <view v-if="view === 'main'" class="main-view">
      <view v-if="step === 'question'" class="glass-panel panel">
        <text class="label">你现在有什么困惑或心事？</text>
        <textarea
          v-model="question"
          class="textarea"
          placeholder="例如：我最近对工作感到很迷茫，不知道该不该换环境..."
        />
        <button class="primary-btn" :disabled="!question.trim() || isLoading" :loading="isLoading" @click="handleStartDraw">
          {{ isLoading ? '大福正在思考牌阵...' : '告诉大福' }}
        </button>
      </view>

      <view v-if="step === 'shuffling'" class="shuffle-wrap">
        <view class="shuffle-cards">
          <view v-for="i in 3" :key="i" :class="['shuffle-card', `card-${i}`]">✧</view>
        </view>
        <text class="shuffle-text">大福正在为你洗牌...</text>
      </view>

      <view v-if="step === 'draw' && spread" class="draw-wrap">
        <view class="draw-head">
          <text class="draw-title">大福为你选择了：{{ spread.name }}</text>
          <text class="draw-sub">请深呼吸，凭直觉抽取 {{ spread.count }} 张牌（{{ selectedIndices.length }}/{{ spread.count }}）</text>
        </view>

        <view class="card-grid">
          <view
            v-for="idx in 22"
            :key="idx"
            :class="['deck-card', selectedIndices.includes(idx - 1) ? 'deck-card-selected' : '']"
            @click="handleSelectCard(idx - 1)"
          >
            ✧
          </view>
        </view>

        <view v-if="isLoading" class="loading-more">
          <view class="spinner"></view>
          <text>大福正在解读牌意...</text>
        </view>
      </view>
    </view>

    <scroll-view v-if="view === 'history'" class="history-view" scroll-y>
      <view v-if="history.length === 0" class="empty">暂无占卜记录</view>
      <view v-for="item in history" :key="item.id" class="glass-panel history-item" @click="openHistoryItem(item)">
        <view class="history-top">
          <text class="history-date">{{ item.date }}</text>
          <text class="history-tag">{{ item.spread.name }}</text>
        </view>
        <text class="history-question">{{ item.question }}</text>
      </view>
    </scroll-view>

    <view v-if="view === 'reading' && currentReading" class="reading-view">
      <scroll-view class="reading-scroll" scroll-y>
        <view class="glass-panel reading-card">
          <view class="reading-question-box">
            <text class="small-muted">你的问题</text>
            <text class="reading-question">{{ currentReading.question }}</text>
          </view>

          <text class="reading-title">大福的解读</text>

          <view class="tarot-cards">
            <view v-for="(card, idx) in currentReading.cards" :key="`${card}-${idx}`" class="tarot-card-item">
              <view class="mini-card">✨</view>
              <view>
                <text class="mini-pos">{{ currentReading.spread.positions[idx] }}</text>
                <text class="mini-name">{{ card }}</text>
              </view>
            </view>
          </view>

          <text class="reading-text pre">{{ currentReading.reading }}</text>
        </view>

        <view
          v-for="(msg, idx) in currentReading.chatHistory"
          :key="`msg-${idx}`"
          :class="['chat-row', msg.role === 'user' ? 'chat-row-user' : 'chat-row-model']"
        >
          <view :class="['chat-bubble', msg.role === 'user' ? 'chat-user' : 'glass-panel']">
            <text class="chat-text pre">{{ msg.content }}</text>
          </view>
        </view>

        <view v-if="isChatting" class="chat-row chat-row-model">
          <view class="glass-panel chat-bubble">
            <text class="chat-text">大福正在思考...</text>
          </view>
        </view>
      </scroll-view>

      <view class="chat-input-wrap">
        <input
          v-model="followUp"
          class="chat-input"
          placeholder="继续向大福提问..."
          @confirm="handleSendFollowUp"
        />
        <view class="send-btn" @click="handleSendFollowUp">➤</view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { onMounted, ref } from 'vue';
import { determineTarotSpread, generateTarotFollowUp, generateTarotReading } from '../utils/api';

const TAROT_DECK = [
  '愚者', '魔术师', '女祭司', '皇后', '皇帝', '教皇',
  '恋人', '战车', '力量', '隐士', '命运之轮', '正义',
  '倒吊人', '死神', '节制', '恶魔', '高塔', '星星',
  '月亮', '太阳', '审判', '世界'
];

const view = ref('main');
const step = ref('question');
const question = ref('');
const spread = ref(null);
const selectedIndices = ref([]);

const currentReading = ref(null);
const history = ref([]);

const followUp = ref('');
const isChatting = ref(false);
const isLoading = ref(false);

onMounted(() => {
  const saved = uni.getStorageSync('tarot_history');
  if (saved) {
    history.value = saved;
  }
});

function saveHistory(next) {
  history.value = next;
  uni.setStorageSync('tarot_history', next);
}

async function handleStartDraw() {
  if (!question.value.trim()) return;
  isLoading.value = true;
  try {
    const spreadResult = await determineTarotSpread(question.value);
    spread.value = spreadResult;
    step.value = 'shuffling';
    setTimeout(() => {
      step.value = 'draw';
    }, 1600);
  } catch (error) {
    uni.showToast({ title: '暂时无法连接，请稍后再试', icon: 'none' });
  } finally {
    isLoading.value = false;
  }
}

async function handleSelectCard(index) {
  if (selectedIndices.value.includes(index) || !spread.value) return;

  const newSelected = [...selectedIndices.value, index];
  selectedIndices.value = newSelected;

  if (newSelected.length === spread.value.count) {
    const finalCards = [...TAROT_DECK].sort(() => 0.5 - Math.random()).slice(0, spread.value.count);

    isLoading.value = true;
    try {
      const reading = await generateTarotReading(question.value, spread.value, finalCards);
      const newItem = {
        id: `${Date.now()}`,
        date: new Date().toLocaleString('zh-CN'),
        question: question.value,
        spread: spread.value,
        cards: finalCards,
        reading,
        chatHistory: []
      };

      currentReading.value = newItem;
      saveHistory([newItem, ...history.value]);
      view.value = 'reading';

      step.value = 'question';
      question.value = '';
      spread.value = null;
      selectedIndices.value = [];
    } catch (error) {
      uni.showToast({ title: '解读失败，请稍后再试', icon: 'none' });
    } finally {
      isLoading.value = false;
    }
  }
}

async function handleSendFollowUp() {
  if (!followUp.value.trim() || !currentReading.value || isChatting.value) return;

  const userMsg = followUp.value;
  followUp.value = '';
  isChatting.value = true;

  const contextHistory = [
    {
      role: 'user',
      content: `我之前问了这个问题：“${currentReading.value.question}”。抽到的牌是：${currentReading.value.cards.join(', ')}。你的解读是：${currentReading.value.reading}`
    },
    { role: 'model', content: '我记得。请问你还有什么想深入了解的吗？' },
    ...currentReading.value.chatHistory
  ];

  const updatedReading = {
    ...currentReading.value,
    chatHistory: [...currentReading.value.chatHistory, { role: 'user', content: userMsg }]
  };
  currentReading.value = updatedReading;

  try {
    const reply = await generateTarotFollowUp(contextHistory, userMsg);
    const finalReading = {
      ...updatedReading,
      chatHistory: [...updatedReading.chatHistory, { role: 'model', content: reply }]
    };
    currentReading.value = finalReading;
    saveHistory(history.value.map((h) => (h.id === finalReading.id ? finalReading : h)));
  } catch (error) {
    uni.showToast({ title: '追问失败，请稍后再试', icon: 'none' });
  } finally {
    isChatting.value = false;
  }
}

function openHistoryItem(item) {
  currentReading.value = item;
  view.value = 'reading';
}
</script>

<style scoped lang="scss">
.tarot-wrap { min-height: 100%; display: flex; flex-direction: column; }
.head { display: flex; justify-content: space-between; align-items: center; margin-top: 8rpx; margin-bottom: 16rpx; }
.icon-btn, .spacer { width: 64rpx; height: 64rpx; display: flex; justify-content: center; align-items: center; color: #3a5358; }
.head-center { text-align: center; }
.title { display: block; color: #3a5358; font-size: 34rpx; font-weight: 600; }
.sub { display: block; margin-top: 4rpx; color: #6b8287; font-size: 22rpx; }
.glass-panel { background: rgba(255,255,255,0.62); border: 1rpx solid rgba(255,255,255,0.82); box-shadow: 0 12rpx 32rpx rgba(140,133,123,0.08); }
.panel { border-radius: 28rpx; padding: 24rpx; }
.label { display: block; color: #3a5358; font-size: 26rpx; margin-bottom: 14rpx; }
.textarea { width: 100%; height: 240rpx; box-sizing: border-box; border: 1rpx solid rgba(255,255,255,0.7); border-radius: 16rpx; background: rgba(255,255,255,0.45); color: #2c3e42; padding: 16rpx; font-size: 27rpx; }
.primary-btn { margin-top: 18rpx; background: #8ba89f; color: #fff; border-radius: 16rpx; font-size: 27rpx; }
.primary-btn::after { border: 0; }
.shuffle-wrap { min-height: 640rpx; display: flex; flex-direction: column; justify-content: center; align-items: center; }
.shuffle-cards { width: 180rpx; height: 260rpx; position: relative; }
.shuffle-card { position: absolute; inset: 0; background: rgba(255,255,255,0.65); border: 1rpx solid rgba(139,168,159,0.45); border-radius: 16rpx; display: flex; justify-content: center; align-items: center; color: rgba(92,122,125,0.55); font-size: 38rpx; }
.card-1 { transform: translateX(-20rpx) rotate(-6deg); }
.card-2 { transform: translateX(0) rotate(0); }
.card-3 { transform: translateX(20rpx) rotate(6deg); }
.shuffle-text { margin-top: 18rpx; color: #5c7a7d; font-size: 24rpx; }
.draw-wrap { min-height: 640rpx; }
.draw-head { text-align: center; margin-bottom: 18rpx; }
.draw-title { display: block; color: #3a5358; font-size: 26rpx; }
.draw-sub { display: block; margin-top: 6rpx; color: #6b8287; font-size: 22rpx; }
.card-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10rpx; }
.deck-card { aspect-ratio: 2/3; border-radius: 12rpx; background: rgba(255,255,255,0.62); border: 1rpx solid rgba(255,255,255,0.6); display: flex; justify-content: center; align-items: center; color: rgba(92,122,125,0.45); }
.deck-card-selected { background: rgba(139,168,159,0.2); border-color: #8ba89f; opacity: 0.6; }
.loading-more { margin-top: 14rpx; display: flex; justify-content: center; align-items: center; gap: 10rpx; color: #5c7a7d; font-size: 22rpx; }
.spinner { width: 28rpx; height: 28rpx; border-radius: 999rpx; border: 3rpx solid rgba(255,255,255,0.6); border-top-color: #8ba89f; animation: spin 1s linear infinite; }
.history-view { flex: 1; }
.empty { margin-top: 120rpx; text-align: center; color: #6b8287; font-size: 24rpx; }
.history-item { border-radius: 22rpx; padding: 18rpx; margin-bottom: 12rpx; }
.history-top { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 8rpx; }
.history-date { color: #6b8287; font-size: 20rpx; }
.history-tag { background: rgba(139,168,159,0.16); color: #3a5358; font-size: 20rpx; border-radius: 10rpx; padding: 4rpx 12rpx; }
.history-question { color: #2c3e42; font-size: 24rpx; line-height: 1.5; }
.reading-view { flex: 1; min-height: 0; display: flex; flex-direction: column; }
.reading-scroll { flex: 1; min-height: 0; }
.reading-card { border-radius: 26rpx; padding: 22rpx; margin-bottom: 14rpx; }
.reading-question-box { margin-bottom: 16rpx; padding-bottom: 14rpx; border-bottom: 1rpx solid rgba(255,255,255,0.5); }
.small-muted { color: #6b8287; font-size: 20rpx; }
.reading-question { display: block; margin-top: 4rpx; color: #2c3e42; font-size: 24rpx; }
.reading-title { color: #3a5358; font-size: 30rpx; font-weight: 600; margin-bottom: 12rpx; }
.tarot-cards { display: flex; flex-direction: column; gap: 10rpx; margin-bottom: 16rpx; }
.tarot-card-item { background: rgba(255,255,255,0.4); border: 1rpx solid rgba(255,255,255,0.6); border-radius: 14rpx; padding: 12rpx; display: flex; gap: 12rpx; align-items: center; }
.mini-card { width: 56rpx; height: 74rpx; border-radius: 10rpx; background: rgba(255,255,255,0.58); border: 1rpx solid rgba(139,168,159,0.4); display: flex; justify-content: center; align-items: center; }
.mini-pos { display: block; color: #6b8287; font-size: 20rpx; }
.mini-name { display: block; color: #3a5358; font-size: 24rpx; margin-top: 2rpx; }
.reading-text { color: #2c3e42; font-size: 24rpx; line-height: 1.7; }
.chat-row { display: flex; margin-bottom: 10rpx; }
.chat-row-user { justify-content: flex-end; }
.chat-row-model { justify-content: flex-start; }
.chat-bubble { max-width: 84%; border-radius: 20rpx; padding: 14rpx; }
.chat-user { background: #8ba89f; color: #fff; }
.chat-text { font-size: 23rpx; line-height: 1.6; }
.chat-input-wrap { display: flex; align-items: center; gap: 10rpx; margin-top: 8rpx; }
.chat-input { flex: 1; height: 72rpx; border-radius: 999rpx; border: 1rpx solid rgba(255,255,255,0.7); background: rgba(255,255,255,0.62); padding: 0 24rpx; font-size: 24rpx; color: #2c3e42; }
.send-btn { width: 62rpx; height: 62rpx; border-radius: 999rpx; background: #8ba89f; color: #fff; display: flex; align-items: center; justify-content: center; }
.pre { white-space: pre-wrap; }
@keyframes spin { to { transform: rotate(360deg); } }
</style>
