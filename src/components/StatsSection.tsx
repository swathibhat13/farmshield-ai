
import React from 'react';
import { motion } from 'framer-motion';

const stats = [
  { label: 'Images Analyzed', value: '87,000+', desc: 'High-fidelity crop datasets' },
  { label: 'Disease Variants', value: '54+', desc: 'Across major crop categories' },
  { label: 'Active Farmers', value: '12,000+', desc: 'Using AI-driven advisory' },
  { label: 'Accuracy Rate', value: '98%', desc: 'Verified diagnostic precision' }
];

const StatsSection: React.FC = () => {
  return (
    <section className="py-24 bg-black border-y border-border-dark">
      <div className="max-w-7xl mx-auto px-6 md:px-10">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-12 md:gap-20">
          {stats.map((stat, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="relative"
            >
              <div className="text-farm-accent text-[10px] uppercase tracking-widest mb-4 font-bold">
                {stat.label}
              </div>
              <div className="text-white text-5xl md:text-6xl font-light tracking-tighter mb-4">
                {stat.value}
              </div>
              <div className="text-cool-slate text-sm leading-relaxed max-w-[150px]">
                {stat.desc}
              </div>
              {i < stats.length - 1 && (
                <div className="hidden lg:block absolute -right-10 top-1/2 -translate-y-1/2 w-[1px] h-12 bg-border-dark" />
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default StatsSection;
