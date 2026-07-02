import React, { useState, useEffect } from 'react';
import { ShieldAlert, Bell, User, Clock, Menu } from 'lucide-react';
import { Alert } from '../../lib/websocket';

interface TopBarProps {
  alerts: Alert[];
  onToggleSidebar: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({ alerts, onToggleSidebar }) => {
  const [time, setTime] = useState<string>('');
  const [role, setRole] = useState<string>('Law Enforcement');
  const [showNotifications, setShowNotifications] = useState<boolean>(false);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTime(now.toLocaleTimeString('en-US', { hour12: false }));
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  // Determine threat parameters based on number of active high-severity alerts
  const criticalCount = alerts.filter(a => a.severity === 'CRITICAL' || a.severity === 'HIGH').length;
  const threatLevel = Math.min(5, Math.max(1, Math.floor(criticalCount / 3) + 2));

  const getThreatColor = (level: number) => {
    if (level <= 2) return 'text-green-500 border-green-500/20 bg-green-950/20';
    if (level <= 4) return 'text-warning border-warning/20 bg-warning/10';
    return 'text-danger border-danger/30 bg-danger/10 animate-pulse-red';
  };

  return (
    <header className="h-[70px] bg-bg-surface border-b border-border-custom px-6 flex items-center justify-between fixed top-0 right-0 left-0 md:left-[220px] z-15">
      {/* Page / System Title */}
      <div className="flex items-center space-x-3">
        {/* Mobile Hamburger menu toggle */}
        <button
          onClick={onToggleSidebar}
          className="md:hidden p-1.5 text-text-secondary hover:text-text-primary hover:bg-bg-surface2 rounded-lg transition mr-1 cursor-pointer"
        >
          <Menu className="w-5 h-5" />
        </button>
        <LandmarkIcon className="w-5 h-5 text-accent-blue" />
        <span className="text-sm font-bold text-text-primary font-mono tracking-wide">
          VYUH DIGITAL TACTICAL GRID
        </span>
      </div>

      {/* Center - Live Clock */}
      <div className="flex items-center space-x-2 text-text-secondary bg-bg-primary/50 border border-border-custom px-4 py-1.5 rounded-lg font-mono text-sm shadow-inner">
        <Clock className="w-4 h-4 text-accent-blue" />
        <span className="text-text-primary font-bold tracking-widest">{time}</span>
        <span className="text-[10px] text-accent-blue/80 font-bold uppercase tracking-wider ml-1">IST</span>
      </div>

      {/* Right - Controls */}
      <div className="flex items-center space-x-5">
        {/* Role Selector */}
        <div className="flex items-center space-x-2 bg-bg-primary/60 border border-border-custom rounded-lg p-1.5">
          <User className="w-4 h-4 text-text-secondary ml-1" />
          <select 
            value={role} 
            onChange={(e) => setRole(e.target.value)}
            className="bg-transparent text-xs font-semibold text-text-primary border-none focus:outline-none pr-3 cursor-pointer"
          >
            <option value="Law Enforcement" className="bg-bg-surface text-text-primary">Law Enforcement</option>
            <option value="Bank Analyst" className="bg-bg-surface text-text-primary">Bank Analyst</option>
            <option value="Citizen" className="bg-bg-surface text-text-primary">Citizen User</option>
          </select>
        </div>

        {/* Threat Level */}
        <div className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg border text-xs font-mono font-bold uppercase tracking-wider ${getThreatColor(threatLevel)}`}>
          <ShieldAlert className="w-4 h-4" />
          <span>THREAT: LVL-{threatLevel}</span>
        </div>

        {/* Notifications */}
        <div className="relative">
          <button 
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative p-2 text-text-secondary hover:text-text-primary bg-bg-primary/50 hover:bg-bg-surface2 border border-border-custom rounded-lg transition-all duration-200"
          >
            <Bell className="w-4 h-4" />
            {alerts.length > 0 && (
              <span className="absolute -top-1.5 -right-1.5 bg-danger text-text-primary text-[9px] font-bold font-mono w-4.5 h-4.5 rounded-full flex items-center justify-center border-2 border-bg-surface shadow">
                {alerts.length}
              </span>
            )}
          </button>

          {/* Quick Notification Dropdown */}
          {showNotifications && (
            <div className="absolute right-0 mt-3 w-80 bg-bg-surface border border-border-custom rounded-xl shadow-2xl z-30 p-4 space-y-3">
              <div className="flex justify-between items-center pb-2 border-b border-border-custom">
                <span className="text-xs font-bold font-mono text-text-primary uppercase tracking-wide">
                  Active System Alarms
                </span>
                <span className="text-[10px] text-text-secondary">
                  {alerts.length} alerts pending
                </span>
              </div>
              <div className="max-h-[300px] overflow-y-auto space-y-2 pr-1">
                {alerts.slice(0, 5).map((a) => (
                  <div key={a.id} className="p-2.5 rounded bg-bg-primary/50 hover:bg-bg-surface2 transition text-xs border-l-2 border-l-accent-blue">
                    <div className="flex justify-between font-bold text-text-primary">
                      <span>{a.title}</span>
                      <span className="text-[9px] text-danger font-mono">{a.severity}</span>
                    </div>
                    <p className="text-[11px] text-text-secondary mt-1 line-clamp-2">{a.description}</p>
                  </div>
                ))}
                {alerts.length === 0 && (
                  <div className="text-center py-6 text-text-secondary text-xs">
                    No active alarm notifications.
                  </div>
                )}
              </div>
              <button 
                onClick={() => setShowNotifications(false)}
                className="w-full text-center text-[10px] font-bold text-accent-blue hover:underline py-1"
              >
                Close Panel
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

// Generic icon helper
const LandmarkIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <path d="M2 20h20" />
    <path d="M5 17V11" />
    <path d="M9 17V11" />
    <path d="M13 17V11" />
    <path d="M17 17V11" />
    <path d="M3 11h18L12 3z" />
  </svg>
);

export default TopBar;
