import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, Moon, Star, Compass, Heart, Menu, X } from 'lucide-react';
import DailyView from './components/DailyView';
import TarotView from './components/TarotView';
import AstroView from './components/AstroView';

export default function App() {
  const [activeTab, setActiveTab] = useState<'daily' | 'tarot' | 'astro'>('daily');
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleTabChange = (tab: 'daily' | 'tarot' | 'astro') => {
    setActiveTab(tab);
    setIsMenuOpen(false);
  };

  return (
    <div className="h-screen flex justify-center bg-bg-main">
      {/* Mobile Container Simulator */}
      <div className="w-full max-w-md bg-bg-main/50 backdrop-blur-sm h-screen relative overflow-hidden shadow-2xl flex flex-col border-x border-white/30">
        
        {/* Header */}
        <header className="pt-12 pb-4 px-6 z-20 relative flex items-center justify-between">
          <button 
            onClick={() => setIsMenuOpen(true)}
            className="p-2 -ml-2 text-text-muted hover:bg-white/40 rounded-full transition-colors"
          >
            <Menu className="w-6 h-6" />
          </button>
          
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-gold-400/20 flex items-center justify-center text-gold-600">
              <Heart className="w-4 h-4 fill-current" />
            </div>
            <h1 className="text-xl font-serif text-gold-600 tracking-wide">
              大福
            </h1>
          </div>
          
          <div className="w-10" /> {/* Spacer for centering */}
        </header>

        {/* Slide-out Menu */}
        <AnimatePresence>
          {isMenuOpen && (
            <>
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsMenuOpen(false)}
                className="absolute inset-0 bg-black/10 backdrop-blur-sm z-40"
              />
              <motion.div
                initial={{ x: '-100%' }}
                animate={{ x: 0 }}
                exit={{ x: '-100%' }}
                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                className="absolute top-0 left-0 bottom-0 w-[80%] max-w-[300px] bg-bg-main/95 backdrop-blur-md border-r border-white/50 z-50 flex flex-col shadow-2xl"
              >
                <div className="pt-16 pb-8 px-6 flex flex-col items-center relative">
                  <button onClick={() => setIsMenuOpen(false)} className="absolute top-6 right-6 text-text-muted hover:text-text-main transition-colors">
                    <X className="w-6 h-6" />
                  </button>
                  <div className="w-12 h-12 rounded-full bg-gold-400/20 flex items-center justify-center text-gold-600 mb-4 shadow-inner">
                    <Heart className="w-6 h-6 fill-current" />
                  </div>
                  <h2 className="font-serif text-gold-600 text-xl tracking-widest">大福的宇宙</h2>
                  <div className="w-12 h-px bg-gold-400/50 mt-4"></div>
                </div>
                
                <div className="flex-1 py-4 px-6 space-y-3">
                  <MenuItem 
                    icon={<Compass className="w-5 h-5" />} 
                    label="今日指引" 
                    isActive={activeTab === 'daily'} 
                    onClick={() => handleTabChange('daily')} 
                  />
                  <MenuItem 
                    icon={<Sparkles className="w-5 h-5" />} 
                    label="塔罗占卜" 
                    isActive={activeTab === 'tarot'} 
                    onClick={() => handleTabChange('tarot')} 
                  />
                  <MenuItem 
                    icon={<Star className="w-5 h-5" />} 
                    label="星盘解析" 
                    isActive={activeTab === 'astro'} 
                    onClick={() => handleTabChange('astro')} 
                  />
                </div>
                
                <div className="p-8 text-xs text-text-muted text-center border-t border-white/20">
                  <p className="font-serif tracking-widest">你的专属心理疗愈伴侣</p>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden relative z-0 flex flex-col min-h-0">
          <AnimatePresence mode="wait">
            {activeTab === 'daily' && (
              <motion.div
                key="daily"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
                className="flex-1 flex flex-col min-h-0"
              >
                <DailyView />
              </motion.div>
            )}
            {activeTab === 'tarot' && (
              <motion.div
                key="tarot"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
                className="flex-1 flex flex-col min-h-0"
              >
                <TarotView />
              </motion.div>
            )}
            {activeTab === 'astro' && (
              <motion.div
                key="astro"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
                className="flex-1 flex flex-col min-h-0"
              >
                <AstroView />
              </motion.div>
            )}
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}

function MenuItem({ icon, label, isActive, onClick }: { icon: React.ReactNode, label: string, isActive: boolean, onClick: () => void }) {
  return (
    <button 
      onClick={onClick}
      className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl transition-all duration-300 ${isActive ? 'bg-white/80 text-gold-600 shadow-[0_4px_20px_rgba(140,133,123,0.1)] translate-x-2 border border-white' : 'text-text-muted hover:bg-white/50 hover:text-text-main hover:translate-x-1 border border-transparent'}`}
    >
      <div className={`p-2.5 rounded-xl transition-colors ${isActive ? 'bg-gold-400/20' : 'bg-white/50'}`}>
        {icon}
      </div>
      <span className="tracking-widest font-serif text-sm">{label}</span>
      {isActive && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-gold-400" />}
    </button>
  );
}
