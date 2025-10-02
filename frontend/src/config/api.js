import axios from 'axios';

// API Configuration
// Debug environment detection
console.log('🔍 Environment Detection:', {
  MODE: import.meta.env.MODE,
  PROD: import.meta.env.PROD,
  DEV: import.meta.env.DEV
});

const API_CONFIG = {
  // Direct connection to Railway backend - CORS should be handled by backend
  baseURL: import.meta.env.MODE === 'production' ? 'https://consensusai-production.up.railway.app' : 'http://localhost:3001',
  timeout: 300000, // 5 minutes for 4-LLM consensus generation
  headers: {
    'Content-Type': 'application/json',
  },
};

console.log('🚀 API Config - Base URL:', API_CONFIG.baseURL);

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
  
  // Authentication endpoints
  auth: {
    register: '/api/auth/register',
    login: '/api/auth/login',
    logout: '/api/auth/logout',
    profile: '/api/auth/profile',
    verify: '/api/auth/verify',
    changePassword: '/api/auth/password',
    exportData: '/api/auth/export-data',
    deleteAccount: '/api/auth/delete-account',
    recoverAccount: '/api/auth/recover-account',
    deletionStatus: '/api/auth/deletion-status',
  },
  
  // Consensus endpoints
  consensus: {
    generate: '/api/consensus/generate',
    history: '/api/consensus/history',
    estimate: '/api/consensus/estimate',
    downloadPdf: (analysisId) => `/api/consensus/report/${analysisId}/pdf`,
    upload: '/api/consensus/upload',
    supportedTypes: '/api/consensus/upload/supported-types',
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
  
  // Admin endpoints
  admin: {
    users: '/api/admin/users',
    reports: '/api/admin/reports',
    stats: '/api/admin/stats',
    userAction: (userId, action) => `/api/admin/users/${userId}/${action}`,
    systemAction: (action) => `/api/admin/system/${action}`,
    deletedUsers: '/api/admin/users/deleted',
    restoreUser: (userId) => `/api/admin/users/${userId}/restore`,
    permanentDelete: (userId) => `/api/admin/users/${userId}/permanent`,
    exportUserData: (userId) => `/api/admin/users/${userId}/export`,
    dataRetention: {
      policies: '/api/admin/data-retention/policies',
      stats: '/api/admin/data-retention/stats',
      cleanup: '/api/admin/data-retention/cleanup',
    },
  },

  // Billing endpoints
  billing: {
    plans: '/api/billing/plans',
    subscription: '/api/billing/subscription',
    setupPayment: '/api/billing/setup-payment',
    createCheckout: '/api/billing/create-checkout-session',
    createPortal: '/api/billing/create-portal-session',
    cancel: '/api/billing/cancel-subscription',
    reactivate: '/api/billing/reactivate-subscription',
    invoices: '/api/billing/invoices',
    usage: '/api/billing/usage',
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
  
  // Support endpoints
  support: {
    contact: '/api/support/contact',
    feedback: '/api/support/feedback',
    stats: '/api/support/stats',
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
  
  // Authentication helpers
  register: (data) => api.post(API_ENDPOINTS.auth.register, data),
  login: (data) => api.post(API_ENDPOINTS.auth.login, data),
  logout: () => api.post(API_ENDPOINTS.auth.logout),
  getProfile: () => api.get(API_ENDPOINTS.auth.profile),
  updateProfile: (data) => api.put(API_ENDPOINTS.auth.profile, data),
  changePassword: (data) => api.put(API_ENDPOINTS.auth.changePassword, data),
  verifyToken: () => api.get(API_ENDPOINTS.auth.verify),
  exportUserData: () => api.get(API_ENDPOINTS.auth.exportData, { responseType: 'blob' }),
  deleteAccount: (data) => api.post(API_ENDPOINTS.auth.deleteAccount, data),
  recoverAccount: (data) => api.post(API_ENDPOINTS.auth.recoverAccount, data),
  getDeletionStatus: () => api.get(API_ENDPOINTS.auth.deletionStatus),
  
  // Consensus helpers
  generateConsensus: (data) => api.post(API_ENDPOINTS.consensus.generate, data),
  getConsensusHistory: (params = {}) => api.get(API_ENDPOINTS.consensus.history, { params }),
  estimateTokens: (data) => api.post(API_ENDPOINTS.consensus.estimate, data),
  downloadConsensusReport: (analysisId) => api.get(API_ENDPOINTS.consensus.downloadPdf(analysisId), { responseType: 'blob' }),
  uploadFiles: (files) => {
    const formData = new FormData();
    files.forEach(file => {
      formData.append('files', file);
    });
    return api.post(API_ENDPOINTS.consensus.upload, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      timeout: 60000, // 1 minute timeout for file uploads
    });
  },
  getSupportedFileTypes: () => api.get(API_ENDPOINTS.consensus.supportedTypes),
  
  // Token helpers
  getTokenUsage: () => api.get(API_ENDPOINTS.tokens.usage),
  getTokenHistory: (params = {}) => api.get(API_ENDPOINTS.tokens.history, { params }),
  checkTokenAvailability: (tokens) => api.post(API_ENDPOINTS.tokens.check, { tokens }),
  getTokenReport: () => api.get(API_ENDPOINTS.tokens.report, { responseType: 'blob' }),
  getTokenPricing: () => api.get(API_ENDPOINTS.tokens.pricing),
  getTokenLimits: () => api.get(API_ENDPOINTS.tokens.limits),
  
  // Admin helpers
  getAdminUsers: (params = {}) => api.get(API_ENDPOINTS.admin.users, { params }),
  getAdminReports: (params = {}) => api.get(API_ENDPOINTS.admin.reports, { params }),
  getAdminStats: () => api.get(API_ENDPOINTS.admin.stats),
  performUserAction: (userId, action, data = {}) => api.post(API_ENDPOINTS.admin.userAction(userId, action), data),
  performSystemAction: (action, data = {}) => api.post(API_ENDPOINTS.admin.systemAction(action), data),
  getDeletedUsers: (params = {}) => api.get(API_ENDPOINTS.admin.deletedUsers, { params }),
  restoreUser: (userId) => api.post(API_ENDPOINTS.admin.restoreUser(userId)),
  permanentDeleteUser: (userId, data) => api.delete(API_ENDPOINTS.admin.permanentDelete(userId), { data }),
  exportUserDataAdmin: (userId) => api.get(API_ENDPOINTS.admin.exportUserData(userId), { responseType: 'blob' }),
  getDataRetentionPolicies: () => api.get(API_ENDPOINTS.admin.dataRetention.policies),
  getDataRetentionStats: () => api.get(API_ENDPOINTS.admin.dataRetention.stats),
  performDataRetentionCleanup: () => api.post(API_ENDPOINTS.admin.dataRetention.cleanup),

  // Billing helpers
  getAvailablePlans: () => api.get(API_ENDPOINTS.billing.plans),
  getSubscription: () => api.get(API_ENDPOINTS.billing.subscription),
  setupPaymentMethod: () => api.post(API_ENDPOINTS.billing.setupPayment),
  createCheckoutSession: (data) => api.post(API_ENDPOINTS.billing.createCheckout, data),
  createPortalSession: () => api.post(API_ENDPOINTS.billing.createPortal),
  cancelSubscription: () => api.post(API_ENDPOINTS.billing.cancel),
  reactivateSubscription: () => api.post(API_ENDPOINTS.billing.reactivate),
  getBillingHistory: (params = {}) => api.get(API_ENDPOINTS.billing.invoices, { params }),
  getBillingUsage: () => api.get(API_ENDPOINTS.billing.usage),
  
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

  // Support helpers
  submitContactForm: (data) => api.post(API_ENDPOINTS.support.contact, data),
  submitFeedback: (data) => api.post(API_ENDPOINTS.support.feedback, data),
  getSupportStats: () => api.get(API_ENDPOINTS.support.stats),
};

// Export the configured axios instance
export default api; 