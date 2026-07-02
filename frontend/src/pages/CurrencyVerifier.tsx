import React, { useState, useEffect } from 'react';
import { Landmark, Upload, FileText, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import { verifyNote, getCurrencyStats, getCurrencyTrends, getCurrencyFeatures } from '../lib/api';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export const CurrencyVerifier: React.FC = () => {
  // Upload States
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [selectedDenom, setSelectedDenom] = useState<number>(500);

  // Analysis State
  const [verifying, setVerifying] = useState<boolean>(false);
  const [result, setResult] = useState<any>(null);

  // Secondary stats data
  const [stats, setStats] = useState<any[]>([]);
  const [trends, setTrends] = useState<any[]>([]);
  const [features, setFeatures] = useState<any[]>([]);
  const [expandedFeatureId, setExpandedFeatureId] = useState<string | null>(null);

  // Load stats and default features
  useEffect(() => {
    const loadStatsData = async () => {
      try {
        const statsRes = await getCurrencyStats();
        setStats(statsRes.data || []);

        const trendsRes = await getCurrencyTrends();
        setTrends(trendsRes.data || []);
      } catch (err) {
        console.error('Error fetching currency analytics:', err);
      }
    };
    loadStatsData();
  }, []);

  // Fetch security guides when denomination changes
  useEffect(() => {
    const loadFeatures = async () => {
      try {
        const featRes = await getCurrencyFeatures(selectedDenom);
        setFeatures(featRes.data || []);
      } catch (err) {
        console.error('Error fetching guides:', err);
      }
    };
    loadFeatures();
  }, [selectedDenom]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      setResult(null); // Clear previous runs
    }
  };

  // Quick Demo Simulator
  const handleSimulateSample = (type: 'genuine' | 'fake') => {
    // Create a mock file object based on name trigger
    const name = type === 'genuine' ? `genuine_${selectedDenom}.jpg` : `fake_${selectedDenom}.jpg`;
    const mockFile = new File([''], name, { type: 'image/jpeg' });
    setSelectedFile(mockFile);
    
    // Set a generic UI block as background preview
    setPreviewUrl(type === 'genuine' ? 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=400&q=80' : 'https://images.unsplash.com/photo-1601597111158-2fceff270190?w=400&q=80');
    setResult(null);
  };

  const handleVerify = async () => {
    if (!selectedFile) return;
    try {
      setVerifying(true);
      const formData = new FormData();
      formData.append('file', selectedFile);
      
      const res = await verifyNote(formData);
      setResult(res.data);
    } catch (err) {
      console.error('Error scanning paper note:', err);
    } finally {
      setVerifying(false);
    }
  };

  const getVerdictBanner = (verdict: string) => {
    switch (verdict.toUpperCase()) {
      case 'GENUINE':
        return 'bg-green-950/60 text-green-400 border border-green-500/40';
      case 'SUSPECT':
        return 'bg-amber-950/60 text-amber-400 border border-amber-500/40';
      case 'COUNTERFEIT':
        return 'bg-red-950/60 text-red-400 border border-red-500/40 animate-pulse-red';
      default:
        return 'bg-gray-900 text-gray-400 border border-gray-700';
    }
  };

  const renderCheckIcon = (status: string) => {
    if (status === 'PASS') return <CheckCircle className="w-4.5 h-4.5 text-success shrink-0" />;
    if (status === 'FAIL') return <XCircle className="w-4.5 h-4.5 text-danger shrink-0" />;
    return <AlertTriangle className="w-4.5 h-4.5 text-warning shrink-0" />;
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column (55% wide) — Scans */}
        <div className="lg:col-span-7 space-y-6">
          <div className="card-glass space-y-4">
            <h3 className="text-sm font-bold font-mono text-text-primary uppercase tracking-wider border-b border-border-custom pb-3 flex items-center gap-1.5">
              <Landmark className="w-4 h-4 text-accent-blue" />
              Counterfeit Currency Scanner (FICN OCR+CV)
            </h3>

            {/* Selector Denomination */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-mono text-text-secondary pr-2">Denomination:</span>
              {[100, 200, 500, 2000].map((d) => (
                <button
                  key={d}
                  onClick={() => {
                    setSelectedDenom(d);
                    setSelectedFile(null);
                    setPreviewUrl(null);
                    setResult(null);
                  }}
                  className={`px-3 py-1 text-xs font-mono font-bold rounded transition-colors ${
                    selectedDenom === d
                      ? 'bg-accent-blue text-text-primary'
                      : 'bg-bg-primary text-text-secondary hover:text-text-primary'
                  }`}
                >
                  ₹{d}
                </button>
              ))}
            </div>

            {/* Drop Container Zone */}
            <div className="border-2 border-dashed border-border-custom hover:border-accent-blue/40 rounded-2xl h-52 flex flex-col items-center justify-center p-4 relative group transition-all">
              {previewUrl ? (
                <div className="w-full h-full relative flex items-center justify-center">
                  <img
                    src={previewUrl}
                    alt="Scan Preview"
                    className="max-h-full max-w-full rounded-lg object-contain shadow-md"
                  />
                  {verifying && (
                    <div className="absolute inset-0 bg-bg-primary/70 rounded-lg flex flex-col items-center justify-center overflow-hidden">
                      {/* Scanning vertical line animation */}
                      <div className="w-full h-1 bg-accent-blue absolute animate-scanning top-0 shadow-lg shadow-accent-blue" />
                      <span className="text-xs font-mono text-text-primary font-bold">Scanning security coordinates...</span>
                    </div>
                  )}
                  <button
                    onClick={() => {
                      setSelectedFile(null);
                      setPreviewUrl(null);
                      setResult(null);
                    }}
                    className="absolute top-2 right-2 bg-bg-surface border border-border-custom rounded-full p-1 text-text-secondary hover:text-text-primary transition"
                  >
                    <XCircle className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <label className="cursor-pointer flex flex-col items-center space-y-2 text-center select-none w-full h-full justify-center">
                  <Upload className="w-8 h-8 text-text-secondary group-hover:text-accent-blue transition-colors" />
                  <span className="text-xs font-bold text-text-primary">Drag & drop note image here</span>
                  <span className="text-[10px] text-text-secondary font-mono">JPG, PNG, WEBP supported</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </label>
              )}
            </div>

            {/* Demo buttons and CTA */}
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center space-x-2 text-[10px] font-mono">
                <span className="text-text-secondary">Simulate Demo note:</span>
                <button
                  onClick={() => handleSimulateSample('genuine')}
                  className="px-2 py-1 bg-green-950/20 text-green-400 border border-green-500/20 rounded hover:border-green-500/50 transition"
                >
                  Genuine ₹{selectedDenom}
                </button>
                <button
                  onClick={() => handleSimulateSample('fake')}
                  className="px-2 py-1 bg-red-950/20 text-red-400 border border-red-500/20 rounded hover:border-red-500/50 transition"
                >
                  Fake ₹{selectedDenom}
                </button>
              </div>

              <button
                onClick={handleVerify}
                disabled={verifying || !selectedFile}
                className="px-6 py-2 bg-accent-blue text-text-primary hover:bg-accent-blue-hover text-xs font-bold rounded-lg transition-all disabled:opacity-50 cursor-pointer"
              >
                {verifying ? 'Analyzing...' : 'Verify Note'}
              </button>
            </div>

            {/* Verification output grid */}
            {result && (
              <div className="space-y-4 animate-fade-in pt-4 border-t border-border-custom">
                {/* Verdict Banner */}
                <div className={`p-4 rounded-xl text-center font-bold tracking-wide flex flex-col items-center justify-center ${getVerdictBanner(result.verdict)}`}>
                  <span className="text-sm font-mono tracking-widest uppercase">Verdict</span>
                  <span className="text-xl uppercase mt-1">{result.verdict === 'GENUINE' ? '✓ GENUINE NOTE' : result.verdict === 'SUSPECT' ? '⚠ SUSPECT — Hold for Review' : '✗ COUNTERFEIT DETECTED'}</span>
                  <span className="text-xs font-mono font-medium mt-1">Confidence Score: {result.confidence}%</span>
                </div>

                {/* 2x4 Grid of Security Checks */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {Object.entries(result.checks).map(([key, check]: any) => {
                    const isFailed = check.status === 'FAIL';
                    return (
                      <div
                        key={key}
                        className={`p-3 rounded-lg border flex items-start space-x-3 transition ${
                          isFailed 
                            ? 'bg-red-950/20 border-red-500/30 border-l-4 border-l-red-500' 
                            : 'bg-bg-primary border-border-custom'
                        }`}
                      >
                        {renderCheckIcon(check.status)}
                        <div className="space-y-1">
                          <span className="text-[11px] font-bold text-text-primary capitalize">
                            {key.replace(/_/g, ' ')}
                          </span>
                          <p className="text-[10px] text-text-secondary font-mono leading-relaxed">
                            {check.description}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Recommendation box */}
                <div className="bg-bg-primary/50 border border-border-custom rounded-xl p-4 flex justify-between items-center text-xs font-mono">
                  <div className="space-y-1">
                    <span className="text-[9px] text-text-secondary uppercase">Recommended Teller Action</span>
                    <p className="text-text-primary font-bold">{result.action}</p>
                  </div>
                  
                  <button 
                    onClick={() => window.print()}
                    className="px-3 py-1.5 bg-bg-surface hover:bg-bg-surface-hover border border-border-custom rounded text-[11px] font-bold text-text-primary transition flex items-center gap-1"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    Print Seizure Report
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column (45% wide) — Stats & Acc Guides */}
        <div className="lg:col-span-5 space-y-6">
          {/* Seizures double BarChart */}
          <div className="card-glass space-y-4">
            <h3 className="text-sm font-bold font-mono text-text-primary uppercase tracking-wider border-b border-border-custom pb-3">
              FICN Seizures by Denomination (RBI Annual Reports)
            </h3>
            <div className="h-[180px] w-full">
              {stats.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stats}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                    <XAxis dataKey="denomination" stroke="#9CA3AF" tick={{ fontSize: 9, fontFamily: 'monospace' }} />
                    <YAxis stroke="#9CA3AF" tick={{ fontSize: 9, fontFamily: 'monospace' }} />
                    <Tooltip contentStyle={{ backgroundColor: '#111827', borderColor: 'rgba(255,255,255,0.08)' }} />
                    <Legend wrapperStyle={{ fontSize: 10, fontFamily: 'monospace' }} />
                    <Bar dataKey="count_2022" name="RBI 2022" fill="#1F2937" />
                    <Bar dataKey="count_2023" name="RBI 2023" fill="#F59E0B" />
                    <Bar dataKey="count_2024" name="RBI 2024" fill="#3B82F6" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <span className="text-xs text-text-secondary">Loading statistics...</span>
              )}
            </div>
          </div>

          {/* VYUH vs Manual Line chart */}
          <div className="card-glass space-y-4">
            <h3 className="text-sm font-bold font-mono text-text-primary uppercase tracking-wider border-b border-border-custom pb-3">
              Detection Rate Comparison (VYUH vs Manual)
            </h3>
            <div className="h-[180px] w-full">
              {trends.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={trends}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                    <XAxis dataKey="month" stroke="#9CA3AF" tick={{ fontSize: 9, fontFamily: 'monospace' }} />
                    <YAxis stroke="#9CA3AF" tick={{ fontSize: 9, fontFamily: 'monospace' }} />
                    <Tooltip contentStyle={{ backgroundColor: '#111827', borderColor: 'rgba(255,255,255,0.08)' }} />
                    <Legend wrapperStyle={{ fontSize: 10, fontFamily: 'monospace' }} />
                    <Line type="monotone" dataKey="detected_manual" name="Manual Tellers" stroke="#9CA3AF" strokeDasharray="5 5" strokeWidth={1.5} />
                    <Line type="monotone" dataKey="detected_vyuh" name="VYUH CV System" stroke="#3B82F6" strokeWidth={2} activeDot={{ r: 6 }} />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <span className="text-xs text-text-secondary">Loading trendlines...</span>
              )}
            </div>
          </div>

          {/* Security Features Guide accordion */}
          <div className="card-glass space-y-4">
            <h3 className="text-sm font-bold font-mono text-text-primary uppercase tracking-wider border-b border-border-custom pb-3">
              RBI Note Security Specifications Guide (₹{selectedDenom})
            </h3>
            <div className="space-y-2">
              {features.map((feat) => {
                const isExpanded = expandedFeatureId === feat.id;
                return (
                  <div
                    key={feat.id}
                    onClick={() => setExpandedFeatureId(isExpanded ? null : feat.id)}
                    className="bg-bg-primary hover:bg-bg-surface-hover border border-border-custom rounded-lg p-3.5 cursor-pointer transition flex flex-col"
                  >
                    <div className="flex justify-between items-center text-xs font-mono">
                      <span className="font-bold text-text-primary">{feat.name}</span>
                      <span className="text-[10px] text-accent-blue font-bold">Details &rarr;</span>
                    </div>

                    {isExpanded && (
                      <p className="text-[11px] text-text-secondary font-mono leading-relaxed mt-2 pt-2 border-t border-border-custom animate-fade-in">
                        {feat.desc}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default CurrencyVerifier;
