import React from 'react';

interface LiveIndicatorProps {
  label?: string;
  pulseColor?: string;
}

export const LiveIndicator: React.FC<LiveIndicatorProps> = ({ 
  label = 'LIVE MONITORING', 
  pulseColor = 'bg-red-500' 
}) => {
  return (
    <div className="flex items-center space-x-2">
      <span className="relative flex h-2 w-2">
        <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${pulseColor}`}></span>
        <span className={`relative inline-flex rounded-full h-2 w-2 ${pulseColor}`}></span>
      </span>
      {label && <span className="text-[10px] font-mono tracking-widest text-text-secondary uppercase">{label}</span>}
    </div>
  );
};

export default LiveIndicator;
