import React, { useState } from 'react';
import { Globe, ChevronDown } from 'lucide-react';

interface NavbarProps {
  onNav: (path: any) => void;
  isLoggedIn: boolean;
  onLogout: () => void;
}

const Navbar: React.FC<NavbarProps> = ({ onNav, isLoggedIn, onLogout }) => {
  const [scrolled, setScrolled] = useState(false);
  const [langMenuOpen, setLangMenuOpen] = useState(false);

  const languages = [
    { code: 'en', name: 'English' },
    { code: 'hi', name: 'हिंदी' },
    { code: 'kn', name: 'ಕನ್ನಡ' },
    { code: 'ml', name: 'മലയാളം' }
  ];

  const handleLanguageChange = (code: string) => {
    document.cookie = `googtrans=/en/${code}; path=/`;
    document.cookie = `googtrans=/en/${code}; domain=.${window.location.hostname}; path=/`;
    setLangMenuOpen(false);
    window.location.reload();
  };

  React.useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <>
      <div className="fixed top-0 left-0 right-0 h-40 bg-gradient-to-b from-black/80 via-black/40 to-transparent z-[45] pointer-events-none" />

      <nav className={`fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-10 py-6 md:px-16 transition-all duration-700 ${
        scrolled ? 'bg-black/90 backdrop-blur-3xl border-b border-white/5 py-4' : 'bg-transparent'
      }`}>
        <div className="flex items-center gap-20">
          <div className="flex items-center gap-3 cursor-pointer group" onClick={() => onNav('landing')}>
            <div className="w-10 h-10 bg-farm-accent rounded-xl flex items-center justify-center group-hover:rotate-[15deg] transition-all duration-500 shadow-[0_0_20px_rgba(82,183,136,0.3)]">
              <span className="text-black font-bold text-xl">🌿</span>
            </div>
            <span className="text-white font-normal text-2xl tracking-tighter">FarmShield AI</span>
          </div>

          <div className="hidden xl:flex items-center gap-12">
            {[
              { label: 'DISEASE DETECTION', path: 'scanner' },
              { label: 'WEATHER ADVISORY', path: 'advisory' },
              { label: 'FEATURES', path: 'features' },
              { label: 'HOW IT WORKS', path: 'how-it-works' }
            ].map((item) => (
              <button 
                key={item.label}
                onClick={() => onNav(item.path as any)}
                className="text-[11px] font-bold tracking-[0.2em] text-white/50 hover:text-white transition-all duration-300 relative group"
              >
                {item.label}
                <span className="absolute -bottom-2 left-0 w-0 h-[1px] bg-farm-accent transition-all duration-300 group-hover:w-full"></span>
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-8">
          
          <div className="relative">
            <button 
              onClick={() => setLangMenuOpen(!langMenuOpen)}
              className="flex items-center gap-2 text-white/70 hover:text-white transition-colors"
            >
              <Globe className="w-4 h-4" />
              <span className="text-[11px] font-bold tracking-widest uppercase">Lang</span>
              <ChevronDown className="w-3 h-3" />
            </button>
            
            {langMenuOpen && (
              <div className="absolute top-full mt-4 right-0 w-32 bg-black/90 backdrop-blur-3xl border border-white/10 rounded-xl overflow-hidden py-2 shadow-2xl">
                {languages.map((l) => (
                  <button 
                    key={l.code}
                    onClick={() => handleLanguageChange(l.code)}
                    className="w-full text-left px-4 py-2 text-[12px] text-white/70 hover:text-farm-accent hover:bg-white/5 transition-colors font-medium"
                  >
                    {l.name}
                  </button>
                ))}
              </div>
            )}
          </div>
          
          <div id="google_translate_element" className="hidden"></div>
          {!isLoggedIn ? (
            <>
              <button onClick={() => onNav('login')} className="text-[11px] font-bold tracking-[0.2em] text-white/70 hover:text-white transition-colors">SIGN IN</button>
              <button onClick={() => onNav('register')} className="bg-farm-accent text-black text-[11px] font-bold tracking-[0.2em] px-8 py-3 rounded-md hover:bg-white transition-all duration-300 shadow-xl">GET STARTED</button>
            </>
          ) : (
            <>
              <button onClick={onLogout} className="text-[11px] font-bold tracking-[0.2em] text-white/50 hover:text-danger-red transition-colors">SIGN OUT</button>
              <button onClick={() => onNav('dashboard')} className="bg-farm-accent/20 text-farm-accent border border-farm-accent/30 text-[11px] font-bold tracking-[0.2em] px-8 py-3 rounded-md hover:bg-farm-accent hover:text-black transition-all">DASHBOARD</button>
            </>
          )}
        </div>
      </nav>
    </>
  );
};

export default Navbar;
