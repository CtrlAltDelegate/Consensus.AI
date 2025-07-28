const axios = require('axios');

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

    // Anthropic Configuration
    if (process.env.ANTHROPIC_API_KEY) {
      this.providers.set('anthropic', {
        name: 'Anthropic',
        models: ['claude-3-5-sonnet-20241022', 'claude-3-sonnet-20240229', 'claude-3-haiku-20240307'],
        endpoint: 'https://api.anthropic.com/v1/messages',
        headers: {
          'x-api-key': process.env.ANTHROPIC_API_KEY,
          'Content-Type': 'application/json',
          'anthropic-version': '2023-06-01'
        }
      });
    }

    // Google Gemini Configuration
    if (process.env.GOOGLE_API_KEY) {
      this.providers.set('google', {
        name: 'Google',
        models: ['gemini-1.5-pro', 'gemini-1.5-flash'],
        endpoint: `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent?key=${process.env.GOOGLE_API_KEY}`,
        headers: {
          'Content-Type': 'application/json'
        }
      });
    }

    // Cohere Configuration
    if (process.env.COHERE_API_KEY) {
      this.providers.set('cohere', {
        name: 'Cohere',
        models: ['command-r-plus', 'command-r', 'command'],
        endpoint: 'https://api.cohere.ai/v1/generate',
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
    
    try {
      // Special handling for Google Gemini endpoint
      const endpoint = provider === 'google' 
        ? `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${process.env.GOOGLE_API_KEY}`
        : providerConfig.endpoint;

      const response = await axios.post(endpoint, requestBody, {
        headers: providerConfig.headers,
        timeout: options.timeout || 30000
      });

      return this.parseResponse(provider, response.data);
    } catch (error) {
      throw new Error(`LLM query failed for ${provider}: ${error.message}`);
    }
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
          model,
          message: prompt,
          temperature: options.temperature || 0.7,
          max_tokens: options.maxTokens || 1000
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
            prompt: responseData.meta?.tokens?.input_tokens || 0,
            completion: responseData.meta?.tokens?.output_tokens || 0,
            total: (responseData.meta?.tokens?.input_tokens || 0) + (responseData.meta?.tokens?.output_tokens || 0)
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
}

module.exports = new LLMOrchestrator(); 