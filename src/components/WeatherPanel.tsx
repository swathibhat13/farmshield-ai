import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MapPin, Leaf, Activity, Droplets, Wind, Thermometer,
  AlertTriangle, CheckCircle, 
  Zap, Shield, BarChart3, ArrowRight, RefreshCw,
  CloudRain, Sun, Gauge, Eye
} from 'lucide-react';

// ── Types ────────────────────────────────────────────
interface AdvisoryResult {
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  riskScore: number;
  location: string;
  crop: string;
  weather: {
    temp: number;
    humidity: number;
    rainfall: number;
    windSpeed: number;
    uvIndex: number;
    visibility: number;
  };
  soilHealth: {
    n: number;
    p: number;
    k: number;
    ph: number;
    moisture: number;
  };
  alerts: { type: string; message: string; severity: 'info' | 'warning' | 'danger' }[];
  recommendations: { icon: string; title: string; desc: string; priority: 'high' | 'medium' | 'low' }[];
  forecast: { day: string; risk: string; temp: number; rain: number }[];
  cropStage: string;
  yieldForecast: number;
}

// ── Simulated AI Advisory Engine ─────────────────────
const generateAdvisory = (
  location: string, crop: string,
  n: number, p: number, k: number
): AdvisoryResult => {
  const riskScore = Math.max(0, Math.min(100,
    (n > 80 ? 20 : 0) + (p < 30 ? 25 : 0) + (k < 25 ? 20 : 0) + Math.random() * 20
  ));

  const riskLevel =
    riskScore < 25 ? 'low' :
    riskScore < 50 ? 'medium' :
    riskScore < 75 ? 'high' : 'critical';

  return {
    riskLevel,
    riskScore: Math.round(riskScore),
    location,
    crop,
    weather: {
      temp: 24 + Math.round(Math.random() * 10),
      humidity: 60 + Math.round(Math.random() * 30),
      rainfall: Math.round(Math.random() * 20),
      windSpeed: 8 + Math.round(Math.random() * 15),
      uvIndex: 3 + Math.round(Math.random() * 7),
      visibility: 8 + Math.round(Math.random() * 4),
    },
    soilHealth: { n, p, k, ph: 6.2 + Math.random() * 1.5, moisture: 40 + Math.random() * 40 },
    alerts: [
      ...(n > 80 ? [{ type: 'Nitrogen', message: `High N levels (${n}kg/ha) detected — risk of leaf burn`, severity: 'warning' as const }] : []),
      ...(p < 30 ? [{ type: 'Phosphorus', message: `Low P levels (${p}kg/ha) — root development at risk`, severity: 'danger' as const }] : []),
      { type: 'Weather', message: 'Optimal growing conditions expected for next 48 hours', severity: 'info' as const },
    ],
    recommendations: [
      { icon: '💧', title: 'Irrigation Protocol', desc: `Apply 25mm water every 3 days for optimal ${crop} growth`, priority: 'high' },
      { icon: '🧪', title: 'Soil Amendment', desc: p < 40 ? `Apply DAP fertilizer at 50kg/ha to boost phosphorus` : 'Maintain current NPK ratio', priority: p < 40 ? 'high' : 'medium' },
      { icon: '🛡️', title: 'Pest Prevention', desc: 'Apply neem-based bioinsecticide as preventive measure', priority: 'medium' },
      { icon: '🌱', title: 'Growth Monitor', desc: 'Schedule weekly scouting for early disease detection', priority: 'low' },
    ],
    forecast: [
      { day: 'Today', risk: 'Low', temp: 28, rain: 5 },
      { day: 'Tomorrow', risk: 'Medium', temp: 31, rain: 12 },
      { day: 'Day 3', risk: 'Low', temp: 27, rain: 8 },
      { day: 'Day 4', risk: 'High', temp: 33, rain: 25 },
      { day: 'Day 5', risk: 'Medium', temp: 29, rain: 15 },
    ],
    cropStage: 'Vegetative Growth — Week 6',
    yieldForecast: 75 + Math.round(Math.random() * 20),
  };
};

// ── Soil Slider ──────────────────────────────────────
const SoilSlider = ({
  label, value, onChange, min, max, unit, color
}: {
  label: string; value: number; onChange: (v: number) => void;
  min: number; max: number; unit: string; color: string;
}) => {
  const pct = ((value - min) / (max - min)) * 100;
  const status = pct < 30 ? 'Low' : pct < 70 ? 'Optimal' : 'High';
  const statusColor = pct < 30 ? '#c0392b' : pct < 70 ? '#52b788' : '#d4a017';

  return (
    <div className="mb-8">
      <div className="flex justify-between items-center mb-3">
        <div>
          <span className="text-white text-[11px] font-bold uppercase tracking-widest">{label}</span>
          <span className="ml-3 text-[10px] px-3 py-1 rounded-full font-bold uppercase"
            style={{ color: statusColor, background: `${statusColor}20`, border: `1px solid ${statusColor}40` }}>
            {status}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-white font-bold text-xl">{value}</span>
          <span className="text-white/40 text-[10px] uppercase font-bold">{unit}</span>
        </div>
      </div>

      <div className="relative h-2 bg-white/5 rounded-full overflow-hidden">
        <motion.div
          className="absolute inset-y-0 left-0 rounded-full"
          style={{ background: color }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.3 }}
        />
      </div>

      <input
        type="range" min={min} max={max} value={value}
        onChange={e => onChange(Number(e.target.value))}
        className="w-full mt-2 opacity-0 absolute z-10"
        style={{ height: '24px', marginTop: '-18px', cursor: 'pointer', position: 'relative' }}
      />
    </div>
  );
};

// ── Risk Gauge ───────────────────────────────────────
const RiskGauge = ({ score, level }: { score: number; level: string }) => {
  const colors = { low: '#52b788', medium: '#d4a017', high: '#e67e22', critical: '#c0392b' };
  const color = colors[level as keyof typeof colors];
  const rotation = (score / 100) * 180 - 90;

  return (
    <div className="relative flex flex-col items-center">
      <svg width="200" height="110" viewBox="0 0 160 90">
        <path d="M 10 80 A 70 70 0 0 1 150 80" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="12" strokeLinecap="round" />
        <path d="M 10 80 A 70 70 0 0 1 150 80" fill="none" stroke={color}
          strokeWidth="12" strokeLinecap="round" opacity="0.3"
          strokeDasharray={`${score * 2.2} 220`} />
        <motion.line
          x1="80" y1="80"
          animate={{
            x2: 80 + 55 * Math.cos(((rotation - 90) * Math.PI) / 180),
            y2: 80 + 55 * Math.sin(((rotation - 90) * Math.PI) / 180),
          }}
          stroke={color} strokeWidth="2" strokeLinecap="round" />
        <circle cx="80" cy="80" r="4" fill={color} />
      </svg>
      <div className="text-center -mt-4">
        <div className="text-5xl font-bold" style={{ color }}>{score}</div>
        <div className="text-[10px] uppercase tracking-[0.3em] font-bold text-white/40 mt-1">Risk Index</div>
      </div>
    </div>
  );
};

// ── Weather Card ─────────────────────────────────────
const WeatherMetric = ({ icon: Icon, value, unit, label }: any) => (
  <div className="bg-white/5 rounded-2xl p-6 border border-white/5 flex flex-col gap-2">
    <Icon className="w-5 h-5 text-farm-accent mb-1" />
    <div className="flex items-end gap-1">
      <span className="text-white text-2xl font-bold">{value}</span>
      <span className="text-white/40 text-[11px] uppercase mb-1 font-bold">{unit}</span>
    </div>
    <div className="text-white/30 text-[9px] uppercase tracking-widest font-bold">{label}</div>
  </div>
);

// ── Main Component ────────────────────────────────────
const WeatherPanel: React.FC = () => {
  const [location, setLocation] = useState('Mangalore');
  const [crop, setCrop] = useState('Tomato');
  const [nitrogen, setNitrogen] = useState(50);
  const [phosphorus, setPhosphorus] = useState(60);
  const [potassium, setPotassium] = useState(40);
  const [result, setResult] = useState<AdvisoryResult | null>(null);
  const [loading, setLoading] = useState(false);

  const CROPS = ['Tomato', 'Rice', 'Wheat', 'Maize', 'Cotton', 'Sugarcane', 'Soybean', 'Potato'];
  const LOCATIONS = ['Mangalore', 'Pune', 'Nagpur', 'Hyderabad', 'Bengaluru', 'Chennai', 'Jaipur', 'Lucknow'];

  const riskConfig = {
    low: { color: '#52b788', bg: '#52b78815', label: 'LOW RISK', icon: CheckCircle },
    medium: { color: '#d4a017', bg: '#d4a01715', label: 'MODERATE RISK', icon: AlertTriangle },
    high: { color: '#e67e22', bg: '#e67e2215', label: 'HIGH RISK', icon: AlertTriangle },
    critical: { color: '#c0392b', bg: '#c0392b15', label: 'CRITICAL RISK', icon: Zap },
  };

  const handleAnalyze = async () => {
    setLoading(true);
    setResult(null);
    await new Promise(r => setTimeout(r, 2000));
    setResult(generateAdvisory(location, crop, nitrogen, phosphorus, potassium));
    setLoading(false);
  };

  const cfg = result ? riskConfig[result.riskLevel] : null;

  return (
    <div className="min-h-screen pt-4 font-sans">
      <div className="max-w-7xl mx-auto">

        {/* ── Header ── */}
        <div className="mb-12 bg-black/80 backdrop-blur-xl p-10 rounded-3xl border border-white/10">
          <div className="text-farm-accent text-[11px] font-bold uppercase tracking-[0.4em] mb-4">Strategic Advisory Hub</div>
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <h1 className="text-white text-5xl font-bold leading-tight">Field Intelligence<br />
                <span className="text-farm-accent">Command Center</span>
              </h1>
              <p className="text-white/60 mt-4 max-w-xl font-medium">
                Real-time soil analysis, weather risk modeling, and AI-powered crop advisories for precision agriculture.
              </p>
            </div>
            {result && (
              <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                className="flex items-center gap-3 px-8 py-4 rounded-2xl border-2"
                style={{ borderColor: `${cfg!.color}40`, background: `${cfg!.color}10` }}>
                <cfg.icon className="w-6 h-6" style={{ color: cfg!.color }} />
                <span className="font-bold text-sm uppercase tracking-widest" style={{ color: cfg!.color }}>
                  {cfg!.label}
                </span>
              </motion.div>
            )}
          </div>
        </div>

        {/* ── Main Grid ── */}
        <div className="grid lg:grid-cols-[1fr_450px] gap-8">

          {/* ── Left: Input Panel ── */}
          <div className="space-y-8">
            <div className="bg-black/80 backdrop-blur-xl border border-white/10 rounded-3xl p-10 shadow-2xl">
              <div className="text-white text-[11px] uppercase tracking-widest font-bold mb-8 flex items-center gap-3">
                <MapPin className="w-5 h-5 text-farm-accent" />
                Strategic Configuration
              </div>

              <div className="grid grid-cols-2 gap-6 mb-10">
                <div>
                  <label className="text-white/40 text-[10px] uppercase tracking-widest block mb-3 font-bold">Target Location</label>
                  <div className="relative">
                    <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-farm-accent" />
                    <select value={location} onChange={e => setLocation(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-xl pl-12 pr-4 py-4 text-white text-sm font-bold appearance-none cursor-pointer focus:outline-none focus:border-farm-accent transition-all">
                      {LOCATIONS.map(l => <option key={l} value={l} className="bg-gray-900">{l}</option>)}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-white/40 text-[10px] uppercase tracking-widest block mb-3 font-bold">Target Crop</label>
                  <div className="relative">
                    <Leaf className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-farm-accent" />
                    <select value={crop} onChange={e => setCrop(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-xl pl-12 pr-4 py-4 text-white text-sm font-bold appearance-none cursor-pointer focus:outline-none focus:border-farm-accent transition-all">
                      {CROPS.map(c => <option key={c} value={c} className="bg-gray-900">{c}</option>)}
                    </select>
                  </div>
                </div>
              </div>

              <div className="text-white text-[11px] uppercase tracking-widest font-bold mb-8 flex items-center gap-3">
                <Activity className="w-5 h-5 text-farm-accent" />
                Soil Nutrient Profile
              </div>

              <SoilSlider label="Nitrogen (N)" value={nitrogen} onChange={setNitrogen}
                min={0} max={150} unit="kg/ha" color="linear-gradient(90deg, #667eea, #764ba2)" />
              <SoilSlider label="Phosphorus (P)" value={phosphorus} onChange={setPhosphorus}
                min={0} max={120} unit="kg/ha" color="linear-gradient(90deg, #f093fb, #f5576c)" />
              <SoilSlider label="Potassium (K)" value={potassium} onChange={setPotassium}
                min={0} max={200} unit="kg/ha" color="linear-gradient(90deg, #4facfe, #00f2fe)" />

              <button onClick={handleAnalyze} disabled={loading}
                className="w-full bg-farm-accent text-black !py-5 flex items-center justify-center gap-4 relative overflow-hidden group disabled:opacity-60 rounded-2xl font-bold uppercase text-[12px] tracking-[0.2em] shadow-xl shadow-farm-accent/10 mt-6">
                {loading ? (
                  <><RefreshCw className="w-5 h-5 animate-spin" /><span>Processing Field Intelligence...</span></>
                ) : (
                  <><Zap className="w-5 h-5" /><span>Run Strategic Analysis</span><ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" /></>
                )}
              </button>
            </div>
          </div>

          {/* ── Right: Results Panel ── */}
          <div className="space-y-8">
            <AnimatePresence mode="wait">
              {!result && !loading ? (
                <motion.div key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  className="bg-black/80 backdrop-blur-xl border border-white/10 rounded-3xl p-12 flex flex-col items-center justify-center text-center min-h-[500px] shadow-2xl">
                  <div className="w-24 h-24 rounded-3xl bg-farm-accent/10 border border-farm-accent/20 flex items-center justify-center mb-8">
                    <BarChart3 className="w-10 h-10 text-farm-accent" />
                  </div>
                  <h3 className="text-white text-2xl font-normal mb-4">Command Ready</h3>
                  <p className="text-white/40 text-sm font-medium max-w-xs leading-relaxed">
                    Set your field parameters and initiate analysis to receive your strategic AI report.
                  </p>
                </motion.div>

              ) : loading ? (
                <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  className="bg-black/80 backdrop-blur-xl border border-white/10 rounded-3xl p-12 flex flex-col items-center justify-center min-h-[500px] shadow-2xl">
                  <div className="relative w-24 h-24 mb-10">
                    <div className="absolute inset-0 border-4 border-farm-accent border-t-transparent rounded-full animate-spin" />
                    <Zap className="absolute inset-0 m-auto w-8 h-8 text-farm-accent" />
                  </div>
                  <div className="space-y-4 w-full max-w-xs">
                    {['Cross-referencing soil', 'Fetching weather risk', 'Modeling yield forecast'].map((s, i) => (
                      <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.4 }}
                        className="flex items-center gap-4 bg-white/5 p-3 rounded-xl">
                        <div className="w-2 h-2 bg-farm-accent rounded-full animate-pulse" />
                        <span className="text-white text-[11px] uppercase tracking-widest font-bold">{s}</span>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>

              ) : result && (
                <motion.div key="result" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
                  {/* Risk Assessment */}
                  <div className="bg-black/80 backdrop-blur-xl border-2 rounded-3xl p-10 shadow-2xl" style={{ borderColor: `${cfg!.color}40` }}>
                    <RiskGauge score={result.riskScore} level={result.riskLevel} />
                    <div className="grid grid-cols-2 gap-4 mt-10">
                      <div className="bg-white/5 rounded-2xl p-5 border border-white/5">
                        <div className="text-[10px] text-white/40 uppercase tracking-widest mb-2 font-bold">Crop Stage</div>
                        <div className="text-white text-sm font-bold">{result.cropStage}</div>
                      </div>
                      <div className="bg-white/5 rounded-2xl p-5 border border-white/5">
                        <div className="text-[10px] text-white/40 uppercase tracking-widest mb-2 font-bold">Efficiency</div>
                        <div className="text-farm-accent text-lg font-bold">{result.yieldForecast}%</div>
                      </div>
                    </div>
                  </div>

                  {/* Recommendations */}
                  <div className="bg-black/80 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl">
                    <div className="text-white text-[11px] uppercase tracking-widest font-bold mb-6 flex items-center gap-3">
                      <Shield className="w-5 h-5 text-farm-accent" />
                      AI Strategic Protocol
                    </div>
                    <div className="space-y-4">
                      {result.recommendations.slice(0, 2).map((rec, i) => (
                        <div key={i} className="p-5 bg-white/5 rounded-2xl border border-white/10 flex gap-4">
                          <span className="text-3xl">{rec.icon}</span>
                          <div>
                            <div className="text-white text-sm font-bold mb-1">{rec.title}</div>
                            <p className="text-white/60 text-[12px] leading-relaxed font-bold">{rec.desc}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WeatherPanel;
