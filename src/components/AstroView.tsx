import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { generateAstroReading, generateAstroTransit, generateAstroBlessing } from '../lib/gemini';
import ReactMarkdown from 'react-markdown';
import { User, Plus, ChevronDown } from 'lucide-react';

interface AstroProfile {
  id: string;
  name: string;
  date: string;
  time: string;
  reading: string | null;
  transit: string | null;
  blessing: string | null;
  avatarSeed: string;
}

function AstroChartSVG() {
  return (
    <div className="relative w-full aspect-square max-w-[280px] mx-auto mb-8">
      <svg viewBox="0 0 200 200" className="w-full h-full animate-[spin_60s_linear_infinite]">
        {/* Outer Ring */}
        <circle cx="100" cy="100" r="95" fill="none" stroke="currentColor" strokeWidth="1" className="text-gold-500/30" />
        <circle cx="100" cy="100" r="85" fill="none" stroke="currentColor" strokeWidth="1" className="text-gold-500/50" />
        
        {/* 12 Houses */}
        {Array.from({ length: 12 }).map((_, i) => {
          const angle = (i * 30) * (Math.PI / 180);
          const x1 = 100 + 85 * Math.cos(angle);
          const y1 = 100 + 85 * Math.sin(angle);
          const x2 = 100 + 30 * Math.cos(angle);
          const y2 = 100 + 30 * Math.sin(angle);
          return (
            <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="currentColor" strokeWidth="0.5" className="text-gold-500/20" />
          );
        })}

        {/* Inner Rings */}
        <circle cx="100" cy="100" r="30" fill="none" stroke="currentColor" strokeWidth="1" className="text-gold-500/40" />
        <circle cx="100" cy="100" r="25" fill="none" stroke="currentColor" strokeWidth="0.5" className="text-gold-500/20" />

        {/* Zodiac Symbols (Simplified representations) */}
        {['♈', '♉', '♊', '♋', '♌', '♍', '♎', '♏', '♐', '♑', '♒', '♓'].map((symbol, i) => {
          const angle = (i * 30 + 15) * (Math.PI / 180);
          const x = 100 + 90 * Math.cos(angle);
          const y = 100 + 90 * Math.sin(angle);
          return (
            <text key={i} x={x} y={y} fontSize="8" fill="currentColor" textAnchor="middle" dominantBaseline="middle" className="text-gold-400" transform={`rotate(${i * 30 + 15 + 90}, ${x}, ${y})`}>
              {symbol}
            </text>
          );
        })}

        {/* Planetary Aspects (Random lines in the center) */}
        <path d="M 80 80 L 120 120 M 120 80 L 80 120 M 100 70 L 100 130 M 70 100 L 130 100" stroke="currentColor" strokeWidth="0.5" className="text-gold-500/30" />
        <circle cx="100" cy="100" r="3" fill="currentColor" className="text-gold-400" />
      </svg>
      {/* Center glowing orb */}
      <div className="absolute inset-0 m-auto w-12 h-12 bg-gold-500/20 rounded-full blur-xl" />
    </div>
  );
}

export default function AstroView() {
  const [profiles, setProfiles] = useState<AstroProfile[]>([]);
  const [activeProfileId, setActiveProfileId] = useState<string | null>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  
  // Form state for new profile
  const [newName, setNewName] = useState('');
  const [newDate, setNewDate] = useState('');
  const [newTime, setNewTime] = useState('');
  
  const [isLoading, setIsLoading] = useState(false);
  const [isTransitLoading, setIsTransitLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'natal' | 'transit'>('natal');

  // Load saved profiles
  useEffect(() => {
    const savedProfiles = localStorage.getItem('astro_profiles');
    const savedActiveId = localStorage.getItem('astro_active_profile_id');
    
    if (savedProfiles) {
      try {
        const parsed = JSON.parse(savedProfiles);
        setProfiles(parsed);
        if (savedActiveId && parsed.some((p: AstroProfile) => p.id === savedActiveId)) {
          setActiveProfileId(savedActiveId);
        } else if (parsed.length > 0) {
          setActiveProfileId(parsed[0].id);
        }
      } catch (e) {
        console.error("Failed to parse profiles", e);
      }
    }
  }, []);

  // Save profiles when they change
  useEffect(() => {
    if (profiles.length > 0) {
      localStorage.setItem('astro_profiles', JSON.stringify(profiles));
    }
    if (activeProfileId) {
      localStorage.setItem('astro_active_profile_id', activeProfileId);
    }
  }, [profiles, activeProfileId]);

  const activeProfile = profiles.find(p => p.id === activeProfileId);

  const handleCreateProfile = async () => {
    if (!newName || !newDate || !newTime) return;
    
    setIsLoading(true);
    
    // Generate initial reading and blessing sequentially with a small delay to avoid rate limits
    const reading = await generateAstroReading(newName, newDate, newTime);
    await new Promise(resolve => setTimeout(resolve, 1000)); // 1 second delay
    const blessing = await generateAstroBlessing(newName, newDate);
    
    const newProfile: AstroProfile = {
      id: Date.now().toString(),
      name: newName,
      date: newDate,
      time: newTime,
      reading,
      transit: null,
      blessing,
      avatarSeed: newName + newDate // Simple seed for consistent avatar
    };
    
    setProfiles([...profiles, newProfile]);
    setActiveProfileId(newProfile.id);
    
    // Reset form
    setNewName('');
    setNewDate('');
    setNewTime('');
    setIsLoading(false);
  };

  const handleGenerateTransit = async () => {
    if (!activeProfile) return;
    
    setIsTransitLoading(true);
    const result = await generateAstroTransit(activeProfile.name, activeProfile.date, activeProfile.time);
    
    setProfiles(profiles.map(p => 
      p.id === activeProfile.id ? { ...p, transit: result } : p
    ));
    
    setIsTransitLoading(false);
  };

  const switchProfile = (id: string) => {
    setActiveProfileId(id);
    setIsDropdownOpen(false);
    setActiveTab('natal');
  };

  return (
    <div className="px-6 flex flex-col min-h-full pb-8 flex-1">
      <div className="text-center mt-4 mb-6 shrink-0">
        <h2 className="text-xl font-serif text-gold-600">星盘解析</h2>
        <p className="text-xs text-text-muted mt-1">探索你灵魂的蓝图</p>
      </div>

      {/* Profile Selector */}
      {profiles.length > 0 && (
        <div className="relative mb-6 z-20">
          <button 
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="w-full glass-panel rounded-2xl p-3 flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <img 
                src={`https://api.dicebear.com/9.x/notionists/svg?seed=${activeProfile?.avatarSeed}&backgroundColor=EBE5D9`} 
                alt="Avatar" 
                className="w-10 h-10 rounded-full border border-gold-400/30"
              />
              <div className="text-left">
                <p className="text-sm font-medium text-text-main">{activeProfile?.name}</p>
                <p className="text-xs text-text-muted truncate max-w-[180px]">{activeProfile?.blessing}</p>
              </div>
            </div>
            <ChevronDown className={`w-5 h-5 text-text-muted transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
          </button>

          <AnimatePresence>
            {isDropdownOpen && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="absolute top-full left-0 right-0 mt-2 glass-panel rounded-2xl overflow-hidden shadow-lg"
              >
                {profiles.map(p => (
                  <button
                    key={p.id}
                    onClick={() => switchProfile(p.id)}
                    className={`w-full text-left p-3 flex items-center gap-3 hover:bg-white/40 transition-colors ${p.id === activeProfileId ? 'bg-white/30' : ''}`}
                  >
                    <img 
                      src={`https://api.dicebear.com/9.x/notionists/svg?seed=${p.avatarSeed}&backgroundColor=EBE5D9`} 
                      alt="Avatar" 
                      className="w-8 h-8 rounded-full border border-gold-400/20"
                    />
                    <span className="text-sm text-text-main">{p.name}</span>
                  </button>
                ))}
                <button
                  onClick={() => {
                    setActiveProfileId(null);
                    setIsDropdownOpen(false);
                  }}
                  className="w-full text-left p-3 flex items-center gap-3 hover:bg-white/40 transition-colors text-gold-600 border-t border-white/30"
                >
                  <div className="w-8 h-8 rounded-full bg-gold-400/10 flex items-center justify-center">
                    <Plus className="w-4 h-4" />
                  </div>
                  <span className="text-sm font-medium">新建星盘档案</span>
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      <AnimatePresence mode="wait">
        {!activeProfileId && (
          <motion.div
            key="form"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="flex-1"
          >
            <div className="glass-panel rounded-3xl p-6 space-y-6">
              <div className="text-center mb-2">
                <h3 className="text-lg font-serif text-gold-600">新建档案</h3>
                <p className="text-xs text-text-muted mt-1">输入信息，生成专属星盘</p>
              </div>

              <div>
                <label className="block text-xs text-gold-600 mb-2 uppercase tracking-wider">称呼</label>
                <input 
                  type="text" 
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="你的名字或昵称"
                  className="w-full bg-white/40 border border-white/50 rounded-xl p-3 text-text-main focus:outline-none focus:border-gold-500 placeholder:text-text-muted/50"
                />
              </div>

              <div>
                <label className="block text-xs text-gold-600 mb-2 uppercase tracking-wider">出生日期</label>
                <input 
                  type="date" 
                  value={newDate}
                  onChange={(e) => setNewDate(e.target.value)}
                  className="w-full bg-white/40 border border-white/50 rounded-xl p-3 text-text-main focus:outline-none focus:border-gold-500"
                />
              </div>
              
              <div>
                <label className="block text-xs text-gold-600 mb-2 uppercase tracking-wider">出生时间</label>
                <input 
                  type="time" 
                  value={newTime}
                  onChange={(e) => setNewTime(e.target.value)}
                  className="w-full bg-white/40 border border-white/50 rounded-xl p-3 text-text-main focus:outline-none focus:border-gold-500"
                />
              </div>

              <div className="pt-2 flex gap-3">
                {profiles.length > 0 && (
                  <button
                    onClick={() => setActiveProfileId(profiles[0].id)}
                    className="flex-1 py-3 rounded-xl bg-white/40 text-text-main font-medium hover:bg-white/60 transition-colors"
                  >
                    取消
                  </button>
                )}
                <button
                  onClick={handleCreateProfile}
                  disabled={!newName || !newDate || !newTime || isLoading}
                  className="flex-[2] py-3 rounded-xl bg-gold-400 text-white font-medium disabled:opacity-50 flex justify-center items-center gap-2 shadow-sm hover:bg-gold-500 transition-colors"
                >
                  {isLoading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>大福正在计算...</span>
                    </>
                  ) : (
                    <span>生成星盘报告</span>
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {activeProfile && (
          <motion.div
            key="reading"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex-1 pb-8 flex flex-col min-h-0"
          >
            <div className="glass-panel rounded-3xl p-6 relative overflow-y-auto flex-1 flex flex-col">
              {/* Decorative background element */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-gold-400/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
              
              <div className="flex justify-between items-center mb-6 border-b border-white/40 pb-4 relative z-10 shrink-0">
                <div>
                  <h3 className="text-lg font-serif text-gold-600">大福的星盘解析</h3>
                  <p className="text-xs text-text-muted mt-1">{activeProfile.date} {activeProfile.time}</p>
                </div>
              </div>

              <div className="shrink-0">
                <AstroChartSVG />
              </div>

              {/* Tabs for Natal vs Transit */}
              <div className="flex gap-2 mb-6 bg-white/30 p-1 rounded-xl shrink-0">
                <button
                  onClick={() => setActiveTab('natal')}
                  className={`flex-1 py-2 text-sm rounded-lg transition-colors ${activeTab === 'natal' ? 'bg-white/60 text-gold-600 shadow-sm' : 'text-text-muted hover:text-text-main'}`}
                >
                  本命星盘
                </button>
                <button
                  onClick={() => {
                    setActiveTab('transit');
                    if (!activeProfile.transit && !isTransitLoading) {
                      handleGenerateTransit();
                    }
                  }}
                  className={`flex-1 py-2 text-sm rounded-lg transition-colors ${activeTab === 'transit' ? 'bg-white/60 text-gold-600 shadow-sm' : 'text-text-muted hover:text-text-main'}`}
                >
                  流年运势
                </button>
              </div>

              <div className="text-sm font-serif leading-relaxed text-text-main whitespace-pre-wrap relative z-10 [&>h1]:text-lg [&>h1]:text-gold-600 [&>h1]:mb-4 [&>h2]:text-base [&>h2]:text-gold-500 [&>h2]:mt-6 [&>h2]:mb-2 [&>p]:mb-4 [&>ul]:list-disc [&>ul]:pl-5 [&>ul]:mb-4 [&>strong]:text-gold-600 flex-1">
                {activeTab === 'natal' ? (
                  <ReactMarkdown>{activeProfile.reading || ''}</ReactMarkdown>
                ) : (
                  isTransitLoading ? (
                    <div className="flex flex-col items-center justify-center py-10 gap-4">
                      <div className="w-8 h-8 border-2 border-bg-muted/20 border-t-gold-400 rounded-full animate-spin" />
                      <p className="text-sm text-gold-500 animate-pulse">大福正在观测流年星象...</p>
                    </div>
                  ) : activeProfile.transit ? (
                    <ReactMarkdown>{activeProfile.transit}</ReactMarkdown>
                  ) : null
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
