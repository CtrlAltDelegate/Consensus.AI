/**
 * Token calculation utilities for different LLM providers
 * This provides estimates for token usage based on text input
 */

// Approximate token counts for different providers
const TOKEN_RATIOS = {
  openai: {
    charactersPerToken: 4, // GPT models average ~4 characters per token
    wordsPerToken: 0.75   // ~0.75 words per token
  },
  anthropic: {
    charactersPerToken: 3.5, // Claude models are slightly more efficient
    wordsPerToken: 0.7
  },
  default: {
    charactersPerToken: 4,
    wordsPerToken: 0.75
  }
};

// Base costs for different operation types (in tokens)
const OPERATION_BASE_COSTS = {
  consensus: 500,      // Base cost for consensus generation
  analysis: 200,       // Base cost for analysis
  summary: 100,        // Base cost for summarization
  comparison: 300,     // Base cost for comparison
  classification: 150  // Base cost for classification
};

/**
 * Calculate estimated tokens for a given text
 * @param {string} text - Input text
 * @param {string} provider - LLM provider ('openai', 'anthropic', etc.)
 * @returns {number} Estimated token count
 */
const calculateTokensFromText = (text, provider = 'default') => {
  if (!text || typeof text !== 'string') return 0;
  
  const ratios = TOKEN_RATIOS[provider] || TOKEN_RATIOS.default;
  const characterCount = text.length;
  const wordCount = text.split(/\s+/).filter(word => word.length > 0).length;
  
  // Use both character and word-based estimates and take the higher one
  const charBasedEstimate = Math.ceil(characterCount / ratios.charactersPerToken);
  const wordBasedEstimate = Math.ceil(wordCount / ratios.wordsPerToken);
  
  return Math.max(charBasedEstimate, wordBasedEstimate);
};

/**
 * Calculate tokens for both input and expected output
 * @param {string} inputText - Input text
 * @param {string} outputText - Output text (if available)
 * @param {string} provider - LLM provider
 * @returns {number} Total token count
 */
const calculateTokenUsage = (inputText, outputText = '', provider = 'default') => {
  const inputTokens = calculateTokensFromText(inputText, provider);
  const outputTokens = calculateTokensFromText(outputText, provider);
  
  return inputTokens + outputTokens;
};

/**
 * Estimate tokens for a consensus operation
 * @param {string} topic - The topic for consensus
 * @param {string[]} sources - Array of source texts
 * @param {Object} options - Operation options
 * @returns {number} Estimated token count
 */
const estimateConsensusTokens = (topic, sources = [], options = {}) => {
  const baseCost = OPERATION_BASE_COSTS.consensus;
  
  // Calculate input tokens
  const topicTokens = calculateTokensFromText(topic);
  const sourceTokens = sources.reduce((total, source) => {
    return total + calculateTokensFromText(source);
  }, 0);
  
  // Estimate output tokens based on complexity
  const complexityMultiplier = sources.length > 5 ? 2 : 1.5;
  const estimatedOutputTokens = Math.ceil((topicTokens + sourceTokens) * 0.3 * complexityMultiplier);
  
  // Add base cost and provider-specific multipliers
  const providerMultiplier = options.providers ? options.providers.length : 2; // Default 2 providers
  
  return Math.ceil((baseCost + topicTokens + sourceTokens + estimatedOutputTokens) * providerMultiplier);
};

/**
 * Estimate tokens for analysis operations
 * @param {string} content - Content to analyze
 * @param {string} analysisType - Type of analysis ('summary', 'classification', etc.)
 * @param {Object} options - Analysis options
 * @returns {number} Estimated token count
 */
const estimateAnalysisTokens = (content, analysisType = 'analysis', options = {}) => {
  const baseCost = OPERATION_BASE_COSTS[analysisType] || OPERATION_BASE_COSTS.analysis;
  const inputTokens = calculateTokensFromText(content);
  
  // Estimate output based on analysis type
  let outputMultiplier;
  switch (analysisType) {
    case 'summary':
      outputMultiplier = 0.2; // Summaries are typically 20% of input
      break;
    case 'classification':
      outputMultiplier = 0.05; // Classifications are very short
      break;
    case 'comparison':
      outputMultiplier = 0.4; // Comparisons can be verbose
      break;
    default:
      outputMultiplier = 0.3;
  }
  
  const estimatedOutputTokens = Math.ceil(inputTokens * outputMultiplier);
  
  return baseCost + inputTokens + estimatedOutputTokens;
};

/**
 * Calculate cost in USD for token usage
 * @param {number} tokens - Number of tokens
 * @param {string} tier - Subscription tier
 * @param {boolean} isOverage - Whether this is overage usage
 * @returns {number} Cost in USD
 */
const calculateTokenCost = (tokens, tier = 'basic', isOverage = false) => {
  if (isOverage) {
    // Overage pricing: $0.001 per token
    return tokens * 0.001;
  }
  
  // Included in subscription, no additional cost
  return 0;
};

/**
 * Get token limits for subscription tiers
 * @param {string} tier - Subscription tier
 * @returns {number} Token limit
 */
const getTokenLimit = (tier) => {
  const limits = {
    basic: 10000,
    pro: 50000,
    enterprise: 200000
  };
  
  return limits[tier] || limits.basic;
};

/**
 * Calculate remaining tokens for a user
 * @param {number} used - Tokens used in current period
 * @param {string} tier - Subscription tier
 * @returns {Object} Token usage information
 */
const calculateRemainingTokens = (used, tier) => {
  const limit = getTokenLimit(tier);
  const remaining = Math.max(0, limit - used);
  const usagePercentage = (used / limit) * 100;
  
  return {
    used,
    limit,
    remaining,
    usagePercentage: Math.round(usagePercentage * 100) / 100,
    isOverLimit: used > limit,
    overageTokens: Math.max(0, used - limit)
  };
};

/**
 * Estimate batch operation tokens
 * @param {Array} operations - Array of operations
 * @returns {number} Total estimated tokens
 */
const estimateBatchTokens = (operations) => {
  return operations.reduce((total, operation) => {
    switch (operation.type) {
      case 'consensus':
        return total + estimateConsensusTokens(operation.topic, operation.sources, operation.options);
      case 'analysis':
        return total + estimateAnalysisTokens(operation.content, operation.analysisType, operation.options);
      default:
        return total + calculateTokensFromText(operation.content || '');
    }
  }, 0);
};

/**
 * Get provider-specific token costs
 * @param {number} inputTokens - Input tokens
 * @param {number} outputTokens - Output tokens
 * @param {string} provider - Provider name
 * @param {string} model - Model name
 * @returns {number} Cost in USD
 */
const getProviderTokenCost = (inputTokens, outputTokens, provider, model) => {
  // This would contain real pricing from providers
  // For now, return a simplified estimate
  const rates = {
    'openai': {
      'gpt-4': { input: 0.03/1000, output: 0.06/1000 },
      'gpt-3.5-turbo': { input: 0.001/1000, output: 0.002/1000 }
    },
    'anthropic': {
      'claude-3-sonnet': { input: 0.003/1000, output: 0.015/1000 },
      'claude-3-haiku': { input: 0.00025/1000, output: 0.00125/1000 }
    }
  };
  
  const rate = rates[provider]?.[model];
  if (!rate) return 0;
  
  return (inputTokens * rate.input) + (outputTokens * rate.output);
};

module.exports = {
  calculateTokensFromText,
  calculateTokenUsage,
  estimateConsensusTokens,
  estimateAnalysisTokens,
  calculateTokenCost,
  getTokenLimit,
  calculateRemainingTokens,
  estimateBatchTokens,
  getProviderTokenCost,
  TOKEN_RATIOS,
  OPERATION_BASE_COSTS
}; 