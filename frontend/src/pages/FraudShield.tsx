import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, Send, Phone, ShieldAlert, Sparkles, AlertOctagon } from 'lucide-react';
import { sendChatbotMessage, analyzeSuspiciousContent, getHelplines } from '../lib/api';
import { motion } from 'framer-motion';
import { getWorkflowState, saveWorkflowState } from '../lib/workflow';

interface Message {
  id: string;
  sender: 'user' | 'bot';
  text: string;
  engine?: string;
  timestamp: Date;
}

export const FraudShield: React.FC = () => {
  const navigate = useNavigate();
  const [_, setWorkflow] = useState(getWorkflowState());

  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'init',
      sender: 'bot',
      text: 'Welcome to VYUH Fraud Shield. I am your Digital Safety Companion. If you are experiencing a scam or received a suspicious message, describe it below or use the quick access guides.',
      engine: 'local_nlp',
      timestamp: new Date()
    }
  ]);
  const [inputText, setInputText] = useState<string>('');
  const [selectedLang, setSelectedLang] = useState<string>('EN');
  const [sending, setSending] = useState<boolean>(false);

  const handleEscalateToPipeline = () => {
    const lastUserMsg = [...messages].reverse().find(m => m.sender === 'user')?.text || '';
    const targetText = lastUserMsg || inputText || 'Citizen reported digital arrest video threat.';
    const caseId = `VYUH-2026-${Math.floor(1000 + Math.random() * 9000)}`;
    
    saveWorkflowState({
      activeStep: 'scam_analysis',
      data: {
        caseId: caseId,
        complaintText: targetText,
        scamType: targetText.toLowerCase().includes('cbi') || targetText.toLowerCase().includes('police') || targetText.toLowerCase().includes('arrest') ? 'Digital Arrest' : 'UPI Fraud',
        urgencyLevel: 'CRITICAL',
        phone: '+919112239392',
        state: 'Delhi',
        district: 'New Delhi',
        accountId: '9876543201',
        ringId: 7
      }
    });
    navigate('/scam');
  };

  useEffect(() => {
    const handleWorkflowChange = () => {
      setWorkflow(getWorkflowState());
    };
    window.addEventListener('vyuh_workflow_change', handleWorkflowChange);
    return () => {
      window.removeEventListener('vyuh_workflow_change', handleWorkflowChange);
    };
  }, []);

  // Crisis Mode States
  const [crisisMode, setCrisisMode] = useState<boolean>(false);

  // Spam content analyzer states
  const [scamUrlInput, setScamUrlInput] = useState<string>('');
  const [checkingUrl, setCheckingUrl] = useState<boolean>(false);
  const [urlVerdict, setUrlVerdict] = useState<any>(null);

  // Helpline list states
  const [helplines, setHelplines] = useState<any[]>([]);

  const chatEndRef = useRef<HTMLDivElement>(null);

  // Load helplines on mount
  useEffect(() => {
    const loadHelplines = async () => {
      try {
        const res = await getHelplines();
        setHelplines(res.data || []);
      } catch (err) {
        console.error('Error fetching helplines:', err);
      }
    };
    loadHelplines();
  }, []);

  // Scroll to bottom on new messages
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, crisisMode]);

  // Handle messages dispatch
  const handleSendMessage = async (textToSend: string) => {
    if (!textToSend.trim()) return;

    const userMsg: Message = {
      id: Math.random().toString(),
      sender: 'user',
      text: textToSend,
      timestamp: new Date()
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputText('');
    setSending(true);

    try {
      const res = await sendChatbotMessage(textToSend);
      
      const botMsg: Message = {
        id: Math.random().toString(),
        sender: 'bot',
        text: res.data.response,
        engine: res.data.engine,
        timestamp: new Date()
      };
      
      setMessages((prev) => [...prev, botMsg]);
    } catch (err) {
      console.error('Error querying chat assistant:', err);
      // Fallback message
      const errorMsg: Message = {
        id: Math.random().toString(),
        sender: 'bot',
        text: 'I am currently having difficulty connecting to my primary intelligence node. If this is an emergency, please hang up immediately and call 1930.',
        engine: 'local_nlp',
        timestamp: new Date()
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setSending(false);
    }
  };

  // Trigger emergency crisis layout
  const handleEmergencyTrigger = () => {
    setCrisisMode(true);
    handleSendMessage('I am currently being scammed. What do I do right now?');
  };

  // Test URL or phone number
  const handleCheckUrl = async () => {
    if (!scamUrlInput.trim()) return;
    try {
      setCheckingUrl(true);
      const res = await analyzeSuspiciousContent(scamUrlInput);
      setUrlVerdict(res.data);
    } catch (err) {
      console.error('Error testing URL content:', err);
    } finally {
      setCheckingUrl(false);
    }
  };

  // Quick Action handler
  const handleQuickAction = (scenario: string) => {
    let text = '';
    switch (scenario) {
      case 'cbi':
        text = 'I got a call from a fake CBI officer saying I have a parcel with drugs.';
        break;
      case 'upi':
        text = 'There was an unknown UPI debit on my bank account just now.';
        break;
      case 'job':
        text = 'I was offered a job online asking me to complete Telegram tasks for money.';
        break;
      case 'whatsapp':
        text = 'I was added to a WhatsApp investment group promising 200% returns.';
        break;
      case 'fedex':
        text = 'A caller claiming to be from FedEx says customs seized a package in my name.';
        break;
      case 'number':
        text = 'Check if phone number +91-91223-38290 is safe.';
        break;
      default:
        text = 'Explain standard UPI safety practices.';
    }
    handleSendMessage(text);
  };

  // Markdown parsing helper
  const parseMarkdown = (text: string) => {
    // Basic formatting mapping: **text** to <strong>, \n to <br/>
    const lines = text.split('\n');
    return lines.map((line, i) => {
      // Check for bullet lists
      const isBullet = line.trim().startsWith('-') || line.trim().startsWith('*');
      const isNumbered = /^\d+\./.test(line.trim());
      
      let formatted = line;
      // Bold replace
      const boldRegex = /\*\*(.*?)\*\*/g;
      formatted = formatted.replace(boldRegex, '<strong>$1</strong>');
      
      const italicRegex = /\*(.*?)\*/g;
      formatted = formatted.replace(italicRegex, '<em>$1</em>');
      
      if (isBullet) {
        return (
          <li key={i} className="ml-4 list-disc text-xs text-text-secondary py-0.5" dangerouslySetInnerHTML={{ __html: formatted.replace(/^[-*]\s+/, '') }} />
        );
      }
      if (isNumbered) {
        return (
          <li key={i} className="ml-4 list-decimal text-xs text-text-secondary py-0.5" dangerouslySetInnerHTML={{ __html: formatted.replace(/^\d+\.\s+/, '') }} />
        );
      }
      return (
        <p key={i} className="text-xs text-text-secondary py-1" dangerouslySetInnerHTML={{ __html: formatted }} />
      );
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className={`h-[calc(100vh-100px)] grid grid-cols-1 lg:grid-cols-12 gap-6 relative rounded-2xl overflow-hidden transition-all duration-300 ${
        crisisMode ? 'border-2 border-danger shadow-[0_0_20px_rgba(239,68,68,0.3)] animate-pulse-slow' : 'border border-border-custom'
      }`}
    >
      
      {/* Left Sidebar (Quick Scenarios + Helplines) */}
      <div className="lg:col-span-3 bg-bg-surface border-r border-border-custom flex flex-col justify-between overflow-y-auto">
        <div className="p-4 space-y-5">
          <div className="border-b border-border-custom pb-3 flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-accent-blue" />
            <h3 className="text-sm font-bold font-mono text-text-primary uppercase tracking-wider">
              VYUH Fraud Shield
            </h3>
          </div>

          {/* Lang buttons */}
          <div className="space-y-1.5">
            <span className="text-[10px] font-mono text-text-secondary uppercase">Select Language:</span>
            <div className="grid grid-cols-3 gap-1.5">
              {['EN', 'HI', 'BN'].map((lang) => (
                <button
                  key={lang}
                  onClick={() => setSelectedLang(lang)}
                  className={`px-2 py-1 text-[10px] font-bold rounded transition-colors ${
                    selectedLang === lang 
                      ? 'bg-accent-blue text-text-primary' 
                      : 'bg-bg-primary text-text-secondary hover:text-text-primary'
                  }`}
                >
                  {lang === 'EN' ? 'English' : lang === 'HI' ? 'हिंदी' : 'বাংলা'}
                </button>
              ))}
            </div>
          </div>

          {/* Emergency Trigger */}
          <div className="space-y-2">
            <button
              onClick={handleEmergencyTrigger}
              className="w-full py-3 bg-danger text-text-primary hover:bg-red-700 text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-1.5 animate-pulse cursor-pointer shadow-lg shadow-danger/25"
            >
              <ShieldAlert className="w-4.5 h-4.5" />
              I'M BEING SCAMMED NOW 🚨
            </button>
            <button
              onClick={handleEscalateToPipeline}
              className="w-full py-2.5 bg-accent-blue text-text-primary hover:bg-accent-blue-hover text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-lg shadow-accent-blue/15"
            >
              <AlertOctagon className="w-4.5 h-4.5 animate-bounce" />
              Escalate Case to VTIP &rarr;
            </button>
          </div>

          {/* Quick Actions preset queries */}
          <div className="space-y-2 pt-2 border-t border-border-custom">
            <span className="text-[10px] font-mono text-text-secondary uppercase block mb-1">Quick Scenarios</span>
            <div className="space-y-1.5">
              <button onClick={() => handleQuickAction('cbi')} className="w-full text-left p-2 bg-bg-primary hover:bg-bg-surface-hover rounded text-[10px] font-mono text-text-secondary hover:text-text-primary border border-border-custom transition-all truncate">
                🚨 Fake CBI Call
              </button>
              <button onClick={() => handleQuickAction('upi')} className="w-full text-left p-2 bg-bg-primary hover:bg-bg-surface-hover rounded text-[10px] font-mono text-text-secondary hover:text-text-primary border border-border-custom transition-all truncate">
                💸 Unknown UPI Debit
              </button>
              <button onClick={() => handleQuickAction('job')} className="w-full text-left p-2 bg-bg-primary hover:bg-bg-surface-hover rounded text-[10px] font-mono text-text-secondary hover:text-text-primary border border-border-custom transition-all truncate">
                💼 Fake Telegram Job
              </button>
              <button onClick={() => handleQuickAction('whatsapp')} className="w-full text-left p-2 bg-bg-primary hover:bg-bg-surface-hover rounded text-[10px] font-mono text-text-secondary hover:text-text-primary border border-border-custom transition-all truncate">
                📈 Fake Investment Group
              </button>
            </div>
          </div>
        </div>

        {/* Helplines layout at bottom of sidebar */}
        <div className="p-4 border-t border-border-custom bg-bg-primary/30 space-y-2">
          <span className="text-[10px] font-mono font-bold text-accent-blue uppercase tracking-widest flex items-center gap-1">
            <Phone className="w-3.5 h-3.5" />
            Cyber Helplines
          </span>
          <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
            {helplines.map((h, idx) => (
              <div key={idx} className="flex justify-between items-center text-[10px] font-mono">
                <span className="text-text-secondary">{h.state}:</span>
                <a href={`tel:${h.number}`} className="text-accent-blue font-bold hover:underline">{h.number}</a>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="lg:col-span-9 bg-[#070b16] flex flex-col justify-between overflow-hidden relative h-full">
        {/* Pinned Crisis Protocol Overlay */}
        {crisisMode && (
          <div className="bg-danger/10 border-b border-danger/30 p-4 animate-fade-in flex flex-col md:flex-row justify-between items-start md:items-center gap-3 z-10 relative select-none">
            <div className="space-y-1">
              <span className="text-xs font-mono font-bold text-danger uppercase tracking-widest block">
                🚨 CRISIS PROTOCOL MODE ACTIVATED
              </span>
              <p className="text-[10px] text-text-secondary font-mono leading-relaxed">
                Follow these critical steps immediately to secure your assets.
              </p>
            </div>
            
            <div className="flex flex-wrap items-center gap-2 text-[10px] font-mono font-bold">
              <a href="tel:1930" className="px-3 py-1.5 bg-danger text-text-primary rounded hover:bg-red-700 transition flex items-center gap-1">
                <Phone className="w-3 h-3" /> Dial 1930
              </a>
              <button 
                onClick={() => setCrisisMode(false)}
                className="px-3 py-1.5 bg-bg-surface border border-border-custom text-text-secondary hover:text-text-primary rounded transition"
              >
                Exit Crisis Mode
              </button>
            </div>
          </div>
        )}

        {/* Chat message bubbles scroll window */}
        <div className="flex-1 p-4 overflow-y-auto space-y-4">
          {messages.map((m) => {
            const isBot = m.sender === 'bot';
            return (
              <div key={m.id} className={`flex items-start ${isBot ? 'space-x-3' : 'justify-end'}`}>
                {isBot && (
                  <div className="w-8 h-8 rounded-full bg-accent-blue/15 border border-accent-blue/30 text-accent-blue font-mono font-bold flex items-center justify-center text-xs shrink-0 select-none">
                    V
                  </div>
                )}
                
                <div className="flex flex-col space-y-1 max-w-[75%]">
                  <div className={`p-4 rounded-2xl text-xs border ${
                    isBot 
                      ? 'bg-bg-surface text-text-primary border-border-custom rounded-tl-none' 
                      : 'bg-accent-blue text-text-primary border-accent-blue/20 rounded-tr-none shadow-md shadow-accent-blue/5'
                  }`}>
                    {isBot ? parseMarkdown(m.text) : <p className="leading-relaxed">{m.text}</p>}
                  </div>
                  
                  {isBot && m.engine && (
                    <span className="text-[8px] font-mono text-text-secondary uppercase tracking-widest self-start flex items-center gap-1 select-none">
                      <Sparkles className="w-2.5 h-2.5 text-accent-blue" />
                      Inference: {m.engine}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
          {sending && (
            <div className="flex items-start space-x-3">
              <div className="w-8 h-8 rounded-full bg-accent-blue/15 border border-accent-blue/30 text-accent-blue font-mono font-bold flex items-center justify-center text-xs shrink-0 animate-pulse">
                V
              </div>
              <div className="bg-bg-surface border border-border-custom rounded-2xl rounded-tl-none p-4 text-xs font-mono text-text-secondary flex items-center space-x-2">
                <span className="w-1.5 h-1.5 rounded-full bg-accent-blue animate-bounce" />
                <span className="w-1.5 h-1.5 rounded-full bg-accent-blue animate-bounce [animation-delay:0.2s]" />
                <span className="w-1.5 h-1.5 rounded-full bg-accent-blue animate-bounce [animation-delay:0.4s]" />
              </div>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>

        {/* Input box + Link Verification panel */}
        <div className="p-4 border-t border-border-custom bg-bg-surface/90 space-y-4">
          
          {/* Suspicious content analyzer inline */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center bg-bg-primary/60 border border-border-custom rounded-xl p-3">
            <div className="md:col-span-4 flex items-center space-x-2 text-[10px] font-mono shrink-0">
              <ShieldAlert className="w-4 h-4 text-warning" />
              <span className="text-text-primary font-bold uppercase tracking-wider">SMS / Link Verification</span>
            </div>
            
            <div className="md:col-span-6 relative">
              <input
                type="text"
                placeholder="Paste suspicious URL, SMS text, or caller phone number..."
                value={scamUrlInput}
                onChange={(e) => setScamUrlInput(e.target.value)}
                className="w-full bg-[#070b16] border border-border-custom rounded-lg px-3 py-1.5 text-[11px] font-mono text-text-primary placeholder-text-secondary/70 focus:outline-none focus:border-accent-blue"
              />
            </div>
            
            <button
              onClick={handleCheckUrl}
              disabled={checkingUrl || !scamUrlInput}
              className="md:col-span-2 px-3 py-1.5 bg-bg-surface hover:bg-bg-surface-hover border border-border-custom hover:border-text-secondary rounded-lg text-[10px] font-bold font-mono text-text-primary transition-all disabled:opacity-55 cursor-pointer"
            >
              {checkingUrl ? 'Testing...' : 'Check Content'}
            </button>

            {urlVerdict && (
              <div className="md:col-span-12 mt-1 px-2.5 py-1.5 rounded bg-bg-surface border border-border-custom flex justify-between items-center text-[10px] font-mono">
                <div>
                  Verdict: <span className={urlVerdict.verdict === 'SAFE' ? 'text-success font-bold' : 'text-danger font-bold animate-pulse'}>
                    {urlVerdict.verdict}
                  </span> 
                  {urlVerdict.flagged_features?.length > 0 && (
                    <span className="text-text-secondary ml-2 font-normal">({urlVerdict.flagged_features.join(', ')})</span>
                  )}
                </div>
                <div className="text-text-secondary text-[9px] font-sans italic">{urlVerdict.recommendation}</div>
              </div>
            )}
          </div>

          {/* Typing message panel */}
          <div className="flex items-center space-x-3">
            <input
              type="text"
              placeholder="Type your message or describe a scam..."
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSendMessage(inputText);
              }}
              className="flex-1 bg-[#070b16] border border-border-custom rounded-xl px-4 py-3 text-xs text-text-primary placeholder-text-secondary focus:outline-none focus:border-accent-blue leading-relaxed font-mono"
            />
            <button
              onClick={() => handleSendMessage(inputText)}
              disabled={!inputText.trim() || sending}
              className="p-3 bg-accent-blue text-text-primary hover:bg-accent-blue-hover rounded-xl shadow transition disabled:opacity-55 cursor-pointer"
            >
              <Send className="w-4.5 h-4.5" />
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default FraudShield;
