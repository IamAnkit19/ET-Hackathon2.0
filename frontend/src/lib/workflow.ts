export interface WorkflowData {
  complaintText?: string;
  scamType?: string;
  urgencyLevel?: string;
  phone?: string;
  state?: string;
  district?: string;
  accountId?: string;
  ringId?: number;
  caseId?: string;
  visScore?: number;
  patrolRecommendations?: string[];
  evidenceGenerated?: boolean;
}

export type WorkflowStep = 'citizen_report' | 'scam_analysis' | 'graph_intelligence' | 'crime_map' | 'case_package';

export interface WorkflowState {
  activeStep: WorkflowStep | null;
  data: WorkflowData;
}

const STORAGE_KEY = 'vyuh_workflow_context';

export const getWorkflowState = (): WorkflowState => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (e) {
    console.error('Failed to read workflow context:', e);
  }
  return { activeStep: null, data: {} };
};

export const saveWorkflowState = (state: WorkflowState) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    // Dispatch a custom event to notify other components of changes
    window.dispatchEvent(new Event('vyuh_workflow_change'));
  } catch (e) {
    console.error('Failed to save workflow context:', e);
  }
};

export const clearWorkflowState = () => {
  try {
    localStorage.removeItem(STORAGE_KEY);
    window.dispatchEvent(new Event('vyuh_workflow_change'));
  } catch (e) {
    console.error('Failed to clear workflow context:', e);
  }
};

export const setWorkflowStep = (step: WorkflowStep | null) => {
  const current = getWorkflowState();
  current.activeStep = step;
  saveWorkflowState(current);
};

export const updateWorkflowData = (updates: Partial<WorkflowData>) => {
  const current = getWorkflowState();
  current.data = { ...current.data, ...updates };
  saveWorkflowState(current);
};
