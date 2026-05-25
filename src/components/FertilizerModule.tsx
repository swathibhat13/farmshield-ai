import React, { useState } from 'react';
import { Leaf, Droplets, FlaskConical, Sprout } from 'lucide-react';

const FertilizerModule: React.FC = () => {
  const [formData, setFormData] = useState({ n: '', p: '', k: '', crop: '' });
  const [recommendation, setRecommendation] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setRecommendation(null);
    try {
      const response = await fetch('http://127.0.0.1:5000/api/fertilizer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const data = await response.json();
      if (data.success) {
        setRecommendation(data.recommendation);
      } else {
        setRecommendation("Failed to generate recommendation.");
      }
    } catch (err) {
      setRecommendation("Error connecting to neural intelligence.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-black/40 backdrop-blur-3xl border border-white/10 rounded-[32px] p-8 h-full">
      <div className="flex items-center gap-4 mb-8">
        <div className="w-10 h-10 bg-farm-accent/10 rounded-xl flex items-center justify-center">
          <FlaskConical className="w-5 h-5 text-farm-accent" />
        </div>
        <div>
          <h3 className="text-white text-xl font-normal">Fertilizer Intelligence</h3>
          <p className="text-white/40 text-[10px] uppercase font-bold tracking-widest mt-1">Smart Nutrient Advisory</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-1">
            <label className="text-[10px] text-white/50 uppercase font-bold tracking-widest">Nitrogen (N)</label>
            <input type="number" placeholder="e.g. 120" required value={formData.n} onChange={e => setFormData({ ...formData, n: e.target.value })} className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-white focus:border-farm-accent outline-none" />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] text-white/50 uppercase font-bold tracking-widest">Phosphorus (P)</label>
            <input type="number" placeholder="e.g. 40" required value={formData.p} onChange={e => setFormData({ ...formData, p: e.target.value })} className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-white focus:border-farm-accent outline-none" />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] text-white/50 uppercase font-bold tracking-widest">Potassium (K)</label>
            <input type="number" placeholder="e.g. 60" required value={formData.k} onChange={e => setFormData({ ...formData, k: e.target.value })} className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-white focus:border-farm-accent outline-none" />
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-[10px] text-white/50 uppercase font-bold tracking-widest">Target Crop</label>
          <div className="relative">
             <Sprout className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-cool-slate" />
             <input type="text" placeholder="e.g. Rice, Tomato, Apple..." required value={formData.crop} onChange={e => setFormData({ ...formData, crop: e.target.value })} className="w-full bg-white/5 border border-white/10 rounded-lg p-3 pl-10 text-white focus:border-farm-accent outline-none" />
          </div>
        </div>

        <button type="submit" disabled={loading} className="w-full bg-farm-accent/10 border border-farm-accent/30 text-farm-accent hover:bg-farm-accent hover:text-black transition-all rounded-lg py-3 font-bold uppercase tracking-widest text-[11px] flex justify-center items-center gap-2">
          {loading ? 'Synthesizing...' : 'Calculate Optimal Mix'}
        </button>
      </form>

      {recommendation && (
        <div className="mt-6 p-5 bg-white/5 border border-white/10 rounded-xl">
          <div className="flex items-start gap-3">
             <Droplets className="w-5 h-5 text-farm-accent shrink-0 mt-0.5" />
             <p className="text-white/80 text-sm leading-relaxed">{recommendation}</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default FertilizerModule;
