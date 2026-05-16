import React from 'react';
import { 
  Zap, 
  CloudSun, 
  TrendingUp, 
  FlaskConical, 
  Bell, 
  LayoutDashboard 
} from 'lucide-react';

const features = [
  {
    title: 'AI Disease Detection',
    desc: 'Upload crop image and detect diseases instantly with our CNN-powered neural engine.',
    icon: <Zap className="w-6 h-6 text-farm-accent" />,
  },
  {
    title: 'Smart Weather Advisory',
    desc: 'Real-time weather alerts and farming suggestions based on hyper-local atmospheric data.',
    icon: <CloudSun className="w-6 h-6 text-blue-400" />,
  },
  {
    title: 'Crop Yield Prediction',
    desc: 'Predict harvest quantity using ML models that analyze soil health and weather trends.',
    icon: <TrendingUp className="w-6 h-6 text-purple-400" />,
  },
  {
    title: 'Soil Analysis',
    desc: 'Get fertilizer and soil recommendations tailored to your specific field parameters.',
    icon: <FlaskConical className="w-6 h-6 text-orange-400" />,
  },
  {
    title: 'Early Disease Alerts',
    desc: 'Prevent crop damage before it spreads with predictive modeling and community warnings.',
    icon: <Bell className="w-6 h-6 text-red-400" />,
  },
  {
    title: 'Farmer Dashboard',
    desc: 'Track previous scans, reports, and yield trends in one unified intelligent interface.',
    icon: <LayoutDashboard className="w-6 h-6 text-emerald-400" />,
  }
];

const Features: React.FC = () => {
  return (
    <section className="py-32 bg-black px-6 md:px-10" id="features-section">
      <div className="max-w-7xl mx-auto">
        <div className="mb-20">
          <div className="text-farm-accent text-[11px] font-bold uppercase tracking-widest mb-4">Core Capabilities</div>
          <h2 className="text-white text-4xl">Everything a Smart Farmer Needs</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((f, i) => (
            <div
              key={i}
              className="p-8 rounded-2xl bg-white/5 border border-white/5 hover:border-farm-accent/30 transition-all duration-300 group"
            >
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-8 bg-white/5 group-hover:bg-white/10 transition-colors">
                {f.icon}
              </div>
              <h3 className="text-white text-xl mb-4 group-hover:text-farm-accent transition-colors">{f.title}</h3>
              <p className="text-cool-slate leading-relaxed text-[15px]">
                {f.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features;
