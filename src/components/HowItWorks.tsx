import React, { useState, useEffect, useRef } from 'react';
import { motion, useScroll, useTransform, useSpring, useInView } from 'framer-motion';
import FAQSection from './FAQSection';
import Testimonials from './Testimonials';
import BeforeAfterSlider from './BeforeAfterSlider';
import { 
  Camera, Cpu, Search, CloudRain, FlaskConical, Stethoscope, BellRing
} from 'lucide-react';

const AnimatedCounter = ({ end, suffix = "", duration = 2 }: { end: number, suffix?: string, duration?: number }) => {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  useEffect(() => {
    if (!isInView) return;
    let startTime: number;
    let animationFrame: number;
    
    const updateCount = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / (duration * 1000), 1);
      setCount(Math.floor(progress * end));
      if (progress < 1) {
        animationFrame = requestAnimationFrame(updateCount);
      }
    };
    
    animationFrame = requestAnimationFrame(updateCount);
    return () => cancelAnimationFrame(animationFrame);
  }, [end, duration, isInView]);

  return <span ref={ref}>{count}{suffix}</span>;
};

const steps = [
  {
    number: '01',
    tag: 'Step 1: Input Acquisition',
    title: 'High-Fidelity Crop Imaging',
    desc: 'The process begins with capturing a high-resolution photograph of the affected plant leaf. Our system supports multi-format uploads (JPG, PNG, WEBP) and employs automated resizing and normalization to prepare the data for the neural network.',
    icon: <Camera className="w-8 h-8 text-farm-accent" />,
    color: 'from-[#1a2a1a] to-[#2d4a2d]',
    proTip: 'For optimal accuracy, use natural, indirect sunlight and ensure the leaf fills at least 60% of the frame.',
    visual: (
      <BeforeAfterSlider 
        beforeImage="https://images.unsplash.com/photo-1530836369250-ef71a3a5e48c?q=80&w=800&auto=format&fit=crop"
        afterImage="https://images.unsplash.com/photo-1611843467160-25afb8df1074?q=80&w=800&auto=format&fit=crop"
        beforeLabel="Healthy Reference"
        afterLabel="Scanned Image"
      />
    )
  },
  {
    number: '02',
    tag: 'Step 2: Core Processing',
    title: 'AI Image Processing',
    desc: 'Your image is instantly routed to our distributed GPU cluster where a proprietary Convolutional Neural Network (CNN) begins the feature extraction phase, analyzing the image pixel by pixel.',
    icon: <Cpu className="w-8 h-8 text-blue-400" />,
    color: 'from-[#1a2a3a] to-[#2d4a5a]',
    proTip: 'Avoid blurry images; the AI needs sharp edges to properly extract features.',
    visual: (
      <div className="relative w-full aspect-[4/3] md:aspect-[16/9] rounded-xl overflow-hidden border border-white/10">
        <img src="https://images.unsplash.com/photo-1598911543314-87d323eb7a13?q=80&w=800&auto=format&fit=crop" alt="Crop" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/scan-lines.png')] opacity-30 z-0 mix-blend-overlay" />
        <motion.div 
          animate={{ top: ['0%', '100%', '0%'] }} 
          transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
          className="absolute left-0 right-0 h-1 bg-blue-500 shadow-[0_0_20px_#3b82f6] z-10"
        />
        <div className="absolute top-4 left-4 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-lg border border-blue-500/30 text-blue-400 text-[10px] uppercase tracking-widest font-bold">
          CNN Active
        </div>
      </div>
    )
  },
  {
    number: '03',
    tag: 'Step 3: Neural Diagnostics',
    title: 'Disease Pattern Recognition',
    desc: 'The model analyzes over 7 million individual parameters to identify subtle patterns—such as chlorotic rings, necrotic spots, or fungal pustules—that are invisible to the naked eye.',
    icon: <Search className="w-8 h-8 text-purple-400" />,
    color: 'from-[#2a1a3a] to-[#4a2d5a]',
    proTip: 'Our model is trained on 87,000+ images and can identify 54+ disease variants with 99.4% precision.',
    visual: (
      <div className="w-full aspect-[4/3] md:aspect-[16/9] bg-[#0a0a0f] rounded-xl border border-white/10 p-6 flex flex-col justify-center relative overflow-hidden">
        <div className="absolute inset-0 bg-purple-500/5" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 relative z-10">
          {[1,2,3,4,5,6,7,8].map(i => (
            <motion.div 
              key={i}
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.1, duration: 0.5 }}
              className="aspect-square rounded-lg border border-purple-500/20 bg-purple-500/10 flex items-center justify-center relative overflow-hidden group"
            >
              <div className="absolute inset-0 border border-purple-400/0 group-hover:border-purple-400/50 transition-colors" />
              <div className="text-[10px] text-purple-400/50 absolute top-1 left-1">F-{i}</div>
            </motion.div>
          ))}
        </div>
      </div>
    )
  },
  {
    number: '04',
    tag: 'Step 4: Ecosystem Sync',
    title: 'Weather Data Integration',
    desc: 'Disease identification is only half the battle. We simultaneously synchronize with hyper-local weather stations via the OpenWeatherMap API to track humidity, dew point, and precipitation history.',
    icon: <CloudRain className="w-8 h-8 text-cyan-400" />,
    color: 'from-[#1a3a3a] to-[#2d5a5a]',
    proTip: 'Weather integration allows us to determine if environmental conditions will accelerate the pathogen spread.',
    visual: (
      <div className="w-full aspect-[4/3] md:aspect-[16/9] bg-gradient-to-br from-[#0a1a1f] to-[#050a0f] rounded-xl border border-white/10 p-8 flex items-center justify-center relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-20" />
        <div className="relative z-10 flex gap-6 items-center">
           <div className="w-24 h-24 rounded-full bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center animate-pulse">
             <CloudRain className="w-10 h-10 text-cyan-400" />
           </div>
           <div>
             <div className="text-cyan-400 text-3xl font-light">84% <span className="text-sm text-cyan-400/60 uppercase">Humidity</span></div>
             <div className="text-white text-lg">26°C <span className="text-sm text-white/40">Temp</span></div>
             <div className="mt-2 text-[10px] uppercase tracking-widest text-cyan-400/60 font-bold">Fungal Risk: Critical</div>
           </div>
        </div>
      </div>
    )
  },
  {
    number: '05',
    tag: 'Step 5: Synthesis',
    title: 'Diagnosis Generation',
    desc: 'Combining the visual CNN findings with the meteorological risk factors, our diagnostic engine finalizes the report. False positives are filtered out using historical regional data.',
    icon: <Stethoscope className="w-8 h-8 text-healthy-emerald" />,
    color: 'from-[#1a2a1a] to-[#2d4a2d]',
    proTip: 'Results are computed in under 3 seconds, ensuring you get answers while still in the field.',
    visual: (
       <div className="w-full aspect-[4/3] md:aspect-[16/9] bg-[#0a0f0a] rounded-xl border border-white/10 flex flex-col items-center justify-center relative p-8">
          <div className="w-full max-w-sm space-y-4 relative z-10">
             <div className="flex justify-between items-center text-sm">
                <span className="text-white/50">Computing Confidence...</span>
                <span className="text-healthy-emerald font-bold">98.2%</span>
             </div>
             <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden">
               <motion.div 
                 initial={{ width: '0%' }}
                 whileInView={{ width: '98.2%' }}
                 transition={{ duration: 1.5, ease: 'easeOut' }}
                 className="h-full bg-healthy-emerald rounded-full"
               />
             </div>
             <div className="mt-8 bg-healthy-emerald/10 border border-healthy-emerald/20 rounded-xl p-4 text-center">
               <div className="text-healthy-emerald font-bold text-lg mb-1">Leaf Blight Confirmed</div>
               <div className="text-white/60 text-xs">Pathogen: Alternaria solani</div>
             </div>
          </div>
       </div>
    )
  },
  {
    number: '06',
    tag: 'Step 6: Actionable Output',
    title: 'Treatment Recommendation',
    desc: 'The system generates a tailored advisory report including biological control methods, specific chemical fungicide recommendations, and precise dosage calculations.',
    icon: <FlaskConical className="w-8 h-8 text-orange-400" />,
    color: 'from-[#3a2a1a] to-[#5a3d1a]',
    proTip: 'Protocols are cross-referenced with agricultural research databases and delivered in your regional language.',
    visual: (
       <div className="w-full aspect-[4/3] md:aspect-[16/9] bg-[#1a120a] rounded-xl border border-white/10 p-6 flex flex-col justify-center">
         <div className="space-y-3">
           {[
             { title: "Immediate Action", desc: "Isolate affected crops. Prune lower leaves to improve air circulation.", color: "text-orange-400", bg: "bg-orange-400/10", border: "border-orange-400/20" },
             { title: "Chemical Protocol", desc: "Apply Copper Oxychloride (50% WP) at 3g/liter of water.", color: "text-blue-400", bg: "bg-blue-400/10", border: "border-blue-400/20" },
             { title: "Biological Control", desc: "Introduce Trichoderma viride enriched compost to the soil.", color: "text-healthy-emerald", bg: "bg-healthy-emerald/10", border: "border-healthy-emerald/20" }
           ].map((item, i) => (
             <motion.div 
               key={i}
               initial={{ opacity: 0, x: 20 }}
               whileInView={{ opacity: 1, x: 0 }}
               transition={{ delay: i * 0.2 }}
               className={`p-4 rounded-xl border ${item.border} ${item.bg}`}
             >
               <div className={`${item.color} font-medium text-sm mb-1`}>{item.title}</div>
               <div className="text-white/70 text-xs">{item.desc}</div>
             </motion.div>
           ))}
         </div>
       </div>
    )
  },
  {
    number: '07',
    tag: 'Step 7: Lifecycle',
    title: 'Alert & Monitoring',
    desc: 'After treatment, FarmShield AI continues to monitor your field via weather data and scheduled follow-up scans to ensure complete crop recovery.',
    icon: <BellRing className="w-8 h-8 text-farm-accent" />,
    color: 'from-[#1a2a1a] to-[#2d4a2d]',
    proTip: 'Tag your field locations accurately to allow our AI to track disease progression over multiple weeks.',
    visual: (
       <div className="w-full aspect-[4/3] md:aspect-[16/9] bg-[#0a1a14] rounded-xl border border-white/10 p-8 flex items-center justify-center relative overflow-hidden">
         <motion.div 
           animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
           transition={{ duration: 2, repeat: Infinity }}
           className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(82,183,136,0.15)_0%,transparent_70%)]"
         />
         <div className="text-center relative z-10">
           <div className="w-16 h-16 rounded-full bg-farm-accent/20 border border-farm-accent/40 flex items-center justify-center mx-auto mb-4 relative">
             <div className="absolute top-0 right-0 w-3 h-3 bg-red-500 rounded-full animate-ping" />
             <BellRing className="w-7 h-7 text-farm-accent" />
           </div>
           <div className="text-white font-medium mb-1">Follow-up Scan Due</div>
           <div className="text-white/50 text-sm">Tomorrow at 08:00 AM</div>
         </div>
       </div>
    )
  }
];

const HowItWorks: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start center", "end center"]
  });
  
  const scaleY = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001
  });

  return (
    <>
      <section className="py-24 bg-black px-6 md:px-10" id="how-it-works">
        <div className="max-w-7xl mx-auto">
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-16 text-center md:text-left"
          >
            <div className="section-label mb-4 md:mx-0 mx-auto">Operational Protocol</div>
            <h2 className="text-white mb-6">AI Solutions in Action</h2>
            <p className="text-cool-slate max-w-2xl text-lg leading-relaxed mx-auto md:mx-0">
              Our 7-stage diagnostic process combines cutting-edge computer vision with real-time 
              climatological data to provide farmers with a defensive shield against crop failure.
            </p>
          </motion.div>

          {/* Statistics Section */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8 mb-24">
            {[
              { label: "Accuracy Rate", num: 95, suffix: "%" },
              { label: "Analysis Time", num: 3, suffix: "s", prefix: "<" },
              { label: "Diseases Detected", num: 50, suffix: "+" },
              { label: "System Uptime", num: 98, suffix: "%" }
            ].map((stat, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="bg-white/[0.02] border border-white/5 rounded-2xl p-6 text-center hover:bg-white/[0.04] transition-colors"
              >
                <div className="text-3xl md:text-5xl font-light text-farm-accent mb-2">
                  {stat.prefix}<AnimatedCounter end={stat.num} suffix={stat.suffix} />
                </div>
                <div className="text-cool-slate text-sm font-medium uppercase tracking-wider">{stat.label}</div>
              </motion.div>
            ))}
          </div>

          {/* Steps Timeline */}
          <div className="relative" ref={containerRef}>
            {/* Background Line */}
            <div className="absolute left-[27px] md:left-1/2 top-0 bottom-0 w-[2px] bg-white/10 md:-translate-x-1/2 rounded-full hidden sm:block" />
            
            {/* Animated Progress Line */}
            <motion.div 
              className="absolute left-[27px] md:left-1/2 top-0 bottom-0 w-[2px] bg-gradient-to-b from-farm-accent via-blue-500 to-purple-500 md:-translate-x-1/2 rounded-full hidden sm:block origin-top"
              style={{ scaleY }}
            />
            
            <div className="space-y-24 md:space-y-32">
              {steps.map((step, i) => {
                const isEven = i % 2 === 0;
                return (
                  <div key={i} className={`relative flex flex-col md:flex-row items-center gap-10 md:gap-16 ${isEven ? 'md:flex-row' : 'md:flex-row-reverse'}`}>
                    
                    {/* Center Node */}
                    <div className="absolute left-[28px] md:left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 hidden sm:flex items-center justify-center z-10 w-12 h-12 rounded-full bg-black border-4 border-black">
                      <div className="w-full h-full rounded-full bg-white/5 border border-white/20 flex items-center justify-center text-xs text-white font-bold">
                        {step.number}
                      </div>
                    </div>

                    {/* Content Side */}
                    <motion.div 
                      initial={{ opacity: 0, x: isEven ? -50 : 50 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true, margin: "-100px" }}
                      className="w-full md:w-1/2 flex flex-col justify-center pl-16 sm:pl-20 md:pl-0"
                    >
                      <div className={`md:max-w-md ${!isEven ? 'md:ml-auto' : ''}`}>
                        <div className="text-farm-accent text-[10px] uppercase tracking-widest mb-3 font-bold">{step.tag}</div>
                        <h3 className="text-white text-3xl font-light mb-4">{step.title}</h3>
                        <p className="text-cool-slate leading-relaxed text-base opacity-80 mb-6">{step.desc}</p>
                        
                        <div className="bg-white/5 border border-white/10 rounded-xl p-4 flex gap-3 items-start">
                          <div className="text-xl">💡</div>
                          <div className="text-white/90 text-sm font-medium leading-relaxed">{step.proTip}</div>
                        </div>
                      </div>
                    </motion.div>

                    {/* Visual Side */}
                    <motion.div 
                      initial={{ opacity: 0, scale: 0.9 }}
                      whileInView={{ opacity: 1, scale: 1 }}
                      viewport={{ once: true, margin: "-100px" }}
                      className="w-full md:w-1/2 pl-0 sm:pl-20 md:pl-0"
                    >
                      <div className="shadow-2xl">
                        {step.visual}
                      </div>
                    </motion.div>

                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      <Testimonials />
      <FAQSection />
    </>
  );
};

export default HowItWorks;
