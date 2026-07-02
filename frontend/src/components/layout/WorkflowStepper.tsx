import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, ArrowRight, XCircle } from 'lucide-react';
import { getWorkflowState, clearWorkflowState, setWorkflowStep, WorkflowStep } from '../../lib/workflow';

export const WorkflowStepper: React.FC = () => {
  const navigate = useNavigate();
  const [workflow, setWorkflow] = useState(getWorkflowState());

  // Listen to workflow changes across components
  useEffect(() => {
    const handleWorkflowChange = () => {
      setWorkflow(getWorkflowState());
    };
    window.addEventListener('vyuh_workflow_change', handleWorkflowChange);
    return () => {
      window.removeEventListener('vyuh_workflow_change', handleWorkflowChange);
    };
  }, []);

  if (!workflow.activeStep) return null;

  const stepsConfig: { id: WorkflowStep; label: string; route: string; desc: string }[] = [
    { id: 'citizen_report', label: '1. Case Origin', route: '/shield', desc: 'Citizen complaint intake' },
    { id: 'scam_analysis', label: '2. Scam Score', route: '/scam', desc: 'Impersonation classification' },
    { id: 'graph_intelligence', label: '3. Graph Homology', route: '/fraud-graph', desc: 'UPI mule ring cluster trace' },
    { id: 'crime_map', label: '4. GIS Corridor', route: '/map', desc: 'Money flow & dispatch coordinates' },
    { id: 'case_package', label: '5. Submission', route: '/', desc: 'Court ready evidence package' },
  ];

  const currentIndex = stepsConfig.findIndex((s) => s.id === workflow.activeStep);

  const handleExit = () => {
    clearWorkflowState();
    navigate('/');
  };

  const handleNextStep = () => {
    if (currentIndex < stepsConfig.length - 1) {
      const nextStep = stepsConfig[currentIndex + 1];
      setWorkflowStep(nextStep.id);
      navigate(nextStep.route);
    }
  };

  const handlePrevStep = () => {
    if (currentIndex > 0) {
      const prevStep = stepsConfig[currentIndex - 1];
      setWorkflowStep(prevStep.id);
      navigate(prevStep.route);
    }
  };

  const getStepButtonLabel = () => {
    switch (workflow.activeStep) {
      case 'citizen_report':
        return 'Verify Scam Classification';
      case 'scam_analysis':
        return 'Map UPI Transactions Graph';
      case 'graph_intelligence':
        return 'Locate State Money Corridor';
      case 'crime_map':
        return 'Compile Legal Evidence';
      case 'case_package':
        return 'Inquiry Active — Final Report';
      default:
        return 'Next Stage';
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -15 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -15 }}
        className="mb-6 z-10 no-print"
      >
        <div className="card-glass bg-[#0d162df2] border border-accent-blue/35 p-4 flex flex-col md:flex-row items-center justify-between gap-4 shadow-xl shadow-accent-blue/[0.04]">
          {/* Left Title details */}
          <div className="flex items-center space-x-3 shrink-0">
            <div className="p-2 bg-accent-blue/15 border border-accent-blue/30 rounded-lg text-accent-blue glow-accent animate-pulse-slow">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[9px] font-mono font-bold text-accent-blue uppercase tracking-widest block">
                Active Tactical Pipeline (VTIP)
              </span>
              <h4 className="text-xs font-bold font-mono text-text-primary uppercase truncate max-w-[200px]">
                Case: {workflow.data.caseId || 'SYS-TRACE-ACTIVE'}
              </h4>
            </div>
          </div>

          {/* Center Timeline indicators */}
          <div className="flex flex-1 items-center justify-center max-w-2xl px-4 select-none overflow-x-auto w-full py-1">
            {stepsConfig.map((st, idx) => {
              const isActive = st.id === workflow.activeStep;
              const isPassed = currentIndex > idx;
              
              return (
                <React.Fragment key={st.id}>
                  <div
                    onClick={() => {
                      setWorkflowStep(st.id);
                      navigate(st.route);
                    }}
                    className={`flex flex-col items-center cursor-pointer px-1 shrink-0 ${
                      isActive 
                        ? 'opacity-100 scale-105' 
                        : isPassed 
                          ? 'opacity-70' 
                          : 'opacity-40 hover:opacity-75'
                    }`}
                  >
                    <span className={`text-[10px] font-mono font-bold tracking-wider px-2.5 py-1 rounded-lg border transition ${
                      isActive 
                        ? 'bg-accent-blue text-text-primary border-accent-blue glow-accent' 
                        : isPassed 
                          ? 'bg-success/10 text-success border-success/35'
                          : 'bg-bg-primary text-text-secondary border-border-custom'
                    }`}>
                      {st.label}
                    </span>
                    <span className="text-[8px] font-mono text-text-secondary uppercase mt-1 hidden sm:inline-block">
                      {st.id === 'citizen_report' && workflow.data.phone ? `Acc: ${workflow.data.accountId?.slice(-4) || 'Alert'}` : st.desc}
                    </span>
                  </div>
                  
                  {idx < stepsConfig.length - 1 && (
                    <div className={`h-[1.5px] flex-1 min-w-[15px] mx-1 ${
                      isPassed ? 'bg-success/50' : 'bg-border-custom'
                    }`} />
                  )}
                </React.Fragment>
              );
            })}
          </div>

          {/* Right Workflow Actions */}
          <div className="flex items-center space-x-2 shrink-0">
            <button
              onClick={handlePrevStep}
              disabled={currentIndex === 0}
              className="px-3 py-1.5 bg-bg-primary hover:bg-bg-surface-hover border border-border-custom text-text-secondary hover:text-text-primary rounded-lg text-xs font-bold font-mono transition disabled:opacity-30 cursor-pointer"
            >
              &larr; Prev
            </button>
            <button
              onClick={handleNextStep}
              disabled={currentIndex === stepsConfig.length - 1}
              className="px-4 py-1.5 bg-accent-blue text-text-primary hover:bg-accent-blue-hover rounded-lg text-xs font-bold font-mono transition flex items-center gap-1 cursor-pointer glow-accent"
            >
              {getStepButtonLabel()} <ArrowRight className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={handleExit}
              className="p-1.5 bg-danger/10 hover:bg-danger/20 border border-danger/30 hover:border-danger text-danger rounded-lg transition"
              title="Close and Clear active workflow"
            >
              <XCircle className="w-4 h-4" />
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default WorkflowStepper;
