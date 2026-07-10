import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const defaultTestimonials = [
  {
    id: 'default-1',
    quote: "FarmShield AI saved my entire tomato harvest this season! The early detection allowed me to treat the crop before the blight spread.",
    name: "Rajesh Kumar",
    role: "Tomato Farmer",
    location: "Maharashtra, India",
    stars: 5,
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=150&auto=format&fit=crop"
  },
  {
    id: 'default-2',
    quote: "Detected leaf blight 2 weeks before visible symptoms appeared. The weather integration is incredibly accurate and helps me plan irrigation perfectly.",
    name: "Priya Sharma",
    role: "Rice Farmer",
    location: "Punjab, India",
    stars: 5,
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=150&auto=format&fit=crop"
  }
];

interface Review {
  id: number;
  name: string;
  role: string;
  rating: number;
  message: string;
  created_at: string;
}

const Testimonials: React.FC = () => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({ name: '', role: '', message: '', rating: 5 });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchReviews();
  }, []);

  const fetchReviews = async () => {
    try {
      const res = await fetch('http://127.0.0.1:5000/api/reviews');
      const data = await res.json();
      if (data.success) {
        setReviews(data.reviews);
      }
    } catch (err) {
      console.error('Failed to fetch reviews', err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);
    try {
      const res = await fetch('http://127.0.0.1:5000/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      const data = await res.json();
      if (data.success) {
        setShowModal(false);
        setFormData({ name: '', role: '', message: '', rating: 5 });
        fetchReviews();
      } else {
        setError(data.error || 'Failed to submit review');
      }
    } catch (err) {
      setError('An error occurred while submitting.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const displayReviews = [
    ...defaultTestimonials,
    ...reviews.map(r => ({
      id: r.id.toString(),
      quote: r.message,
      name: r.name,
      role: r.role,
      location: r.created_at,
      stars: r.rating,
      avatar: `https://api.dicebear.com/7.x/initials/svg?seed=${r.name}&backgroundColor=166534`
    }))
  ];

  return (
    <section className="py-24 bg-[#0a0a0a] px-6 md:px-10 border-t border-white/5 relative overflow-hidden">
      <div className="max-w-7xl mx-auto relative z-10">
        <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-6">
          <div className="text-left">
            <div className="section-label mb-4">Farmer Success Stories</div>
            <h2 className="text-white mb-4 text-4xl md:text-5xl font-semibold tracking-tight">Trusted by 10,000+ Farmers</h2>
            <p className="text-cool-slate max-w-2xl text-lg leading-relaxed">
              Real results from fields across the country. See how FarmShield AI is transforming crop protection and maximizing yields.
            </p>
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowModal(true)}
            className="px-6 py-3 bg-farm-accent/10 text-farm-accent border border-farm-accent/30 rounded-xl font-medium hover:bg-farm-accent hover:text-black transition-all whitespace-nowrap shadow-[0_0_20px_rgba(74,222,128,0.15)]"
          >
            + Share Your Experience
          </motion.button>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {displayReviews.map((t, i) => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: (i % 3) * 0.1 }}
              className="bg-dark-surface/50 border border-white/10 rounded-2xl p-8 relative flex flex-col justify-between hover:border-farm-accent/30 transition-colors group"
            >
              <div className="text-farm-accent text-5xl font-serif absolute top-6 left-6 opacity-20 group-hover:opacity-40 transition-opacity">"</div>
              <div className="relative z-10 flex-1">
                <div className="flex gap-1 mb-6">
                  {[...Array(5)].map((_, idx) => (
                    <svg key={idx} className={`w-5 h-5 ${idx < t.stars ? 'text-yellow-500 fill-yellow-500' : 'text-white/20 fill-white/20'}`} viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
                <p className="text-white text-lg leading-relaxed mb-8 font-light italic">"{t.quote}"</p>
              </div>
              <div className="flex items-center gap-4 border-t border-white/10 pt-6 mt-4">
                <img src={t.avatar} alt={t.name} className="w-12 h-12 rounded-full object-cover grayscale group-hover:grayscale-0 transition-all border border-white/20" />
                <div>
                  <div className="text-white font-medium">{t.name}</div>
                  <div className="text-cool-slate text-sm">{t.role}{t.location ? ` • ${t.location}` : ''}</div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md px-4"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="bg-[#121212] border border-white/10 rounded-2xl p-8 max-w-lg w-full relative shadow-2xl overflow-hidden"
            >
              {/* Decorative elements */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-farm-accent/10 blur-[50px] rounded-full pointer-events-none" />
              <div className="absolute bottom-0 left-0 w-32 h-32 bg-blue-500/10 blur-[50px] rounded-full pointer-events-none" />

              <button
                onClick={() => setShowModal(false)}
                className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-white/5 text-white/50 hover:bg-white/10 hover:text-white transition-colors"
              >
                ✕
              </button>

              <div className="relative z-10">
                <h3 className="text-2xl font-semibold text-white mb-2 tracking-tight">Share Your Experience</h3>
                <p className="text-cool-slate mb-6 text-sm leading-relaxed">Help other farmers by sharing how FarmShield AI has impacted your harvest.</p>

                {error && <div className="mb-4 p-3 bg-red-500/10 border border-red-500/50 text-red-500 rounded-lg text-sm">{error}</div>}

                <form onSubmit={handleSubmit} className="space-y-5">
                  <div>
                    <label className="block text-cool-slate text-sm mb-2 font-medium">Name</label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={e => setFormData({ ...formData, name: e.target.value })}
                      className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-farm-accent transition-colors"
                      placeholder="Your full name"
                    />
                  </div>
                  <div>
                    <label className="block text-cool-slate text-sm mb-2 font-medium">Role & Location (Optional)</label>
                    <input
                      type="text"
                      value={formData.role}
                      onChange={e => setFormData({ ...formData, role: e.target.value })}
                      className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-farm-accent transition-colors"
                      placeholder="e.g. Rice Farmer • Punjab"
                    />
                  </div>
                  <div>
                    <label className="block text-cool-slate text-sm mb-2 font-medium">Rating</label>
                    <div className="flex gap-2">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          type="button"
                          key={star}
                          onClick={() => setFormData({ ...formData, rating: star })}
                          className={`w-10 h-10 rounded-lg flex items-center justify-center transition-all text-xl ${star <= formData.rating ? 'bg-yellow-500/20 text-yellow-500' : 'bg-white/5 text-white/30 hover:bg-white/10'}`}
                        >
                          ★
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="block text-cool-slate text-sm mb-2 font-medium">Your Review</label>
                    <textarea
                      required
                      value={formData.message}
                      onChange={e => setFormData({ ...formData, message: e.target.value })}
                      className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-farm-accent transition-colors h-32 resize-none"
                      placeholder="Tell us about your experience..."
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-4 bg-farm-accent text-black font-semibold rounded-xl hover:bg-[#3bca6b] transition-all disabled:opacity-50 mt-4 shadow-[0_0_15px_rgba(74,222,128,0.3)] hover:shadow-[0_0_25px_rgba(74,222,128,0.5)] transform hover:-translate-y-0.5 active:translate-y-0"
                  >
                    {isSubmitting ? 'Submitting...' : 'Submit Review'}
                  </button>
                </form>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
};

export default Testimonials;
