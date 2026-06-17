import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Eye, EyeOff, User, Mail, Lock, AlertCircle } from 'lucide-react';

interface AuthProps {
  onLogin: () => void;
  initialMode?: 'login' | 'register';
}

const Auth: React.FC<AuthProps> = ({ onLogin, initialMode = 'login' }) => {
  const [isLogin, setIsLogin] = useState(initialMode === 'login');
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [useOtp, setUseOtp] = useState(true);
  const [showOtpInput, setShowOtpInput] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rememberMe, setRememberMe] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const baseUrl = 'http://127.0.0.1:5000';

    if (isForgotPassword) {
      try {
        const response = await fetch(`${baseUrl}/api/auth/forgot-password`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: formData.email }),
        });
        const data = await response.json();
        if (data.success) {
          setError(data.message || "Reset link sent!");
        } else {
          setError(data.error || "Failed to send reset link");
        }
      } catch (err) {
        setError("Connection failed. Ensure backend is running.");
      } finally {
        setLoading(false);
      }
      return;
    }

    if (isLogin && useOtp) {
      if (showOtpInput) {
        try {
          const response = await fetch(`${baseUrl}/api/auth/otp-verify`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: formData.email, otp: otpCode }),
          });
          const data = await response.json();
          if (data.success) {
            localStorage.setItem('fs_token', data.token);
            localStorage.setItem('fs_logged_in', 'true');
            if (data.user?.name) {
              localStorage.setItem('fs_user_name', data.user.name);
            }
            if (data.user?.role) {
              localStorage.setItem('fs_user_role', data.user.role);
            }
            onLogin();
          } else {
            setError(data.error || "Invalid OTP");
          }
        } catch (err) {
          setError("Connection failed. Ensure backend is running.");
        } finally {
          setLoading(false);
        }
        return;
      } else {
        try {
          const response = await fetch(`${baseUrl}/api/auth/otp-request`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: formData.email }),
          });
          const data = await response.json();
          if (data.success) {
            setError(data.message || "OTP sent to your email!");
            setShowOtpInput(true);
          } else {
            setError(data.error || "Failed to send OTP");
          }
        } catch (err) {
          setError("Connection failed. Ensure backend is running.");
        } finally {
          setLoading(false);
        }
        return;
      }
    }

    const endpoint = isLogin ? '/api/auth/login' : '/api/auth/register';

    try {
      const response = await fetch(`${baseUrl}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          password: formData.password,
          remember: rememberMe
        }),
      });

      const data = await response.json();

      if (data.success) {
        if (isLogin) {
          localStorage.setItem('fs_token', data.token);
          localStorage.setItem('fs_logged_in', 'true');
          if (data.user?.name) {
            localStorage.setItem('fs_user_name', data.user.name);
          }
          if (data.user?.role) {
            localStorage.setItem('fs_user_role', data.user.role);
          }
          onLogin();
        } else {
          setIsLogin(true);
          setError("Account created! Please sign in.");
        }
      } else {
        setError(data.error || "Authentication failed");
      }
    } catch (err) {
      setError("Connection to neural auth failed. Ensure backend is running.");
    } finally {
      setLoading(false);
    }
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
            {isForgotPassword ? 'Reset Password' : isLogin ? 'Welcome Back' : 'Create Account'}
          </h2>
          <p className="text-cool-slate text-sm">
            {isForgotPassword
              ? 'Enter your email to receive a reset link'
              : isLogin
              ? 'Access your cinematic agricultural intelligence'
              : 'Join the next generation of smart farming'}
          </p>
        </div>

        {error && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className={`mb-6 p-4 rounded-lg flex items-center gap-3 text-xs font-bold uppercase tracking-wider ${(error.includes('created') || error.includes('sent') || error.includes('successful')) ? 'bg-healthy-emerald/20 text-healthy-emerald border border-healthy-emerald/30' : 'bg-danger-red/20 text-danger-red border border-danger-red/30'}`}
          >
            <AlertCircle size={16} />
            {error}
          </motion.div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {!isLogin && !isForgotPassword && (
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
              required
              placeholder="Email Address"
              className="w-full bg-white/5 border border-white/10 rounded-lg py-3.5 pl-12 pr-4 text-white placeholder:text-cool-slate/50 focus:border-farm-accent transition-all outline-none"
              value={formData.email}
              onChange={e => setFormData({ ...formData, email: e.target.value })}
            />
          </div>

          {!isForgotPassword && !(isLogin && useOtp) && (
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-cool-slate" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
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
          )}

          {isLogin && useOtp && showOtpInput && (
            <div className="relative mt-4">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-cool-slate" />
              <input
                type="text"
                required
                placeholder="Enter 6-digit OTP"
                className="w-full bg-white/5 border border-white/10 rounded-lg py-3.5 pl-12 pr-4 text-white placeholder:text-cool-slate/50 focus:border-farm-accent transition-all outline-none"
                value={otpCode}
                onChange={e => setOtpCode(e.target.value)}
                maxLength={6}
              />
            </div>
          )}

          {isLogin && !isForgotPassword && (
            <div className="flex flex-col gap-4 mt-2 mb-4 px-1">
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer group">
                  <div className="relative flex items-center justify-center w-4 h-4 rounded border border-white/20 bg-white/5 group-hover:border-farm-accent/50 transition-colors">
                    <input 
                      type="checkbox" 
                      className="absolute opacity-0 cursor-pointer w-full h-full"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                    />
                    {rememberMe && <div className="w-2 h-2 rounded-sm bg-farm-accent" />}
                  </div>
                  <span className="text-[13px] text-cool-slate group-hover:text-white transition-colors">Remember me</span>
                </label>
                
                <button 
                  type="button" 
                  onClick={() => { setIsForgotPassword(true); setError(null); }}
                  className="text-[13px] text-farm-accent hover:text-white transition-colors"
                >
                  Forgot Password?
                </button>
              </div>
              <button
                type="button"
                onClick={() => {
                  setUseOtp(!useOtp);
                  setShowOtpInput(false);
                  setOtpCode('');
                }}
                className="text-[13px] text-cool-slate hover:text-farm-accent transition-colors self-start"
              >
                {useOtp ? 'Use Password Instead' : 'Login with OTP'}
              </button>
            </div>
          )}

          <button 
            type="submit" 
            disabled={loading}
            className="w-full btn-runway mt-4 !py-4 text-[15px] disabled:opacity-50 flex items-center justify-center gap-3"
          >
            {loading && <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />}
            {isForgotPassword ? 'Send Reset Link' : (isLogin && useOtp) ? (showOtpInput ? 'Verify OTP' : 'Send OTP') : isLogin ? 'Sign In' : 'Create Account'}
          </button>
        </form>

        <div className="mt-8 pt-8 border-t border-white/5 text-center">
          <button
            type="button"
            onClick={() => {
              if (isForgotPassword) {
                setIsForgotPassword(false);
              } else {
                setIsLogin(!isLogin);
              }
              setError(null);
              setShowOtpInput(false);
              setOtpCode('');
            }}
            className="text-[13px] text-cool-slate hover:text-farm-accent transition-colors"
          >
            {isForgotPassword 
              ? "Back to Sign In" 
              : isLogin 
                ? "Don't have an account? Register" 
                : "Already have an account? Sign In"}
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default Auth;
