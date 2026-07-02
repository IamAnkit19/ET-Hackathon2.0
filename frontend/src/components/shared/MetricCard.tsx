import React from 'react';

interface MetricCardProps {
  label: string;
  value: string | number;
  delta?: string;
  icon?: React.ReactNode;
  color?: string;
}

export const MetricCard: React.FC<MetricCardProps> = ({ 
  label, 
  value, 
  delta, 
  icon,
  color = 'border-l-accent-blue' 
}) => {
  const isPositive = delta ? delta.includes('▲') || delta.includes('+') : false;
  const isNegative = delta ? delta.includes('▼') || delta.includes('-') : false;

  return (
    <div className={`card-glass border-l-4 ${color} flex items-center justify-between transition-transform duration-300 hover:scale-[1.02]`}>
      <div className="space-y-1">
        <span className="text-xs font-mono font-bold tracking-wider text-text-secondary uppercase">
          {label}
        </span>
        <div className="text-2xl font-bold text-text-primary tracking-tight">
          {value}
        </div>
        {delta && (
          <span className={`text-xs font-semibold ${
            isPositive ? 'text-green-400' : isNegative ? 'text-red-400' : 'text-text-secondary'
          }`}>
            {delta}
          </span>
        )}
      </div>
      {icon && (
        <div className="text-accent-blue bg-accent-blue/10 p-2.5 rounded-lg border border-accent-blue/20">
          {icon}
        </div>
      )}
    </div>
  );
};

export default MetricCard;
