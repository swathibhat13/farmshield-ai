import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import Features from './components/Features';
import StatsSection from './components/StatsSection';
import FAQSection from './components/FAQSection';
import Footer from './components/Footer';
import Auth from './components/Auth';
import Dashboard from './components/Dashboard';
import DiseaseScanner from './components/DiseaseScanner';
import WeatherPanel from './components/WeatherPanel';
import HowItWorks from './components/HowItWorks';
import FarmShieldAI from './components/FarmShieldAI';
import StrategicSidebar from './components/StrategicSidebar';
import ErrorBoundary from './ErrorBoundary';
import AdminDashboard from './components/AdminDashboard';

type AppState = 'landing' | 'login' | 'register' | 'dashboard' | 'scanner' | 'advisory' | 'article' | 'how-it-works' | 'features' | 'admin' | 'verify';

function App() {
  const [authState, setAuthState] = useState<AppState>('landing');
  const [isLoggedIn, setIsLoggedIn] = useState(() => localStorage.getItem('fs_logged_in') === 'true');
  const [isAdmin, setIsAdmin] = useState(() => localStorage.getItem('fs_user_role') === 'admin');
  const [verifyMessage, setVerifyMessage] = useState<string | null>(null);

  // ── Magic Link Token Verification ──────────────────
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');
    if (!token) return;

    setAuthState('verify');
    setVerifyMessage('Verifying your magic link...');

    fetch('http://127.0.0.1:5000/api/auth/magic-link-login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token }),
    })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          localStorage.setItem('fs_token', data.token);
          localStorage.setItem('fs_logged_in', 'true');
          if (data.user?.name) localStorage.setItem('fs_user_name', data.user.name);
          if (data.user?.role) localStorage.setItem('fs_user_role', data.user.role);
          window.history.replaceState({}, '', '/');
          setVerifyMessage('✅ Logged in successfully! Redirecting...');
          setTimeout(() => {
            setIsLoggedIn(true);
            setIsAdmin(localStorage.getItem('fs_user_role') === 'admin');
            setAuthState('dashboard');
          }, 1500);
        } else {
          setVerifyMessage('❌ ' + (data.error || 'Invalid or expired link. Please request a new one.'));
          setTimeout(() => setAuthState('login'), 3000);
        }
      })
      .catch(() => {
        setVerifyMessage('❌ Connection failed. Please try again.');
        setTimeout(() => setAuthState('login'), 3000);
      });
  }, []);

  const handleNav = (path: AppState) => {
    setAuthState(path);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleLogin = () => {
    setIsLoggedIn(true);
    setIsAdmin(localStorage.getItem('fs_user_role') === 'admin');
    localStorage.setItem('fs_logged_in', 'true');
    setAuthState('dashboard');
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setIsAdmin(false);
    localStorage.removeItem('fs_logged_in');
    localStorage.removeItem('fs_token');
    localStorage.removeItem('fs_user_name');
    localStorage.removeItem('fs_user_role');
    setAuthState('landing');
  };

  const InsidePageWrapper = ({ children }: { children: React.ReactNode }) => (
    <div className="relative min-h-screen bg-black flex flex-col">
      {/* Cinematic Background Layer */}
      <div className="fixed inset-0 z-0">
        <img 
          src="https://images.unsplash.com/photo-1523348837708-15d4a09cfac2?w=1800&q=80" 
          alt="Bright Atmospheric Farm" 
          className="w-full h-full object-cover opacity-90 scale-100 transition-opacity duration-1000"
        />
        <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" />
      </div>
      
      {/* Content Layer */}
      <div className="relative z-10 flex-1 pt-32 pb-24 px-6 md:px-12 transition-all duration-500">
        <div className="max-w-[1400px] mx-auto">
          {children}
        </div>
        <div className="mt-20">
          <ErrorBoundary><Footer onNav={handleNav} /></ErrorBoundary>
        </div>
      </div>
    </div>
  );


  return (
    <main className="bg-runway-black min-h-screen selection:bg-farm-accent selection:text-black font-sans overflow-x-hidden">
      <ErrorBoundary>
        <Navbar onNav={handleNav} isLoggedIn={isLoggedIn} isAdmin={isAdmin} onLogout={handleLogout} />
      </ErrorBoundary>
      
      <AnimatePresence mode="wait">
        {authState === 'landing' && (
          <motion.div key="landing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <ErrorBoundary><Hero onStart={() => handleNav('register')} onExplore={() => handleNav('features')} /></ErrorBoundary>
            <ErrorBoundary><Features /></ErrorBoundary>
            <ErrorBoundary><StatsSection /></ErrorBoundary>
            <ErrorBoundary><FAQSection /></ErrorBoundary>
            <ErrorBoundary><Footer onNav={handleNav} /></ErrorBoundary>
          </motion.div>
        )}

        {(authState === 'login' || authState === 'register') && (
          <motion.div key="auth" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <ErrorBoundary><Auth initialMode={authState} onLogin={handleLogin} /></ErrorBoundary>
          </motion.div>
        )}

        {authState === 'dashboard' && (
          <motion.div key="dashboard" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <InsidePageWrapper>
              <ErrorBoundary><Dashboard onArticleClick={() => {}} /></ErrorBoundary>
            </InsidePageWrapper>
          </motion.div>
        )}

        {authState === 'scanner' && (
          <motion.div key="scanner" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            <InsidePageWrapper>
              <ErrorBoundary><DiseaseScanner /></ErrorBoundary>
            </InsidePageWrapper>
          </motion.div>
        )}

        {authState === 'advisory' && (
          <motion.div key="advisory" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            <InsidePageWrapper>
              <ErrorBoundary><WeatherPanel /></ErrorBoundary>
            </InsidePageWrapper>
          </motion.div>
        )}

        {authState === 'how-it-works' && (
          <motion.div key="how-it-works" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
             <InsidePageWrapper>
                <ErrorBoundary><HowItWorks /></ErrorBoundary>
             </InsidePageWrapper>
          </motion.div>
        )}

        {authState === 'features' && (
          <motion.div key="features-page" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
             <InsidePageWrapper>
                <ErrorBoundary><Features /></ErrorBoundary>
             </InsidePageWrapper>
          </motion.div>
        )}

        {authState === 'admin' && isAdmin && (
          <motion.div key="admin" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
             <ErrorBoundary><AdminDashboard /></ErrorBoundary>
          </motion.div>
        )}

        {authState === 'verify' && (
          <motion.div
            key="verify"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-xl"
          >
            <div className="text-center space-y-6 px-8 max-w-md">
              <div className="w-16 h-16 bg-farm-accent/20 rounded-2xl flex items-center justify-center text-4xl mx-auto">
                🌿
              </div>
              <div className="w-10 h-10 border-2 border-farm-accent border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-white text-lg font-medium">{verifyMessage || 'Verifying...'}</p>
              <p className="text-cool-slate text-sm">FarmShield AI — Advanced Agricultural Intelligence</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>


      <ErrorBoundary>
        <FarmShieldAI />
      </ErrorBoundary>
    </main>
  );
}

export default App;
