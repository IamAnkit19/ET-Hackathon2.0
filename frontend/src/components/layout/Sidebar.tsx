import React, { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { Home, Share2, AlertTriangle, ShieldCheck, Map, Landmark, X } from 'lucide-react';
import { getDashboardSummary } from '../../lib/api';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const [visScore, setVisScore] = useState<number>(64.2);

  useEffect(() => {
    const fetchSummary = async () => {
      try {
        const res = await getDashboardSummary();
        if (res.data && res.data.vyuh_intelligence_score !== undefined) {
          setVisScore(res.data.vyuh_intelligence_score);
        }
      } catch (err) {
        console.error('Error fetching sidebar summary score:', err);
      }
    };
    fetchSummary();
    // Update every 10 seconds for consistency
    const timer = setInterval(fetchSummary, 10000);
    return () => clearInterval(timer);
  }, []);

  const getDotColor = (score: number) => {
    if (score < 40) return 'bg-success';
    if (score <= 70) return 'bg-warning';
    return 'bg-danger animate-pulse';
  };

  const navItems = [
    { name: 'Command Center', path: '/', icon: <Home className="w-4 h-4" /> },
    { name: 'Fraud Network', path: '/fraud-graph', icon: <Share2 className="w-4 h-4" /> },
    { name: 'Scam Detector', path: '/scam', icon: <AlertTriangle className="w-4 h-4" /> },
    { name: 'Currency Verify', path: '/currency', icon: <Landmark className="w-4 h-4" /> },
    { name: 'Fraud Shield', path: '/shield', icon: <ShieldCheck className="w-4 h-4" /> },
    { name: 'Crime Map', path: '/map', icon: <Map className="w-4 h-4" /> },
  ];

  return (
    <>
      {/* Mobile backdrop overlay */}
      {isOpen && (
        <div 
          className="md:hidden fixed inset-0 bg-black/60 backdrop-blur-xs z-30 transition-opacity duration-300"
          onClick={onClose}
        />
      )}
      
      <aside className={`w-[220px] bg-bg-surface border-r border-border-custom h-screen fixed left-0 top-0 flex flex-col z-40 transition-transform duration-300 md:translate-x-0 ${
        isOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        {/* Top Header Logo */}
        <div className="p-5 border-b border-border-custom flex items-center justify-between">
          <div className="flex flex-col">
            <h1 className="text-xl font-bold tracking-wider text-accent-blue flex items-center">
              VYUH <span className="text-[10px] text-text-secondary ml-1 bg-accent-blue/10 px-1 py-0.5 rounded border border-accent-blue/20">V2.0</span>
            </h1>
            <span className="text-[9px] font-mono text-text-secondary uppercase tracking-widest mt-1">
              विघ्न — AI DISRUPTION
            </span>
          </div>
          <button
            onClick={onClose}
            className="md:hidden p-1 text-text-secondary hover:text-text-primary hover:bg-bg-surface2 rounded-lg cursor-pointer"
          >
            <X className="w-4.5 h-4.5" />
          </button>
        </div>

      {/* Nav List */}
      <nav className="flex-1 px-3 py-4 space-y-1.5 overflow-y-auto">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            onClick={onClose}
            className={({ isActive }) =>
              `flex items-center space-x-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 border-l-2 ${
                isActive
                  ? 'bg-accent-blue/15 text-accent-blue border-accent-blue font-bold shadow-md shadow-accent-blue/5'
                  : 'text-text-secondary border-transparent hover:text-text-primary hover:bg-bg-surface2'
              }`
            }
          >
            {item.icon}
            <span>{item.name}</span>
          </NavLink>
        ))}
      </nav>

      {/* Bottom VIS Indicator */}
      <div className="p-4 border-t border-border-custom bg-bg-primary/40 flex items-center justify-between">
        <div className="flex flex-col">
          <span className="text-[9px] font-mono text-text-secondary uppercase tracking-wider">
            National Risk
          </span>
          <span className="text-xs font-bold font-mono text-text-primary mt-0.5">
            VIS Score: {visScore.toFixed(1)}
          </span>
        </div>
        <div className="flex items-center space-x-1.5">
          <span className={`w-3.5 h-3.5 rounded-full ${getDotColor(visScore)}`} />
        </div>
      </div>
    </aside>
  </>
  );
};

export default Sidebar;
