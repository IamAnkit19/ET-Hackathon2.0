import React, { useState } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Sidebar from './components/layout/Sidebar';
import TopBar from './components/layout/TopBar';
import Dashboard from './pages/Dashboard';
import FraudGraph from './pages/FraudGraph';
import ScamDetector from './pages/ScamDetector';
import CurrencyVerifier from './pages/CurrencyVerifier';
import FraudShield from './pages/FraudShield';
import CrimeMap from './pages/CrimeMap';
import { useAlertWebSocket } from './lib/websocket';

// Import Leaflet CSS for maps
import 'leaflet/dist/leaflet.css';

import ParticleBackground from './components/shared/ParticleBackground';
import WorkflowStepper from './components/layout/WorkflowStepper';
import Copilot from './components/layout/Copilot';

const AppContent: React.FC = () => {
  // Global WebSocket hook that connects to ws://localhost:8000/api/ws/alerts
  const { alerts, connected } = useAlertWebSocket();
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(false);

  return (
    <div className="min-h-screen bg-bg-primary text-text-primary flex relative">
      {/* Animated particle mesh in background */}
      <ParticleBackground />

      {/* Floating Police Copilot Command Terminal */}
      <Copilot />

      {/* Sidebar - fixed left */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main Grid Wrapper */}
      <div className="flex-1 ml-0 md:ml-[220px] flex flex-col min-h-screen overflow-hidden">
        {/* TopBar - fixed top header */}
        <TopBar alerts={alerts} onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} />

        {/* Dynamic page container viewports */}
        <main className="flex-1 mt-[70px] p-6 overflow-y-auto relative z-10">
          {/* Active Tactical Investigation Stepper */}
          <WorkflowStepper />

          {/* Status Offline warning banner */}
          {!connected && (
            <div className="mb-4 bg-red-950/40 border border-red-500/30 text-red-400 px-4 py-2.5 rounded-lg text-xs font-mono flex items-center justify-between select-none">
              <span>⚠ CONNECTION LOST: Unable to connect to the VYUH backend server. Ensure it is active on http://localhost:8000.</span>
              <span className="font-bold uppercase tracking-wider animate-pulse">Offline</span>
            </div>
          )}

          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/fraud-graph" element={<FraudGraph />} />
            <Route path="/scam" element={<ScamDetector />} />
            <Route path="/currency" element={<CurrencyVerifier />} />
            <Route path="/shield" element={<FraudShield />} />
            <Route path="/map" element={<CrimeMap />} />
          </Routes>
        </main>
      </div>
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
};

export default App;
