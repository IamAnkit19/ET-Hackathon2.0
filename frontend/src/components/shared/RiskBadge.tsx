import React from 'react';

interface RiskBadgeProps {
  risk: string;
}

export const RiskBadge: React.FC<RiskBadgeProps> = ({ risk }) => {
  const normRisk = risk.toUpperCase();

  const getStyle = () => {
    switch (normRisk) {
      case 'CRITICAL':
        return 'bg-red-950/40 text-red-400 border border-red-500/30';
      case 'HIGH':
        return 'bg-orange-950/40 text-orange-400 border border-orange-500/30';
      case 'MEDIUM':
      case 'SUSPICIOUS':
        return 'bg-amber-950/40 text-amber-400 border border-amber-500/30';
      case 'LOW':
        return 'bg-gray-900 text-gray-400 border border-gray-700/50';
      case 'SAFE':
      case 'GENUINE':
        return 'bg-green-950/40 text-green-400 border border-green-500/30';
      case 'MULE':
        return 'bg-red-950/60 text-red-400 border border-red-500/50 animate-pulse';
      default:
        return 'bg-gray-800 text-gray-300 border border-gray-700';
    }
  };

  return (
    <span className={`px-2.5 py-1 text-xs font-mono font-bold rounded-full uppercase tracking-wider ${getStyle()}`}>
      {normRisk === 'MULE' && <span className="inline-block w-2.5 h-2.5 mr-1.5 rounded-full bg-red-500 animate-ping align-middle" />}
      {normRisk}
    </span>
  );
};

export default RiskBadge;
