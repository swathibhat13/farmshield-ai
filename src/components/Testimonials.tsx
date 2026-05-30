import React from 'react';
import { motion } from 'framer-motion';

const testimonials = [
  {
    quote: "FarmShield AI saved my entire tomato harvest this season! The early detection allowed me to treat the crop before the blight spread.",
    name: "Rajesh Kumar",
    role: "Tomato Farmer",
    location: "Maharashtra, India",
    stars: 5,
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=150&auto=format&fit=crop"
  },
  {
    quote: "Detected leaf blight 2 weeks before visible symptoms appeared. The weather integration is incredibly accurate and helps me plan irrigation perfectly.",
    name: "Priya Sharma",
    role: "Rice Farmer",
    location: "Punjab, India",
    stars: 5,
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=150&auto=format&fit=crop"
  }
];

const Testimonials: React.FC = () => {
  return (
    <section className="py-24 bg-[#0a0a0a] px-6 md:px-10 border-t border-white/5">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <div className="section-label justify-center mb-4">Farmer Success Stories</div>
          <h2 className="text-white mb-6">Trusted by 10,000+ Farmers</h2>
          <p className="text-cool-slate max-w-2xl mx-auto text-lg leading-relaxed">
            Real results from fields across the country. See how FarmShield AI is transforming crop protection and maximizing yields.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {testimonials.map((t, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="bg-dark-surface/50 border border-white/10 rounded-2xl p-8 relative"
            >
              <div className="text-farm-accent text-5xl font-serif absolute top-6 left-6 opacity-20">"</div>
              <div className="relative z-10">
                <div className="flex gap-1 mb-6">
                  {[...Array(t.stars)].map((_, idx) => (
                    <svg key={idx} className="w-5 h-5 text-yellow-500 fill-yellow-500" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
                <p className="text-white text-lg leading-relaxed mb-8 font-light italic">"{t.quote}"</p>
                
                <div className="flex items-center gap-4 border-t border-white/10 pt-6">
                  <img src={t.avatar} alt={t.name} className="w-12 h-12 rounded-full object-cover grayscale hover:grayscale-0 transition-all border border-white/20" />
                  <div>
                    <div className="text-white font-medium">{t.name}</div>
                    <div className="text-cool-slate text-sm">{t.role} • {t.location}</div>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Testimonials;
