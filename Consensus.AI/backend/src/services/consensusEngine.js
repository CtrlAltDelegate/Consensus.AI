const axios = require('axios');
const { calculateTokenUsage } = require('../utils/tokenCalculator');

class ConsensusEngine {
  constructor() {
    this.llmProviders = {
      openai: {
        apiKey: process.env.OPENAI_API_KEY,
        endpoint: 'https://api.openai.com/v1/chat/completions',
        model: 'gpt-4'
      },
      anthropic: {
        apiKey: process.env.ANTHROPIC_API_KEY,
        endpoint: 'https://api.anthropic.com/v1/messages',
        model: 'claude-3-sonnet-20240229'
      }
    };
  }

  async generateConsensus(topic, sources, options = {}) {
    try {
      const responses = await this.queryMultipleLLMs(topic, sources);
      const consensus = await this.synthesizeResponses(responses);
      
      return {
        consensus,
        confidence: this.calculateConfidence(responses),
        sources: responses.map(r => ({
          provider: r.provider,
          model: r.model,
          tokenUsage: r.tokenUsage
        })),
        totalTokens: responses.reduce((sum, r) => sum + r.tokenUsage, 0)
      };
    } catch (error) {
      throw new Error(`Consensus generation failed: ${error.message}`);
    }
  }

  async queryMultipleLLMs(topic, sources) {
    const prompt = this.buildPrompt(topic, sources);
    const promises = Object.entries(this.llmProviders).map(([provider, config]) => 
      this.queryLLM(provider, config, prompt)
    );
    
    return Promise.all(promises);
  }

  async queryLLM(provider, config, prompt) {
    // Implementation would vary based on provider
    const response = await axios.post(config.endpoint, {
      model: config.model,
      messages: [{ role: 'user', content: prompt }]
    }, {
      headers: {
        'Authorization': `Bearer ${config.apiKey}`,
        'Content-Type': 'application/json'
      }
    });

    return {
      provider,
      model: config.model,
      response: response.data.choices[0].message.content,
      tokenUsage: calculateTokenUsage(prompt, response.data.choices[0].message.content)
    };
  }

  buildPrompt(topic, sources) {
    return `
    Analyze the following topic and sources to provide a comprehensive consensus:
    
    Topic: ${topic}
    
    Sources:
    ${sources.map((source, index) => `${index + 1}. ${source}`).join('\n')}
    
    Please provide a balanced analysis that synthesizes information from all sources.
    `;
  }

  async synthesizeResponses(responses) {
    // Simple implementation - in practice, this would be more sophisticated
    const combinedResponses = responses.map(r => r.response).join('\n\n---\n\n');
    
    // This would typically involve another LLM call to synthesize
    return `Consensus based on ${responses.length} AI models:\n\n${combinedResponses}`;
  }

  calculateConfidence(responses) {
    // Simplified confidence calculation
    return Math.min(0.95, 0.5 + (responses.length * 0.15));
  }
}

module.exports = new ConsensusEngine(); 