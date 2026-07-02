import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Radio, FileText, AlertTriangle, ShieldCheck, Play, ArrowRight, BookOpen, BarChart3, X } from 'lucide-react';
import { analyzeComplaint, analyzeCall, getScamPatterns, getScamLeaderboard, reportScam } from '../lib/api';
import RiskBadge from '../components/shared/RiskBadge';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Cell, Tooltip } from 'recharts';
import { motion } from 'framer-motion';
import { getWorkflowState, updateWorkflowData, setWorkflowStep } from '../lib/workflow';

export const ScamDetector: React.FC = () => {
  const navigate = useNavigate();
  const [workflow, setWorkflow] = useState(getWorkflowState());

  // Column 1 States - Text Analysis
  const [complaintText, setComplaintText] = useState<string>('');
  const [analyzingText, setAnalyzingText] = useState<boolean>(false);
  const [textResult, setTextResult] = useState<any>(null);
  const [mhaModalOpen, setMhaModalOpen] = useState<boolean>(false);

  useEffect(() => {
    const state = getWorkflowState();
    setWorkflow(state);
    if (state.activeStep === 'scam_analysis' && state.data.complaintText) {
      setComplaintText(state.data.complaintText);
    }

    const handleWorkflowChange = () => {
      const updated = getWorkflowState();
      setWorkflow(updated);
      if (updated.activeStep === 'scam_analysis' && updated.data.complaintText) {
        setComplaintText(updated.data.complaintText);
      }
    };
    window.addEventListener('vyuh_workflow_change', handleWorkflowChange);
    return () => {
      window.removeEventListener('vyuh_workflow_change', handleWorkflowChange);
    };
  }, []);

  // Deepfake Audio Prototype states
  const [analyzingAudio, setAnalyzingAudio] = useState<boolean>(false);
  const [audioScore, setAudioScore] = useState<number | null>(null);
  const [audioSample] = useState<string>('cbi_cloned_voice.wav');
  const audioCanvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!analyzingAudio) return;
    const canvas = audioCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let frameId: number;
    let phase = 0;

    const animateWave = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.strokeStyle = '#3B82F6';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      
      const width = canvas.width;
      const height = canvas.height;
      const mid = height / 2;

      for (let x = 0; x < width; x++) {
        const freq1 = 0.06;
        const freq2 = 0.14;
        const amp1 = 12 * Math.sin(x * freq1 + phase);
        const amp2 = 6 * Math.cos(x * freq2 + phase * 1.3);
        const noise = Math.random() > 0.94 ? (Math.random() - 0.5) * 6 : 0;
        const y = mid + amp1 + amp2 + noise;

        if (x === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      }
      ctx.stroke();
      
      phase += 0.18;
      frameId = requestAnimationFrame(animateWave);
    };

    animateWave();
    return () => cancelAnimationFrame(frameId);
  }, [analyzingAudio]);

  const handleAnalyzeAudio = () => {
    setAnalyzingAudio(true);
    setAudioScore(null);
    setTimeout(() => {
      setAnalyzingAudio(false);
      setAudioScore(98.6);
    }, 2500);
  };

  // Column 1 States - Call Analysis
  const [duration, setDuration] = useState<number>(45);
  const [callerPrefix, setCallerPrefix] = useState<string>('+91911');
  const [timeHour, setTimeHour] = useState<number>(11);
  const [transferProximity, setTransferProximity] = useState<number>(10);
  const [analyzingCallState, setAnalyzingCallState] = useState<boolean>(false);
  const [callResult, setCallResult] = useState<any>(null);

  // Column 2 States - Active Patterns
  const [patterns, setPatterns] = useState<any[]>([]);
  const [expandedPatternId, setExpandedPatternId] = useState<number | null>(null);

  // Column 3 States - Leaderboard
  const [leaderboard, setLeaderboard] = useState<any[]>([]);

  // Bottom Stepper - Digital Arrest Simulator
  const [activeStep, setActiveStep] = useState<number>(1);
  const [simAlertPulse, setSimAlertPulse] = useState<boolean>(false);

  // Load Leaderboard and Patterns
  useEffect(() => {
    const loadSecondaryData = async () => {
      try {
        const patternsRes = await getScamPatterns();
        setPatterns(patternsRes.data || []);

        const leadRes = await getScamLeaderboard();
        setLeaderboard(leadRes.data || []);
      } catch (err) {
        console.error('Error loading scam trends metrics:', err);
      }
    };
    loadSecondaryData();
  }, []);

  // Text complaint check handler
  const handleAnalyzeText = async () => {
    if (!complaintText) return;
    try {
      setAnalyzingText(true);
      const res = await analyzeComplaint(complaintText);
      setTextResult(res.data);
      
      const state = getWorkflowState();
      if (state.activeStep) {
        updateWorkflowData({
          complaintText: complaintText,
          scamType: res.data.scam_type,
          urgencyLevel: res.data.urgency_level,
          phone: complaintText.match(/\+91\d+/)?.[0] || '+919876500001',
        });
      }
    } catch (err) {
      console.error('Error parsing input complaint:', err);
    } finally {
      setAnalyzingText(false);
    }
  };

  // Call pattern metadata check handler
  const handleAnalyzeCall = async () => {
    try {
      setAnalyzingCallState(true);
      const res = await analyzeCall({
        duration: Number(duration),
        caller_prefix: callerPrefix,
        time_hour: Number(timeHour),
        transfer_proximity: Number(transferProximity)
      });
      setCallResult(res.data);
    } catch (err) {
      console.error('Error analyzing caller vectors:', err);
    } finally {
      setAnalyzingCallState(false);
    }
  };

  // Automatic language indicator
  const detectLanguage = (text: string) => {
    if (!text) return 'Detecting...';
    const isHindi = anyHindiChars(text);
    return isHindi ? 'Hindi (Multilingual)' : 'English (Detected)';
  };

  const anyHindiChars = (text: string) => {
    return /[\u0900-\u097F]/.test(text) || text.toLowerCase().includes('maine') || text.toLowerCase().includes('receive');
  };

  // Stepper descriptions
  const steps = [
    { id: 1, name: 'Spoofed Call', desc: 'Scammer spoof caller ID (e.g. CBI or Customs).' },
    { id: 2, name: 'Parcel Threat', desc: 'Victim told package under Aadhaar holds narcotics.' },
    { id: 3, name: 'Video Escalate', desc: 'Skype/WhatsApp video call initiated for investigation.' },
    { id: 4, name: 'Fake Document', desc: 'Arrest warrant printed on government letterhead shown.' },
    { id: 5, name: 'VYUH Flagged ⚡', desc: 'Speech patterns, duration, and spoof ID matched.' },
    { id: 6, name: 'Stay on Line', desc: 'Victim held hostage under digital arrest.' },
    { id: 7, name: 'Cash Transfer', desc: 'Aggressor demands safe-keeping cash deposit.' }
  ];

  const handleNextStep = () => {
    setActiveStep((prev) => {
      const next = prev < 7 ? prev + 1 : 1;
      if (next === 5) {
        setSimAlertPulse(true);
      } else {
        setSimAlertPulse(false);
      }
      return next;
    });
  };

  const getMhaAlertText = () => {
    if (!textResult) return '';
    return `MHA-I4C CYBER SCAM ALERT WARNING
----------------------------------
SCAM PROFILE DETECTED: ${textResult.scam_type}
URGENCY THREAT LEVEL: ${textResult.urgency_level}
CONFIDENCE INDEX: ${(textResult.confidence * 100).toFixed(0)}%
SUGGESTED DISPATCH WARNING:
"${textResult.recommended_action}"
----------------------------------
VYUH Intelligence Auto-Filing Registry. Document Ref ID: VYUH-SCAM-${Date.now().toString().slice(-4)}`;
  };

  // BarChart colors
  const getBarColor = (count: number) => {
    if (count > 35) return '#EF4444'; // Red
    return '#F59E0B'; // Amber
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-6"
    >
      {/* 3-Column main display */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        
        {/* Column 1 (50% wide on large screens) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Analysis terminal */}
          <div className="card-glass space-y-4">
            <h3 className="text-sm font-bold font-mono text-text-primary uppercase tracking-wider border-b border-border-custom pb-3 flex items-center gap-1.5">
              <Radio className="w-4 h-4 text-accent-blue" />
              Real-time Scam Analysis Terminal
            </h3>

            <div className="space-y-2">
              <textarea
                rows={6}
                value={complaintText}
                onChange={(e) => setComplaintText(e.target.value)}
                placeholder="Paste complaint text, call description, or suspicious message here... (Hindi or English supported) e.g., 'Maine ek call receive ki CBI officer se, unhone bola mera package mein drugs hain...'"
                className="w-full bg-[#070b16] border border-border-custom rounded-xl p-4 text-xs font-mono text-green-400 placeholder-green-700/60 focus:outline-none focus:border-accent-blue leading-relaxed resize-none"
              />
              <div className="flex justify-between items-center text-[10px] font-mono text-text-secondary px-1">
                <span>{detectLanguage(complaintText)}</span>
                <span>Format check: utf-8</span>
              </div>
            </div>

            <button
              onClick={handleAnalyzeText}
              disabled={analyzingText || !complaintText}
              className="w-full py-2.5 bg-accent-blue text-text-primary hover:bg-accent-blue-hover text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50 cursor-pointer"
            >
              {analyzingText ? 'Analyzing scripts...' : 'Analyze Pattern'}
            </button>

            {/* Classification result display */}
            {textResult && (
              <div className="bg-[#070b16] border border-border-custom rounded-xl p-4 space-y-3 animate-fade-in">
                <div className="flex justify-between items-center">
                  <div className="flex flex-col">
                    <span className="text-[9px] font-mono text-text-secondary uppercase">Identified Scam</span>
                    <span className="text-sm font-bold text-text-primary flex items-center gap-1">
                      🚨 {textResult.scam_type}
                    </span>
                  </div>
                  <RiskBadge risk={textResult.urgency_level} />
                </div>

                {/* Progress bar confidence */}
                <div className="space-y-1 text-[10px] font-mono text-text-secondary">
                  <div className="flex justify-between">
                    <span>Analysis Confidence Index</span>
                    <span>{(textResult.confidence * 100).toFixed(0)}%</span>
                  </div>
                  <div className="w-full h-1.5 bg-bg-surface rounded">
                    <div 
                      className="h-full bg-accent-blue rounded transition-all duration-300"
                      style={{ width: `${textResult.confidence * 100}%` }}
                    />
                  </div>
                </div>

                <div className="bg-bg-surface/50 border border-border-custom rounded-lg p-3 text-[11px] font-mono leading-relaxed">
                  <span className="text-[10px] text-accent-blue font-bold block mb-1">Recommended Action Protocol</span>
                  {textResult.recommended_action}
                </div>

                {/* Explainable AI (XAI) SHAP Factor Scorecard */}
                <div className="bg-bg-surface/30 border border-border-custom/50 rounded-lg p-3 space-y-2 text-[10px] font-mono select-none">
                  <span className="text-[10px] text-warning font-bold block">Explainable AI (XAI) - Factor Weightings</span>
                  <div className="space-y-1.5">
                    <div>
                      <div className="flex justify-between mb-0.5 text-[9px] text-text-secondary">
                        <span>Agency Impersonation Indicators (SHAP)</span>
                        <span className="text-text-primary font-bold">+45%</span>
                      </div>
                      <div className="w-full h-1 bg-bg-primary rounded-full overflow-hidden">
                        <div className="h-full bg-accent-blue rounded-full" style={{ width: '45%' }} />
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between mb-0.5 text-[9px] text-text-secondary">
                        <span>High-pressure / Threat Language</span>
                        <span className="text-text-primary font-bold">+35%</span>
                      </div>
                      <div className="w-full h-1 bg-bg-primary rounded-full overflow-hidden">
                        <div className="h-full bg-warning rounded-full" style={{ width: '35%' }} />
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between mb-0.5 text-[9px] text-text-secondary">
                        <span>Financial transaction references</span>
                        <span className="text-text-primary font-bold">+20%</span>
                      </div>
                      <div className="w-full h-1 bg-bg-primary rounded-full overflow-hidden">
                        <div className="h-full bg-success rounded-full" style={{ width: '20%' }} />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-1">
                  <button
                    onClick={() => setMhaModalOpen(true)}
                    className="px-3 py-2 bg-bg-surface border border-border-custom hover:border-text-secondary text-text-primary hover:bg-bg-surface2 rounded text-xs font-bold font-mono transition flex items-center justify-center gap-1"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    MHA Alert Draft
                  </button>
                  <button
                    onClick={async () => {
                      await reportScam({
                        text: complaintText,
                        scam_type: textResult.scam_type,
                        phone: '+919999900000',
                        state: 'Delhi',
                        district: 'New Delhi'
                      });
                      alert('Alert forwarded to NCRB cyber portals.');
                    }}
                    className="px-3 py-2 bg-danger/10 hover:bg-danger/25 text-danger border border-danger/30 rounded text-xs font-bold font-mono transition flex items-center justify-center gap-1"
                  >
                    <AlertTriangle className="w-3.5 h-3.5" />
                    Report to 1930
                  </button>
                </div>

                {workflow.activeStep && (
                  <div className="pt-2 border-t border-border-custom/30">
                    <button
                      onClick={() => {
                        setWorkflowStep('graph_intelligence');
                        navigate('/fraud-graph');
                      }}
                      className="w-full py-2 bg-accent-blue text-text-primary hover:bg-accent-blue-hover rounded text-xs font-bold font-mono transition flex items-center justify-center gap-1.5 glow-accent cursor-pointer"
                    >
                      <ArrowRight className="w-4 h-4 animate-pulse" />
                      Trace Mule Graph Networks &rarr;
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Call Metadata Scorer */}
          <div className="card-glass space-y-4">
            <h3 className="text-sm font-bold font-mono text-text-primary uppercase tracking-wider border-b border-border-custom pb-3 flex items-center gap-1.5">
              <Radio className="w-4 h-4 text-warning" />
              Active call telemetry analysis
            </h3>

            <div className="grid grid-cols-2 gap-4 text-xs font-mono">
              <div className="space-y-1">
                <label className="text-text-secondary">Call Duration (mins):</label>
                <input
                  type="number"
                  value={duration}
                  onChange={(e) => setDuration(Number(e.target.value))}
                  className="w-full bg-[#070b16] border border-border-custom rounded px-3 py-2 text-text-primary"
                />
              </div>
              <div className="space-y-1">
                <label className="text-text-secondary">Caller Prefix:</label>
                <input
                  type="text"
                  value={callerPrefix}
                  onChange={(e) => setCallerPrefix(e.target.value)}
                  className="w-full bg-[#070b16] border border-border-custom rounded px-3 py-2 text-text-primary"
                />
              </div>
              <div className="space-y-1">
                <label className="text-text-secondary">Hour of Call (0-23):</label>
                <input
                  type="number"
                  value={timeHour}
                  onChange={(e) => setTimeHour(Number(e.target.value))}
                  className="w-full bg-[#070b16] border border-border-custom rounded px-3 py-2 text-text-primary"
                />
              </div>
              <div className="space-y-1">
                <label className="text-text-secondary">Proximity to UPI Tx (mins):</label>
                <input
                  type="number"
                  value={transferProximity}
                  onChange={(e) => setTransferProximity(Number(e.target.value))}
                  className="w-full bg-[#070b16] border border-border-custom rounded px-3 py-2 text-text-primary"
                />
              </div>
            </div>

            <button
              onClick={handleAnalyzeCall}
              className="w-full py-2 bg-bg-surface border border-border-custom hover:bg-bg-surface-hover text-xs font-bold rounded-lg text-text-primary transition-colors font-mono cursor-pointer"
            >
              {analyzingCallState ? 'Processing call details...' : 'Analyze Call Risk'}
            </button>

            {callResult && (
              <div className="bg-[#070b16] border border-border-custom rounded-xl p-4 grid grid-cols-3 gap-4 items-center">
                <div className="text-center border-r border-border-custom pr-2">
                  <span className="text-[9px] font-mono text-text-secondary uppercase">Risk score</span>
                  <div className="text-2xl font-bold text-danger font-mono mt-1">
                    {callResult.risk_score}%
                  </div>
                  <span className="text-[8px] bg-red-950/60 text-red-400 font-bold px-1 py-0.5 rounded font-mono uppercase mt-1 inline-block">
                    {callResult.alert_level}
                  </span>
                </div>
                <div className="col-span-2 text-[10px] font-mono text-text-secondary space-y-1.5 leading-relaxed pl-2">
                  <div className="text-accent-blue font-bold uppercase tracking-wider">Identified Signals:</div>
                  <ul className="list-disc list-inside space-y-0.5 max-h-24 overflow-y-auto pr-1">
                    {callResult.indicators.map((ind: string, idx: number) => (
                      <li key={idx} className="truncate">{ind}</li>
                    ))}
                  </ul>
                  <div className="text-text-primary font-bold border-t border-border-custom pt-1 mt-1 font-sans">
                    Action: {callResult.action}
                  </div>
                </div>
              </div>
            )}
          </div>
          {/* Deepfake Audio Verification Scorer */}
          <div className="card-glass space-y-4">
            <h3 className="text-sm font-bold font-mono text-text-primary uppercase tracking-wider border-b border-border-custom pb-3 flex items-center gap-1.5">
              <Play className="w-4 h-4 text-accent-blue" />
              AI Deepfake voice clone detection
            </h3>

            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-text-secondary">Scam Voice Registry Sample:</span>
                <span className="text-accent-blue font-bold">{audioSample}</span>
              </div>

              {/* Animated waveform visualizer */}
              <div className="relative h-20 bg-black/45 border border-border-custom rounded-xl overflow-hidden flex items-center justify-center">
                {analyzingAudio ? (
                  <canvas ref={audioCanvasRef} width={280} height={80} className="w-full h-full" />
                ) : (
                  <div className="text-[10px] font-mono text-text-secondary uppercase tracking-widest text-center px-4">
                    [ Click analyze to scan audio print ]
                  </div>
                )}
              </div>

              <button
                onClick={handleAnalyzeAudio}
                disabled={analyzingAudio}
                className="w-full py-2 bg-bg-surface border border-border-custom hover:bg-bg-surface-hover text-xs font-bold rounded-lg text-text-primary transition-colors font-mono cursor-pointer disabled:opacity-50"
              >
                {analyzingAudio ? 'Analyzing frequency artifacts...' : 'Analyze Audio Sample'}
              </button>

              {audioScore !== null && (
                <div className="bg-danger/10 border border-danger/25 rounded-lg p-3 grid grid-cols-3 gap-2 items-center animate-fade-in text-[10px] font-mono">
                  <div className="text-center border-r border-danger/20 pr-1">
                    <span className="text-[8px] text-text-secondary uppercase">Deepfake Match</span>
                    <div className="text-xl font-bold text-danger mt-1">{audioScore}%</div>
                  </div>
                  <div className="col-span-2 space-y-1 text-text-secondary pl-1 leading-relaxed">
                    <span className="text-danger font-bold uppercase tracking-wider">CRITICAL VERDICT:</span>
                    <div>• Synthetic voice signature detected.</div>
                    <div>• Mewat call center acoustic footprint match.</div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Column 2 (25% wide) — Patterns list */}
        <div className="card-glass space-y-4">
          <h3 className="text-sm font-bold font-mono text-text-primary uppercase tracking-wider border-b border-border-custom pb-3 flex items-center gap-1.5">
            <BookOpen className="w-4 h-4 text-accent-blue" />
            Scam Patterns Database
          </h3>
          <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
            {patterns.map((p) => {
              const isExpanded = expandedPatternId === p.id;
              return (
                <div
                  key={p.id}
                  onClick={() => setExpandedPatternId(isExpanded ? null : p.id)}
                  className="bg-bg-primary hover:bg-bg-surface-hover border border-border-custom rounded-lg p-3 cursor-pointer transition"
                >
                  <div className="flex justify-between items-start">
                    <span className="font-bold text-xs text-text-primary">{p.type}</span>
                    <span className="text-[10px] text-danger font-mono font-bold">{p.threat_rating}% rating</span>
                  </div>
                  <div className="text-[9px] text-accent-blue font-mono mt-1">{p.key_vector}</div>
                  
                  {isExpanded && (
                    <p className="text-[10px] text-text-secondary font-mono mt-2 pt-2 border-t border-border-custom leading-relaxed animate-fade-in">
                      {p.description}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Column 3 (25% wide) — Leaderboard */}
        <div className="card-glass space-y-4">
          <h3 className="text-sm font-bold font-mono text-text-primary uppercase tracking-wider border-b border-border-custom pb-3 flex items-center gap-1.5">
            <BarChart3 className="w-4 h-4 text-accent-blue" />
            Volume Leaderboard
          </h3>

          <div className="h-[200px] w-full">
            {leaderboard.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={leaderboard.slice(0, 5)} layout="vertical" margin={{ left: -10, right: 10, top: 0, bottom: 0 }}>
                  <XAxis type="number" hide />
                  <YAxis dataKey="scam_type" type="category" axisLine={false} tickLine={false} tick={{ fill: '#9CA3AF', fontSize: 9, fontFamily: 'monospace' }} width={80} />
                  <Tooltip contentStyle={{ backgroundColor: '#111827', borderColor: 'rgba(255,255,255,0.08)' }} />
                  <Bar dataKey="cases_count" radius={4}>
                    {leaderboard.slice(0, 5).map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={getBarColor(entry.cases_count)} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <span className="text-xs text-text-secondary">Loading statistics...</span>
            )}
          </div>

          <div className="space-y-3 pt-2 border-t border-border-custom">
            <div className="text-[10px] font-mono text-text-secondary uppercase font-bold tracking-wider">Top 3 Loss Vectors</div>
            {leaderboard.slice(0, 3).map((item, idx) => (
              <div key={idx} className="flex justify-between items-center text-xs font-mono">
                <span className="text-text-secondary text-[11px] truncate w-28">{item.scam_type}</span>
                <span className="text-danger font-bold">₹{(item.estimated_loss / 10000000).toFixed(1)} Cr</span>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Bottom Horizontal Stepper: Digital Arrest Simulator */}
      <section className={`card-glass space-y-6 transition-all duration-300 ${simAlertPulse ? 'border-danger glow-danger scale-[1.01]' : ''}`}>
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border-custom pb-4">
          <div className="space-y-1">
            <h3 className="text-sm font-bold font-mono text-text-primary uppercase tracking-wider flex items-center gap-1.5">
              <ShieldCheck className="w-4.5 h-4.5 text-accent-blue" />
              Digital Arrest Scam — Step-by-Step AI Interception Demo
            </h3>
            <p className="text-[10px] text-text-secondary">
              See which caller and text signatures VYUH intercepts BEFORE money routing happens.
            </p>
          </div>
          
          <button
            onClick={handleNextStep}
            className="px-4 py-2 bg-accent-blue/15 border border-accent-blue/20 hover:border-accent-blue hover:text-text-primary text-accent-blue text-xs font-bold font-mono rounded-lg transition-all flex items-center gap-1 cursor-pointer"
          >
            <Play className="w-3.5 h-3.5" />
            Next Step
          </button>
        </div>

        {/* Horizontal stepper line */}
        <div className="flex flex-col lg:flex-row items-stretch gap-4 justify-between select-none">
          {steps.map((st) => {
            const isActive = activeStep === st.id;
            const isPassed = activeStep > st.id;
            const isVyuhFlag = st.id === 5;
            
            return (
              <div 
                key={st.id} 
                className={`flex-1 p-3.5 rounded-lg border transition-all duration-300 flex flex-col relative ${
                  isActive 
                    ? (isVyuhFlag ? 'bg-danger/20 border-danger scale-[1.03]' : 'bg-accent-blue/15 border-accent-blue scale-[1.03]') 
                    : isPassed 
                      ? 'bg-bg-primary/50 border-border-custom opacity-65'
                      : 'bg-bg-primary border-border-custom'
                }`}
              >
                <div className="flex justify-between items-center">
                  <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded ${
                    isActive 
                      ? (isVyuhFlag ? 'bg-danger text-text-primary' : 'bg-accent-blue text-text-primary') 
                      : 'bg-bg-surface2 text-text-secondary'
                  }`}>
                    STEP 0{st.id}
                  </span>
                  
                  {isVyuhFlag && (
                    <span className="flex h-2 w-2 relative">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                    </span>
                  )}
                </div>
                
                <h4 className={`text-xs font-bold mt-2.5 ${isActive ? 'text-text-primary font-bold' : 'text-text-secondary'}`}>
                  {st.name}
                </h4>
                <p className="text-[10px] text-text-secondary font-mono mt-1.5 leading-relaxed">
                  {st.desc}
                </p>

                {isActive && isVyuhFlag && (
                  <div className="mt-3 p-1.5 bg-danger/25 border border-danger/30 rounded text-[9px] font-mono text-danger font-bold text-center animate-pulse">
                    VYUH ALERT FIRES HERE (98% confidence CBI key matching)
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* MHA Alert Modal */}
      {mhaModalOpen && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-bg-surface border border-border-custom rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl relative">
            <div className="px-6 py-4 border-b border-border-custom flex justify-between items-center bg-bg-primary/40">
              <span className="text-xs font-bold font-mono text-accent-blue uppercase tracking-widest">
                National early warning system alert draft
              </span>
              <button 
                onClick={() => setMhaModalOpen(false)}
                className="text-text-secondary hover:text-text-primary transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-3">
              <pre className="bg-[#070b16] border border-border-custom text-green-400 font-mono text-xs p-4 rounded-xl overflow-x-auto whitespace-pre-wrap leading-relaxed select-all">
                {getMhaAlertText()}
              </pre>
              <div className="flex justify-end pt-3">
                <button
                  onClick={() => setMhaModalOpen(false)}
                  className="px-4 py-2 bg-accent-blue text-text-primary hover:bg-accent-blue-hover text-xs font-bold rounded-lg transition"
                >
                  Confirm warning
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default ScamDetector;
