import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Minus, HelpCircle, Wrench } from 'lucide-react';

const commonFaqs = [
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

const troubleshooting = [
  {
    q: "My image won't upload, what should I do?",
    a: "Ensure your image is in JPG, PNG, or WEBP format and under 10MB. Check your internet connection and try refreshing the page."
  },
  {
    q: "The AI couldn't detect any disease, but my plant looks sick.",
    a: "Try taking a clearer, closer photo of the affected area with good lighting. The leaf should fill at least 60% of the frame, avoiding harsh shadows."
  },
  {
    q: "Weather advisory is not showing for my location.",
    a: "Please ensure you have granted location permissions to your browser. You can also manually enter your coordinates in the settings panel."
  },
  {
    q: "I forgot my password.",
    a: "Click on 'Forgot Password' on the login screen. A reset link will be sent to your registered email address within a few minutes."
  }
];

const FAQSection: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'common' | 'troubleshooting'>('common');
  const [open, setOpen] = useState<number | null>(null);

  const currentList = activeTab === 'common' ? commonFaqs : troubleshooting;

  return (
    <section className="py-32 bg-black px-6 md:px-10" id="faq">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-16">
          <div className="section-label justify-center mb-4">Support Center</div>
          <h2 className="text-white mb-8">FAQ Page</h2>
          
          <div className="flex flex-wrap justify-center gap-4">
            <button
              onClick={() => { setActiveTab('common'); setOpen(null); }}
              className={`flex items-center gap-2 px-6 py-3 rounded-full text-sm font-medium transition-all ${
                activeTab === 'common' 
                  ? 'bg-farm-accent text-black' 
                  : 'bg-dark-surface border border-white/10 text-cool-slate hover:text-white hover:border-white/30'
              }`}
            >
              <HelpCircle className="w-4 h-4" />
              Common Questions Answered
            </button>
            <button
              onClick={() => { setActiveTab('troubleshooting'); setOpen(null); }}
              className={`flex items-center gap-2 px-6 py-3 rounded-full text-sm font-medium transition-all ${
                activeTab === 'troubleshooting' 
                  ? 'bg-farm-accent text-black' 
                  : 'bg-dark-surface border border-white/10 text-cool-slate hover:text-white hover:border-white/30'
              }`}
            >
              <Wrench className="w-4 h-4" />
              Troubleshooting Guide
            </button>
          </div>
        </div>

        <div className="space-y-4 min-h-[400px]">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
              className="space-y-4"
            >
              {currentList.map((faq, i) => (
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
                    <div className="text-cool-slate shrink-0 ml-4">
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
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
};

export default FAQSection;
