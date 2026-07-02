import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Shield, FileText, Download, Users, X, Info, Search, RefreshCw, Upload, MapPin } from 'lucide-react';
import { 
  getGraphNetwork, 
  getGraphRings, 
  getGraphNode, 
  investigateAccount, 
  getExportEvidenceUrl,
  uploadTransactionsCSV
} from '../lib/api';
import FraudNetworkGraph, { GraphNode, GraphEdge } from '../components/graph/FraudNetworkGraph';
import RiskBadge from '../components/shared/RiskBadge';
import { motion } from 'framer-motion';
import { getWorkflowState, updateWorkflowData, setWorkflowStep } from '../lib/workflow';

export const FraudGraph: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const ringParam = searchParams.get('ring');
  const [workflow, setWorkflow] = useState(getWorkflowState());

  // API State
  const [nodes, setNodes] = useState<GraphNode[]>([]);
  const [edges, setEdges] = useState<GraphEdge[]>([]);
  const [rings, setRings] = useState<any[]>([]);
  
  // Interaction State
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [selectedNodeData, setSelectedNodeData] = useState<any>(null);
  const [selectedRingId, setSelectedRingId] = useState<number | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  
  // Search bar input
  const [searchQuery, setSearchQuery] = useState<string>('');

  useEffect(() => {
    const handleWorkflowChange = () => {
      setWorkflow(getWorkflowState());
    };
    window.addEventListener('vyuh_workflow_change', handleWorkflowChange);
    return () => {
      window.removeEventListener('vyuh_workflow_change', handleWorkflowChange);
    };
  }, []);

  // Investigation / Case Modal State
  const [investigating, setInvestigating] = useState<boolean>(false);
  const [caseModalOpen, setCaseModalOpen] = useState<boolean>(false);
  const [caseDetails, setCaseDetails] = useState<any>(null);
  
  // CSV Log Upload State
  const [uploadingCSV, setUploadingCSV] = useState<boolean>(false);

  const handleCSVUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    
    try {
      setUploadingCSV(true);
      const formData = new FormData();
      formData.append('file', file);
      
      const res = await uploadTransactionsCSV(formData);
      if (res.data && res.data.success) {
        alert(`Success: Processed ${res.data.processed_rows} rows. Found ${res.data.new_suspicious_nodes} new suspicious nodes.`);
        // Reload graph data
        await loadGraphData();
      } else {
        alert('Failed to upload CSV transaction log.');
      }
    } catch (err) {
      console.error('Error uploading CSV transaction log:', err);
      alert('Error uploading transaction logs. Make sure it is a valid CSV.');
    } finally {
      setUploadingCSV(false);
      e.target.value = '';
    }
  };

  // Load Initial Graph & Rings
  const loadGraphData = async () => {
    try {
      setLoading(true);
      const networkRes = await getGraphNetwork();
      setNodes(networkRes.data.nodes || []);
      setEdges(networkRes.data.edges || []);

      const ringsRes = await getGraphRings();
      setRings(ringsRes.data || []);

      // Check for active VTIP context auto-selections
      const activeState = getWorkflowState();
      if (activeState.activeStep === 'graph_intelligence' && activeState.data.accountId) {
        const targetAcc = activeState.data.accountId;
        setSelectedNodeId(targetAcc);
        setSelectedRingId(activeState.data.ringId || 7);
        try {
          const nodeRes = await getGraphNode(targetAcc);
          setSelectedNodeData(nodeRes.data);
        } catch (e) {
          console.error('Auto-load node failed:', e);
        }
      } else if (ringParam) {
        setSelectedRingId(parseInt(ringParam, 10));
      }
    } catch (err) {
      console.error('Error fetching graph intelligence datasets:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadGraphData();
  }, [ringParam]);

  // Handle Node Selection
  const handleNodeClick = async (nodeId: string) => {
    setSelectedNodeId(nodeId);
    setSelectedRingId(null); // Clear active ring selection details
    try {
      setLoading(true);
      const res = await getGraphNode(nodeId);
      setSelectedNodeData(res.data);
    } catch (err) {
      console.error('Error fetching node connectivity data:', err);
    } finally {
      setLoading(false);
    }
  };

  // Trigger Case creation / FIR Generation
  const handleInvestigateNode = async () => {
    if (!selectedNodeId) return;
    try {
      setInvestigating(true);
      const res = await investigateAccount(selectedNodeId);
      setCaseDetails(res.data);
      setCaseModalOpen(true);
      
      const state = getWorkflowState();
      if (state.activeStep) {
        updateWorkflowData({
          caseId: res.data.case_id || `VYUH-CASE-${res.data.id || '2026'}`,
          accountId: selectedNodeId,
          visScore: selectedNodeData?.risk_score || 88,
          state: 'Delhi',
          district: 'New Delhi',
          evidenceGenerated: true
        });
      }
    } catch (err) {
      console.error('Error launching legal inquiry:', err);
    } finally {
      setInvestigating(false);
    }
  };

  // Replay network progression state
  const [replayDay, setReplayDay] = useState<number>(10);

  // Filtered edges based on timeline slider progression
  const filteredEdges = React.useMemo(() => {
    return edges.filter((e, idx) => {
      const edgeStep = (idx % 10) + 1;
      return edgeStep <= replayDay;
    });
  }, [edges, replayDay]);

  // Filtered nodes logic (Memoized to prevent array ref changes from re-triggering D3 simulations)
  const filteredNodes = React.useMemo(() => {
    return nodes.filter((n, idx) => {
      // Status Filter
      if (statusFilter !== 'ALL' && n.status.toUpperCase() !== statusFilter) return false;
      // Ring Selector
      if (selectedRingId && n.community_id !== selectedRingId) return false;
      // Search query
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        if (!n.id.toLowerCase().includes(q) && !n.label.toLowerCase().includes(q)) return false;
      }
      // Replay Day Filter
      const nodeStep = (idx % 10) + 1;
      return nodeStep <= replayDay;
    });
  }, [nodes, statusFilter, selectedRingId, searchQuery, replayDay]);

  // Calculate top statistics
  const totalCount = nodes.length;
  const muleCount = nodes.filter(n => n.status === 'MULE').length;
  const suspCount = nodes.filter(n => n.status === 'SUSPICIOUS').length;
  const safeCount = nodes.filter(n => n.status === 'SAFE').length;

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-6"
    >
      {/* Top Stats Banner */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="card-glass py-3 px-4 flex items-center justify-between">
          <span className="text-[10px] font-mono text-text-secondary uppercase">Monitored Nodes</span>
          <span className="text-xl font-bold font-mono text-text-primary">{totalCount}</span>
        </div>
        <div className="card-glass py-3 px-4 flex items-center justify-between border-l-2 border-l-danger">
          <span className="text-[10px] font-mono text-text-secondary uppercase">Mule Accounts</span>
          <span className="text-xl font-bold font-mono text-danger">{muleCount}</span>
        </div>
        <div className="card-glass py-3 px-4 flex items-center justify-between border-l-2 border-l-warning">
          <span className="text-[10px] font-mono text-text-secondary uppercase">Suspicious Rings</span>
          <span className="text-xl font-bold font-mono text-warning">{suspCount}</span>
        </div>
        <div className="card-glass py-3 px-4 flex items-center justify-between border-l-2 border-l-success">
          <span className="text-[10px] font-mono text-text-secondary uppercase">Safe Nodes</span>
          <span className="text-xl font-bold font-mono text-success">{safeCount}</span>
        </div>
      </section>

      {/* Control Bar */}
      <section className="card-glass p-3 flex flex-wrap items-center justify-between gap-4">
        {/* Filter buttons */}
        <div className="flex items-center space-x-2">
          {['ALL', 'MULE', 'SUSPICIOUS', 'SAFE'].map((f) => (
            <button
              key={f}
              onClick={() => setStatusFilter(f)}
              className={`px-3 py-1.5 text-xs font-bold rounded transition-colors ${
                statusFilter === f
                  ? 'bg-accent-blue text-text-primary'
                  : 'bg-bg-primary text-text-secondary hover:text-text-primary'
              }`}
            >
              {f}
            </button>
          ))}
        </div>

        {/* CSV File Upload Section */}
        <div className="flex items-center space-x-2 bg-bg-primary/45 border border-border-custom rounded-lg px-3 py-1">
          <input
            type="file"
            accept=".csv"
            onChange={handleCSVUpload}
            id="csv-upload"
            className="hidden"
            disabled={uploadingCSV}
          />
          <label
            htmlFor="csv-upload"
            className="text-xs font-mono font-bold text-accent-blue hover:text-accent-blue-hover cursor-pointer flex items-center gap-1.5 py-1 select-none"
          >
            <Upload className="w-3.5 h-3.5" />
            {uploadingCSV ? 'Processing...' : 'Upload Txs (CSV)'}
          </label>
        </div>

        {/* Ring selection & search */}
        <div className="flex items-center space-x-3 flex-1 max-w-md">
          {/* Highlight Ring 7 button */}
          <button
            onClick={() => setSelectedRingId(selectedRingId === 7 ? null : 7)}
            className={`px-3 py-1.5 text-xs font-mono font-bold rounded border transition-colors shrink-0 ${
              selectedRingId === 7
                ? 'bg-danger text-text-primary border-danger'
                : 'bg-bg-primary text-text-secondary border-border-custom hover:text-text-primary hover:border-danger/40'
            }`}
          >
            {selectedRingId === 7 ? 'Clear Highlight' : 'Highlight Ring #7'}
          </button>

          {/* Search */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-text-secondary absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search Owner or ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-bg-primary border border-border-custom rounded-lg pl-9 pr-4 py-1.5 text-xs text-text-primary placeholder-text-secondary focus:outline-none focus:border-accent-blue"
            />
          </div>

          <button 
            onClick={loadGraphData}
            className="p-1.5 bg-bg-primary hover:bg-bg-surface2 border border-border-custom rounded-lg text-text-secondary hover:text-text-primary transition"
            title="Refresh database data"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </section>

      {/* Main Split Panels */}
      <section className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Left 60% — Graph */}
        <div className="lg:col-span-3 flex flex-col justify-between h-[550px] relative">
          <div className="flex-1 h-[470px] relative">
            {loading && (
              <div className="absolute inset-0 bg-bg-primary/50 backdrop-blur-xs flex items-center justify-center z-10 rounded-xl">
                <div className="flex flex-col items-center space-y-3">
                  <div className="w-10 h-10 rounded-full border-4 border-bg-surface2 border-t-accent-blue animate-spin" />
                  <span className="text-xs font-mono text-text-secondary">Recalculating Louvain & TDA vectors...</span>
                </div>
              </div>
            )}
            <FraudNetworkGraph
              nodes={filteredNodes}
              edges={filteredEdges}
              onNodeClick={handleNodeClick}
              selectedCommunityId={selectedRingId}
            />
          </div>

          {/* Timeline Replay slider */}
          <div className="p-3 bg-bg-primary/45 border border-border-custom rounded-xl flex items-center justify-between gap-4 font-mono text-[10px] select-none shadow-md">
            <span className="text-accent-blue font-bold tracking-wider shrink-0 uppercase">Replay Network Progression:</span>
            <input
              type="range"
              min={1}
              max={10}
              value={replayDay}
              onChange={(e) => setReplayDay(Number(e.target.value))}
              className="flex-1 accent-accent-blue cursor-pointer h-1 bg-bg-surface2 rounded-lg"
            />
            <span className="font-bold text-text-primary px-2.5 py-0.5 bg-accent-blue/15 border border-accent-blue/30 rounded text-xs shrink-0">
              Day {replayDay}
            </span>
          </div>
        </div>

        {/* Right 40% — Detail Panel */}
        <div className="lg:col-span-2 h-[550px] overflow-y-auto card-glass space-y-4">
          {!selectedNodeId ? (
            // Default view: Rings Ledger list
            <div className="space-y-4">
              <div className="border-b border-border-custom pb-2">
                <h3 className="text-xs font-bold font-mono text-text-primary uppercase tracking-widest flex items-center gap-1.5">
                  <Users className="w-4 h-4 text-accent-blue" />
                  Detected Coordinated Mule Rings
                </h3>
                <p className="text-[10px] text-text-secondary mt-1">
                  Louvain community sizes with cycles calculated through persistent homology.
                </p>
              </div>

              <div className="space-y-3">
                {rings.map((ring) => (
                  <div
                    key={ring.ring_id}
                    onClick={() => setSelectedRingId(selectedRingId === ring.ring_id ? null : ring.ring_id)}
                    className={`p-3.5 rounded-lg border cursor-pointer transition-all duration-200 ${
                      selectedRingId === ring.ring_id
                        ? 'bg-danger/10 border-danger shadow-md shadow-danger/5'
                        : 'bg-bg-primary border-border-custom hover:bg-bg-surface-hover hover:border-danger/30'
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div className="font-bold text-sm text-text-primary">
                        Ring #{ring.ring_id} {ring.ring_id === 7 && <span className="text-[9px] bg-danger/20 text-danger border border-danger/30 px-1 py-0.5 rounded font-mono ml-1">PRIMARY DEMO</span>}
                      </div>
                      <span className={`px-2 py-0.5 rounded text-[9px] font-mono font-bold ${
                        ring.status === 'CRITICAL' ? 'bg-red-950/60 text-red-400' : 'bg-amber-950/60 text-amber-400'
                      }`}>
                        {ring.status}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 mt-3 text-[11px] font-mono text-text-secondary">
                      <div>Members: <span className="text-text-primary font-bold">{ring.member_count} accounts</span></div>
                      <div>Avg Risk Index: <span className="text-text-primary font-bold">{ring.avg_risk}%</span></div>
                      <div>TDA Cycles (B1): <span className="text-accent-blue font-bold">{ring.betti_1_cycles} cycles</span></div>
                      <div>Est. Loss routed: <span className="text-text-primary font-bold">₹{(ring.estimated_fraud_value / 100000).toFixed(2)} L</span></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            // Active Node Click Details view
            <div className="space-y-4">
              {/* Back button */}
              <button
                onClick={() => {
                  setSelectedNodeId(null);
                  setSelectedNodeData(null);
                }}
                className="text-[10px] font-bold text-accent-blue hover:underline uppercase flex items-center gap-1 font-mono"
              >
                &larr; Back to Mule Rings ledger
              </button>

              <div className="border-b border-border-custom pb-3">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-bold text-text-primary text-base">
                      {selectedNodeData?.account?.owner_name || 'Loading...'}
                    </h3>
                    <span className="text-xs font-mono text-text-secondary">
                      Acc: {selectedNodeId}
                    </span>
                  </div>
                  {selectedNodeData?.account?.status && (
                    <RiskBadge risk={selectedNodeData.account.status} />
                  )}
                </div>
              </div>

              {/* Central Risk indicators */}
              <div className="space-y-3">
                <div className="bg-bg-primary rounded-lg p-3.5 border border-border-custom text-center">
                  <div className="text-[10px] font-mono text-text-secondary uppercase tracking-widest">
                    Composite Risk Score
                  </div>
                  <div className="text-3xl font-mono font-bold text-danger mt-1">
                    {selectedNodeData?.account?.risk_score?.toFixed(1) || '--'}%
                  </div>
                </div>

                {/* Score Breakdown progress bars */}
                <div className="space-y-2 text-xs font-mono">
                  <div className="font-bold text-[10px] text-text-secondary uppercase tracking-wider mb-1">
                    Topological Homology Factors
                  </div>
                  <div>
                    <div className="flex justify-between text-[11px] mb-1">
                      <span>Centrality (PageRank Index)</span>
                      <span>{(selectedNodeData?.account?.page_rank_score * 1000).toFixed(1) || '0.0'}%</span>
                    </div>
                    <div className="w-full h-1.5 bg-bg-primary rounded">
                      <div 
                        className="h-full bg-accent-blue rounded transition-all duration-500" 
                        style={{ width: `${Math.min(100, selectedNodeData?.account?.page_rank_score * 1000) || 0}%` }}
                      />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-[11px] mb-1">
                      <span>Velocity Index (Spike rate)</span>
                      <span>{selectedNodeData?.account?.velocity_score?.toFixed(1) || '0.0'}%</span>
                    </div>
                    <div className="w-full h-1.5 bg-bg-primary rounded">
                      <div 
                        className="h-full bg-warning rounded transition-all duration-500" 
                        style={{ width: `${selectedNodeData?.account?.velocity_score || 0}%` }}
                      />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-[11px] mb-1">
                      <span>TDA Loop Signature (Betti-1)</span>
                      <span>{selectedNodeData?.account?.tda_score?.toFixed(1) || '0.0'}%</span>
                    </div>
                    <div className="w-full h-1.5 bg-bg-primary rounded">
                      <div 
                        className="h-full bg-danger rounded transition-all duration-500" 
                        style={{ width: `${selectedNodeData?.account?.tda_score || 0}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Risk Engine Algebraic Scorecard */}
              <div className="bg-[#070b16] border border-border-custom rounded-xl p-3 space-y-1.5 font-mono text-[9px] text-text-secondary select-none shadow-inner">
                <span className="text-[10px] text-danger font-bold block mb-1">Risk Score Calculation Engine</span>
                <div className="flex justify-between border-b border-border-custom/30 pb-1">
                  <span>PageRank Weight (40%):</span>
                  <span className="text-text-primary font-bold">
                    {((selectedNodeData?.account?.page_rank_score || 0) * 400).toFixed(1)}%
                  </span>
                </div>
                <div className="flex justify-between border-b border-border-custom/30 pb-1">
                  <span>Loop Homology B1 (30%):</span>
                  <span className="text-text-primary font-bold">
                    {((selectedNodeData?.account?.tda_score || 0) * 0.3).toFixed(1)}%
                  </span>
                </div>
                <div className="flex justify-between border-b border-border-custom/30 pb-1">
                  <span>Tx Velocity Weight (30%):</span>
                  <span className="text-text-primary font-bold">
                    {((selectedNodeData?.account?.velocity_score || 0) * 0.3).toFixed(1)}%
                  </span>
                </div>
                <div className="flex justify-between text-[10px] font-bold text-danger pt-1">
                  <span>Composite Verdict:</span>
                  <span>
                    {selectedNodeData?.account?.risk_score?.toFixed(1)}%
                  </span>
                </div>
              </div>

              {/* Transactions ledger overview */}
              <div className="space-y-2 pt-2 border-t border-border-custom">
                <div className="flex justify-between text-xs font-mono">
                  <span className="text-text-secondary">Registration IP:</span>
                  <span className="text-text-primary font-bold">{selectedNodeData?.account?.registration_ip}</span>
                </div>
                <div className="flex justify-between text-xs font-mono">
                  <span className="text-text-secondary">Total Volume Routed:</span>
                  <span className="text-text-primary font-bold">
                    ₹{((selectedNodeData?.total_volume || 0) / 100000).toFixed(2)} L
                  </span>
                </div>
              </div>

              {/* Actions */}
              <div className="grid grid-cols-2 gap-3 pt-3">
                <button
                  onClick={handleInvestigateNode}
                  disabled={investigating}
                  className="px-4 py-2.5 bg-accent-blue text-text-primary hover:bg-accent-blue-hover text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-1.5 disabled:opacity-55 cursor-pointer"
                >
                  <FileText className="w-4 h-4" />
                  {investigating ? 'Running...' : 'Investigate Node'}
                </button>
                <a
                  href={getExportEvidenceUrl(`VYUH-2026-${selectedNodeId?.slice(-4) || '000'}`)}
                  className="px-4 py-2.5 bg-bg-primary text-text-secondary hover:text-text-primary border border-border-custom hover:border-text-secondary text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  Evidence PDF
                </a>
              </div>

              {workflow.activeStep === 'graph_intelligence' && (
                <div className="pt-2 border-t border-border-custom/30">
                  <button
                    onClick={() => {
                      setWorkflowStep('crime_map');
                      navigate('/map');
                    }}
                    className="w-full py-2.5 bg-accent-blue text-text-primary hover:bg-accent-blue-hover rounded text-xs font-bold font-mono transition flex items-center justify-center gap-1.5 glow-accent cursor-pointer"
                  >
                    <MapPin className="w-4 h-4" />
                    Locate on GIS Crime Map &rarr;
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </section>

      {/* Case Management / FIR modal */}
      {caseModalOpen && caseDetails && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-bg-surface border border-border-custom rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl relative">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-border-custom flex justify-between items-center bg-bg-primary/40">
              <div className="flex items-center space-x-2 text-accent-blue">
                <Shield className="w-5 h-5 animate-pulse" />
                <span className="text-sm font-bold font-mono tracking-wider uppercase">VYUH Core Court-Ready Case Package</span>
              </div>
              <button 
                onClick={() => setCaseModalOpen(false)}
                className="text-text-secondary hover:text-text-primary transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4 max-h-[450px] overflow-y-auto">
              <div className="grid grid-cols-2 gap-4 text-xs font-mono border-b border-border-custom pb-4">
                <div>
                  <span className="text-text-secondary block">Case ID:</span>
                  <span className="text-text-primary font-bold text-sm">{caseDetails.case_id}</span>
                </div>
                <div>
                  <span className="text-text-secondary block">Liaison Status:</span>
                  <span className="text-danger font-bold text-sm uppercase">{caseDetails.status}</span>
                </div>
              </div>

              {/* Monospace FIR print block */}
              <div className="space-y-2">
                <span className="text-xs font-mono font-bold text-text-secondary uppercase">Draft First Information Report (FIR)</span>
                <pre className="bg-[#070b16] border border-border-custom text-green-400 font-mono text-[11px] p-4 rounded-xl overflow-x-auto whitespace-pre-wrap select-all leading-5">
                  {caseDetails.fir_draft}
                </pre>
              </div>

              {/* Information disclaimer */}
              <div className="bg-accent-blue/5 border border-accent-blue/15 rounded-lg p-3.5 flex items-start space-x-2.5">
                <Info className="w-4.5 h-4.5 text-accent-blue shrink-0 mt-0.5" />
                <p className="text-[10px] text-text-secondary font-mono leading-relaxed">
                  This report packages topological cycles (Betti numbers) and transaction logs under compliance guidelines for filing directly to staging courts. Admissible under IT Act compliance standard Section 65B.
                </p>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-border-custom bg-bg-primary/20 flex justify-end space-x-3">
              <button
                onClick={() => setCaseModalOpen(false)}
                className="px-4 py-2 bg-bg-surface border border-border-custom rounded-lg text-text-secondary hover:text-text-primary text-xs font-bold transition"
              >
                Cancel
              </button>
              <a
                href={getExportEvidenceUrl(caseDetails.case_id)}
                className="px-4 py-2 bg-accent-blue text-text-primary hover:bg-accent-blue-hover rounded-lg text-xs font-bold transition flex items-center gap-1.5"
              >
                <Download className="w-4.5 h-4.5" />
                Download PDF
              </a>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default FraudGraph;
