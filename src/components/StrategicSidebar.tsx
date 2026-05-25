import React from 'react';
import { motion } from 'framer-motion';
import { 
  LayoutGrid, 
  Shield, 
  CloudSun, 
  Book, 
  Settings, 
  HelpCircle,
  Zap
} from 'lucide-react';

interface SidebarProps {
  currentPath: string;
  onNav: (path: any) => void;
}

const StrategicSidebar: React.FC<SidebarProps> = ({ currentPath, onNav }) => {
  const menuItems = [
    { id: 'dashboard', label: 'Operational Hub', icon: LayoutGrid },
    { id: 'scanner', label: 'Neural Scanner', icon: Shield },
    { id: 'advisory', label: 'Atmospheric Hub', icon: CloudSun },
  ];

  return (
    <div className="fixed left-0 top-0 bottom-0 w-24 xl:w-72 bg-deep-black/80 backdrop-blur-3xl border-r border-white/5 z-40 flex flex-col pt-32 pb-10 transition-all duration-500 overflow-hidden group/sidebar">
      {/* Dynamic Glow */}
      <div className="absolute top-0 left-0 w-full h-[300px] bg-farm-accent/5 blur-[120px] pointer-events-none" />
      
      <div className="flex-1 px-4 space-y-2">
        {menuItems.map((item) => {
          const isActive = currentPath === item.id;
          const Icon = item.icon;
          
          return (
            <button
              key={item.id}
              onClick={() => onNav(item.id)}
              className={`w-full flex items-center gap-4 px-4 py-4 rounded-xl transition-all duration-300 relative group ${
                isActive 
                  ? 'bg-farm-accent/10 text-farm-accent' 
                  : 'text-white/40 hover:text-white hover:bg-white/5'
              }`}
            >
              {isActive && (
                <motion.div 
                  layoutId="activeGlow"
                  className="absolute left-0 w-1 h-6 bg-farm-accent rounded-full"
                />
              )}
              <Icon className={`w-5 h-5 flex-shrink-0 transition-transform duration-500 ${isActive ? 'scale-110' : 'group-hover:scale-110'}`} />
              <span className="hidden xl:block text-[11px] font-bold uppercase tracking-[0.2em] whitespace-nowrap opacity-100 transition-opacity duration-500">
                {item.label}
              </span>
              
              {/* Tooltip for collapsed state */}
              <div className="xl:hidden absolute left-full ml-4 px-3 py-2 bg-farm-accent text-black text-[10px] font-bold rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none uppercase tracking-widest z-50 whitespace-nowrap shadow-2xl">
                {item.label}
              </div>
            </button>
          );
        })}
      </div>
    </div>

  );
};

export default StrategicSidebar;
