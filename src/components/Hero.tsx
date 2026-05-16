import React from 'react';
import { motion } from 'framer-motion';

interface HeroProps {
  onStart: () => void;
  onExplore: () => void;
}

const Hero: React.FC<HeroProps> = ({ onStart, onExplore }) => {
  return (
    <section className="relative h-screen min-h-[700px] w-full flex items-center overflow-hidden bg-black font-sans">
      <div className="absolute inset-0 z-0 overflow-hidden">
        <img
          src="https://images.unsplash.com/photo-1625246333195-78d9c38ad449?w=1800&q=80"
          alt="Atmospheric Farm"
          className="w-full h-full object-cover opacity-80 scale-110 animate-subtle-zoom"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black via-black/30 to-transparent z-10" />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent z-10" />
      </div>

      <div className="relative z-20 container mx-auto px-8 md:px-16 flex justify-between items-center h-full pt-20">
        <div className="max-w-3xl">
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="flex items-center gap-3 mb-8">
            <div className="w-8 h-[1px] bg-farm-accent"></div>
            <span className="text-farm-accent text-[11px] font-bold uppercase tracking-[0.4em]">AI-Powered Agricultural Intelligence</span>
          </motion.div>

          <motion.h1 initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="text-white text-6xl md:text-8xl font-normal leading-[1.0] tracking-tighter mb-10">
            Protect Your Crops.<br />
            <span className="text-farm-accent/90">Predict.</span> Detect.<br />
            Harvest More.
          </motion.h1>

          <div className="flex items-center gap-6 mt-12">
            <button onClick={onStart} className="btn-runway !px-10 !py-4 text-base">Analyze Your Crop</button>
            <button onClick={onExplore} className="btn-outline !px-10 !py-4 text-base">Explore Features</button>
          </div>
        </div>

        <div className="hidden xl:flex flex-col gap-6 w-96 transform translate-y-10">
          {[
            { label: 'DISEASE DETECTED', val: 'Tomato Early Blight', sub: 'Confidence: 98%', color: 'border-farm-accent', icon: '✓' },
            { label: 'RAIN ALERT', val: 'Heavy rainfall expected tomorrow', sub: 'Local Forecast', color: 'border-blue-400', icon: '☁' }
          ].map((card, i) => (
            <motion.div key={i} initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.6 + (i * 0.2) }}
              className={`p-6 rounded-2xl bg-white/5 border border-white/10 border-l-4 ${card.color}/60 backdrop-blur-2xl hover:bg-white/10 transition-all`}
            >
              <div className="flex justify-between items-start mb-2">
                <span className="text-[10px] font-bold text-white/40 tracking-widest uppercase">{card.label}</span>
                <span className="text-white/20">{card.icon}</span>
              </div>
              <div className="text-white text-lg font-medium mb-1">{card.val}</div>
              <div className={`text-[11px] font-bold ${card.color.replace('border-', 'text-')}/80`}>{card.sub}</div>
            </motion.div>
          ))}
        </div>
      </div>

      <div className="absolute bottom-12 right-16 z-20 flex items-center gap-16 text-right">
        {[
          { val: '98', unit: '%', label: 'DETECTION ACCURACY' },
          { val: '54', unit: '', label: 'DISEASES IDENTIFIED' }
        ].map((stat, i) => (
          <motion.div key={i} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.2 + (i * 0.1) }} className="flex flex-col items-end">
            <div className="flex items-baseline gap-1">
              <span className="text-white text-5xl font-light tracking-tighter">{stat.val}</span>
              <span className="text-white/40 text-xl font-light">{stat.unit}</span>
            </div>
            <div className="text-white/30 text-[9px] font-bold tracking-[0.2em] mt-1">{stat.label}</div>
          </motion.div>
        ))}
      </div>
    </section>
  );
};

export default Hero;
