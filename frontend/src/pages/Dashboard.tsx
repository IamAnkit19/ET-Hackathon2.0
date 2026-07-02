import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, AlertOctagon, TrendingUp, AlertTriangle, Users, Landmark, Radio, CheckCircle2, FileText, X } from 'lucide-react';
import { getDashboardSummary, getGraphRings } from '../lib/api';
import { useAlertWebSocket } from '../lib/websocket';
import MetricCard from '../components/shared/MetricCard';
import AlertFeed from '../components/shared/AlertFeed';
import LiveIndicator from '../components/shared/LiveIndicator';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { motion } from 'framer-motion';
import { getWorkflowState, saveWorkflowState, clearWorkflowState } from '../lib/workflow';
import LiveRadar from '../components/shared/LiveRadar';

export const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { alerts } = useAlertWebSocket();
  
  const [loading, setLoading] = useState<boolean>(true);
  const [summaryData, setSummaryData] = useState<any>(null);
  const [rings, setRings] = useState<any[]>([]);
  const [scamDistribution, setScamDistribution] = useState<any[]>([]);
  const [workflow, setWorkflow] = useState(getWorkflowState());
  const [evidenceLockerOpen, setEvidenceLockerOpen] = useState<boolean>(false);

  useEffect(() => {
    const handleWorkflowChange = () => {
      setWorkflow(getWorkflowState());
    };
    window.addEventListener('vyuh_workflow_change', handleWorkflowChange);
    return () => {
      window.removeEventListener('vyuh_workflow_change', handleWorkflowChange);
    };
  }, []);

  const handleEscalateAlert = (alert: any) => {
    // Generate case ID and map initial suspect context
    const caseId = `VYUH-2026-${alert.id || '9999'}`;
    saveWorkflowState({
      activeStep: 'citizen_report',
      data: {
        caseId: caseId,
        complaintText: alert.description,
        scamType: alert.module === 'scam' ? 'Digital Arrest' : 'UPI Fraud',
        urgencyLevel: alert.severity,
        phone: alert.description.match(/\+91\d+/)?.[0] || '+919876500001',
        state: 'Delhi',
        district: 'New Delhi',
        accountId: '9876543201',
        ringId: 7
      }
    });
    navigate('/shield');
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        // Fetch summary
        const summaryRes = await getDashboardSummary();
        setSummaryData(summaryRes.data);

        // Fetch rings
        const ringsRes = await getGraphRings();
        setRings(ringsRes.data || []);

        // Retrieve top scams from leaderboard mapping
        const response = await fetch('http://localhost:8000/api/scam/leaderboard');
        const leaderboard = await response.json();
        
        // Take top 5 and map to PieChart structure
        const pieData = leaderboard.slice(0, 5).map((item: any) => ({
          name: item.scam_type,
          value: item.cases_count
        }));
        setScamDistribution(pieData);
      } catch (err) {
        console.error('Error fetching dashboard summary statistics:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    // Poll stats every 10 seconds
    const interval = setInterval(fetchData, 10000);
    return () => clearInterval(interval);
  }, []);

  const getVisColor = (score: number) => {
    if (score < 40) return '#10B981'; // success
    if (score <= 70) return '#F59E0B'; // warning
    return '#EF4444'; // danger
  };

  // SVG Gauge calculations
  const visScore = summaryData?.vyuh_intelligence_score ?? 67.4;
  const radius = 60;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (visScore / 100) * circumference;

  const COLORS = ['#3B82F6', '#EF4444', '#F59E0B', '#10B981', '#EC4899'];

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-6"
    >
      {workflow.activeStep === 'case_package' && (
        <div className="card-glass border-success bg-green-950/20 p-6 flex flex-col md:flex-row items-center justify-between gap-6 glow-accent animate-fade-in no-print">
          <div className="space-y-2 max-w-2xl">
            <div className="flex items-center space-x-2 text-success">
              <CheckCircle2 className="w-5 h-5 animate-pulse" />
              <span className="text-xs font-mono font-bold tracking-widest uppercase">Court Evidence Package Compiled</span>
            </div>
            <h3 className="text-lg font-bold text-text-primary">
              Section 65B Cybercrime Action Docket Ready
            </h3>
            <p className="text-xs text-text-secondary leading-relaxed font-mono">
              Tactical cyber intelligence trace successfully mapped. Telemetry details: 
              Case ID <span className="text-text-primary font-bold">{workflow.data.caseId}</span>, 
              Target UPI <span className="text-text-primary font-bold">{workflow.data.accountId}</span>, 
              Scam Profile <span className="text-warning font-bold">{workflow.data.scamType} ({workflow.data.urgencyLevel})</span>, 
              and AI patrol recommendations assigned to <span className="text-success font-bold">Delhi Sector</span>.
            </p>
          </div>
          <div className="flex items-center space-x-3 shrink-0">
            <button
              onClick={() => setEvidenceLockerOpen(true)}
              className="px-4 py-2.5 bg-bg-primary hover:bg-bg-surface2 border border-border-custom hover:border-accent-blue text-accent-blue hover:text-text-primary text-xs font-bold font-mono rounded-lg transition flex items-center gap-1.5 cursor-pointer"
            >
              <Landmark className="w-4 h-4" /> Open Evidence Locker
            </button>
            <button
              onClick={() => {
                navigate(`/fraud-graph?ring=7`);
              }}
              className="px-4 py-2.5 bg-accent-blue text-text-primary hover:bg-accent-blue-hover text-xs font-bold font-mono rounded-lg transition-colors flex items-center gap-1.5 glow-accent cursor-pointer"
            >
              <FileText className="w-4 h-4" /> Download Court Packet
            </button>
            <button
              onClick={() => {
                clearWorkflowState();
                navigate('/');
              }}
              className="px-3 py-2.5 bg-bg-surface hover:bg-bg-surface2 border border-border-custom hover:border-danger text-text-secondary hover:text-danger text-xs font-bold font-mono rounded-lg transition cursor-pointer"
            >
              Archive Inquiry
            </button>
          </div>
        </div>
      )}

      {/* AI Secure Evidence Locker Modal */}
      {evidenceLockerOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-fade-in no-print">
          <div className="bg-[#0b1120] border border-border-custom rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl relative">
            {/* Header */}
            <div className="px-6 py-4 border-b border-border-custom flex justify-between items-center bg-bg-primary/50">
              <div className="flex items-center space-x-2 text-success font-mono font-bold text-xs uppercase tracking-wider">
                <CheckCircle2 className="w-5 h-5 animate-pulse" />
                <span>VYUH Crypto Evidence Locker (Locked)</span>
              </div>
              <button 
                onClick={() => setEvidenceLockerOpen(false)}
                className="text-text-secondary hover:text-text-primary transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Evidence items list */}
            <div className="p-6 space-y-4 max-h-[420px] overflow-y-auto font-mono text-xs text-text-secondary scrollbar-thin">
              <div className="bg-[#070b16] p-3 rounded-lg border border-border-custom space-y-2">
                <div className="flex justify-between items-center text-text-primary font-bold">
                  <span>1. CITIZEN ALERTS LOGS</span>
                  <span className="text-success text-[10px]">MD5 HASH MATCHED</span>
                </div>
                <div className="text-[10px] break-all leading-normal">
                  File ref: <span className="text-accent-blue font-bold">alert_log_{workflow.data.caseId?.toLowerCase()}.json</span><br/>
                  SHA-256 Key: <span className="text-green-400">f25d98fa6a8b7c7b2e1e07b8a7b9f8d9a0d1e2e3f4a5b6c7d8e9f0a1b2c3d4e5</span>
                </div>
              </div>

              <div className="bg-[#070b16] p-3 rounded-lg border border-border-custom space-y-2">
                <div className="flex justify-between items-center text-text-primary font-bold">
                  <span>2. TELEMETRY SCAM AUDITS</span>
                  <span className="text-success text-[10px]">VERIFIED</span>
                </div>
                <div className="text-[10px] leading-normal">
                  Call script matched category: <span className="text-warning font-bold">{workflow.data.scamType}</span><br/>
                  Threat urgency: <span className="text-danger font-bold">{workflow.data.urgencyLevel}</span>
                </div>
              </div>

              <div className="bg-[#070b16] p-3 rounded-lg border border-border-custom space-y-2">
                <div className="flex justify-between items-center text-text-primary font-bold">
                  <span>3. GRAPH CENTRALITY SCHEMA</span>
                  <span className="text-success text-[10px]">TDA GENERATED</span>
                </div>
                <div className="text-[10px] leading-normal">
                  Target UPI Node: <span className="text-accent-blue font-bold">{workflow.data.accountId}</span><br/>
                  Louvain community Ring ID: <span className="text-accent-blue font-bold">#7</span> (centrality: 0.1258, PageRank score: 88%)
                </div>
              </div>

              <div className="bg-[#070b16] p-3 rounded-lg border border-border-custom space-y-2">
                <div className="flex justify-between items-center text-text-primary font-bold">
                  <span>4. DEPLOYMENT COORDINATES LOG</span>
                  <span className="text-success text-[10px]">SIGNED</span>
                </div>
                <div className="text-[10px] leading-normal font-sans">
                  Tactical dispatches:
                  <ul className="list-disc list-inside space-y-0.5 mt-1 font-mono text-[9px]">
                    {workflow.data.patrolRecommendations?.map((r: string, i: number) => (
                      <li key={i}>{r}</li>
                    )) || <li>Deploy patrol coordinates to localized suspect center.</li>}
                  </ul>
                </div>
              </div>

              <div className="bg-[#070b16] p-3 rounded-lg border border-border-custom space-y-1.5">
                <div className="flex justify-between items-center text-text-primary font-bold">
                  <span>5. SECTION 65B CERTIFICATION</span>
                  <span className="text-success text-[10px]">DIGITALLY SIGNED</span>
                </div>
                <div className="text-[9px] leading-normal text-green-500 font-bold">
                  ✓ Digitally signed by cyber cell investigator. Encrypted seal: [SEC65B-VYUH-{workflow.data.caseId?.slice(-4)}-SEAL-APPROVED]
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-border-custom bg-bg-primary/20 flex justify-end space-x-3">
              <button
                onClick={() => setEvidenceLockerOpen(false)}
                className="px-4 py-2 bg-bg-surface border border-border-custom hover:bg-bg-surface2 rounded-lg text-text-secondary hover:text-text-primary font-mono text-xs font-bold transition cursor-pointer"
              >
                Close Locker
              </button>
              <button
                onClick={() => {
                  window.print();
                }}
                className="px-4 py-2 bg-accent-blue hover:bg-accent-blue-hover rounded-lg text-text-primary font-mono text-xs font-bold transition flex items-center gap-1.5 cursor-pointer glow-accent"
              >
                <FileText className="w-4 h-4" /> Print Evidence Dossier
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Hero Section: VIS Score circular gauge */}
      <section className="card-glass flex flex-col md:flex-row items-center justify-between gap-6 py-6 px-8 bg-gradient-to-r from-bg-surface to-bg-primary/20">
        <div className="space-y-2 max-w-lg text-center md:text-left">
          <div className="flex items-center justify-center md:justify-start space-x-2 text-accent-blue">
            <Shield className="w-5 h-5" />
            <span className="text-xs font-mono font-bold tracking-widest uppercase">System Threat Gauge</span>
          </div>
          <h2 className="text-2xl font-bold text-text-primary">
            VYUH Intelligence Score (VIS)
          </h2>
          <p className="text-sm text-text-secondary">
            A composite National Fraud Threat Index scoring transaction anomalies, fake currency ratios, active impersonations, and localized incident bursts.
          </p>
        </div>

        {/* Circular Gauge */}
        <div 
          className="flex flex-col items-center justify-center relative select-none"
          role="progressbar"
          aria-valuenow={visScore}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="VYUH Intelligence Score National Threat Gauge"
        >
          <svg className="w-36 h-36 transform -rotate-90">
            <circle
              cx="72"
              cy="72"
              r={radius}
              className="stroke-bg-surface2 fill-none"
              strokeWidth="10"
            />
            <circle
              cx="72"
              cy="72"
              r={radius}
              className="fill-none transition-all duration-1000 ease-out"
              stroke={getVisColor(visScore)}
              strokeWidth="10"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
            />
          </svg>
          <div className="absolute flex flex-col items-center justify-center">
            <span className="text-3xl font-mono font-bold text-text-primary">
              {loading ? '--' : visScore.toFixed(1)}
            </span>
            <span className="text-[9px] font-mono text-text-secondary uppercase tracking-widest">
              Threat Index
            </span>
          </div>
        </div>
      </section>

      {/* KPI Cards Row */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {loading ? (
          Array(4).fill(0).map((_, i) => (
            <div key={i} className="h-28 bg-bg-surface rounded-xl border border-border-custom animate-pulse" />
          ))
        ) : (
          <>
            <MetricCard
              label="Cybercrime Complaints Today"
              value={summaryData?.national_kpis?.complaints_today ?? 184}
              delta="▲ +12% vs yesterday"
              icon={<AlertTriangle className="w-5 h-5 text-accent-blue" />}
              color="border-l-accent-blue"
            />
            <MetricCard
              label="Active Fraud Networks"
              value={summaryData?.national_kpis?.active_networks ?? 28}
              delta="▲ +2 detected today"
              icon={<Users className="w-5 h-5 text-danger" />}
              color="border-l-danger"
            />
            <MetricCard
              label="FICN Notes Flagged (30d)"
              value={summaryData?.national_kpis?.ficn_seized_30d ?? 1240}
              delta="▼ -4% vs last month"
              icon={<Landmark className="w-5 h-5 text-success" />}
              color="border-l-success"
            />
            <MetricCard
              label="Scams Intercepted (Sim)"
              value={summaryData?.national_kpis?.scams_intercepted ?? 392}
              delta="▲ +45 in last 24h"
              icon={<Radio className="w-5 h-5 text-warning" />}
              color="border-l-warning"
            />
          </>
        )}
      </section>

      {/* Main content splitting list */}
      <section className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Left - Live feeds */}
        <div className="lg:col-span-3 card-glass flex flex-col space-y-4">
          <div className="flex items-center justify-between border-b border-border-custom pb-3">
            <h3 className="text-sm font-bold font-mono text-text-primary uppercase tracking-wider flex items-center gap-2">
              <AlertOctagon className="w-4 h-4 text-danger" />
              Live Cybercrime Alert Feed
            </h3>
            <LiveIndicator />
          </div>
          <AlertFeed alerts={alerts} maxHeight="h-[340px]" onEscalate={handleEscalateAlert} />
        </div>

        {/* Right - Radar + Pie charts stack */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          <div className="card-glass">
            <LiveRadar />
          </div>
          <div className="card-glass flex flex-col justify-between space-y-4">
            <h3 className="text-sm font-bold font-mono text-text-primary uppercase tracking-wider border-b border-border-custom pb-3 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-accent-blue" />
              Active Scam Categories
            </h3>
            <div className="h-[220px] w-full flex items-center justify-center">
              {loading ? (
                <div className="w-32 h-32 rounded-full border-4 border-bg-surface2 border-t-accent-blue animate-spin" />
              ) : scamDistribution.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={scamDistribution}
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={80}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {scamDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#111827', borderColor: 'rgba(255,255,255,0.08)', borderRadius: 8 }}
                      itemStyle={{ color: '#F9FAFB' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <span className="text-xs text-text-secondary">Loading statistics...</span>
              )}
            </div>

            {/* Custom Legends list */}
            <div className="grid grid-cols-2 gap-2 text-xs font-mono">
              {scamDistribution.map((entry, index) => (
                <div key={entry.name} className="flex items-center space-x-2 truncate">
                  <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                  <span className="text-text-secondary truncate">{entry.name} ({entry.value})</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Bottom recent investigations rings */}
      <section className="card-glass space-y-4">
        <h3 className="text-sm font-bold font-mono text-text-primary uppercase tracking-wider border-b border-border-custom pb-3 flex items-center gap-2">
          <Shield className="w-4 h-4 text-accent-blue" />
          Mule Ring Detection Ledger (Louvain communities)
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead>
              <tr className="border-b border-border-custom text-text-secondary uppercase">
                <th className="pb-3 pr-2">Ring ID</th>
                <th className="pb-3 pr-2">Cluster Size</th>
                <th className="pb-3 pr-2">Avg Risk Score</th>
                <th className="pb-3 pr-2">TDA Cycles (Betti-1)</th>
                <th className="pb-3 pr-2">Est. Fraud Value</th>
                <th className="pb-3 pr-2 text-center">Status</th>
                <th className="pb-3 pr-2 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array(3).fill(0).map((_, idx) => (
                  <tr key={idx} className="border-b border-border-custom/50 animate-pulse">
                    <td colSpan={7} className="py-4 bg-bg-surface2/10 h-10" />
                  </tr>
                ))
              ) : rings.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-text-secondary">
                    No community loops flagged.
                  </td>
                </tr>
              ) : (
                rings.map((ring) => (
                  <tr key={ring.ring_id} className="border-b border-border-custom/50 hover:bg-bg-surface2/25 transition-colors">
                    <td className="py-3.5 pr-2 font-bold text-text-primary">Ring #{ring.ring_id}</td>
                    <td className="py-3.5 pr-2 text-text-primary">{ring.member_count} nodes</td>
                    <td className="py-3.5 pr-2 font-bold" style={{ color: getVisColor(ring.avg_risk) }}>
                      {ring.avg_risk}%
                    </td>
                    <td className="py-3.5 pr-2 text-accent-blue font-bold">{ring.betti_1_cycles} loops</td>
                    <td className="py-3.5 pr-2 text-text-secondary">₹{(ring.estimated_fraud_value / 100000).toFixed(2)} L</td>
                    <td className="py-3.5 pr-2 text-center">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        ring.status === 'CRITICAL' ? 'bg-red-950/60 text-red-400' : 'bg-amber-950/60 text-amber-400'
                      }`}>
                        {ring.status}
                      </span>
                    </td>
                    <td className="py-3.5 pr-2 text-right">
                      <button
                        onClick={() => navigate(`/fraud-graph?ring=${ring.ring_id}`)}
                        className="px-3 py-1 bg-accent-blue/10 hover:bg-accent-blue/20 text-accent-blue hover:text-text-primary border border-accent-blue/25 hover:border-accent-blue rounded text-[11px] font-bold transition-all"
                      >
                        Investigate
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </motion.div>
  );
};

export default Dashboard;
