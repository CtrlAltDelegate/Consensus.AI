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
        models: ['gpt-4', 'gpt-3.5-turbo'],
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
        models: ['claude-3-sonnet-20240229', 'claude-3-haiku-20240307'],
        endpoint: 'https://api.anthropic.com/v1/messages',
        headers: {
          'x-api-key': process.env.ANTHROPIC_API_KEY,
          'Content-Type': 'application/json',
          'anthropic-version': '2023-06-01'
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
      const response = await axios.post(providerConfig.endpoint, requestBody, {
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