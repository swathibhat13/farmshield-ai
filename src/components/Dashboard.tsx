
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import DiseaseScanner from './DiseaseScanner';
import WeatherPanel from './WeatherPanel';
import ResearchSection from './ResearchSection';
import AICommandCenter from './AICommandCenter';
import CropHistory from './CropHistory';
import FertilizerModule from './FertilizerModule';
import MarketSchemes from './MarketSchemes';
import { 
  Activity, 
  Leaf, 
  Wind, 
  ShieldCheck, 
  Cpu, 
  BarChart4, 
  TrendingUp,
  AlertCircle,
  X,
  Calendar
} from 'lucide-react';

interface DashboardProps {
  onArticleClick: (article: any) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ onArticleClick: externalOnArticleClick }) => {
  const userName = localStorage.getItem('fs_user_name') || 'Commander';
  const [selectedArticle, setSelectedArticle] = useState<any>(null);
  const stats = [
    { label: 'System Integrity', value: '99.8%', trend: '+0.2%', icon: Cpu, color: 'text-farm-accent' },
    { label: 'Global Risk Index', value: 'Low', trend: 'Stable', icon: ShieldCheck, color: 'text-healthy-emerald' },
    { label: 'Detection Accuracy', value: '94.2%', trend: '+1.5%', icon: Activity, color: 'text-farm-accent' },
    { label: 'Atmospheric Health', value: 'Optimal', trend: 'Vibrant', icon: Wind, color: 'text-blue-400' },
  ];

  return (
    <div className="min-h-screen bg-runway-black pt-16 pb-20 px-4 md:px-10">
      <div className="max-w-[1600px] mx-auto space-y-12">
        
        {/* ── Dashboard Header ── */}
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-16">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-4"
          >
            <div className="flex items-center gap-3">
              <span className="w-12 h-[1px] bg-farm-accent" />
              <span className="text-farm-accent text-[11px] font-bold uppercase tracking-[0.4em]">Agricultural Intelligence</span>
            </div>
            <h1 className="text-white text-5xl md:text-6xl font-normal leading-tight mb-2">
              Welcome, <span className="text-farm-accent">{userName}</span>
            </h1>
            <h2 className="text-white/80 text-3xl md:text-4xl font-light">
              Operational <span className="text-farm-accent">Pulse</span>
            </h2>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }}
            className="flex items-center gap-6 pb-2"
          >
            <div className="text-right">
              <div className="text-white/40 text-[10px] font-bold uppercase tracking-widest mb-1">Last Neural Sync</div>
              <div className="text-white font-mono text-sm">MAY 16, 2026 — 18:07:15</div>
            </div>
            <div className="w-12 h-12 rounded-full border border-white/10 flex items-center justify-center bg-white/5 animate-pulse">
              <Activity className="w-5 h-5 text-farm-accent" />
            </div>
          </motion.div>
        </header>

        {/* ── AI Intelligence Centerpiece ── */}
        <motion.section
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1 }}
          className="mb-12"
        >
          <AICommandCenter />
        </motion.section>

        {/* ── High-Level Metrics ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="bg-white/5 border border-white/10 rounded-3xl p-8 hover:bg-white/[0.08] transition-all group cursor-default"
            >
              <div className="flex justify-between items-start mb-6">
                <div className={`w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center border border-white/10 group-hover:border-farm-accent/30 transition-colors`}>
                  <stat.icon className={`w-6 h-6 ${stat.color}`} />
                </div>
                <div className="text-healthy-emerald text-[11px] font-bold bg-healthy-emerald/10 px-3 py-1 rounded-full">
                  {stat.trend}
                </div>
              </div>
              <div className="text-white/40 text-[11px] font-bold uppercase tracking-widest mb-1">{stat.label}</div>
              <div className="text-white text-3xl font-normal">{stat.value}</div>
            </motion.div>
          ))}
        </div>

        {/* ── Main Diagnostic Grid ── */}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-10">
          
          {/* Left: Disease Scanner Hub */}
          <div className="xl:col-span-7">
            <div className="relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-farm-accent/20 to-transparent rounded-[32px] blur-xl opacity-0 group-hover:opacity-100 transition duration-1000" />
              <div className="relative bg-black/40 backdrop-blur-3xl border border-white/10 rounded-[32px] overflow-hidden">
                <div className="p-8 border-b border-white/5 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-farm-accent/10 rounded-xl flex items-center justify-center">
                      <Leaf className="w-5 h-5 text-farm-accent" />
                    </div>
                    <div>
                      <h3 className="text-white text-xl font-normal">Neural Pathogen Scanner</h3>
                      <p className="text-white/40 text-[10px] uppercase font-bold tracking-widest mt-1">Ready for high-resolution specimen input</p>
                    </div>
                  </div>
                </div>
                <div className="p-2">
                  <DiseaseScanner />
                </div>
              </div>
            </div>
          </div>

          {/* Right: Weather & Quick Advisory */}
          <div className="xl:col-span-5 space-y-10">
            {/* compact advisory trigger */}
            <div className="bg-gradient-to-br from-farm-accent/20 to-black border border-farm-accent/30 rounded-[32px] p-10 flex flex-col justify-between min-h-[300px]">
              <div>
                <div className="w-12 h-12 bg-black rounded-2xl flex items-center justify-center mb-8 border border-white/10">
                  <BarChart4 className="w-6 h-6 text-farm-accent" />
                </div>
                <h3 className="text-white text-3xl font-normal mb-4">Strategic Forecasting</h3>
                <p className="text-white/60 text-sm leading-relaxed max-w-sm">
                  Initialize atmospheric modeling to predict yield variants and climate-related risk factors for your current location.
                </p>
              </div>
              <button 
                onClick={() => window.scrollTo({ top: 1200, behavior: 'smooth' })}
                className="w-full bg-farm-accent text-black font-bold py-5 rounded-2xl hover:scale-[1.02] transition-all uppercase tracking-widest text-[11px] flex items-center justify-center gap-3 mt-8 shadow-2xl shadow-farm-accent/20"
              >
                Launch Intelligence Report <TrendingUp className="w-4 h-4" />
              </button>
            </div>

            {/* Live Alerts */}
            <div className="bg-white/5 border border-white/10 rounded-[32px] p-8">
              <div className="flex items-center justify-between mb-8">
                <div className="text-white text-[11px] font-bold uppercase tracking-widest flex items-center gap-3">
                  <AlertCircle className="w-4 h-4 text-warning-amber" />
                  Real-time Neural Alerts
                </div>
                <span className="text-white/20 text-[10px] font-bold">LIVE</span>
              </div>
              <div className="space-y-4">
                {[
                  { msg: 'System calibrated for high humidity zones.', time: '2m ago', type: 'info' },
                  { msg: 'Gemini 1.5 Pro AI engine online.', time: '12m ago', type: 'success' },
                  { msg: 'Atmospheric risk in Pune region: Moderate.', time: '45m ago', type: 'warning' },
                ].map((alert, i) => (
                  <div key={i} className="flex justify-between items-start py-4 border-b border-white/5 last:border-0">
                    <p className="text-[13px] text-white/80 font-medium">{alert.msg}</p>
                    <span className="text-[10px] text-white/20 font-bold whitespace-nowrap ml-4">{alert.time}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* New Farmer Modules Grid */}
          <div className="xl:col-span-12 mt-6">
            <MarketSchemes />
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-10 xl:col-span-12 mt-6">
             <FertilizerModule />
             <CropHistory />
          </div>

          {/* Full Width Bottom: Strategic Advisory Hub */}
          <div className="xl:col-span-12 mt-10">
            <div className="bg-black/40 backdrop-blur-3xl border border-white/10 rounded-[40px] overflow-hidden">
               <div className="p-12 border-b border-white/5">
                  <div className="flex items-center gap-4 mb-4">
                    <span className="text-farm-accent text-[11px] font-bold uppercase tracking-[0.4em]">In-Depth Intelligence</span>
                  </div>
                  <h2 className="text-white text-4xl font-normal">Strategic <span className="text-farm-accent">Advisory</span> Hub</h2>
               </div>
               <div className="p-4">
                  <WeatherPanel />
               </div>
            </div>
          </div>

          {/* Full Width Bottom: Research Library */}
          <div className="xl:col-span-12 mt-10">
             <div className="flex items-center justify-between mb-10 px-4">
                <h3 className="text-white text-2xl font-normal italic tracking-tight">Research Intelligence Library</h3>
                <button className="text-farm-accent text-[11px] font-bold uppercase tracking-widest hover:underline transition-all">View All Archives</button>
             </div>
             <ResearchSection onArticleClick={setSelectedArticle} />
          </div>

        </div>
      </div>

      {/* Advanced Holographic Article Modal */}
      <AnimatePresence>
        {selectedArticle && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 md:p-12">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }}
              onClick={() => setSelectedArticle(null)}
              className="absolute inset-0 bg-black/90 backdrop-blur-md cursor-pointer"
            >
               {/* Ambient grid background */}
               <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/grid.png')] opacity-10" />
            </motion.div>
            
            <motion.div 
              initial={{ opacity: 0, scale: 0.98, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.98, y: 30 }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="relative w-full max-w-5xl bg-black/60 backdrop-blur-3xl border border-farm-accent/30 rounded-none overflow-hidden shadow-[0_0_50px_rgba(82,183,136,0.1)] flex flex-col max-h-[90vh]"
            >
              {/* Sci-Fi Decorative Corners */}
              <div className="absolute top-0 left-0 w-16 h-16 border-t-2 border-l-2 border-farm-accent z-20 pointer-events-none" />
              <div className="absolute top-0 right-0 w-16 h-16 border-t-2 border-r-2 border-farm-accent z-20 pointer-events-none" />
              <div className="absolute bottom-0 left-0 w-16 h-16 border-b-2 border-l-2 border-farm-accent z-20 pointer-events-none" />
              <div className="absolute bottom-0 right-0 w-16 h-16 border-b-2 border-r-2 border-farm-accent z-20 pointer-events-none" />
              
              {/* Animated Scan Line */}
              <motion.div 
                animate={{ top: ['0%', '100%', '0%'] }}
                transition={{ duration: 6, repeat: Infinity, ease: "linear" }}
                className="absolute left-0 right-0 h-[1px] bg-farm-accent/40 shadow-[0_0_15px_#52b788] z-30 pointer-events-none"
              />

              {/* Header Image Area */}
              <div className="relative h-72 md:h-96 shrink-0 border-b border-farm-accent/20">
                <img src={selectedArticle.image} alt={selectedArticle.title} className="w-full h-full object-cover opacity-80" />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />
                
                {/* Tech UI Elements over Image */}
                <div className="absolute top-6 left-8 flex items-center gap-3 z-10">
                   <div className="w-2 h-2 bg-warning-amber rounded-full animate-ping" />
                   <span className="text-warning-amber text-[9px] font-bold tracking-[0.4em] uppercase">Secure Datalink Active</span>
                </div>

                <button 
                  onClick={() => setSelectedArticle(null)}
                  className="absolute top-6 right-8 w-12 h-12 bg-black/60 backdrop-blur-md flex items-center justify-center text-farm-accent hover:text-black hover:bg-farm-accent transition-all border border-farm-accent/50 z-20 group"
                >
                  <X className="w-5 h-5 group-hover:rotate-90 transition-transform duration-300" />
                </button>

                <div className="absolute bottom-10 left-10 right-10 z-10">
                  <div className="flex items-center gap-4 mb-4">
                    <span className="px-3 py-1 bg-farm-accent/10 text-farm-accent border border-farm-accent/50 text-[10px] font-bold tracking-[0.3em] uppercase backdrop-blur-md">
                      {selectedArticle.category.split('/')[0]}
                    </span>
                    <span className="flex items-center gap-2 text-white/40 text-[10px] font-mono tracking-widest uppercase">
                      <Activity className="w-3 h-3 text-farm-accent" /> SYS_TS: {new Date().getTime()}
                    </span>
                  </div>
                  <h2 className="text-4xl md:text-5xl lg:text-6xl font-light text-white leading-tight tracking-tight">
                    {selectedArticle.title}
                  </h2>
                </div>
              </div>

              {/* Content Area */}
              <div className="p-10 md:p-14 overflow-y-auto custom-scrollbar relative bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] bg-repeat">
                <div className="absolute inset-0 bg-black/80 pointer-events-none" />
                
                <div className="relative z-10 prose prose-invert prose-lg max-w-none text-white/80">
                  {selectedArticle.content.split('\n').map((line: string, i: number) => {
                    if (line.startsWith('## ')) {
                      return (
                        <div key={i} className="flex items-center gap-4 mt-12 mb-6">
                           <div className="w-12 h-[1px] bg-farm-accent" />
                           <h3 className="text-2xl font-normal text-farm-accent tracking-wide uppercase m-0">{line.replace('## ', '')}</h3>
                        </div>
                      );
                    }
                    if (line.startsWith('- **')) {
                      const text = line.replace('- **', '').split('**:');
                      return (
                        <li key={i} className="mb-4 text-white/70 list-none flex items-start gap-4">
                          <span className="text-farm-accent font-mono mt-1 text-[10px]">▶</span>
                          <div>
                             <strong className="text-white block text-sm font-bold tracking-widest uppercase mb-1">{text[0]}</strong>
                             <span className="text-white/60 leading-relaxed text-sm">{text[1]}</span>
                          </div>
                        </li>
                      );
                    }
                    if (line.trim() === '') return <br key={i} />;
                    return <p key={i} className="text-white/60 leading-relaxed font-light text-lg mb-6">{line}</p>;
                  })}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Dashboard;
