
import React from 'react';
import { motion } from 'framer-motion';
import DiseaseScanner from './DiseaseScanner';
import WeatherPanel from './WeatherPanel';
import ResearchSection from './ResearchSection';
import { LayoutGrid, CloudSun, Leaf, Activity } from 'lucide-react';

interface DashboardProps {
  onArticleClick: (article: any) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ onArticleClick }) => {
  return (
    <div className="min-h-screen bg-runway-black pt-24 pb-12 px-6">
      <div className="max-w-[1600px] mx-auto">
        <header className="mb-12">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <span className="section-label mb-4 block">Dashboard / Intelligence Overview</span>
            <h1 className="text-white mb-4">Operational Pulse</h1>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-12 mb-16">
              {[
                { 
                  title: 'Atmospheric Advisory', 
                  desc: 'Real-time weather analysis providing 72-hour risk windows and planting recommendations.' 
                },
                { 
                  title: 'Deep-Vision Diagnostics', 
                  desc: 'Computer vision models identifying 38+ plant diseases with 99.4% precision.' 
                },
                { 
                  title: 'Actionable Protocols', 
                  desc: 'Smart recommendations for irrigation, fertilizer usage, and pest control measures.' 
                }
              ].map((service, i) => (
                <div key={i} className="border-l border-white/10 pl-6 py-2">
                  <h4 className="text-[12px] font-bold uppercase tracking-[2px] text-white mb-2">{service.title}</h4>
                  <p className="text-[13px] text-cool-slate leading-relaxed">{service.desc}</p>
                </div>
              ))}
            </div>
          </motion.div>
        </header>

        {/* Intelligence Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Main Scanner Section */}
          <div className="lg:col-span-8">
            <div className="glass-container p-8 h-full">
              <div className="flex items-center gap-3 mb-8">
                <Leaf className="w-5 h-5 text-white" />
                <h3 className="text-white text-[20px]">AI Disease Diagnosis</h3>
              </div>
              <DiseaseScanner />
            </div>
          </div>

          {/* Side Panels */}
          <div className="lg:col-span-4 space-y-8">
            {/* Weather Pulse */}
            <div className="glass-container p-8">
              <div className="flex items-center gap-3 mb-8">
                <CloudSun className="w-5 h-5 text-white" />
                <h3 className="text-white text-[20px]">Atmospheric Intelligence</h3>
              </div>
              <WeatherPanel />
            </div>

            {/* Quick Stats / Status */}
            <div className="glass-container p-8">
              <div className="flex items-center gap-3 mb-6">
                <Activity className="w-5 h-5 text-white" />
                <h3 className="text-white text-[20px]">Risk Assessment</h3>
              </div>
              <div className="space-y-4">
                {[
                  { label: 'CROP HEALTH INDEX', value: '94%', color: 'text-white' },
                  { label: 'SOIL MOISTURE', value: 'OPTIMAL', color: 'text-cool-slate' },
                  { label: 'PEST RISK LEVEL', value: 'LOW', color: 'text-cool-slate' }
                ].map((stat, i) => (
                  <div key={i} className="flex justify-between items-center py-3 border-b border-white/5">
                    <span className="text-[11px] tracking-widest uppercase text-cool-slate">{stat.label}</span>
                    <span className={`text-[14px] font-medium ${stat.color}`}>{stat.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Research & Advisory Bottom Section */}
          <div className="lg:col-span-12">
            <div className="glass-container p-8">
              <div className="flex items-center gap-3 mb-8">
                <LayoutGrid className="w-5 h-5 text-white" />
                <h3 className="text-white text-[20px]">Strategic Advisory</h3>
              </div>
              <ResearchSection onArticleClick={onArticleClick} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
