
import React from 'react';
import { motion } from 'framer-motion';
import { Plus, Minus } from 'lucide-react';

const faqs = [
  {
    q: "How accurate is the disease detection?",
    a: "Our CNN models are trained on a curated dataset of over 87,000 images, achieving a 98% accuracy rate in controlled testing environments. We recommend capturing images in indirect sunlight for best results."
  },
  {
    q: "Does it work without an active internet connection?",
    a: "The web platform requires a connection for real-time weather sync. However, our edge-optimized mobile application allows for local inference on supported devices for disease detection in zero-signal zones."
  },
  {
    q: "What crops are currently supported?",
    a: "We currently support 54+ disease variants across major crops including Rice, Wheat, Tomato, Potato, Maize, and Grapes. We are constantly expanding our dataset to include more regional varieties."
  },
  {
    q: "How do I interpret the weather risk level?",
    a: "Risk levels are calculated using XGBoost models that correlate your field's soil parameters with 72-hour historical and 48-hour forecasted weather data to predict pathogen acceleration."
  }
];

const FAQSection: React.FC = () => {
  const [open, setOpen] = React.useState<number | null>(null);

  return (
    <section className="py-32 bg-black px-6 md:px-10" id="faq">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-20">
          <div className="section-label justify-center mb-4">Support Center</div>
          <h2 className="text-white">Frequently Asked<br />Questions</h2>
        </div>

        <div className="space-y-4">
          {faqs.map((faq, i) => (
            <div 
              key={i}
              className="border border-border-dark rounded-xl bg-dark-surface/30 overflow-hidden"
            >
              <button 
                onClick={() => setOpen(open === i ? null : i)}
                className="w-full p-6 md:p-8 flex items-center justify-between text-left group"
              >
                <span className="text-white text-lg font-normal group-hover:text-farm-accent transition-colors">
                  {faq.q}
                </span>
                <div className="text-cool-slate">
                  {open === i ? <Minus className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
                </div>
              </button>
              
              {open === i && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  className="px-6 md:px-8 pb-8"
                >
                  <p className="text-cool-slate leading-relaxed">
                    {faq.a}
                  </p>
                </motion.div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FAQSection;
