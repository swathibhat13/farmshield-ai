
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Eye, EyeOff, User, Mail, Lock } from 'lucide-react';

interface AuthProps {
  onLogin: () => void;
  initialMode?: 'login' | 'register';
}

const Auth: React.FC<AuthProps> = ({ onLogin, initialMode = 'login' }) => {
  const [isLogin, setIsLogin] = useState(initialMode === 'login');
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onLogin();
  };

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center overflow-hidden bg-runway-black">
      {/* Cinematic Background */}
      <div className="absolute inset-0 z-0">
        <img
          src="https://images.unsplash.com/photo-1500382017468-9049fed747ef?q=80&w=2532&auto=format&fit=crop"
          alt="Agricultural Horizon"
          className="w-full h-full object-cover animate-subtle-zoom opacity-30"
        />
        <div className="absolute inset-0 cinematic-overlay" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
        className="relative z-10 w-full max-w-[440px] px-8 py-12 bg-dark-surface/40 backdrop-blur-3xl border border-white/5 rounded-2xl"
      >
        <div className="text-center mb-10">
          <div className="w-12 h-12 bg-farm-accent rounded-[10px] flex items-center justify-center text-[20px] mx-auto mb-6">🌿</div>
          <span className="text-farm-accent text-[11px] font-bold uppercase tracking-[0.2em] mb-4 block">FarmShield AI Intelligence</span>
          <h2 className="text-white text-3xl font-normal tracking-tight mb-2">
            {isLogin ? 'Welcome Back' : 'Create Account'}
          </h2>
          <p className="text-cool-slate text-sm">
            {isLogin
              ? 'Access your cinematic agricultural intelligence'
              : 'Join the next generation of smart farming'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {!isLogin && (
            <div className="relative">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-cool-slate" />
              <input
                type="text"
                placeholder="Full Name"
                className="w-full bg-white/5 border border-white/10 rounded-lg py-3.5 pl-12 pr-4 text-white placeholder:text-cool-slate/50 focus:border-farm-accent transition-all outline-none"
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
          )}

          <div className="relative">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-cool-slate" />
            <input
              type="email"
              placeholder="Email Address"
              className="w-full bg-white/5 border border-white/10 rounded-lg py-3.5 pl-12 pr-4 text-white placeholder:text-cool-slate/50 focus:border-farm-accent transition-all outline-none"
              value={formData.email}
              onChange={e => setFormData({ ...formData, email: e.target.value })}
            />
          </div>

          <div className="relative">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-cool-slate" />
            <input
              type={showPassword ? 'text' : 'password'}
              placeholder="Password"
              className="w-full bg-white/5 border border-white/10 rounded-lg py-3.5 pl-12 pr-12 text-white placeholder:text-cool-slate/50 focus:border-farm-accent transition-all outline-none"
              value={formData.password}
              onChange={e => setFormData({ ...formData, password: e.target.value })}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-cool-slate hover:text-white transition-colors"
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>

          <button type="submit" className="w-full btn-runway mt-4 !py-4 text-[15px]">
            {isLogin ? 'Sign In' : 'Create Account'}
          </button>
        </form>

        <div className="mt-8 pt-8 border-t border-white/5 text-center">
          <button
            onClick={() => setIsLogin(!isLogin)}
            className="text-[13px] text-cool-slate hover:text-farm-accent transition-colors"
          >
            {isLogin ? "Don't have an account? Register" : "Already have an account? Sign In"}
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default Auth;
