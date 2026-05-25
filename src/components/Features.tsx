import React from 'react';
import { 
  CloudRain,
  ThermometerSun,
  Droplets,
  Sprout,
  Activity,
  BarChart4,
  LayoutDashboard,
  Clock,
  ShieldCheck,
  TrendingUp,
  FlaskConical,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

const Features: React.FC = () => {
  return (
    <section className="py-32 bg-black px-6 md:px-10" id="features-section">
      <div className="max-w-7xl mx-auto">
        <div className="mb-20 text-center">
          <div className="text-farm-accent text-[11px] font-bold uppercase tracking-widest mb-4">Core Capabilities</div>
          <h2 className="text-white text-4xl md:text-5xl lg:text-6xl font-light mb-6">Everything a Smart Farmer Needs</h2>
          <p className="text-white/50 max-w-2xl mx-auto text-lg">
            Our platform goes beyond simple detection. We provide actionable, real-world intelligence to safeguard your crops and maximize your yield.
          </p>
        </div>

        <div className="space-y-32">
          
          {/* Feature 1: Smart Weather Advisory */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div className="order-2 lg:order-1">
              <div className="w-14 h-14 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center mb-6">
                <CloudRain className="w-6 h-6 text-blue-400" />
              </div>
              <h3 className="text-white text-3xl md:text-4xl font-light mb-6">
                <span className="text-blue-400">Smart Weather</span> Advisory
              </h3>
              <p className="text-white/60 text-lg leading-relaxed mb-8">
                Powered by the <strong className="text-white">OpenWeather API</strong>, our system pulls hyper-local, real-time atmospheric data to provide actionable farming suggestions rather than just raw numbers.
              </p>
              
              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <ThermometerSun className="w-6 h-6 text-farm-accent mt-1" />
                  <div>
                    <h4 className="text-white text-lg font-medium">Temperature & Humidity Tracking</h4>
                    <p className="text-white/50 text-sm mt-1">Live data monitoring to detect conditions favorable for fungal growth.</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <Droplets className="w-6 h-6 text-blue-400 mt-1" />
                  <div>
                    <h4 className="text-white text-lg font-medium">Rain Prediction</h4>
                    <p className="text-white/50 text-sm mt-1">Advanced forecasting to help you plan irrigation cycles efficiently.</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="order-1 lg:order-2 bg-[#111] border border-white/10 rounded-3xl p-8 relative overflow-hidden group">
               <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/20 blur-[100px] rounded-full pointer-events-none" />
               <div className="bg-black/50 border border-white/5 rounded-2xl p-6 mb-4 backdrop-blur-md">
                 <div className="flex justify-between items-center mb-4">
                   <div className="text-white font-medium">Current Status</div>
                   <div className="text-blue-400 text-sm font-bold bg-blue-500/10 px-3 py-1 rounded-full">HIGH HUMIDITY</div>
                 </div>
                 <div className="text-4xl text-white font-light mb-2">85% <span className="text-lg text-white/40">RH</span></div>
                 <div className="text-white/50 text-sm">Temperature: 28°C</div>
               </div>
               
               <div className="bg-warning-amber/10 border border-warning-amber/20 rounded-2xl p-6">
                 <div className="flex items-center gap-3 mb-2">
                   <Activity className="w-5 h-5 text-warning-amber" />
                   <h4 className="text-warning-amber font-medium">Farming Suggestion</h4>
                 </div>
                 <p className="text-white/80 text-sm leading-relaxed">
                   High humidity detected. Risk of fungal disease is high. Avoid overwatering today and ensure proper crop ventilation.
                 </p>
               </div>
            </div>
          </div>

          {/* Feature 2: Fertilizer Recommendation */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div className="bg-[#111] border border-white/10 rounded-3xl p-8 relative overflow-hidden group">
               <div className="absolute top-0 left-0 w-32 h-32 bg-farm-accent/20 blur-[100px] rounded-full pointer-events-none" />
               
               <div className="space-y-4 mb-8 relative z-10">
                 <div className="bg-black/50 border border-white/5 rounded-xl p-4 flex items-center justify-between">
                   <span className="text-white/50 text-sm">Crop Type</span>
                   <span className="text-white font-medium">Tomato</span>
                 </div>
                 <div className="bg-black/50 border border-white/5 rounded-xl p-4 flex items-center justify-between">
                   <span className="text-white/50 text-sm">Soil Type</span>
                   <span className="text-white font-medium">Loamy (pH 6.5)</span>
                 </div>
                 <div className="bg-black/50 border border-white/5 rounded-xl p-4 flex items-center justify-between">
                   <span className="text-white/50 text-sm">Disease Detected</span>
                   <span className="text-danger-red font-medium flex items-center gap-2">
                     <AlertCircle className="w-4 h-4" /> Leaf Blight
                   </span>
                 </div>
               </div>

               <div className="bg-farm-accent/10 border border-farm-accent/20 rounded-2xl p-6 relative z-10">
                 <h4 className="text-farm-accent font-medium mb-3 flex items-center gap-2">
                   <CheckCircle2 className="w-5 h-5" /> AI Recommendation
                 </h4>
                 <div className="space-y-2">
                   <p className="text-white/90 text-sm"><strong className="text-white">Fertilizer:</strong> NPK 20-20-20</p>
                   <p className="text-white/90 text-sm"><strong className="text-white">Quantity:</strong> 50kg per hectare</p>
                   <p className="text-white/90 text-sm"><strong className="text-white">Schedule:</strong> Apply twice weekly</p>
                 </div>
               </div>
            </div>

            <div>
              <div className="w-14 h-14 rounded-2xl bg-farm-accent/10 border border-farm-accent/20 flex items-center justify-center mb-6">
                <FlaskConical className="w-6 h-6 text-farm-accent" />
              </div>
              <h3 className="text-white text-3xl md:text-4xl font-light mb-6">
                <span className="text-farm-accent">Fertilizer</span> Recommendation System
              </h3>
              <p className="text-white/60 text-lg leading-relaxed mb-8">
                This is the perfect companion feature to our disease detection. Instead of just telling you what's wrong, we provide a complete, actionable treatment plan.
              </p>
              
              <ul className="space-y-4">
                {[
                  'Customized for specific crop and soil types',
                  'Suggests precise fertilizer brands and NPK ratios',
                  'Calculates exact application quantities',
                  'Provides long-term prevention tips'
                ].map((item, i) => (
                  <li key={i} className="flex items-center gap-3 text-white/70">
                    <CheckCircle2 className="w-5 h-5 text-farm-accent shrink-0" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Feature 3: Farmer Dashboard */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div className="order-2 lg:order-1">
              <div className="w-14 h-14 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center mb-6">
                <LayoutDashboard className="w-6 h-6 text-purple-400" />
              </div>
              <h3 className="text-white text-3xl md:text-4xl font-light mb-6">
                Comprehensive <span className="text-purple-400">Farmer Dashboard</span>
              </h3>
              <p className="text-white/60 text-lg leading-relaxed mb-8">
                A startup-level, professional unified interface. Evaluators and users love dashboards that bring all critical data points into one command center.
              </p>
              
              <div className="grid grid-cols-2 gap-6">
                <div className="bg-white/5 border border-white/5 rounded-xl p-5">
                  <Clock className="w-6 h-6 text-white/40 mb-3" />
                  <h4 className="text-white font-medium mb-1">Disease History</h4>
                  <p className="text-white/40 text-xs">Track past scans & recoveries</p>
                </div>
                <div className="bg-white/5 border border-white/5 rounded-xl p-5">
                  <TrendingUp className="w-6 h-6 text-white/40 mb-3" />
                  <h4 className="text-white font-medium mb-1">Yield Prediction</h4>
                  <p className="text-white/40 text-xs">Visualize harvest trends</p>
                </div>
                <div className="bg-white/5 border border-white/5 rounded-xl p-5">
                  <ShieldCheck className="w-6 h-6 text-white/40 mb-3" />
                  <h4 className="text-white font-medium mb-1">Health Score</h4>
                  <p className="text-white/40 text-xs">Overall crop vitality metric</p>
                </div>
                <div className="bg-white/5 border border-white/5 rounded-xl p-5">
                  <BarChart4 className="w-6 h-6 text-white/40 mb-3" />
                  <h4 className="text-white font-medium mb-1">Recent Detections</h4>
                  <p className="text-white/40 text-xs">Quick access to latest scans</p>
                </div>
              </div>
            </div>
            
            <div className="order-1 lg:order-2 bg-[#111] border border-white/10 rounded-3xl p-8 relative overflow-hidden group min-h-[400px] flex items-center justify-center">
               <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-20" />
               <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-purple-500/20 blur-[100px] rounded-full pointer-events-none" />
               
               <div className="relative z-10 w-full max-w-sm">
                  <div className="bg-black/80 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-2xl mb-4 transform -rotate-2 hover:rotate-0 transition-transform">
                    <div className="flex justify-between items-center mb-6">
                      <div className="text-white font-medium">Crop Health Score</div>
                      <div className="text-farm-accent text-2xl font-light">94<span className="text-sm">%</span></div>
                    </div>
                    <div className="w-full bg-white/10 h-2 rounded-full overflow-hidden">
                      <div className="w-[94%] bg-farm-accent h-full rounded-full" />
                    </div>
                  </div>
                  
                  <div className="bg-black/80 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-2xl transform rotate-2 hover:rotate-0 transition-transform ml-8">
                    <div className="flex items-center gap-4 mb-4">
                      <div className="w-10 h-10 rounded-full bg-danger-red/20 flex items-center justify-center">
                        <Activity className="w-5 h-5 text-danger-red" />
                      </div>
                      <div>
                        <div className="text-white font-medium text-sm">Recent Detection</div>
                        <div className="text-white/50 text-xs">2 hours ago</div>
                      </div>
                    </div>
                    <div className="text-white/80 text-sm">
                      Early signs of <strong className="text-danger-red font-medium">Leaf Mold</strong> identified in Sector 4.
                    </div>
                  </div>
               </div>
            </div>
          </div>
          
        </div>
      </div>
    </section>
  );
};

export default Features;
