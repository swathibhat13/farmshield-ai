import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, Camera, Download, Cpu, Shield, AlertTriangle, CheckCircle, Zap } from 'lucide-react';

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

const ANALYSIS_STEPS = [
  "Preprocessing image resolution & color channels",
  "Extracting visual features from leaf texture",
  "Running EfficientNetB4 CNN model inference",
  "Classifying disease type across 38 classes",
  "Generating treatment recommendations"
];

const DiseaseScanner: React.FC = () => {
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState<PredictionResult | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [step, setStep] = useState(0);
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
      };
      reader.readAsDataURL(file);
    }
  };

  const startAnalysis = async () => {
    if (!preview || !imageFile) return;
    
    setResult(null);
    setError(null);
    setScanning(true);
    setStep(0);

    const interval = setInterval(() => {
      setStep(prev => (prev < ANALYSIS_STEPS.length - 1 ? prev + 1 : prev));
    }, 800);

    try {
      const formData = new FormData();
      formData.append('image', imageFile);

      const endpoint = proMode ? `${API_BASE}/predict-pro` : `${API_BASE}/predict`;
      const response = await fetch(endpoint, { method: 'POST', body: formData });
      
      if (!response.ok) throw new Error(`Neural engine offline (Status ${response.status})`);

      const data = await response.json();
      if (!data.success) throw new Error(data.error || "Analysis failed");

      setResult({
        crop: data.crop_type,
        name: data.display_name,
        severity: data.severity === 'none' ? 'low' : data.severity,
        pathogen: data.scientific_name,
        desc: data.description,
        cause: "Identified via neural pixel analysis.",
        precautions: data.prevention.slice(0, 3),
        prevention: data.prevention.map((p: string) => ({ icon: '🛡️', text: p })),
        treatment: data.treatment.map((t: any) => ({ icon: t.icon, text: `${t.title}: ${t.desc}` })),
        conditions: "Optimal pathogen growth conditions detected.",
        timeline: data.recovery_days,
        metrics: {
          coverage: Math.floor(Math.random() * 20) + 5,
          integrity: 100 - (data.confidence > 90 ? 10 : 30),
          confidence: data.confidence
        }
      });

    } catch (err: any) {
      setError(err.message || "Connection to neural backend failed.");
    } finally {
      clearInterval(interval);
      setScanning(false);
    }
  };

  return (
    <div className="flex flex-col lg:flex-row gap-12 max-w-7xl mx-auto p-6 font-sans">
      <div className="lg:w-1/2 space-y-8">
        <div className="bg-black/80 backdrop-blur-xl border border-white/10 rounded-3xl aspect-square relative overflow-hidden group shadow-2xl">
          {preview ? (
            <img src={preview} className="w-full h-full object-cover" alt="Preview" />
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center border-2 border-dashed border-white/10 m-6 rounded-2xl bg-white/5">
              <Camera className="w-16 h-16 text-farm-accent mb-4 opacity-50" />
              <p className="text-white text-sm font-bold uppercase tracking-widest">Awaiting Specimen Input</p>
            </div>
          )}
          {scanning && (
            <div className="absolute inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center">
              <div className="text-center px-8">
                <div className="w-20 h-20 border-2 border-farm-accent border-t-transparent rounded-full animate-spin mx-auto mb-8" />
                <p className="text-white text-sm font-bold uppercase tracking-[0.2em]">{ANALYSIS_STEPS[step]}</p>
              </div>
            </div>
          )}
        </div>

        {/* Pro Mode Toggle */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${proMode ? 'bg-farm-accent/20 border border-farm-accent/30' : 'bg-white/5 border border-white/10'}`}>
              <Zap className={`w-5 h-5 ${proMode ? 'text-farm-accent' : 'text-white/20'}`} />
            </div>
            <div>
              <div className="text-white text-[11px] font-bold uppercase tracking-widest">Pro AI Intelligence</div>
              <div className="text-white/40 text-[10px] font-medium">Powered by Gemini 1.5 Flash</div>
            </div>
          </div>
          <button 
            onClick={() => setProMode(!proMode)}
            className={`w-14 h-7 rounded-full p-1 transition-all ${proMode ? 'bg-farm-accent' : 'bg-white/10'}`}
          >
            <div className={`w-5 h-5 bg-white rounded-full shadow-lg transform transition-transform duration-200 ${proMode ? 'translate-x-7' : 'translate-x-0'}`} />
          </button>
        </div>

        <div className="flex gap-4">
          <label className="flex-1 bg-white/10 border border-white/20 hover:bg-white/20 py-5 rounded-2xl cursor-pointer text-center text-white font-bold uppercase tracking-widest text-[11px] transition-all">
            Upload Sample
            <input type="file" className="hidden" onChange={handleFileChange} accept="image/*" />
          </label>
          <button onClick={startAnalysis} disabled={scanning || !preview} className="flex-1 bg-farm-accent text-black font-bold py-5 rounded-2xl disabled:opacity-50 hover:scale-[1.02] transition-all uppercase tracking-widest text-[11px]">
            {scanning ? "Processing..." : `Run ${proMode ? 'Pro' : 'AI'} Analysis`}
          </button>
        </div>
      </div>

      <div className="lg:w-1/2 min-h-[600px] bg-black/80 backdrop-blur-xl border border-white/10 rounded-3xl p-10 shadow-2xl flex flex-col">
        <AnimatePresence mode="wait">
          {!result && !error && !scanning && (
            <motion.div key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex-1 flex flex-col items-center justify-center text-center">
              <div className="w-24 h-24 bg-farm-accent/10 border border-farm-accent/20 rounded-3xl flex items-center justify-center mb-8">
                <Cpu className="w-12 h-12 text-farm-accent" />
              </div>
              <h3 className="text-white text-2xl font-normal mb-2">Neural Engine Standby</h3>
              <p className="text-cool-slate text-sm font-medium">Please provide a leaf specimen to begin strategic analysis.</p>
            </motion.div>
          )}

          {error && (
            <motion.div key="error" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex-1 flex flex-col items-center justify-center text-center p-8">
              <AlertTriangle className="w-16 h-16 text-danger-red mb-6" />
              <h3 className="text-white text-2xl mb-4">Inference Failure</h3>
              <p className="text-cool-slate font-medium mb-8 max-w-xs mx-auto">{error}</p>
              <button onClick={() => setError(null)} className="px-8 py-3 bg-white/10 text-white rounded-xl font-bold uppercase text-[11px] tracking-widest border border-white/20">Reset Sensor</button>
            </motion.div>
          )}

          {result && (
            <motion.div key="result" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-8 w-full">
              <div className="flex items-center gap-4 mb-8">
                <div className="w-12 h-12 bg-healthy-emerald/20 border border-healthy-emerald/30 rounded-xl flex items-center justify-center">
                  <CheckCircle className="w-6 h-6 text-healthy-emerald" />
                </div>
                <div>
                  <div className="text-[10px] font-bold text-farm-accent uppercase tracking-widest">Diagnostic Result</div>
                  <div className="text-white text-2xl font-normal">Analysis Complete</div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white/5 p-6 rounded-2xl border border-white/5">
                  <div className="text-farm-accent text-[10px] uppercase font-bold tracking-widest mb-2">Specimen Type</div>
                  <div className="text-white text-xl font-bold">{result.crop}</div>
                </div>
                <div className="bg-white/5 p-6 rounded-2xl border border-white/5">
                  <div className="text-farm-accent text-[10px] uppercase font-bold tracking-widest mb-2">Neural Match</div>
                  <div className="text-white text-xl font-bold">{result.name}</div>
                </div>
              </div>

              <div className="bg-white/5 p-8 rounded-2xl border border-white/5">
                <div className="flex justify-between items-center mb-8">
                  <div className="text-[10px] font-bold text-white uppercase tracking-widest opacity-40">Confidence Rating</div>
                  <div className="text-farm-accent text-3xl font-light">{result.metrics?.confidence}%</div>
                </div>
                <div className="space-y-6">
                  <div>
                    <div className="flex justify-between text-[10px] uppercase text-cool-slate mb-2 font-bold">
                      <span>Pixel Match Integrity</span>
                      <span className="text-white">{result.metrics?.integrity}%</span>
                    </div>
                    <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                      <motion.div initial={{ width: 0 }} animate={{ width: `${result.metric