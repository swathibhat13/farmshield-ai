
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Cpu, 
  Activity, 
  Zap, 
  ShieldCheck, 
  TrendingUp, 
  Droplets, 
  CloudRain,
  Brain,
  ChevronRight,
  AlertCircle
} from 'lucide-react';

const AICommandCenter: React.FC = () => {
  const [activeInsight, setActiveInsight] = useState(0);

  const insights = [
    { text: "Potassium deficiency detected in Zone B", trend: "Critical", icon: Zap, color: "text-danger-red" },
    { text: "Incoming precipitation window: 14h", trend: "High Confidence", icon: CloudRain, color: "text-blue-400" },
    { text: "Yield forecast improved by 6.2%", trend: "Optimizing", icon: TrendingUp, color: "text-healthy-emerald" },
    { text: "Atmospheric humidity risk: Moderate", trend: "Monitoring", icon: Droplets, color: "text-warning-amber" },
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveInsight((prev) => (prev + 1) % insights.length);
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="relative w-full bg-black/40 backdrop-blur-3xl border border-white/10 rounded-[40px] overflow-hidden group">
      {/* Background Grid Pattern */}
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-[0.03]" />
      <div className="absolute inset-0 bg-gradient-to-br from-farm-accent/10 via-transparent to-transparent" />

      {/* Main Content Layout */}
      <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-0">
        
        {/* ── LEFT: The Neural Core (AI Pulse) ── */}
        <div className="lg:col-span-5 p-12 flex flex-col items-center justify-center border-r border-white/5">
          <div className="relative">
            {/* Concentric Pulsing Rings */}
            {[1, 2, 3].map((ring) => (
              <motion.div
                key={ring}
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1.5, opacity: 0 }}
                transition={{ 
                  duration: 3, 
                  repeat: Infinity, 
                  delay: ring * 1,
                  ease: "easeOut" 
                }}
                className="absolute inset-0 border border-farm-accent/30 rounded-full"
              />
            ))}
            
            {/* The Central Brain */}
            <motion.div 
              animate={{ 
                scale: [1, 1.05, 1],
                rotate: [0, 5, -5, 0]
              }}
              transition={{ duration: 6, repeat: Infinity }}
              className="w-48 h-48 rounded-full bg-black/80 border-2 border-farm-accent/50 flex items-center justify-center relative shadow-[0_0_50px_rgba(82,183,136,0.2)]"
            >
              <div className="absolute inset-0 bg-farm-accent/10 rounded-full blur-2xl animate-pulse" />
              <Brain className="w-20 h-20 text-farm-accent relative z-10" />
            </motion.div>

            {/* Orbiting Indicators */}
            <motion.div 
              animate={{ rotate: 360 }}
              transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
              className="absolute -inset-10 border border-white/5 rounded-full"
            >
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-2 h-2 bg-farm-accent rounded-full shadow-[0_0_10px_#52b788]" />
            </motion.div>
          </div>

          <div className="text-center mt-12 space-y-2">
            <h3 className="text-white text-[10px] font-bold uppercase tracking-[0.6em] opacity-40">Neural Status</h3>
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 bg-healthy-emerald rounded-full animate-ping" />
              <span className="text-white text-3xl font-light tracking-tight">STABLE</span>
            </div>
            <p className="text-farm-accent text-[11px] font-bold uppercase tracking-widest mt-2">Intelligence Engine Active</p>
          </div>
        </div>

        {/* ── RIGHT: Insight Engine ── */}
        <div className="lg:col-span-7 p-12 flex flex-col justify-between space-y-12">
          
          <div className="space-y-8">
             <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Cpu className="w-5 h-5 text-farm-accent" />
                  <span className="text-white text-xs font-bold uppercase tracking-[0.2em]">Neural Insight Stream</span>
                </div>
                <div className="flex gap-1">
                  {[0, 1, 2, 3].map((i) => (
                    <div key={i} className={`w-6 h-1 rounded-full transition-all duration-500 ${i === activeInsight ? 'bg-farm-accent w-10' : 'bg-white/10'}`} />
                  ))}
                </div>
             </div>

             <div className="min-h-[140px] flex items-center">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeInsight}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="flex items-start gap-8"
                  >
                    <div className={`p-6 rounded-3xl bg-white/5 border border-white/10 ${insights[activeInsight].color}`}>
                      {React.createElement(insights[activeInsight].icon, { className: "w-10 h-10" })}
                    </div>
                    <div className="space-y-3 pt-2">
                      <div className={`text-[10px] font-bold uppercase tracking-widest ${insights[activeInsight].color}`}>
                        • {insights[activeInsight].trend}
                      </div>
                      <h2 className="text-white text-3xl font-normal leading-tight max-w-md">
                        {insights[activeInsight].text}
                      </h2>
                    </div>
                  </motion.div>
                </AnimatePresence>
             </div>
          </div>

          {/* Quick Metrics Grid */}
          <div className="grid grid-cols-3 gap-6 pt-12 border-t border-white/5">
            {[
              { label: 'Farm Integrity', val: '98%', color: 'text-farm-accent' },
              { label: 'Soil Health', val: 'Optimum', color: 'text-healthy-emerald' },
              { label: 'Neural Accuracy', val: '94.4%', color: 'text-blue-400' },
            ].map((m, i) => (
              <div key={i} className="space-y-1">
                <div className="text-[9px] font-bold uppercase tracking-widest text-white/30">{m.label}</div>
                <div className={`text-lg font-bold ${m.color}`}>{m.val}</div>
              </div>
            ))}
            <button className="col-span-3 flex items-center justify-center gap-3 py-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl text-white text-[10px] font-bold uppercase tracking-[0.2em] transition-all group/btn">
              Access Full Strategic Archives <ChevronRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
            </button>
          </div>

        </div>

      </div>

      {/* Decorative Corner Accents */}
      <div className="absolute top-0 right-0 w-24 h-24 border-t-2 border-r-2 border-farm-accent/20 rounded-tr-[40px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-24 h-24 border-b-2 border-l-2 border-farm-accent/20 rounded-bl-[40px] pointer-events-none" />
    </div>
  );
};

export default AICommandCenter;
