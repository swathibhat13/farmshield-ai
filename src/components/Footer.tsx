import React, { useState } from 'react';

interface FooterProps {
  onNav: (path: any) => void;
}

const Footer: React.FC<FooterProps> = ({ onNav }) => {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    
    setStatus('loading');
    
    // Simulate an API call
    setTimeout(() => {
      if (email.includes('@')) {
        setStatus('success');
        setEmail('');
        setTimeout(() => setStatus('idle'), 3000); // Reset after 3 seconds
      } else {
        setStatus('error');
        setTimeout(() => setStatus('idle'), 3000);
      }
    }, 1000);
  };

  return (
    <footer className="bg-black border-t border-border-dark py-24 px-6 md:px-10">
      <div className="max-w-7xl mx-auto grid md:grid-cols-2 lg:grid-cols-4 gap-12 mb-24">
        <div className="lg:col-span-1">
          <div className="flex items-center gap-2.5 mb-8 cursor-pointer" onClick={() => onNav('landing')}>
            <div className="w-8 h-8 bg-farm-accent rounded-[6px] flex items-center justify-center text-[16px]">🌿</div>
            <span className="text-white text-[16px] font-semibold tracking-[-0.3px]">
              Farm<span className="text-farm-accent">Shield</span> AI
            </span>
          </div>
          <p className="text-cool-slate text-sm leading-relaxed max-w-xs">
            Advancing global food security through AI-powered atmospheric intelligence and sub-pixel disease detection.
          </p>
        </div>

        <div>
          <h4 className="text-white text-[11px] font-bold uppercase tracking-[0.2em] mb-8">Intelligence</h4>
          <ul className="space-y-4">
            <li><button onClick={() => onNav('scanner')} className="text-cool-slate text-[14px] hover:text-white transition-colors">Disease Engine</button></li>
            <li><button onClick={() => onNav('advisory')} className="text-cool-slate text-[14px] hover:text-white transition-colors">Weather Advisory</button></li>
            <li><button onClick={() => onNav('features')} className="text-cool-slate text-[14px] hover:text-white transition-colors">Features</button></li>
            <li><button onClick={() => onNav('how-it-works')} className="text-cool-slate text-[14px] hover:text-white transition-colors">How It Works</button></li>
          </ul>
        </div>

        <div>
          <h4 className="text-white text-[11px] font-bold uppercase tracking-[0.2em] mb-8">Department</h4>
          <ul className="space-y-4">
            <li><a href="#" className="text-cool-slate text-[14px] hover:text-white transition-colors">Research Papers</a></li>
            <li><a href="#" className="text-cool-slate text-[14px] hover:text-white transition-colors">Open Datasets</a></li>
            <li><a href="#" className="text-cool-slate text-[14px] hover:text-white transition-colors">Ethics Board</a></li>
            <li><a href="#" className="text-cool-slate text-[14px] hover:text-white transition-colors">Careers</a></li>
          </ul>
        </div>

        <div>
          <h4 className="text-white text-[11px] font-bold uppercase tracking-[0.2em] mb-8">Stay Connected</h4>
          <div className="flex flex-col gap-6">
             <p className="text-cool-slate text-sm">Join our newsletter for weekly insights into AI-driven agriculture.</p>
             <form onSubmit={handleJoin} className="flex flex-col gap-2">
                <div className="flex gap-2">
                  <input 
                    type="email" 
                    placeholder="Email address" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={status === 'loading' || status === 'success'}
                    className="bg-white/5 border border-border-dark px-4 py-3 text-sm text-white focus:outline-none focus:border-farm-accent flex-grow rounded-sm disabled:opacity-50"
                  />
                  <button 
                    type="submit" 
                    disabled={status === 'loading' || status === 'success'}
                    className="px-5 py-3 bg-farm-accent text-black text-[13px] font-bold uppercase tracking-wider rounded-sm disabled:opacity-50 transition-colors"
                  >
                    {status === 'loading' ? '...' : status === 'success' ? '✓' : 'Join'}
                  </button>
                </div>
                {status === 'success' && (
                  <p className="text-farm-accent text-xs">Successfully joined the newsletter!</p>
                )}
                {status === 'error' && (
                  <p className="text-red-500 text-xs">Please enter a valid email address.</p>
                )}
             </form>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto pt-12 border-t border-border-dark flex flex-col md:flex-row justify-between items-center gap-8">
        <div className="text-cool-slate text-[11px] font-medium tracking-wider uppercase">
          © 2026 FARMSHIELD AI. DESIGNED FOR PRECISION.
        </div>
        <div className="flex gap-8">
          <a href="#" className="text-cool-slate text-[11px] font-bold tracking-widest uppercase hover:text-white transition-colors">X / Twitter</a>
          <a href="#" className="text-cool-slate text-[11px] font-bold tracking-widest uppercase hover:text-white transition-colors">LinkedIn</a>
          <a href="#" className="text-cool-slate text-[11px] font-bold tracking-widest uppercase hover:text-white transition-colors">GitHub</a>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
