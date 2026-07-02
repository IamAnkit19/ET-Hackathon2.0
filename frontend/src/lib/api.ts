import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:8000/api',
});

// Dashboard
export const getDashboardSummary = () => api.get('/dashboard-summary');

// Module 1 - Fraud Graph
export const getGraphNetwork = () => api.get('/graph/network');
export const getGraphRings = () => api.get('/graph/rings');
export const getGraphNode = (acctId: string) => api.get(`/graph/node/${acctId}`);
export const investigateAccount = (accountId: string) => api.post('/graph/investigate', { account_id: accountId });
export const getExportEvidenceUrl = (caseId: string) => `http://localhost:8000/api/graph/export-evidence/${caseId}`;
export const uploadTransactionsCSV = (formData: FormData) => api.post('/graph/upload', formData, {
  headers: { 'Content-Type': 'multipart/form-data' }
});

// Module 2 - Scam Detector
export const analyzeComplaint = (text: string, state?: string) => api.post('/scam/analyze-complaint', { text, state });
export const analyzeCall = (data: { duration: number; caller_prefix: string; time_hour: number; transfer_proximity: number }) => 
  api.post('/scam/analyze-call', data);
export const getScamPatterns = () => api.get('/scam/patterns');
export const getScamLeaderboard = () => api.get('/scam/leaderboard');
export const reportScam = (data: { text: string; scam_type: string; phone: string; state: string; district: string }) => 
  api.post('/scam/report', data);

// Module 3 - Currency Verifier
export const verifyNote = (formData: FormData) => api.post('/currency/verify', formData, {
  headers: { 'Content-Type': 'multipart/form-data' }
});
export const getCurrencyStats = () => api.get('/currency/stats');
export const getCurrencyTrends = () => api.get('/currency/trends');
export const getCurrencyFeatures = (denom: number) => api.get(`/currency/features/${denom}`);

// Module 4 - Fraud Shield Chatbot
export const sendChatbotMessage = (message: string) => api.post('/chatbot/message', { message });
export const analyzeSuspiciousContent = (content: string) => api.post('/chatbot/analyze-content', { content });
export const getHelplines = () => api.get('/chatbot/helplines');

// Module 5 - Crime Map
export const getHeatmap = () => api.get('/map/heatmap');
export const getIncidents = () => api.get('/map/incidents');
export const getFICNSeizures = () => api.get('/map/ficn-seizures');
export const getHotspots = () => api.get('/map/hotspots');
export const getCorridors = () => api.get('/map/corridors');
export const getPatrolRecommendations = (district: string) => api.get(`/map/patrol-recommend?district=${district}`);
export const reportMapIncident = (data: { crime_type: string; severity: string; description: string; state: string; district: string; latitude: number; longitude: number }) => 
  api.post('/map/report', data);

export default api;
