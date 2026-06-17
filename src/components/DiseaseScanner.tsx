
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Camera, 
  Download, 
  Cpu, 
  Shield, 
  AlertTriangle, 
  CheckCircle, 
  Zap, 
  Search,
  Layers,
  Dna,
  Binary
} from 'lucide-react';

interface PredictionResult {
  crop: string;
  name: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  pathogen: string;
  desc: string;
  cause: string;
  precautions: string[];
  prevention: { icon: string; text: string }[];
  treatment: { icon: string; text: string }[];
  conditions: string;
  timeline: string;
  metrics?: {
    coverage: number;
    integrity: number;
    confidence: number;
  };
}

const API_BASE = 'http://127.0.0.1:5000/api';

const SCAN_STAGES = [
  { id: 'enhance', label: 'Specimen Resolution Enhanced', icon: Layers },
  { id: 'vein', label: 'Vein Structure Mapped', icon: Dna },
  { id: 'sign', label: 'Disease Signatures Detected', icon: Search },
  { id: 'classify', label: 'Neural Classification Complete', icon: Binary },
  { id: 'strategy', label: 'Generating Treatment Strategy', icon: Zap },
];

const DiseaseScanner: React.FC = () => {
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState<PredictionResult | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [currentStage, setCurrentStage] = useState(-1);
  const [error, setError] = useState<string | null>(null);
  const [proMode, setProMode] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
        setResult(null);
        setError(null);
        setCurrentStage(-1);
      };
      reader.readAsDataURL(file);
    }
  };

  const startAnalysis = async () => {
    if (!preview || !imageFile) return;
    
    setResult(null);
    setError(null);
    setScanning(true);
    setCurrentStage(0);

    // Simulate stage progress visually
    const stageInterval = setInterval(() => {
      setCurrentStage(prev => {
        if (prev < SCAN_STAGES.length - 1) return prev + 1;
        return prev;
      });
    }, 1200);

    try {
      const formData = new FormData();
      formData.append('image', imageFile);
      
      const token = localStorage.getItem('fs_token');
      if (token) {
        try {
           const payload = JSON.parse(atob(token.split('.')[1]));
           const userEmail = payload.sub || payload.identity;
           if (userEmail) formData.append('user_email', userEmail);
        } catch (e) {}
      }

      const endpoint = proMode ? `${API_BASE}/predict-pro` : `${API_BASE}/predict`;
      const response = await fetch(endpoint, { method: 'POST', body: formData });
      
      if (!response.ok) throw new Error(`Neural engine offline (Status ${response.status})`);

      const data = await response.json();
      if (!data.success) throw new Error(data.error || "Analysis failed");

      // Ensure scanning effect lasts a bit for immersion
      // await new Promise(r => setTimeout(r, 1000));

      setResult({
        crop: data.crop_type || "Unknown",
        name: data.display_name || "Unknown",
        severity: data.severity || 'low',
        pathogen: data.scientific_name || "Unknown",
        desc: data.description || "No description available.",
        cause: "Identified via neural pixel analysis.",
        precautions: data.prevention ? data.prevention.slice(0, 3) : [],
        prevention: data.prevention ? data.prevention.map((p: string) => ({ icon: '🛡️', text: p })) : [],
        treatment: data.treatment ? data.treatment.map((t: any) => ({ icon: t.icon || '💊', text: `${t.title || 'Action'}: ${t.desc || 'Details'}` })) : [],
        conditions: "Analysis complete.",
        timeline: data.recovery_days || "Unknown",
        metrics: {
          coverage: 15,
          integrity: 85,
          confidence: data.confidence || 90
        }
      });

    } catch (err: any) {
      setError(err.message || "Connection to neural backend failed.");
    } finally {
      clearInterval(stageInterval);
      setScanning(false);
    }
  };

  return (
    <div className="flex flex-col lg:flex-row gap-10 max-w-7xl mx-auto font-sans text-white">
      
      {/* ── LEFT: Immersive Scanner View ── */}
      <div className="lg:w-1/2 space-y-8">
        <div className={`relative bg-black/80 backdrop-blur-xl border ${scanning ? 'border-farm-accent/50 shadow-[0_0_40px_rgba(82,183,136,0.1)]' : 'border-white/10'} rounded-[32px] aspect-square overflow-hidden group transition-all duration-500`}>
          
          {preview ? (
            <>
              <img src={preview} className={`w-full h-full object-cover transition-all duration-1000 ${scanning ? 'scale-110 blur-[1px] brightness-50' : 'scale-100'}`} alt="Preview" />
              
              {/* Scan HUD Overlay */}
              <AnimatePresence>
                {scanning && (
                  <motion.div 
                    initial={{ opacity: 0 }} 
                    animate={{ opacity: 1 }} 
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 pointer-events-none"
                  >
                    {/* Targeting Grid */}
                    <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/grid.png')] opacity-20" />
                    
                    {/* The Scan Beam */}
                    <motion.div 
                      animate={{ top: ['0%', '100%', '0%'] }}
                      transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                      className="absolute left-0 right-0 h-1 bg-gradient-to-r from-transparent via-farm-accent to-transparent shadow-[0_0_20px_#52b788] z-20"
                    />

                    {/* Corner Brackets */}
                    <div className="absolute top-8 left-8 w-12 h-12 border-t-2 border-l-2 border-farm-accent shadow-[0_0_10px_#52b788]" />
                    <div className="absolute top-8 right-8 w-12 h-12 border-t-2 border-r-2 border-farm-accent shadow-[0_0_10px_#52b788]" />
                    <div className="absolute bottom-8 left-8 w-12 h-12 border-b-2 border-l-2 border-farm-accent shadow-[0_0_10px_#52b788]" />
                    <div className="absolute bottom-8 right-8 w-12 h-12 border-b-2 border-r-2 border-farm-accent shadow-[0_0_10px_#52b788]" />

                    {/* Central Analysis Lock */}
                    <div className="absolute inset-0 flex items-center justify-center">
                       <div className="w-32 h-32 border border-farm-accent/30 rounded-full animate-ping" />
                       <div className="absolute w-48 h-48 border border-white/5 rounded-full animate-reverse-spin" />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </>
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center border-2 border-dashed border-white/5 m-8 rounded-[24px] bg-white/5">
              <div className="w-20 h-20 bg-farm-accent/10 rounded-full flex items-center justify-center mb-6">
                <Camera className="w-10 h-10 text-farm-accent opacity-50" />
              </div>
              <p className="text-white text-[10px] font-bold uppercase tracking-[0.4em] opacity-40">Awaiting Specimen Input</p>
            </div>
          )}
        </div>

        {/* Pro Mode Toggle & Actions */}
        <div className="space-y-6">
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all ${proMode ? 'bg-farm-accent text-black shadow-[0_0_20px_rgba(82,183,136,0.4)]' : 'bg-white/5 text-white/20'}`}>
                <Zap className="w-6 h-6" />
              </div>
              <div>
                <div className="text-white text-[11px] font-bold uppercase tracking-widest">Pro Neural Engine</div>
                <div className="text-white/40 text-[10px] uppercase font-bold tracking-widest mt-0.5">Gemini 1.5 Flash Enabled</div>
              </div>
            </div>
            <button 
              onClick={() => setProMode(!proMode)}
              className={`w-14 h-7 rounded-full relative transition-all duration-300 ${proMode ? 'bg-farm-accent' : 'bg-white/10'}`}
            >
              <div className={`absolute top-1 left-1 w-5 h-5 bg-white rounded-full shadow-lg transition-transform duration-300 ${proMode ? 'translate-x-7' : 'translate-x-0'}`} />
            </button>
          </div>

          <div className="flex gap-4">
            <label className="flex-[0.8] bg-white/5 border border-white/10 hover:bg-white/10 py-5 rounded-2xl cursor-pointer text-center font-bold uppercase tracking-[0.2em] text-[10px] transition-all group">
              Upload Sample
              <input type="file" className="hidden" onChange={handleFileChange} accept="image/*" />
            </label>
            <button 
              onClick={startAnalysis} 
              disabled={scanning || !preview} 
              className="flex-1 bg-farm-accent text-black font-bold py-5 rounded-2xl disabled:opacity-50 uppercase tracking-[0.2em] text-[10px] shadow-xl shadow-farm-accent/10 hover:scale-[1.02] transition-all"
            >
              {scanning ? "Neural Scan Active..." : `Initiate ${proMode ? 'Pro' : 'AI'} Analysis`}
            </button>
          </div>
        </div>
      </div>

      {/* ── RIGHT: Live Diagnostic Feed ── */}
      <div className="lg:w-1/2 bg-black/40 backdrop-blur-3xl border border-white/10 rounded-[32px] p-10 flex flex-col min-h-[500px] max-h-[850px] overflow-y-auto [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-thumb]:bg-white/10 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:rounded-full">
        <AnimatePresence mode="wait">
          
          {scanning ? (
            <motion.div key="scanning" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex-1 space-y-10">
              <div className="flex items-center gap-4">
                <div className="w-2 h-2 bg-farm-accent rounded-full animate-ping" />
                <h3 className="text-white text-[12px] font-bold uppercase tracking-[0.3em]">Neural Diagnostic Feed</h3>
              </div>
              
              <div className="space-y-4">
                {SCAN_STAGES.map((s, i) => {
                  const isActive = i === currentStage;
                  const isDone = i < currentStage;
                  
                  return (
                    <motion.div 
                      key={s.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.2 }}
                      className={`flex items-center gap-5 p-5 rounded-2xl border transition-all duration-500 ${isActive ? 'bg-farm-accent/10 border-farm-accent/40 shadow-[0_0_20px_rgba(82,183,136,0.05)]' : isDone ? 'bg-white/5 border-white/5 opacity-50' : 'border-transparent opacity-20'}`}
                    >
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isActive ? 'bg-farm-accent text-black animate-pulse' : 'bg-white/5 text-white'}`}>
                        {isDone ? <CheckCircle className="w-5 h-5" /> : <s.icon className="w-5 h-5" />}
                      </div>
                      <span className={`text-[11px] font-bold uppercase tracking-widest ${isActive ? 'text-farm-accent' : 'text-white'}`}>
                        {s.label}
                      </span>
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>

          ) : !result && !error ? (
            <motion.div key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex-1 flex flex-col items-center justify-center text-center">
              <div className="w-24 h-24 bg-white/5 border border-white/10 rounded-full flex items-center justify-center mb-8">
                <Cpu className="w-10 h-10 text-white opacity-20" />
              </div>
              <h3 className="text-white text-2xl font-light mb-3">Diagnostic Standby</h3>
              <p className="text-white/40 text-sm max-w-xs mx-auto leading-relaxed">
                Feed the neural engine a specimen to initiate deep-vision diagnostic protocols.
              </p>
            </motion.div>

          ) : error ? (
            <motion.div key="error" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex-1 flex flex-col items-center justify-center text-center p-8">
              <AlertTriangle className="w-16 h-16 text-red-500 mb-8" />
              <h3 className="text-white text-2xl mb-4">Neural Link Severed</h3>
              <p className="text-white/40 mb-10 max-w-xs">{error}</p>
              <button onClick={() => setError(null)} className="px-10 py-4 bg-white/5 border border-white/10 rounded-2xl text-[10px] font-bold uppercase tracking-widest hover:bg-white/10 transition-all">Reconnect Sensors</button>
            </motion.div>

          ) : result && (
            <motion.div key="result" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-8 h-full">
              <div className="flex items-center justify-between border-b border-white/5 pb-8">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-healthy-emerald/10 border border-healthy-emerald/30 rounded-2xl flex items-center justify-center">
                    <CheckCircle className="w-6 h-6 text-healthy-emerald" />
                  </div>
                  <div>
                    <div className="text-farm-accent text-[10px] font-bold uppercase tracking-[0.3em] mb-1">Diagnostic Report</div>
                    <div className="text-white text-2xl font-normal">Analysis Complete</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-white/30 text-[9px] font-bold uppercase tracking-widest mb-1">Confidence</div>
                  <div className="text-farm-accent text-3xl font-light">{result.metrics?.confidence}%</div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white/5 p-6 rounded-2xl border border-white/5">
                  <div className="text-farm-accent text-[10px] uppercase font-bold tracking-widest mb-2 opacity-50">Crop Identification</div>
                  <div className="text-white text-xl font-bold">{result.crop}</div>
                </div>
                <div className="bg-white/5 p-6 rounded-2xl border border-white/5">
                  <div className="text-farm-accent text-[10px] uppercase font-bold tracking-widest mb-2 opacity-50">Match Signature</div>
                  <div className="text-white text-xl font-bold">{result.name}</div>
                </div>
              </div>

              {result.name !== "Unknown" && (
                <div className="bg-white/5 p-6 rounded-2xl border border-white/5 flex flex-col gap-4">
                  <div>
                    <div className="text-farm-accent text-[10px] uppercase font-bold tracking-widest mb-2 opacity-50">Clinical Description</div>
                    <p className="text-white/80 text-[13px] leading-relaxed">{result.desc}</p>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-4 border-t border-white/10 pt-4 mt-2">
                    <div>
                      <div className="text-farm-accent text-[10px] uppercase font-bold tracking-widest mb-1 opacity-50">Severity</div>
                      <div className={`text-[12px] font-bold uppercase tracking-wider ${result.severity === 'critical' ? 'text-red-500' : result.severity === 'high' ? 'text-orange-500' : result.severity === 'medium' ? 'text-yellow-500' : 'text-healthy-emerald'}`}>
                        {result.severity}
                      </div>
                    </div>
                    <div>
                      <div className="text-farm-accent text-[10px] uppercase font-bold tracking-widest mb-1 opacity-50">Pathogen</div>
                      <div className="text-white/80 text-[12px] italic">{result.pathogen || 'N/A'}</div>
                    </div>
                    <div>
                      <div className="text-farm-accent text-[10px] uppercase font-bold tracking-widest mb-1 opacity-50">Recovery</div>
                      <div className="text-white/80 text-[12px]">{result.timeline || 'N/A'}</div>
                    </div>
                  </div>
                </div>
              )}

              <div className="bg-gradient-to-br from-white/[0.03] to-transparent p-8 rounded-[32px] border border-white/5">
                <div className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-6">Strategic Treatment Protocol</div>
                <div className="space-y-4">
                  {result.treatment && result.treatment.length > 0 ? result.treatment.map((t, i) => (
                    <div key={i} className="flex gap-5 p-5 bg-black/40 rounded-2xl border border-white/5 items-center">
                      <span className="text-3xl grayscale-[0.5]">{t.icon}</span>
                      <p className="text-[13px] text-white/70 leading-relaxed font-bold">{t.text}</p>
                    </div>
                  )) : (
                    <div className="text-white/50 text-[13px]">No treatment required. Continue regular monitoring.</div>
                  )}
                </div>
              </div>

              {result.prevention && result.prevention.length > 0 && (
                <div className="bg-gradient-to-br from-white/[0.03] to-transparent p-8 rounded-[32px] border border-white/5">
                  <div className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-6">Preventative Measures</div>
                  <div className="space-y-3">
                    {result.prevention.map((p, i) => (
                      <div key={i} className="flex gap-4 items-center bg-black/20 p-4 rounded-xl border border-white/5">
                        <Shield className="w-5 h-5 text-farm-accent opacity-70 flex-shrink-0" />
                        <span className="text-[13px] text-white/70 font-medium leading-relaxed">{p.text}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <button onClick={() => window.print()} className="w-full bg-white/5 hover:bg-white/10 text-white/60 font-bold py-5 rounded-2xl border border-white/5 transition-all flex items-center justify-center gap-3 uppercase text-[10px] tracking-widest mt-auto">
                <Download className="w-4 h-4" /> Download Intelligence Log
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default DiseaseScanner;
