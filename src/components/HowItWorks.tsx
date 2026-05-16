
import React from 'react';
import { motion } from 'framer-motion';

const steps = [
  {
    number: '01',
    tag: 'Step 1: Input Acquisition',
    title: 'High-Fidelity Crop Imaging',
    desc: 'The process begins with capturing a high-resolution photograph of the affected plant leaf. For optimal accuracy, we recommend using natural, indirect sunlight and ensuring the leaf fills at least 60% of the frame. Our system supports multi-format uploads (JPG, PNG, WEBP) and employs automated resizing and normalization to prepare the data for the neural network.',
    icon: '📸',
    color: 'from-[#1a2a1a] to-[#2d4a2d]'
  },
  {
    number: '02',
    tag: 'Step 2: Neural Diagnostics',
    title: 'Deep Feature Extraction',
    desc: 'Once uploaded, your image is processed by our proprietary CNN architecture based on EfficientNet-B4. The model analyzes over 7 million individual parameters to identify subtle patterns—such as chlorotic rings, necrotic spots, or fungal pustules—that are invisible to the naked eye. With a training set of 87,000+ images, the system identifies 54+ disease variants with 99.4% precision.',
    icon: '🧠',
    color: 'from-[#1a1a2a] to-[#2d2d4a]'
  },
  {
    number: '03',
    tag: 'Step 3: Ecosystem Sync',
    title: 'Atmospheric Data Correlation',
    desc: 'Disease identification is only half the battle. FarmShield AI simultaneously synchronizes with hyper-local weather stations via the OpenWeatherMap API. We track humidity, dew point, and precipitation history over the last 72 hours to determine if environmental conditions are likely to accelerate the spread of the detected pathogen.',
    icon: '🌤',
    color: 'from-[#2a1a1a] to-[#4a2d2d]'
  },
  {
    number: '04',
    tag: 'Step 4: Strategic Output',
    title: 'Verified Treatment Protocols',
    desc: 'Finally, the system generates a tailored advisory report. This includes biological control methods, specific chemical fungicide recommendations, and long-term preventative measures. These protocols are cross-referenced with agricultural research databases and delivered in regional languages (Malayalam, Hindi, Tamil) to ensure absolute clarity for the farmer.',
    icon: '✅',
    color: 'from-[#1a2a2a] to-[#2d4a4a]'
  }
];

const HowItWorks: React.FC = () => {
  return (
    <section className="py-24 bg-black px-6 md:px-10" id="how-it-works">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-16"
        >
          <div className="section-label mb-4">Operational Protocol</div>
          <h2 className="text-white mb-6">AI Solutions in Action</h2>
          <p className="text-cool-slate max-w-2xl text-lg leading-relaxed">
            Our multi-stage diagnostic process combines cutting-edge computer vision with real-time 
            climatological data to provide farmers with a defensive shield against crop failure.
          </p>
        </motion.div>

        <div className="relative">
          <div className="absolute left-7 top-0 bottom-0 w-[1px] bg-border-dark hidden md:block" />
          
          <div className="space-y-0">
            {steps.map((step, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="group relative grid md:grid-cols-[56px_1fr_1.2fr] gap-10 items-center py-16 border-b border-border-dark last:border-0"
              >
                <div className="w-14 h-14 rounded-full border border-border-dark bg-black flex items-center justify-center text-xl font-light text-cool-slate group-hover:bg-farm-accent group-hover:text-black transition-all duration-500 z-10 shadow-[0_0_15px_rgba(82,183,136,0)] group-hover:shadow-[0_0_20px_rgba(82,183,136,0.3)]">
                  {step.number}
                </div>
                
                <div>
                  <div className="text-farm-accent text-[10px] uppercase tracking-widest mb-3 font-bold">{step.tag}</div>
                  <h3 className="text-white text-2xl md:text-3xl font-normal mb-5 group-hover:text-farm-accent transition-colors leading-tight">{step.title}</h3>
                  <p className="text-cool-slate leading-relaxed text-base md:text-[17px] opacity-80 group-hover:opacity-100 transition-opacity">{step.desc}</p>
                </div>

                <div className="hidden md:block">
                  <div className={`aspect-[16/9] rounded-xl bg-gradient-to-br ${step.color} border border-white/5 flex flex-col items-center justify-center text-5xl group-hover:scale-[1.03] transition-all duration-700 relative overflow-hidden shadow-2xl`}>
                    <div className="absolute inset-0 bg-black/20" />
                    <span className="relative z-10 filter drop-shadow-lg">{step.icon}</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Best Practices Section */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-32 p-10 md:p-16 rounded-3xl bg-dark-surface border border-white/5 relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 p-10 opacity-5">
            <div className="text-9xl font-bold text-white">i</div>
          </div>
          <div className="relative z-10">
            <h4 className="text-white text-2xl mb-8">Optimization & Best Practices</h4>
            <div className="grid md:grid-cols-3 gap-12">
              {[
                { title: "Image Quality", text: "Ensure the leaf is flat and not shadowed. Avoid blurry images; hold the camera 4-6 inches from the leaf surface." },
                { title: "Timing", text: "Run scans in the early morning for the best weather-based irrigation advice, as soil moisture levels are most stable." },
                { title: "Consistency", text: "Tag your field locations accurately to allow our AI to track disease progression over multiple weeks." }
              ].map((tip, i) => (
                <div key={i}>
                  <div className="text-farm-accent text-[11px] font-bold uppercase tracking-widest mb-3">{tip.title}</div>
                  <p className="text-cool-slate text-sm leading-relaxed">{tip.text}</p>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default HowItWorks;
