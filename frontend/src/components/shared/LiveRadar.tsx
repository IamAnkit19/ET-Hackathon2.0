import React, { useEffect, useRef, useState } from 'react';
import { Radio } from 'lucide-react';

export const LiveRadar: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [activeThreats, setActiveThreats] = useState<{ id: number; name: string; type: string; intensity: string }[]>([
    { id: 1, name: 'Delhi Sector 4', type: 'UPI Mule Cluster', intensity: 'CRITICAL' },
    { id: 2, name: 'Jamtara Corridor', type: 'Vishing Burst', intensity: 'HIGH' },
    { id: 3, name: 'Mewat Zone', type: 'Impersonation Cell', intensity: 'HIGH' },
  ]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId: number;
    let angle = 0;

    // Fixed mock threat dots coordinates relative to radar center
    const threats = [
      { x: 30, y: -40, strength: 0.8 },
      { x: -50, y: 30, strength: 0.6 },
      { x: 60, y: 50, strength: 0.9 },
      { x: -20, y: -60, strength: 0.4 },
    ];

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const cx = canvas.width / 2;
      const cy = canvas.height / 2;
      const maxRadius = Math.min(cx, cy) - 10;

      // 1. Draw Radar background circles
      ctx.strokeStyle = 'rgba(59, 130, 246, 0.15)';
      ctx.lineWidth = 1;
      for (let r = maxRadius / 4; r <= maxRadius; r += maxRadius / 4) {
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, 2 * Math.PI);
        ctx.stroke();
      }

      // Crosshairs lines
      ctx.beginPath();
      ctx.moveTo(cx - maxRadius, cy);
      ctx.lineTo(cx + maxRadius, cy);
      ctx.moveTo(cx, cy - maxRadius);
      ctx.lineTo(cx, cy + maxRadius);
      ctx.stroke();

      // 2. Draw sweeping radar beam line
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      const sweepX = cx + maxRadius * Math.cos(angle);
      const sweepY = cy + maxRadius * Math.sin(angle);
      ctx.lineTo(sweepX, sweepY);
      ctx.strokeStyle = 'rgba(59, 130, 246, 0.4)';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Sweep gradient trailing wedge
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.arc(cx, cy, maxRadius, angle - 0.25, angle);
      ctx.lineTo(cx, cy);
      ctx.fillStyle = 'rgba(59, 130, 246, 0.06)';
      ctx.fill();

      // 3. Draw active threat coordinates
      threats.forEach((th) => {
        const tx = cx + th.x;
        const ty = cy + th.y;

        // Calculate angular difference to handle sweep illumination glow fading
        const pointAngle = Math.atan2(th.y, th.x);
        let diff = angle - pointAngle;
        while (diff < -Math.PI) diff += 2 * Math.PI;
        while (diff > Math.PI) diff -= 2 * Math.PI;

        let alpha = 0.1;
        if (diff > 0 && diff < 0.5) {
          alpha = 1 - (diff / 0.5);
        }

        // Draw pulsing danger target dot
        ctx.beginPath();
        ctx.arc(tx, ty, 4, 0, 2 * Math.PI);
        ctx.fillStyle = `rgba(239, 68, 68, ${Math.max(0.15, alpha)})`;
        ctx.fill();

        if (alpha > 0.6) {
          ctx.beginPath();
          ctx.arc(tx, ty, 8 * (1 - alpha), 0, 2 * Math.PI);
          ctx.strokeStyle = 'rgba(239, 68, 68, 0.4)';
          ctx.stroke();
        }
      });

      // Update rotation speed
      angle = (angle + 0.015) % (2 * Math.PI);
      animationId = requestAnimationFrame(draw);
    };

    draw();

    // Trigger randomized list alerts ticker
    const timer = setInterval(() => {
      const names = ['Delhi Sector 4', 'Jamtara Corridor', 'Mewat Zone', 'Noida Node 2', 'Kolkata Mule Ring', 'Mumbai Sector 3'];
      const types = ['UPI Mule Cluster', 'Vishing Burst', 'Impersonation Cell', 'SIM Swap Registry'];
      const intensities = ['CRITICAL', 'HIGH', 'MEDIUM'];

      setActiveThreats(prev => {
        const copy = [...prev];
        copy.shift();
        copy.push({
          id: Date.now(),
          name: names[Math.floor(Math.random() * names.length)],
          type: types[Math.floor(Math.random() * types.length)],
          intensity: intensities[Math.floor(Math.random() * intensities.length)]
        });
        return copy;
      });
    }, 4000);

    return () => {
      cancelAnimationFrame(animationId);
      clearInterval(timer);
    };
  }, []);

  return (
    <div className="flex flex-col space-y-3.5 h-full">
      <div className="flex items-center justify-between border-b border-border-custom pb-2">
        <h3 className="text-xs font-bold font-mono text-text-primary uppercase tracking-wider flex items-center gap-1.5">
          <Radio className="w-4 h-4 text-danger animate-pulse" />
          Live Tactical Threat Radar
        </h3>
        <span className="text-[9px] font-mono text-danger uppercase tracking-wider font-bold bg-danger/10 px-1.5 py-0.5 rounded border border-danger/25">
          Sweeping 30GHz
        </span>
      </div>

      <div className="flex items-center justify-center gap-4 flex-col sm:flex-row flex-1">
        {/* Radar display */}
        <div className="relative shrink-0">
          <canvas
            ref={canvasRef}
            width={140}
            height={140}
            className="border border-border-custom/30 rounded-full bg-black/35 shadow-inner"
          />
          <div className="absolute inset-0 border border-accent-blue/10 rounded-full pointer-events-none animate-ping-slow opacity-15" />
        </div>

        {/* Live Threats Ticker ledger list */}
        <div className="flex-1 w-full space-y-2 max-h-[140px] overflow-y-auto pr-1">
          {activeThreats.map((th) => (
            <div key={th.id} className="p-2 bg-bg-primary/50 border border-border-custom rounded-lg flex items-center justify-between gap-2 text-[10px] font-mono">
              <div className="truncate">
                <span className="text-text-primary font-bold block truncate">{th.name}</span>
                <span className="text-text-secondary block truncate">{th.type}</span>
              </div>
              <span className={`px-1.5 py-0.5 rounded font-bold text-[9px] ${
                th.intensity === 'CRITICAL' ? 'bg-red-950/60 text-red-400 border border-red-500/20' : 'bg-amber-950/60 text-amber-400 border border-amber-500/20'
              }`}>
                {th.intensity}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default LiveRadar;
