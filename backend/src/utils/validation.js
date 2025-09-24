const Joi = require('joi');

// User registration validation
const validateUserRegistration = (data) => {
  const schema = Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().min(6).required(),
    profile: Joi.object({
      firstName: Joi.string().min(1).max(50),
      lastName: Joi.string().min(1).max(50),
      organization: Joi.string().max(100)
    }).optional()
  });

  return schema.validate(data);
};

// User login validation
const validateUserLogin = (data) => {
  const schema = Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required()
  });

  return schema.validate(data);
};

// Consensus request validation
const validateConsensusRequest = (data) => {
  const schema = Joi.object({
    topic: Joi.string().min(10).max(1000).required(),
    sources: Joi.array()
      .items(Joi.string().min(1).max(5000))  // Reduced min from 10 to 1 for flexibility
      .min(0)  // Allow empty sources
      .max(10)
      .optional()
      .default([]),
    options: Joi.object({
      generatePdf: Joi.boolean().default(false),
      emailReport: Joi.boolean().default(false),
      includeMetadata: Joi.boolean().default(true),
      priority: Joi.string().valid('standard', 'detailed').default('standard'), // Add priority support
      confidenceThreshold: Joi.number().min(0).max(1).default(0.5),
      maxResponseLength: Joi.number().min(100).max(5000).default(2000)
    }).optional().default({})
  });

  return schema.validate(data);
};

// Subscription update validation
const validateSubscriptionUpdate = (data) => {
  const schema = Joi.object({
    tier: Joi.string().pattern(/^[0-9a-fA-F]{24}$/).required(), // MongoDB ObjectId
    billingPeriod: Joi.string().valid('monthly', 'yearly').default('monthly')
  });

  return schema.validate(data);
};

// Token check validation
const validateTokenCheck = (data) => {
  const schema = Joi.object({
    tokens: Joi.number().integer().min(1).max(500000).required()
  });

  return schema.validate(data);
};

// Profile update validation
const validateProfileUpdate = (data) => {
  const schema = Joi.object({
    profile: Joi.object({
      firstName: Joi.string().min(1).max(50),
      lastName: Joi.string().min(1).max(50),
      organization: Joi.string().max(100)
    }).required()
  });

  return schema.validate(data);
};

// Password change validation
const validatePasswordChange = (data) => {
  const schema = Joi.object({
    currentPassword: Joi.string().required(),
    newPassword: Joi.string().min(6).required(),
    confirmPassword: Joi.string().valid(Joi.ref('newPassword')).required()
  });

  return schema.validate(data);
};

// LLM provider configuration validation
const validateLLMConfig = (data) => {
  const schema = Joi.object({
    provider: Joi.string().valid('openai', 'anthropic', 'google', 'cohere').required(),
    model: Joi.string().required(),
    options: Joi.object({
      temperature: Joi.number().min(0).max(2).default(0.7),
      maxTokens: Joi.number().min(1).max(4000).default(1000),
      topP: Joi.number().min(0).max(1).default(1),
      frequencyPenalty: Joi.number().min(-2).max(2).default(0),
      presencePenalty: Joi.number().min(-2).max(2).default(0)
    }).optional()
  });

  return schema.validate(data);
};

// Billing address validation
const validateBillingAddress = (data) => {
  const schema = Joi.object({
    line1: Joi.string().required(),
    line2: Joi.string().allow('').optional(),
    city: Joi.string().required(),
    state: Joi.string().optional(),
    postalCode: Joi.string().required(),
    country: Joi.string().length(2).required() // ISO country code
  });

  return schema.validate(data);
};

// File upload validation
const validateFileUpload = (file) => {
  const allowedTypes = ['text/plain', 'application/pdf', 'text/csv', 'application/json'];
  const maxSize = 10 * 1024 * 1024; // 10MB

  if (!file) {
    return { error: { details: [{ message: 'No file provided' }] } };
  }

  if (!allowedTypes.includes(file.mimetype)) {
    return { error: { details: [{ message: 'Invalid file type. Allowed types: txt, pdf, csv, json' }] } };
  }

  if (file.size > maxSize) {
    return { error: { details: [{ message: 'File too large. Maximum size is 10MB' }] } };
  }

  return { error: null };
};

// Email template validation
const validateEmailTemplate = (data) => {
  const schema = Joi.object({
    subject: Joi.string().min(1).max(200).required(),
    htmlContent: Joi.string().required(),
    textContent: Joi.string().optional(),
    variables: Joi.object().optional()
  });

  return schema.validate(data);
};

// Webhook validation
const validateWebhookPayload = (data) => {
  const schema = Joi.object({
    type: Joi.string().required(),
    data: Joi.object().required(),
    created: Joi.number().integer().required(),
    id: Joi.string().required(),
    livemode: Joi.boolean().required(),
    object: Joi.string().valid('event').required(),
    pending_webhooks: Joi.number().integer().required(),
    request: Joi.object().optional()
  });

  return schema.validate(data);
};

// Common validation helpers
const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

const isValidObjectId = (id) => {
  const objectIdRegex = /^[0-9a-fA-F]{24}$/;
  return objectIdRegex.test(id);
};

const sanitizeString = (str, maxLength = 1000) => {
  if (typeof str !== 'string') return '';
  return str.trim().substring(0, maxLength);
};

const validatePagination = (page, limit) => {
  const pageNum = parseInt(page) || 1;
  const limitNum = parseInt(limit) || 10;
  
  return {
    page: Math.max(1, pageNum),
    limit: Math.min(100, Math.max(1, limitNum)) // Max 100 items per page
  };
};

// Contact form validation
const validateContactForm = (data) => {
  const schema = Joi.object({
    name: Joi.string().min(2).max(100).required(),
    email: Joi.string().email().required(),
    subject: Joi.string().min(5).max(200).required(),
    category: Joi.string().valid('general', 'technical', 'billing', 'feature', 'bug', 'account').required(),
    message: Joi.string().min(10).max(2000).required(),
    priority: Joi.string().valid('low', 'normal', 'high', 'critical').required()
  });

  return schema.validate(data);
};

// Feedback form validation
const validateFeedbackForm = (data) => {
  const schema = Joi.object({
    type: Joi.string().valid('feature', 'bug', 'improvement', 'general').required(),
    title: Joi.string().min(5).max(200).required(),
    description: Joi.string().min(10).max(2000).required(),
    category: Joi.string().valid('general', 'consensus', 'reports', 'dashboard', 'billing', 'api', 'mobile', 'performance').required(),
    priority: Joi.string().valid('low', 'medium', 'high', 'critical').required(),
    email: Joi.string().email().allow('').optional(),
    allowContact: Joi.boolean().optional()
  });

  return schema.validate(data);
};

module.exports = {
  validateUserRegistration,
  validateUserLogin,
  validateConsensusRequest,
  validateSubscriptionUpdate,
  validateTokenCheck,
  validateProfileUpdate,
  validatePasswordChange,
  validateLLMConfig,
  validateBillingAddress,
  validateFileUpload,
  validateEmailTemplate,
  validateWebhookPayload,
  validateContactForm,
  validateFeedbackForm,
  isValidEmail,
  isValidObjectId,
  sanitizeString,
  validatePagination
}; 