const axios = require('axios');

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/** Redact API key from URL before logging. */
function redactKeyFromUrl(url) {
  if (!url || typeof url !== 'string') return url;
  return url.replace(/key=AIzaSy[A-Za-z0-9_-]+/gi, 'key=[REDACTED]');
}

/** Parse "Please retry in X.XXs" from Google error message for backoff. */
function parseRetryAfterSeconds(error) {
  const msg = (error.response?.data?.error?.message || error.message || '');
  const match = msg.match(/retry in (\d+(?:\.\d+)?)\s*s/i);
  if (match) return Math.min(60, Math.max(5, parseFloat(match[1])));
  const header = error.response?.headers?.['retry-after'];
  if (header) return Math.min(60, Math.max(5, parseInt(header, 10) || 30));
  return 30;
}

class LLMOrchestrator {
  constructor() {
    this.providers = new Map();
    this.initializeProviders();
  }

  initializeProviders() {
    // OpenAI Configuration
    if (process.env.OPENAI_API_KEY) {
      this.providers.set('openai', {
        name: 'OpenAI',
        models: ['gpt-4o', 'gpt-4', 'gpt-3.5-turbo'],
        endpoint: 'https://api.openai.com/v1/chat/completions',
        headers: {
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
          'Content-Type': 'application/json'
        }
      });
    }

    // Anthropic Configuration (current models: claude-sonnet-4-5; older 3.x IDs retired)
    if (process.env.ANTHROPIC_API_KEY) {
      this.providers.set('anthropic', {
        name: 'Anthropic',
        models: ['claude-sonnet-4-5', 'claude-3-5-sonnet-20240620', 'claude-3-sonnet-20240229', 'claude-3-haiku-20240307'],
        endpoint: 'https://api.anthropic.com/v1/messages',
        headers: {
          'x-api-key': process.env.ANTHROPIC_API_KEY,
          'Content-Type': 'application/json',
          'anthropic-version': '2023-06-01'
        }
      });
    }

    // Google Gemini Configuration (v1beta has generateContent for gemini-1.5-*; v1 lacks some models)
    if (process.env.GOOGLE_API_KEY) {
      this.providers.set('google', {
        name: 'Google',
        models: ['gemini-2.0-flash', 'gemini-1.5-flash', 'gemini-1.5-pro'],
        endpoint: 'https://generativelanguage.googleapis.com/v1beta/models',
        headers: {
          'Content-Type': 'application/json'
        }
      });
    }

    // Cohere Configuration (command-r and command-r-plus removed Sept 2025; use 08-2024)
    if (process.env.COHERE_API_KEY) {
      this.providers.set('cohere', {
        name: 'Cohere',
        models: ['command-r-plus-08-2024', 'command-r-08-2024', 'command-a-03-2025', 'command'],
        endpoint: 'https://api.cohere.ai/v1/chat',
        headers: {
          'Authorization': `Bearer ${process.env.COHERE_API_KEY}`,
          'Content-Type': 'application/json'
        }
      });
    }
  }

  async executeQuery(provider, model, prompt, options = {}) {
    const providerConfig = this.providers.get(provider);
    if (!providerConfig) {
      throw new Error(`Provider ${provider} not configured`);
    }

    const requestBody = this.buildRequestBody(provider, model, prompt, options);
    const endpoint = provider === 'google'
      ? `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${process.env.GOOGLE_API_KEY}`
      : providerConfig.endpoint;

    if (!endpoint) {
      throw new Error(`Endpoint is undefined for provider ${provider}`);
    }

    const maxRetries = (options.retryOnQuota !== false) ? 2 : 0;
    let lastError;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        if (attempt > 0) console.log(`🌐 ${provider} (${model}) retry ${attempt}/${maxRetries}`);
        else console.log(`🌐 ${provider} (${model})`);

        const response = await axios.post(endpoint, requestBody, {
          headers: providerConfig.headers,
          timeout: options.timeout || 60000
        });

        console.log(`✅ ${provider} response received successfully`);
        return this.parseResponse(provider, response.data);
      } catch (error) {
        lastError = error;
        const status = error.response?.status;
        const isTimeout = error.code === 'ECONNABORTED' || /timeout/i.test(error.message || '');

        if ((status === 429 || status === 503) && attempt < maxRetries) {
          const waitSec = parseRetryAfterSeconds(error);
          console.warn(`⏳ ${provider} quota/rate limit (${status}), retrying in ${waitSec}s...`);
          await sleep(waitSec * 1000);
          continue;
        }
        if (status >= 500 && status < 600 && attempt < maxRetries) {
          const waitSec = attempt === 0 ? 5 : 15;
          console.warn(`⏳ ${provider} server error (${status}), retrying in ${waitSec}s...`);
          await sleep(waitSec * 1000);
          continue;
        }
        if (isTimeout && attempt < 1) {
          console.warn(`⏳ ${provider} request timed out, retrying once in 5s...`);
          await sleep(5000);
          continue;
        }

        console.error(`❌ ${provider} API call failed:`, {
          provider,
          model,
          error: error.message,
          status: error.response?.status,
          statusText: error.response?.statusText,
          data: error.response?.data,
          endpoint: redactKeyFromUrl(endpoint) || 'UNDEFINED',
          requestBodyPreview: JSON.stringify(requestBody).substring(0, 200) + '...',
          headers: providerConfig.headers,
          fullErrorData: error.response?.data ? JSON.stringify(error.response.data, null, 2) : 'No response data'
        });
        throw new Error(`${provider} (${model}) API failed: ${error.message}`);
      }
    }

    throw new Error(`${provider} (${model}) API failed: ${lastError?.message || 'Unknown'}`);
  }

  buildRequestBody(provider, model, prompt, options) {
    switch (provider) {
      case 'openai':
        return {
          model,
          messages: [{ role: 'user', content: prompt }],
          max_tokens: options.maxTokens || 1000,
          temperature: options.temperature || 0.7
        };
      
      case 'anthropic':
        return {
          model,
          max_tokens: options.maxTokens || 1000,
          temperature: options.temperature || 0.7,
          messages: [{ role: 'user', content: prompt }]
        };
      
      case 'google':
        return {
          contents: [{
            parts: [{
              text: prompt
            }]
          }],
          generationConfig: {
            temperature: options.temperature || 0.7,
            maxOutputTokens: options.maxTokens || 1000
          }
        };
      
      case 'cohere':
        return {
          message: prompt,
          model,
          max_tokens: options.maxTokens || 1000,
          temperature: options.temperature || 0.7,
          stream: false
        };
      
      default:
        throw new Error(`Unsupported provider: ${provider}`);
    }
  }

  parseResponse(provider, responseData) {
    switch (provider) {
      case 'openai':
        return {
          content: responseData.choices[0].message.content,
          tokenUsage: {
            prompt: responseData.usage.prompt_tokens,
            completion: responseData.usage.completion_tokens,
            total: responseData.usage.total_tokens
          }
        };
      
      case 'anthropic':
        return {
          content: responseData.content[0].text,
          tokenUsage: {
            prompt: responseData.usage.input_tokens,
            completion: responseData.usage.output_tokens,
            total: responseData.usage.input_tokens + responseData.usage.output_tokens
          }
        };
      
      case 'google':
        return {
          content: responseData.candidates[0].content.parts[0].text,
          tokenUsage: {
            prompt: responseData.usageMetadata?.promptTokenCount || 0,
            completion: responseData.usageMetadata?.candidatesTokenCount || 0,
            total: responseData.usageMetadata?.totalTokenCount || 0
          }
        };
      
      case 'cohere':
        return {
          content: responseData.text,
          tokenUsage: {
            prompt: responseData.meta?.billed_units?.input_tokens || 0,
            completion: responseData.meta?.billed_units?.output_tokens || 0,
            total: (responseData.meta?.billed_units?.input_tokens || 0) + (responseData.meta?.billed_units?.output_tokens || 0)
          }
        };
      
      default:
        throw new Error(`Unsupported provider: ${provider}`);
    }
  }

  getAvailableProviders() {
    return Array.from(this.providers.entries()).map(([key, config]) => ({
      id: key,
      name: config.name,
      models: config.models
    }));
  }

  async runParallelQueries(queries) {
    const promises = queries.map(query =>
      this.executeQuery(query.provider, query.model, query.prompt, query.options)
        .catch(error => ({ error: error.message, ...query }))
    );
    return Promise.all(promises);
  }

  /**
   * Execute a query with fallback models. Tries primary (provider, model) first;
   * on failure tries each entry in fallbacks in order. Returns first success.
   * fallbacks: [{ provider, model }, ...]
   */
  async executeQueryWithFallback(provider, model, prompt, options = {}, fallbacks = []) {
    const chain = [{ provider, model }, ...fallbacks];
    let lastError;
    for (let i = 0; i < chain.length; i++) {
      const { provider: p, model: m } = chain[i];
      try {
        const result = await this.executeQuery(p, m, prompt, options);
        if (i > 0) result._fallbackUsed = `${p}/${m}`;
        return result;
      } catch (err) {
        lastError = err;
        console.warn(`⚠️ ${p}/${m} failed, trying next fallback:`, err.message);
      }
    }
    throw lastError || new Error('No fallback succeeded');
  }
}

module.exports = new LLMOrchestrator(); 
