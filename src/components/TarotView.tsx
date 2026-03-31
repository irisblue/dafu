import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { determineTarotSpread, generateTarotReading, generateTarotFollowUp, TarotSpread } from '../lib/gemini';
import ReactMarkdown from 'react-markdown';
import { Clock, Send, ChevronLeft } from 'lucide-react';

const TAROT_DECK = [
  "愚者", "魔术师", "女祭司", "皇后", "皇帝", "教皇",
  "恋人", "战车", "力量", "隐士", "命运之轮", "正义",
  "倒吊人", "死神", "节制", "恶魔", "高塔", "星星",
  "月亮", "太阳", "审判", "世界"
];

type ChatMessage = { role: string, parts: { text: string }[] };

type TarotHistoryItem = {
  id: string;
  date: string;
  question: string;
  spread: TarotSpread;
  cards: string[];
  reading: string;
  chatHistory: ChatMessage[];
};

export default function TarotView() {
  const [view, setView] = useState<'main' | 'history' | 'reading'>('main');
  const [step, setStep] = useState<'question' | 'shuffling' | 'draw'>('question');
  
  const [question, setQuestion] = useState('');
  const [spread, setSpread] = useState<TarotSpread | null>(null);
  const [selectedIndices, setSelectedIndices] = useState<number[]>([]);
  const [drawnCards, setDrawnCards] = useState<string[]>([]);
  
  const [currentReading, setCurrentReading] = useState<TarotHistoryItem | null>(null);
  const [history, setHistory] = useState<TarotHistoryItem[]>([]);
  
  const [followUp, setFollowUp] = useState('');
  const [isChatting, setIsChatting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const saved = localStorage.getItem('tarot_history');
    if (saved) {
      try {
        setHistory(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse history", e);
      }
    }
  }, []);

  useEffect(() => {
    if (view === 'reading') {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [currentReading?.chatHistory, view]);

  const saveHistory = (newHistory: TarotHistoryItem[]) => {
    setHistory(newHistory);
    localStorage.setItem('tarot_history', JSON.stringify(newHistory));
  };

  const handleStartDraw = async () => {
    if (!question.trim()) return;
    
    setIsLoading(true);
    const spreadResult = await determineTarotSpread(question);
    if (!spreadResult) {
      setIsLoading(false);
      alert("大福暂时无法连接，请稍后再试。");
      return;
    }
    
    setSpread(spreadResult);
    setIsLoading(false);
    
    setStep('shuffling');
    setTimeout(() => {
      setStep('draw');
    }, 2000);
  };

  const handleSelectCard = async (index: number) => {
    if (selectedIndices.includes(index)) return;
    if (!spread) return;

    const newSelected = [...selectedIndices, index];
    setSelectedIndices(newSelected);

    if (newSelected.length === spread.count) {
      const shuffled = [...TAROT_DECK].sort(() => 0.5 - Math.random());
      const finalCards = shuffled.slice(0, spread.count);
      setDrawnCards(finalCards);
      
      setIsLoading(true);
      const result = await generateTarotReading(question, spread, finalCards);
      
      const newItem: TarotHistoryItem = {
        id: Date.now().toString(),
        date: new Date().toLocaleString('zh-CN'),
        question,
        spread,
        cards: finalCards,
        reading: result,
        chatHistory: []
      };
      
      setCurrentReading(newItem);
      saveHistory([newItem, ...history]);
      
      setIsLoading(false);
      setView('reading');
      setStep('question');
      setQuestion('');
      setSpread(null);
      setSelectedIndices([]);
      setDrawnCards([]);
    }
  };

  const handleSendFollowUp = async () => {
    if (!followUp.trim() || !currentReading) return;
    
    const userMsg = followUp;
    setFollowUp('');
    setIsChatting(true);
    
    // Build context for the chat
    const contextHistory: ChatMessage[] = [
      { role: 'user', parts: [{ text: `我之前问了这个问题：“${currentReading.question}”。抽到的牌是：${currentReading.cards.join(', ')}。你的解读是：${currentReading.reading}` }] },
      { role: 'model', parts: [{ text: '我记得。请问你还有什么想深入了解的吗？' }] },
      ...currentReading.chatHistory
    ];
    
    // Optimistically add user message
    const updatedReading = {
      ...currentReading,
      chatHistory: [...currentReading.chatHistory, { role: 'user', parts: [{ text: userMsg }] }]
    };
    setCurrentReading(updatedReading);
    
    const reply = await generateTarotFollowUp(contextHistory, userMsg);
    
    const finalReading = {
      ...updatedReading,
      chatHistory: [...updatedReading.chatHistory, { role: 'model', parts: [{ text: reply }] }]
    };
    
    setCurrentReading(finalReading);
    saveHistory(history.map(h => h.id === finalReading.id ? finalReading : h));
    setIsChatting(false);
  };

  const openHistoryItem = (item: TarotHistoryItem) => {
    setCurrentReading(item);
    setView('reading');
  };

  return (
    <div className="px-6 flex flex-col min-h-full pb-8 flex-1">
      <div className="flex justify-between items-center mt-4 mb-6 shrink-0">
        {view !== 'main' ? (
          <button onClick={() => setView('main')} className="text-gold-600 p-2 -ml-2 hover:bg-white/40 rounded-full transition-colors">
            <ChevronLeft className="w-6 h-6" />
          </button>
        ) : <div className="w-10" />}
        
        <div className="text-center">
          <h2 className="text-xl font-serif text-gold-600">塔罗倾听</h2>
          <p className="text-xs text-text-muted mt-1">让潜意识为你指引方向</p>
        </div>
        
        {view === 'main' ? (
          <button onClick={() => setView('history')} className="text-gold-600 p-2 -mr-2 hover:bg-white/40 rounded-full transition-colors">
            <Clock className="w-5 h-5" />
          </button>
        ) : <div className="w-10" />}
      </div>

      <AnimatePresence mode="wait">
        {view === 'main' && (
          <motion.div
            key="main"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="flex-1 flex flex-col justify-center min-h-0"
          >
            {step === 'question' && (
              <div className="glass-panel rounded-3xl p-6 overflow-y-auto">
                <label className="block text-sm text-gold-600 mb-4 font-serif">
                  你现在有什么困惑或心事？
                </label>
                <textarea
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  placeholder="例如：我最近对工作感到很迷茫，不知道该不该换环境..."
                  className="w-full bg-white/40 border border-white/50 rounded-xl p-4 text-text-main placeholder:text-text-muted/50 focus:outline-none focus:border-gold-500 resize-none h-32"
                />
                <button
                  onClick={handleStartDraw}
                  disabled={!question.trim() || isLoading}
                  className="w-full mt-6 py-3 rounded-xl bg-gold-400 text-white font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gold-500 transition-colors flex justify-center items-center gap-2 shadow-sm"
                >
                  {isLoading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>大福正在思考牌阵...</span>
                    </>
                  ) : (
                    <span>告诉大福</span>
                  )}
                </button>
              </div>
            )}

            {step === 'shuffling' && (
              <div className="flex-1 flex flex-col items-center justify-center gap-8">
                <div className="relative w-24 h-36">
                  {[0, 1, 2].map((i) => (
                    <motion.div
                      key={i}
                      animate={{ 
                        x: [0, (i-1)*20, 0],
                        rotate: [0, (i-1)*10, 0]
                      }}
                      transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
                      className="absolute inset-0 bg-white/60 border border-gold-400/30 rounded-xl shadow-md flex items-center justify-center"
                    >
                      <div className="w-16 h-28 border border-gold-400/20 rounded-lg flex items-center justify-center">
                        <span className="text-gold-500/50 text-2xl">✧</span>
                      </div>
                    </motion.div>
                  ))}
                </div>
                <p className="text-sm text-gold-500 font-serif animate-pulse">大福正在为你洗牌...</p>
              </div>
            )}

            {step === 'draw' && spread && (
              <div className="flex-1 flex flex-col items-center gap-6">
                <div className="text-center">
                  <h3 className="text-sm font-serif text-gold-600 mb-1">大福为你选择了：{spread.name}</h3>
                  <p className="text-xs text-text-muted">
                    请深呼吸，凭直觉从下方抽取 <span className="font-bold text-gold-500">{spread.count}</span> 张牌
                    ({selectedIndices.length}/{spread.count})
                  </p>
                </div>
                
                <div className="grid grid-cols-4 gap-3 w-full max-w-[300px] mx-auto">
                  {Array(22).fill(0).map((_, idx) => {
                    const isSelected = selectedIndices.includes(idx);
                    return (
                      <motion.div 
                        key={idx}
                        whileHover={{ scale: isSelected ? 1 : 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handleSelectCard(idx)}
                        className={`aspect-[2/3] rounded-lg border flex items-center justify-center cursor-pointer transition-all duration-300 ${
                          isSelected 
                            ? 'bg-gold-400/20 border-gold-400 opacity-50' 
                            : 'bg-white/60 border-white/50 shadow-sm hover:border-gold-400/50'
                        }`}
                      >
                        <span className="text-gold-500/30 text-xs">✧</span>
                      </motion.div>
                    );
                  })}
                </div>

                {isLoading && (
                  <div className="flex flex-col items-center gap-2 mt-4">
                    <div className="w-6 h-6 border-2 border-white/50 border-t-gold-400 rounded-full animate-spin" />
                    <p className="text-xs text-gold-500">大福正在解读牌意...</p>
                  </div>
                )}
              </div>
            )}
          </motion.div>
        )}

        {view === 'history' && (
          <motion.div
            key="history"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="flex-1 overflow-y-auto pb-4 space-y-4"
          >
            {history.length === 0 ? (
              <div className="text-center text-text-muted mt-10 text-sm">
                暂无占卜记录
              </div>
            ) : (
              history.map(item => (
                <button
                  key={item.id}
                  onClick={() => openHistoryItem(item)}
                  className="w-full text-left glass-panel rounded-2xl p-4 hover:border-gold-400/30 transition-colors"
                >
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-xs text-text-muted">{item.date}</span>
                    <span className="text-xs text-gold-600 bg-gold-400/10 px-2 py-1 rounded-md">{item.spread.name}</span>
                  </div>
                  <p className="text-sm text-text-main line-clamp-2">{item.question}</p>
                </button>
              ))
            )}
          </motion.div>
        )}

        {view === 'reading' && currentReading && (
          <motion.div
            key="reading"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="flex-1 flex flex-col min-h-0"
          >
            <div className="flex-1 overflow-y-auto pb-4 space-y-6 pr-2">
              <div className="glass-panel rounded-3xl p-6">
                <div className="mb-4 pb-4 border-b border-white/40">
                  <p className="text-xs text-text-muted mb-1">你的问题</p>
                  <p className="text-sm text-text-main">{currentReading.question}</p>
                </div>

                <h3 className="text-lg font-serif text-gold-600 mb-4">
                  大福的解读
                </h3>
                
                <div className="flex flex-col gap-3 mb-6">
                  {currentReading.cards.map((card, idx) => (
                    <div key={idx} className="bg-white/30 p-3 rounded-xl border border-white/50 flex items-center gap-3">
                      <div className="w-10 h-14 bg-white/60 rounded border border-gold-400/30 flex items-center justify-center shrink-0">
                        <span className="text-xs">✨</span>
                      </div>
                      <div>
                        <div className="text-xs text-text-muted mb-0.5">{currentReading.spread.positions[idx]}</div>
                        <div className="text-sm font-medium text-gold-600">{card}</div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="text-sm font-serif leading-relaxed text-text-main whitespace-pre-wrap [&>h1]:text-lg [&>h1]:text-gold-600 [&>h1]:mb-4 [&>h2]:text-base [&>h2]:text-gold-500 [&>h2]:mt-6 [&>h2]:mb-2 [&>p]:mb-4 [&>ul]:list-disc [&>ul]:pl-5 [&>ul]:mb-4 [&>strong]:text-gold-600">
                  <ReactMarkdown>{currentReading.reading}</ReactMarkdown>
                </div>
              </div>

              {/* Chat History */}
              {currentReading.chatHistory.map((msg, idx) => (
                <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] rounded-2xl p-4 text-sm ${
                    msg.role === 'user' 
                      ? 'bg-gold-400 text-white rounded-br-sm shadow-sm' 
                      : 'glass-panel rounded-bl-sm text-text-main'
                  }`}>
                    <ReactMarkdown>{msg.parts[0].text}</ReactMarkdown>
                  </div>
                </div>
              ))}
              
              {isChatting && (
                <div className="flex justify-start">
                  <div className="glass-panel rounded-2xl rounded-bl-sm p-4 text-sm text-gold-500 flex items-center gap-2">
                    <div className="w-3 h-3 border-2 border-white/50 border-t-gold-400 rounded-full animate-spin" />
                    大福正在思考...
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Chat Input */}
            <div className="pt-2 pb-2">
              <div className="relative flex items-center">
                <input
                  type="text"
                  value={followUp}
                  onChange={(e) => setFollowUp(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSendFollowUp()}
                  placeholder="继续向大福提问..."
                  className="w-full bg-white/60 border border-white/50 rounded-full py-3 pl-4 pr-12 text-sm text-text-main placeholder:text-text-muted/50 focus:outline-none focus:border-gold-400 shadow-sm"
                />
                <button
                  onClick={handleSendFollowUp}
                  disabled={!followUp.trim() || isChatting}
                  className="absolute right-2 w-8 h-8 rounded-full bg-gold-400 text-white flex items-center justify-center disabled:opacity-50 hover:bg-gold-500 transition-colors"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
