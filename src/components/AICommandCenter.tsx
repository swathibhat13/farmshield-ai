
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Cpu, 
  Zap, 
  TrendingUp, 
  Droplets, 
  CloudRain,
  Brain,
  ChevronRight,
  RefreshCw,
  Users,
  ScanLine,
  Layers
} from 'lucide-react';

interface Stats {
  total_scans: number;
  total_users: number;
  farm_integrity: number;
  neural_accuracy: number;
  model_classes: number;
}

// Animated count-up hook
function useCountUp(target: number, duration = 1200, decimals = 0) {
  const [value, setValue] = useState(0);
  const startRef = useRef<number | null>(null);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    if (target === 0) return;
    startRef.current = null;
    const step = (ts: number) => {
      if (!startRef.current) startRef.current = ts;
      const progress = Math.min((ts - startRef.current) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
      setValue(parseFloat((eased * target).toFixed(decimals)));
      if (progress < 1) rafRef.current = requestAnimationFrame(step);
    };
    rafRef.current = requestAnimationFrame(step);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [target, duration, decimals]);

  return value;
}

const AICommandCenter: React.FC = () => {
  const [activeInsight, setActiveInsight] = useState(0);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastSync, setLastSync] = useState<string>('');
  const [syncPulse, setSyncPulse] = useState(false);

  const insights = [
    { text: "Potassium deficiency detected in Zone B", trend: "Critical", icon: Zap, color: "text-danger-red" },
    { text: "Incoming precipitation window: 14h", trend: "High Confidence", icon: CloudRain, color: "text-blue-400" },
    { text: "Yield forecast improved by 6.2%", trend: "Optimizing", icon: TrendingUp, color: "text-healthy-emerald" },
    { text: "Atmospheric humidity risk: Moderate", trend: "Monitoring", icon: Droplets, color: "text-warning-amber" },
  ];

  const fetchStats = async () => {
    try {
      const res = await fetch('http://127.0.0.1:5000/api/stats');
      const data = await res.json();
      if (data.success) {
        setStats(data);
        setLastSync(new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
        setSyncPulse(true);
        setTimeout(() => setSyncPulse(false), 800);
      }
    } catch (e) {
      // backend may not be reachable; keep defaults
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
    const statsTimer = setInterval(fetchStats, 30000);
    const insightTimer = setInterval(() => {
      setActiveInsight((prev) => (prev + 1) % insights.length);
    }, 4000);
    return () => { clearInterval(statsTimer); clearInterval(insightTimer); };
  }, []);

  // Live animated values
  const animScans     = useCountUp(stats?.total_scans    ?? 0, 1400, 0);
  const animUsers     = useCountUp(stats?.total_users    ?? 0, 1400, 0);
  const animIntegrity = useCountUp(stats?.farm_integrity ?? 98, 1200, 1);
  const animAccuracy  = useCountUp(stats?.neural_accuracy ?? 94.4, 1200, 1);

  const metrics = [
    {
      label: 'Farm Integrity',
      val: loading ? '—' : `${animIntegrity}%`,
      color: 'text-farm-accent',
      icon: TrendingUp,
      sublabel: 'Healthy vs diseased ratio'
    },
    {
      label: 'Total Scans',
      val: loading ? '—' : animScans.toLocaleString(),
      color: 'text-warning-amber',
      icon: ScanLine,
      sublabel: 'Detections run'
    },
    {
      label: 'Active Users',
      val: loading ? '—' : animUsers.toLocaleString(),
      color: 'text-healthy-emerald',
      icon: Users,
      sublabel: 'Registered farmers'
    },
    {
      label: 'Neural Accuracy',
      val: loading ? '—' : `${animAccuracy}%`,
      color: 'text-blue-400',
      icon: Layers,
      sublabel: `${stats?.model_classes ?? 38} disease classes`
    },
  ];

  const scrollToScanner = () => {
    const el = document.querySelector('[data-section="scanner"]') as HTMLElement | null;
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else {
      window.scrollTo({ top: 900, behavior: 'smooth' });
    }
  };

  return (
    <div className="relative w-full bg-black/40 backdrop-blur-3xl border border-white/10 rounded-[40px] overflow-hidden group">
      {/* Background Grid Pattern */}
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-[0.03]" />
      <div className="absolute inset-0 bg-gradient-to-br from-farm-accent/10 via-transparent to-transparent" />

      {/* Main Content Layout */}
      <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-0">
        
        {/* ── LEFT: The Neural Core ── */}
        <div className="lg:col-span-5 p-12 flex flex-col items-center justify-center border-r border-white/5">
          <div className="relative">
            {[1, 2, 3].map((ring) => (
              <motion.div
                key={ring}
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1.5, opacity: 0 }}
                transition={{ duration: 3, repeat: Infinity, delay: ring * 1, ease: "easeOut" }}
                className="absolute inset-0 border border-farm-accent/30 rounded-full"
              />
            ))}

            <motion.div
              animate={{ scale: [1, 1.05, 1], rotate: [0, 5, -5, 0] }}
              transition={{ duration: 6, repeat: Infinity }}
              className="w-48 h-48 rounded-full bg-black/80 border-2 border-farm-accent/50 flex items-center justify-center relative shadow-[0_0_50px_rgba(82,183,136,0.2)]"
            >
              <div className="absolute inset-0 bg-farm-accent/10 rounded-full blur-2xl animate-pulse" />
              <Brain className="w-20 h-20 text-farm-accent relative z-10" />
            </motion.div>

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
              <span className="text-white text-3xl font-light tracking-tight">LIVE</span>
            </div>
            <p className="text-farm-accent text-[11px] font-bold uppercase tracking-widest mt-2">Intelligence Engine Active</p>
            
            {/* Last sync indicator */}
            <div className="flex items-center justify-center gap-2 mt-4 pt-4 border-t border-white/5">
              <motion.div
                animate={syncPulse ? { rotate: 360 } : { rotate: 0 }}
                transition={{ duration: 0.5 }}
              >
                <RefreshCw className={`w-3 h-3 transition-colors ${syncPulse ? 'text-farm-accent' : 'text-white/20'}`} />
              </motion.div>
              <span className="text-white/30 text-[10px] font-mono tracking-widest">
                {lastSync ? `SYNC ${lastSync}` : 'CONNECTING...'}
              </span>
            </div>
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
                  <button
                    key={i}
                    onClick={() => setActiveInsight(i)}
                    className={`h-1 rounded-full transition-all duration-500 ${i === activeInsight ? 'bg-farm-accent w-10' : 'bg-white/10 w-6 hover:bg-white/20'}`}
                  />
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
                  <div className={`p-6 rounded-3xl bg-white/5 border border-white/10 ${insights[activeInsight].color} shrink-0`}>
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

          {/* Live Metrics Grid */}
          <div className="space-y-4 pt-8 border-t border-white/5">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {metrics.map((m, i) => (
                <motion.div
                  key={m.label}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="space-y-1 bg-white/3 rounded-xl p-3 border border-white/5"
                >
                  <div className="flex items-center gap-1.5 mb-2">
                    <m.icon className={`w-3 h-3 ${m.color}`} />
                    <div className="text-[9px] font-bold uppercase tracking-widest text-white/30">{m.label}</div>
                  </div>
                  <div className={`text-lg font-bold ${m.color} tabular-nums`}>
                    {loading ? (
                      <div className="w-12 h-5 bg-white/10 rounded animate-pulse" />
                    ) : m.val}
                  </div>
                  <div className="text-[9px] text-white/20">{m.sublabel}</div>
                </motion.div>
              ))}
            </div>

            <button
              onClick={scrollToScanner}
              className="w-full flex items-center justify-center gap-3 py-4 bg-white/5 hover:bg-farm-accent/10 border border-white/10 hover:border-farm-accent/30 rounded-2xl text-white text-[10px] font-bold uppercase tracking-[0.2em] transition-all group/btn"
            >
              Access Full Strategic Archives
              <ChevronRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
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
