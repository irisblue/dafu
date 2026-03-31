import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { generateDailyFortune, DailyFortune } from '../lib/gemini';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';

// Helper to determine today's theme
function getThemeForToday() {
  const date = new Date();
  const month = date.getMonth() + 1;
  const day = date.getDate();
  
  if (month === 3 && day >= 10 && day <= 15) {
    return { name: '植树节', particle: '🍎', prompt: '今天是植树节前后，万物生发，充满生机...' };
  }
  if (month === 3 || month === 4) {
    return { name: '春日落樱', particle: '🌸', prompt: '正值春日，樱花飘落，微风和煦...' };
  }
  if (month === 6 || month === 7) {
    return { name: '夏日微风', particle: '🍃', prompt: '夏日炎炎，微风拂过，带来清凉...' };
  }
  if (month === 9 || month === 10) {
    return { name: '秋日落叶', particle: '🍁', prompt: '秋意渐浓，落叶归根，适合沉淀...' };
  }
  if (month === 12 || month === 1) {
    return { name: '冬日初雪', particle: '❄️', prompt: '冬日初雪，万物纯洁，内心宁静...' };
  }
  return { name: '温柔日常', particle: '✨', prompt: '温柔的日常里，充满小确幸...' };
}

const MONET_PAINTINGS = [
  "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3f/Water_Lilies_by_Claude_Monet_-_1906.jpg/800px-Water_Lilies_by_Claude_Monet_-_1906.jpg",
  "https://upload.wikimedia.org/wikipedia/commons/thumb/f/fd/Claude_Monet_-_Water_Lilies_-_1906%2C_Ryuzo_Ryuzaki.jpg/800px-Claude_Monet_-_Water_Lilies_-_1906%2C_Ryuzo_Ryuzaki.jpg",
  "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a4/Claude_Monet_1899_Nympheas_02.jpg/800px-Claude_Monet_1899_Nympheas_02.jpg",
  "https://upload.wikimedia.org/wikipedia/commons/thumb/1/10/Claude_Monet_-_Water_Lilies_-_1916.jpg/800px-Claude_Monet_-_Water_Lilies_-_1916.jpg",
  "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e0/Claude_Monet_-_Water_Lilies_-_1908.jpg/800px-Claude_Monet_-_Water_Lilies_-_1908.jpg"
];

export default function DailyView() {
  const [fortune, setFortune] = useState<DailyFortune | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState<'loading' | 'message' | 'cards'>('loading');
  const [merit, setMerit] = useState(0);
  const [clicks, setClicks] = useState<{ id: number, x: number, y: number }[]>([]);
  const [clickCount, setClickCount] = useState(0);
  const [isHit, setIsHit] = useState(false);

  const theme = getThemeForToday();

  useEffect(() => {
    const savedMerit = localStorage.getItem('user_merit');
    if (savedMerit) setMerit(parseInt(savedMerit, 10));

    const fetchTodayFortune = async () => {
      const todayStr = new Date().toISOString().split('T')[0];
      const cached = localStorage.getItem(`fortune_${todayStr}`);
      if (cached) {
        setFortune(JSON.parse(cached));
        setStep('message');
      } else {
        setIsLoading(true);
        const result = await generateDailyFortune(theme.prompt);
        if (result) {
          setFortune(result);
          localStorage.setItem(`fortune_${todayStr}`, JSON.stringify(result));
          setStep('message');
        }
        setIsLoading(false);
      }
    };
    fetchTodayFortune();
  }, [theme.prompt]);

  const handleRegenerate = async () => {
    setIsLoading(true);
    setStep('loading');
    const todayStr = new Date().toISOString().split('T')[0];
    const result = await generateDailyFortune(theme.prompt);
    if (result) {
      setFortune(result);
      localStorage.setItem(`fortune_${todayStr}`, JSON.stringify(result));
      setStep('message');
    }
    setIsLoading(false);
  };

  const handleMeritClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const newMerit = merit + 1;
    setMerit(newMerit);
    localStorage.setItem('user_merit', newMerit.toString());

    const newClick = { id: clickCount, x, y };
    setClicks([...clicks, newClick]);
    setClickCount(clickCount + 1);
    
    setIsHit(true);
    setTimeout(() => setIsHit(false), 150);

    setTimeout(() => {
      setClicks(prev => prev.filter(c => c.id !== newClick.id));
    }, 1000);
  };

  const today = format(new Date(), 'yyyy年MM月dd日 EEEE', { locale: zhCN });
  const dayOfYear = Math.floor((new Date().getTime() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 1000 / 60 / 60 / 24);
  const monetImage = MONET_PAINTINGS[dayOfYear % MONET_PAINTINGS.length];

  return (
    <div className="px-6 flex flex-col gap-6 pb-8 flex-1">
      {/* Date Header */}
      <div className="text-center mt-2 shrink-0">
        <p className="text-sm text-text-muted tracking-widest">{today} · {theme.name}</p>
      </div>

      {/* Daily Fortune Card */}
      <div className="relative flex flex-col">
        <div className="glass-panel rounded-3xl p-6 relative overflow-hidden flex flex-col items-center justify-center min-h-[420px]">

          <AnimatePresence mode="wait">
            {step === 'loading' && (
              <motion.div
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center gap-4 z-10"
              >
                <div className="w-10 h-10 border-2 border-white/50 border-t-gold-400 rounded-full animate-spin" />
                <p className="text-sm text-gold-500 animate-pulse">大福正在为你感应今日能量...</p>
              </motion.div>
            )}

            {step === 'message' && fortune && (
              <motion.div
                key="message"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="w-full flex flex-col items-center gap-6 z-10 h-full justify-center"
              >
                <div className="w-full min-h-[280px] rounded-3xl overflow-hidden shadow-sm relative border border-white/50 flex items-center justify-center p-8 text-center">
                  <img 
                    src={monetImage} 
                    alt="Daily Inspiration" 
                    className="absolute inset-0 w-full h-full object-cover opacity-70"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-white/40 backdrop-blur-[2px]" />
                  <p className="relative z-10 text-gold-600 font-serif text-xl leading-relaxed font-medium">
                    "{fortune.message}"
                  </p>
                </div>
                
                <button 
                  onClick={() => setStep('cards')}
                  className="px-8 py-3.5 rounded-full bg-gold-400 text-white font-medium text-sm tracking-wider hover:bg-gold-500 transition-colors shadow-sm w-full max-w-[200px]"
                >
                  开启今日指引
                </button>
              </motion.div>
            )}

            {step === 'cards' && fortune && (
              <motion.div
                key="cards"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="w-full h-full flex flex-col z-10"
              >
                <div className="flex justify-between items-center mb-6 shrink-0">
                  <h3 className="text-lg font-serif text-gold-600">今日指引</h3>
                  <button 
                    onClick={() => setStep('message')}
                    className="text-xs text-text-muted hover:text-gold-500 transition-colors flex items-center gap-1"
                  >
                    <span>←</span> 返回
                  </button>
                </div>
                
                {/* Horizontal Scrollable Cards */}
                <div className="w-full overflow-x-auto snap-x snap-mandatory flex gap-4 pb-4 items-stretch">
                  
                  {/* Card 1: Color & Number */}
                  <div className="snap-center shrink-0 w-[85%] bg-white/40 rounded-3xl border border-white/50 p-6 flex flex-col justify-center items-center gap-6 shadow-sm min-h-[280px]">
                    <div className="text-center">
                      <div className="w-12 h-12 rounded-full bg-gold-400/20 flex items-center justify-center mx-auto mb-3">
                        <span className="text-xl">🎨</span>
                      </div>
                      <span className="text-sm text-text-muted block mb-1">幸运色</span>
                      <span className="text-xl font-serif text-gold-600">{fortune.luckyColor}</span>
                    </div>
                    <div className="w-16 h-px bg-gold-400/30" />
                    <div className="text-center">
                      <div className="w-12 h-12 rounded-full bg-gold-400/20 flex items-center justify-center mx-auto mb-3">
                        <span className="text-xl">🔢</span>
                      </div>
                      <span className="text-sm text-text-muted block mb-1">幸运数字</span>
                      <span className="text-xl font-serif text-gold-600">{fortune.luckyNumber}</span>
                    </div>
                  </div>

                  {/* Card 2: Travel & Outfit */}
                  <div className="snap-center shrink-0 w-[85%] bg-white/40 rounded-3xl border border-white/50 p-6 flex flex-col justify-center gap-6 shadow-sm min-h-[280px]">
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-lg">✨</span>
                        <span className="text-sm font-medium text-gold-600">出行建议</span>
                      </div>
                      <p className="text-sm text-text-main leading-relaxed pl-8">{fortune.travelAdvice}</p>
                    </div>
                    <div className="w-full h-px bg-gold-400/30" />
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-lg">👗</span>
                        <span className="text-sm font-medium text-gold-600">着装配饰</span>
                      </div>
                      <p className="text-sm text-text-main leading-relaxed pl-8">{fortune.outfit}</p>
                    </div>
                  </div>

                  {/* Card 3: Dos & Donts */}
                  <div className="snap-center shrink-0 w-[85%] bg-white/40 rounded-3xl border border-white/50 p-6 flex flex-col justify-center gap-4 shadow-sm min-h-[280px]">
                    <div className="bg-green-100/40 p-4 rounded-2xl border border-green-200/50 flex-1">
                      <span className="text-sm text-green-700 font-medium block mb-2 flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-green-500" /> 宜
                      </span>
                      <ul className="text-sm text-text-main space-y-1.5">
                        {fortune.dos.map((item, i) => <li key={i}>{item}</li>)}
                      </ul>
                    </div>
                    <div className="bg-red-100/40 p-4 rounded-2xl border border-red-200/50 flex-1">
                      <span className="text-sm text-red-700 font-medium block mb-2 flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-red-500" /> 忌
                      </span>
                      <ul className="text-sm text-text-main space-y-1.5">
                        {fortune.donts.map((item, i) => <li key={i}>{item}</li>)}
                      </ul>
                    </div>
                  </div>

                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

      {/* Merit Accumulator (Wooden Fish concept) */}
      <div className="glass-panel rounded-3xl p-6 flex flex-col items-center gap-4 mt-4 shrink-0">
        <div className="text-center">
          <p className="text-xs text-text-muted tracking-widest mb-1">今日功德 / 平静值</p>
          <p className="text-2xl font-mono text-gold-600">{merit.toLocaleString()}</p>
        </div>
        
        <button 
          onClick={handleMeritClick}
          className="relative w-24 h-24 flex items-center justify-center focus:outline-none"
        >
          <motion.div
            animate={isHit ? { scale: [1, 0.85, 1.05, 1], rotate: [0, -5, 3, 0] } : {}}
            transition={{ duration: 0.3 }}
            className="relative"
          >
            {/* Cute Wooden Fish SVG */}
            <svg viewBox="0 0 100 100" className="w-20 h-20 text-gold-600 drop-shadow-md">
              <path d="M50,15 C20,15 5,40 5,65 C5,85 25,95 50,95 C75,95 95,85 95,65 C95,40 80,15 50,15 Z" fill="currentColor" />
              {isHit ? (
                <>
                  {/* Hit Eyes >< */}
                  <path d="M28,52 L35,56 L28,60" stroke="#FDFBF7" strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M72,52 L65,56 L72,60" stroke="#FDFBF7" strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                  {/* Hit Mouth O */}
                  <circle cx="50" cy="70" r="4" fill="#FDFBF7" />
                </>
              ) : (
                <>
                  {/* Normal Eyes */}
                  <path d="M30,55 C30,52 32,50 35,50 C38,50 40,52 40,55 C40,58 38,60 35,60 C32,60 30,58 30,55 Z" fill="#FDFBF7" />
                  <path d="M70,55 C70,58 68,60 65,60 C62,60 60,58 60,55 C60,52 62,50 65,50 C68,50 70,52 70,55 Z" fill="#FDFBF7" />
                  {/* Normal Mouth */}
                  <path d="M50,75 C40,75 35,70 35,70 L38,67 C38,67 42,71 50,71 C58,71 62,67 62,67 L65,70 C65,70 60,75 50,75 Z" fill="#FDFBF7" />
                </>
              )}
              <path d="M85,40 L95,30" stroke="#FDFBF7" strokeWidth="4" strokeLinecap="round" />
            </svg>
            
            {/* Mallet animation */}
            <motion.div 
              animate={isHit ? { rotate: [0, -45, 0], x: [-10, -20, -10], y: [-10, 0, -10] } : {}}
              transition={{ duration: 0.2 }}
              className="absolute -top-4 -right-4 w-8 h-8 origin-bottom-left"
            >
              <svg viewBox="0 0 24 24" className="w-full h-full text-gold-500 drop-shadow-sm" fill="currentColor">
                <rect x="14" y="2" width="6" height="12" rx="3" transform="rotate(45 17 8)" />
                <rect x="8" y="10" width="4" height="14" rx="2" transform="rotate(45 10 17)" fill="#8C857B" />
              </svg>
            </motion.div>
          </motion.div>
          
          {/* Floating +1 animations */}
          <AnimatePresence>
            {clicks.map(click => (
              <motion.div
                key={click.id}
                initial={{ opacity: 1, y: 0, scale: 0.5 }}
                animate={{ opacity: 0, y: -50, scale: 1.2 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="absolute text-gold-500 font-bold text-lg pointer-events-none"
                style={{ left: '60%', top: '10%' }}
              >
                +1
              </motion.div>
            ))}
          </AnimatePresence>
        </button>
        <p className="text-xs text-text-muted">点击敲击，沉淀内心</p>
      </div>
      </div>
    </div>
  );
}
