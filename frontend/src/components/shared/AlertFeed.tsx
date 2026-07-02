import React from 'react';
import { Alert } from '../../lib/websocket';
import { Shield, Radio, DollarSign, MapPin, Eye } from 'lucide-react';

interface AlertFeedProps {
  alerts: Alert[];
  maxHeight?: string;
  onEscalate?: (alert: Alert) => void;
}

export const formatRelativeTime = (timestampStr: string) => {
  try {
    const date = new Date(timestampStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffSecs = Math.floor(diffMs / 1000);
    
    if (diffSecs < 10) return 'Just now';
    if (diffSecs < 60) return `${diffSecs}s ago`;
    if (diffMins < 60) return `${diffMins}m ago`;
    
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    
    return date.toLocaleDateString();
  } catch (e) {
    return 'Recently';
  }
};

export const AlertFeed: React.FC<AlertFeedProps> = ({ alerts, maxHeight = 'max-h-[400px]', onEscalate }) => {
  
  const getSeverityBorder = (sev: string) => {
    switch (sev.toUpperCase()) {
      case 'CRITICAL':
        return 'border-l-red-500';
      case 'HIGH':
        return 'border-l-orange-500';
      case 'MEDIUM':
        return 'border-l-amber-500';
      default:
        return 'border-l-gray-500';
    }
  };

  const getModuleIcon = (mod: string) => {
    switch (mod.toLowerCase()) {
      case 'graph':
        return <Shield className="w-3.5 h-3.5" />;
      case 'scam':
        return <Radio className="w-3.5 h-3.5" />;
      case 'currency':
        return <DollarSign className="w-3.5 h-3.5" />;
      case 'map':
        return <MapPin className="w-3.5 h-3.5" />;
      default:
        return <Eye className="w-3.5 h-3.5" />;
    }
  };

  return (
    <div className={`overflow-y-auto pr-1 space-y-3 ${maxHeight}`}>
      {alerts.length === 0 ? (
        <div className="text-center py-8 text-text-secondary text-sm font-mono">
          No live alerts in feed buffer. Monitoring active...
        </div>
      ) : (
        alerts.map((alert) => {
          const isCritical = alert.severity.toUpperCase() === 'CRITICAL';
          
          return (
            <div 
              key={`${alert.id}-${alert.timestamp}`} 
              className={`bg-bg-surface border-1 border-border-custom border-l-4 ${getSeverityBorder(alert.severity)} p-3.5 rounded-lg transition-all duration-300 hover:bg-bg-surface-hover flex items-start space-x-3`}
            >
              <div className="flex-1 space-y-1">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="flex items-center space-x-1 px-2 py-0.5 text-[9px] font-mono font-bold bg-accent-blue/10 text-accent-blue rounded border border-accent-blue/20 uppercase">
                      {getModuleIcon(alert.module)}
                      <span>{alert.module}</span>
                    </span>
                    <span className="text-[10px] text-text-secondary font-mono">
                      {formatRelativeTime(alert.timestamp)}
                    </span>
                  </div>
                  {isCritical && (
                    <span className="flex h-2.5 w-2.5 relative">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
                    </span>
                  )}
                </div>
                <div className="text-sm font-bold text-text-primary">
                  {alert.title}
                </div>
                <div className="text-xs text-text-secondary line-clamp-2">
                  {alert.description}
                </div>
                {onEscalate && (
                  <div className="flex justify-end pt-2">
                    <button
                      onClick={() => onEscalate(alert)}
                      className="px-2 py-1 bg-accent-blue/10 hover:bg-accent-blue/20 text-accent-blue hover:text-text-primary border border-accent-blue/20 rounded text-[9px] font-mono font-bold transition-all cursor-pointer"
                    >
                      Escalate to VTIP Pipeline &rarr;
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })
      )}
    </div>
  );
};

export default AlertFeed;
