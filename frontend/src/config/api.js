import axios from 'axios';

// API Configuration
const API_CONFIG = {
  // Direct connection to Railway backend - CORS should be handled by backend
  baseURL: import.meta.env.PROD ? 'https://consensusai-production.up.railway.app' : 'http://localhost:3001',
  timeout: 120000, // 2 minutes for 4-LLM consensus generation
  headers: {
    'Content-Type': 'application/json',
  },
};

// Create axios instance
const api = axios.create(API_CONFIG);

// Request interceptor for auth tokens
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Handle common errors
    if (error.response?.status === 401) {
      // Unauthorized - clear token and redirect to login
      localStorage.removeItem('auth_token');
      console.log('🚫 401 Unauthorized - would redirect to login (disabled for testing)');
    } else if (error.response?.status === 429) {
      // Rate limited
      console.warn('Rate limited. Please try again later.');
    } else if (error.response?.status >= 500) {
      // Server error
      console.error('Server error:', error.response.data);
    }
    
    return Promise.reject(error);
  }
);

// API endpoints
export const API_ENDPOINTS = {
  // Health check
  health: '/health',
  
  // Consensus endpoints
  consensus: {
    generate: '/api/consensus/generate',
    history: '/api/consensus/history',
    estimate: '/api/consensus/estimate',
    downloadPdf: (analysisId) => `/api/consensus/report/${analysisId}/pdf`,
  },
  
  // Token endpoints
  tokens: {
    usage: '/api/tokens/usage',
    history: '/api/tokens/usage/history',
    check: '/api/tokens/check',
    report: '/api/tokens/usage/report',
    pricing: '/api/tokens/pricing',
    limits: '/api/tokens/limits',
    reset: '/api/tokens/reset', // Admin only
  },
  
  // Billing endpoints
  billing: {
    subscription: '/api/billing/subscription',
    history: '/api/billing/history',
    setupIntent: '/api/billing/setup-intent',
    plans: '/api/billing/plans',
  },
  
  // Reports endpoints
  reports: {
    list: '/api/reports',
    get: (reportId) => `/api/reports/${reportId}`,
    create: '/api/reports',
    update: (reportId) => `/api/reports/${reportId}`,
    delete: (reportId) => `/api/reports/${reportId}`,
    bulkDelete: '/api/reports',
    stats: '/api/reports/stats/overview',
    export: '/api/reports/export',
    downloadPdf: (jobId) => `/api/consensus/report/${jobId}/pdf`,
  },
  
  // Webhook endpoints (for testing)
  webhooks: {
    stripe: '/api/webhooks/stripe',
    test: '/api/webhooks/test',
  },
};

// Helper functions for common API calls
export const apiHelpers = {
  // Health check
  checkHealth: () => api.get(API_ENDPOINTS.health),
  
  // Consensus helpers
  generateConsensus: (data) => api.post(API_ENDPOINTS.consensus.generate, data),
  getConsensusHistory: (params = {}) => api.get(API_ENDPOINTS.consensus.history, { params }),
  estimateTokens: (data) => api.post(API_ENDPOINTS.consensus.estimate, data),
  downloadConsensusReport: (analysisId) => api.get(API_ENDPOINTS.consensus.downloadPdf(analysisId), { responseType: 'blob' }),
  
  // Token helpers
  getTokenUsage: () => api.get(API_ENDPOINTS.tokens.usage),
  getTokenHistory: (params = {}) => api.get(API_ENDPOINTS.tokens.history, { params }),
  checkTokenAvailability: (tokens) => api.post(API_ENDPOINTS.tokens.check, { tokens }),
  getTokenReport: () => api.get(API_ENDPOINTS.tokens.report, { responseType: 'blob' }),
  getTokenPricing: () => api.get(API_ENDPOINTS.tokens.pricing),
  getTokenLimits: () => api.get(API_ENDPOINTS.tokens.limits),
  
  // Billing helpers
  getSubscription: () => api.get(API_ENDPOINTS.billing.subscription),
  updateSubscription: (data) => api.put(API_ENDPOINTS.billing.subscription, data),
  cancelSubscription: () => api.delete(API_ENDPOINTS.billing.subscription),
  getBillingHistory: (params = {}) => api.get(API_ENDPOINTS.billing.history, { params }),
  createSetupIntent: () => api.post(API_ENDPOINTS.billing.setupIntent),
  getAvailablePlans: () => api.get(API_ENDPOINTS.billing.plans),
  
  // Reports helpers
  getReports: (params = {}) => api.get(API_ENDPOINTS.reports.list, { params }),
  getReport: (reportId) => api.get(API_ENDPOINTS.reports.get(reportId)),
  saveReport: (data) => api.post(API_ENDPOINTS.reports.create, data),
  updateReport: (reportId, data) => api.patch(API_ENDPOINTS.reports.update(reportId), data),
  deleteReport: (reportId) => api.delete(API_ENDPOINTS.reports.delete(reportId)),
  bulkDeleteReports: (reportIds) => api.delete(API_ENDPOINTS.reports.bulkDelete, { data: { reportIds } }),
  getReportStats: () => api.get(API_ENDPOINTS.reports.stats),
  exportReports: (reportIds, format) => api.post(API_ENDPOINTS.reports.export, { reportIds, format }, { responseType: 'blob' }),
  downloadReportPdf: (jobId) => api.get(API_ENDPOINTS.reports.downloadPdf(jobId), { responseType: 'blob' }),
};

// Export the configured axios instance
export default api; 