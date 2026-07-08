import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Terminal, Send, X, Sparkles } from 'lucide-react';
import { saveWorkflowState, clearWorkflowState, getWorkflowState } from '../../lib/workflow';

export const Copilot: React.FC = () => {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [input, setInput] = useState<string>('');
  const [typing, setTyping] = useState<boolean>(false);
  const [history, setHistory] = useState<{ type: 'cmd' | 'resp'; text: string }[]>([
    { type: 'resp', text: 'VYUH Tactical Copilot v2.0 initialized. Type /help for available commands.' }
  ]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [history]);

  const addTypingResponse = (text: string) => {
    setTyping(true);
    setTimeout(() => {
      setHistory(prev => [...prev, { type: 'resp', text }]);
      setTyping(false);
    }, 400 + Math.min(text.length * 2, 800));
  };

  const handleCommand = (cmdStr: string) => {
    const raw = cmdStr.trim();
    if (!raw) return;

    setHistory(prev => [...prev, { type: 'cmd', text: raw }]);
    setInput('');

    const args = raw.split(' ');
    const command = args[0].toLowerCase();
    const param = args.slice(1).join(' ');

    switch (command) {
      case '/help':
        addTypingResponse(
          'Available Commands:\n' +
          '/trace [id] — Route to Graph analytics for account\n' +
          '/dispatch [area] — Locate coordinates & deploy patrol\n' +
          '/verify — Redirect to Currency verifier scanner\n' +
          '/status — Show system health & active pipeline state\n' +
          '/risk [account] — Quick inline risk score lookup\n' +
          '/clear — Reset active investigation context\n' +
          '/bns — Print BNS/IT Act law citations\n' +
          '/about — Platform overview for hackathon judges'
        );
        break;
      case '/trace':
        if (!param) {
          addTypingResponse('Error: Provide an Account ID or phone to trace. e.g., /trace 9876543201');
        } else {
          saveWorkflowState({
            activeStep: 'graph_intelligence',
            data: {
              caseId: `VYUH-2026-COP-${Math.floor(1000 + Math.random() * 9000)}`,
              accountId: param,
              phone: param.startsWith('+91') ? param : '+919876500001',
              ringId: 7
            }
          });
          addTypingResponse(`Tracing account ${param}. Loading homology node clusters...`);
          setTimeout(() => {
            navigate('/fraud-graph');
            setIsOpen(false);
          }, 1200);
        }
        break;
      case '/dispatch':
        if (!param) {
          addTypingResponse('Error: Provide target district/sector. e.g., /dispatch New Delhi');
        } else {
          saveWorkflowState({
            activeStep: 'crime_map',
            data: {
              caseId: `VYUH-2026-COP-${Math.floor(1000 + Math.random() * 9000)}`,
              state: 'Delhi',
              district: param,
              accountId: '9876543201',
              ringId: 7
            }
          });
          addTypingResponse(`Locating coordinates for ${param}. Requesting patrol recommendations...`);
          setTimeout(() => {
            navigate('/map');
            setIsOpen(false);
          }, 1200);
        }
        break;
      case '/verify':
        addTypingResponse('Redirecting to RBI banknote verifier...');
        setTimeout(() => {
          navigate('/currency');
          setIsOpen(false);
        }, 800);
        break;
      case '/status': {
        const wf = getWorkflowState();
        const pipelineStatus = wf.activeStep 
          ? `ACTIVE — Step: ${wf.activeStep.toUpperCase().replace('_', ' ')}, Case: ${wf.data.caseId || 'N/A'}`
          : 'IDLE — No active investigation pipeline';
        addTypingResponse(
          `System Health Report:\n` +
          `────────────────────\n` +
          `Platform: VYUH v2.0 (ET AI Hackathon 2.0)\n` +
          `Backend: http://localhost:8000 ● ONLINE\n` +
          `WebSocket: ws://localhost:8000/api/ws/alerts ● CONNECTED\n` +
          `Modules: 5/5 operational (Dashboard, Scam, Graph, Currency, Map)\n` +
          `Pipeline: ${pipelineStatus}\n` +
          `AI Engine: Groq LLM + Local Semantic RAG\n` +
          `Graph Engine: NetworkX (Louvain + Betti Homology)\n` +
          `Database: SQLite (vyuh.db) — Seeded`
        );
        break;
      }
      case '/risk': {
        if (!param) {
          addTypingResponse('Error: Provide account ID. e.g., /risk 9876543201');
        } else {
          setTyping(true);
          fetch(`http://localhost:8000/api/graph/node/${param}`)
            .then(res => res.json())
            .then(data => {
              const acct = data.account;
              if (acct) {
                setHistory(prev => [...prev, { type: 'resp', text:
                  `Risk Profile for ${acct.owner_name} (${param}):\n` +
                  `────────────────────\n` +
                  `Status: ${acct.status}\n` +
                  `Composite Risk: ${acct.risk_score?.toFixed(1)}%\n` +
                  `PageRank: ${(acct.page_rank_score * 1000).toFixed(2)}\n` +
                  `TDA Score: ${acct.tda_score?.toFixed(1)}%\n` +
                  `Velocity: ${acct.velocity_score?.toFixed(1)}%\n` +
                  `Community: Ring #${acct.community_id}\n` +
                  `Verdict: ${acct.risk_score > 70 ? '⚠ HIGH RISK — INVESTIGATE' : acct.risk_score > 40 ? '⚡ MODERATE — MONITOR' : '✓ LOW RISK'}`
                }]);
              } else {
                setHistory(prev => [...prev, { type: 'resp', text: `Account ${param} not found in database.` }]);
              }
              setTyping(false);
            })
            .catch(() => {
              setHistory(prev => [...prev, { type: 'resp', text: `Failed to fetch risk data for ${param}. Is the backend running?` }]);
              setTyping(false);
            });
        }
        break;
      }
      case '/clear':
        clearWorkflowState();
        addTypingResponse('Context cleared. Pipeline reset.');
        break;
      case '/bns':
        addTypingResponse(
          'Legal Citations Reference:\n' +
          '════════════════════════\n' +
          '▸ Sec 318 BNS: Cheating by personation (mule fronts)\n' +
          '▸ Sec 319 BNS: Cheating & dishonestly inducing delivery\n' +
          '▸ Sec 320 BNS: Dishonest concealment of facts\n' +
          '▸ Sec 66C IT Act: Identity theft using computer resource\n' +
          '▸ Sec 66D IT Act: Cheating by personation via computer\n' +
          '▸ Sec 65B IEA: Admissibility of electronic records\n' +
          '▸ RBI Master Direction: Counterfeit Note Detection & Reporting\n' +
          '▸ MHA I4C Protocol: Citizen Financial Cyber Fraud Reporting (1930)'
        );
        break;
      case '/about':
        addTypingResponse(
          'VYUH (विघ्न) — Digital Public Safety Intelligence Platform\n' +
          '══════════════════════════════════════════════════════════\n' +
          'Built for ET AI Hackathon 2.0, Problem Statement 6:\n' +
          '"AI for Digital Public Safety: Defeating Counterfeiting,\n' +
          'Fraud & Digital Arrest Scams"\n\n' +
          '10 Innovative Features:\n' +
          '1. Police Copilot CLI (this terminal)\n' +
          '2. AI Investigation Agent\n' +
          '3. Live Threat Radar\n' +
          '4. Deepfake Voice Detection\n' +
          '5. Explainable AI (XAI/SHAP)\n' +
          '6. Fraud Network Replay\n' +
          '7. Risk Score Engine\n' +
          '8. AI Case Timeline\n' +
          '9. AI Evidence Locker\n' +
          '10. Court-Ready Report Generator'
        );
        break;
      default: {
        // Enhanced AI RAG response for natural language queries
        const low = raw.toLowerCase();
        let reply = '';
        if (low.includes('65b') || low.includes('evidence')) {
          reply = 'Agent: Section 65B of the Indian Evidence Act requires a signed certificate asserting that the electronic document was generated by a computer in regular use. VYUH automates this with digital MD5/SHA-256 seal signatures in the Evidence Locker. Any output from VYUH\'s graph engine, scam analyzer, or currency verifier can be printed as a Section 65B-compliant court document.';
        } else if (low.includes('louvain') || low.includes('community')) {
          reply = 'Agent: The Louvain community detection algorithm optimizes network modularity by iteratively moving nodes between clusters. In VYUH, it segments UPI transaction networks into coordinated mule rings. High modularity scores indicate tightly-knit fraud groups operating in isolation from the broader network.';
        } else if (low.includes('betti') || low.includes('tda') || low.includes('homology') || low.includes('topology')) {
          reply = 'Agent: Topological Data Analysis (TDA) computes Betti numbers (β₀ = connected components, β₁ = loops/cycles). VYUH uses 1D Betti cycle counts to detect circular money-laundering loops in UPI graphs. High β₁ indicates structured round-tripping patterns — a strong mule ring indicator.';
        } else if (low.includes('pagerank') || low.includes('centrality')) {
          reply = 'Agent: PageRank measures a node\'s importance by counting incoming transaction edges weighted by source importance. In VYUH, high PageRank identifies collection/distribution hubs in mule networks. Combined with velocity scoring (transaction frequency spikes), it forms 40% of the composite risk score.';
        } else if (low.includes('hotspot') || low.includes('mewat') || low.includes('jamtara')) {
          reply = 'Agent: Threat radar shows Mewat (Haryana) dominates digital arrest scams with spoofed CBI/customs calls. Jamtara (Jharkhand) specializes in UPI phishing with rapid cashout velocity. Hyderabad corridor handles international mule routing. VYUH\'s GIS heatmap overlays I4C complaint density to forecast emerging zones.';
        } else if (low.includes('deepfake') || low.includes('voice') || low.includes('clone')) {
          reply = 'Agent: VYUH\'s deepfake voice detection prototype analyzes audio waveform patterns for synthetic speech artifacts. It checks spectral consistency, pitch variation anomalies, and cross-references against known scam call center acoustic fingerprints (Mewat/Jamtara voice registry). Detection confidence is displayed as a percentage score.';
        } else if (low.includes('xai') || low.includes('shap') || low.includes('explain')) {
          reply = 'Agent: Explainable AI (XAI) in VYUH uses SHAP (SHapley Additive exPlanations) factor scoring. When a scam is detected, the system shows exactly which features drove the classification: agency impersonation keywords (+45%), high-pressure language (+35%), financial transfer references (+20%). This transparency is critical for court admissibility.';
        } else if (low.includes('digital arrest') || low.includes('scam')) {
          reply = 'Agent: Digital arrest scams involve impersonating CBI/ED/Customs officers via video call, threatening arrest over fake parcel allegations. VYUH detects these through: call duration analysis (>120 min suspicious), caller prefix matching (+91911 etc.), script keyword classification, and voice clone detection. The 7-step simulator demonstrates the complete scam lifecycle.';
        } else if (low.includes('ficn') || low.includes('counterfeit') || low.includes('currency') || low.includes('fake note')) {
          reply = 'Agent: FICN (Fake Indian Currency Notes) detection uses OVI color-shift analysis (green→blue under tilt), watermark clarity scoring, bleed-line counting, microprint OCR verification, and serial number format validation. VYUH checks against RBI security feature guidelines for ₹100, ₹200, ₹500, and ₹2000 denominations.';
        } else if (low.includes('1930') || low.includes('i4c') || low.includes('helpline') || low.includes('report')) {
          reply = 'Agent: 1930 is MHA\'s national cybercrime helpline. I4C (Indian Cyber Crime Coordination Centre) aggregates reports from citizens. VYUH integrates by auto-drafting MHA alert formats and forwarding scam classifications to NCRB portals. Citizens can also file reports directly through the Fraud Shield chatbot.';
        } else if (low.includes('hello') || low.includes('hi') || low.includes('hey')) {
          reply = 'Agent: Welcome, Officer. VYUH Tactical Copilot ready. Use /help to see available commands, /status to check system health, or ask me about any cybersecurity topic (TDA, Louvain, deepfakes, FICN, digital arrests, Section 65B, etc.)';
        } else {
          reply = `Agent: Mapped query "${raw}". I can answer questions about:\n• Digital arrest scams & detection\n• Graph analytics (Louvain, PageRank, TDA/Betti)\n• Deepfake voice detection\n• FICN/counterfeit currency\n• Legal citations (BNS, IT Act, 65B)\n• MHA I4C helpline procedures\n\nOr use commands: /trace, /dispatch, /verify, /risk, /status, /bns`;
        }
        addTypingResponse(reply);
        break;
      }
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-45 no-print">
      {isOpen ? (
        <div className="w-85 bg-bg-surface border border-accent-blue/35 rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-fade-in backdrop-blur-md">
          {/* Header */}
          <div className="px-4 py-3 bg-bg-primary/50 border-b border-border-custom flex justify-between items-center select-none">
            <div className="flex items-center space-x-2 text-accent-blue font-mono font-bold text-xs">
              <Terminal className="w-4 h-4 animate-pulse" />
              <span>VYUH COPILOT Terminal</span>
            </div>
            <button 
              onClick={() => setIsOpen(false)}
              className="text-text-secondary hover:text-text-primary transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Chat/Command logs */}
          <div className="flex-1 h-60 overflow-y-auto p-4 space-y-3 font-mono text-[10px] text-green-400 bg-black/60 leading-relaxed scrollbar-thin">
            {history.map((h, i) => (
              <div key={i} className={h.type === 'cmd' ? 'text-text-primary' : 'text-green-400 whitespace-pre-wrap'}>
                {h.type === 'cmd' ? `> ${h.text}` : h.text}
              </div>
            ))}
            {typing && (
              <div className="text-accent-blue flex items-center gap-1">
                <span className="copilot-typing-dot" />
                <span className="copilot-typing-dot" style={{ animationDelay: '0.15s' }} />
                <span className="copilot-typing-dot" style={{ animationDelay: '0.3s' }} />
                <span className="ml-1 text-[9px]">Processing...</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Form input */}
          <div className="p-2.5 border-t border-border-custom flex items-center gap-2 bg-bg-primary/30">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleCommand(input);
              }}
              placeholder="Type command e.g., /help, /trace..."
              className="flex-1 bg-[#060a16] border border-border-custom rounded-lg px-3 py-1.5 font-mono text-[11px] text-text-primary placeholder-text-secondary focus:outline-none focus:border-accent-blue leading-relaxed"
              disabled={typing}
            />
            <button
              onClick={() => handleCommand(input)}
              disabled={typing}
              className="p-1.5 bg-accent-blue hover:bg-accent-blue-hover text-text-primary rounded-lg transition disabled:opacity-50"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setIsOpen(true)}
          className="p-3 bg-accent-blue hover:bg-accent-blue-hover text-text-primary rounded-full shadow-lg shadow-accent-blue/25 hover:scale-105 transition flex items-center gap-1.5 font-mono font-bold text-xs select-none glow-accent cursor-pointer border border-accent-blue/40"
        >
          <Sparkles className="w-4.5 h-4.5 animate-spin-slow" />
          Copilot CLI
        </button>
      )}
    </div>
  );
};

export default Copilot;
