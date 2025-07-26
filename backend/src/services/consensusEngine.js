const llmOrchestrator = require('./llmOrchestrator');
const { calculateTokenUsage } = require('../utils/tokenCalculator');

class ConsensusEngine {
  constructor() {
    // Define the 3+1 LLM architecture
    this.initialAnalysisLLMs = [
      { provider: 'openai', model: 'gpt-4', name: 'GPT-4' },
      { provider: 'anthropic', model: 'claude-3-sonnet-20240229', name: 'Claude-3-Sonnet' },
      { provider: 'google', model: 'gemini-1.5-pro', name: 'Gemini 1.5 Pro' }
    ];
    
    this.consensusReviewer = {
      provider: 'cohere',
      model: 'command-r-plus',
      name: 'Command R+'
    };
  }

  async generateConsensus(topic, sources, options = {}) {
    try {
      console.log('🚀 Starting 4-LLM consensus generation...');
      
      // Step 1: Generate initial reports from 3 LLMs
      const initialReports = await this.generateInitialReports(topic, sources);
      console.log(`✅ Generated ${initialReports.length} initial reports`);
      
      // Step 2: Use Command R+ to review all reports and generate final consensus
      const finalConsensus = await this.generateFinalConsensus(topic, sources, initialReports);
      console.log('✅ Generated final consensus with Command R+');
      
      // Calculate total token usage
      const totalTokens = [...initialReports, finalConsensus].reduce((sum, report) => sum + (report.tokenUsage?.total || 0), 0);
      
      return {
        consensus: finalConsensus.content,
        confidence: this.calculateConfidence(initialReports, finalConsensus),
        reports: {
          initial: initialReports.map(r => ({
            provider: r.provider,
            model: r.model,
            name: r.name,
            content: r.content,
            tokenUsage: r.tokenUsage
          })),
          final: {
            provider: finalConsensus.provider,
            model: finalConsensus.model,
            name: finalConsensus.name,
            content: finalConsensus.content,
            tokenUsage: finalConsensus.tokenUsage
          }
        },
        totalTokens,
        metadata: {
          topic,
          sourcesCount: sources.length,
          processingTime: Date.now(),
          llmsUsed: [...this.initialAnalysisLLMs, this.consensusReviewer].map(llm => llm.name)
        }
      };
    } catch (error) {
      console.error('❌ Consensus generation failed:', error);
      throw new Error(`Consensus generation failed: ${error.message}`);
    }
  }

  async generateInitialReports(topic, sources) {
    const prompt = this.buildInitialAnalysisPrompt(topic, sources);
    
    const queries = this.initialAnalysisLLMs.map(llm => ({
      provider: llm.provider,
      model: llm.model,
      prompt,
      options: { maxTokens: 1500, temperature: 0.7 }
    }));

    try {
      const responses = await llmOrchestrator.runParallelQueries(queries);
      
      return responses.map((response, index) => {
        const llm = this.initialAnalysisLLMs[index];
        
        if (response.error) {
          console.warn(`⚠️ ${llm.name} failed:`, response.error);
          return {
            provider: llm.provider,
            model: llm.model,
            name: llm.name,
            content: `Error: ${response.error}`,
            tokenUsage: { total: 0 },
            error: true
          };
        }
        
        return {
          provider: llm.provider,
          model: llm.model,
          name: llm.name,
          content: response.content,
          tokenUsage: response.tokenUsage
        };
      });
    } catch (error) {
      throw new Error(`Initial reports generation failed: ${error.message}`);
    }
  }

  async generateFinalConsensus(topic, sources, initialReports) {
    const prompt = this.buildConsensusReviewPrompt(topic, sources, initialReports);
    
    try {
      const response = await llmOrchestrator.executeQuery(
        this.consensusReviewer.provider,
        this.consensusReviewer.model,
        prompt,
        { maxTokens: 2000, temperature: 0.5 }
      );
      
      return {
        provider: this.consensusReviewer.provider,
        model: this.consensusReviewer.model,
        name: this.consensusReviewer.name,
        content: response.content,
        tokenUsage: response.tokenUsage
      };
    } catch (error) {
      throw new Error(`Final consensus generation failed: ${error.message}`);
    }
  }

  buildInitialAnalysisPrompt(topic, sources) {
    return `
You are an expert analyst tasked with providing a comprehensive analysis of the given topic and sources.

**Topic:** ${topic}

**Sources to analyze:**
${sources.map((source, index) => `${index + 1}. ${source}`).join('\n')}

**Instructions:**
1. Carefully analyze all provided sources
2. Identify key themes, arguments, and perspectives
3. Note any contradictions or agreements between sources
4. Provide your independent analysis and insights
5. Be objective and evidence-based in your assessment
6. Structure your response clearly with main points and supporting evidence

**Your analysis should be thorough but concise (aim for 800-1200 words).**

Please provide your analysis:
`;
  }

  buildConsensusReviewPrompt(topic, sources, initialReports) {
    const reportsSection = initialReports.map((report, index) => {
      if (report.error) {
        return `**${report.name}:** [Analysis unavailable due to error: ${report.content}]`;
      }
      return `**${report.name} Analysis:**\n${report.content}`;
    }).join('\n\n---\n\n');

    return `
You are a senior analyst tasked with reviewing multiple AI analyses and creating a comprehensive consensus report.

**Topic:** ${topic}

**Original Sources:**
${sources.map((source, index) => `${index + 1}. ${source}`).join('\n')}

**AI Analyses to Review:**

${reportsSection}

**Your Task:**
As the final reviewer, create a comprehensive consensus report that:

1. **Synthesizes** the key insights from all analyses
2. **Identifies** areas of agreement and disagreement between the analyses
3. **Evaluates** the strength of evidence and arguments presented
4. **Provides** your own expert assessment of the topic
5. **Concludes** with clear, actionable insights

**Structure your consensus report as follows:**
- **Executive Summary** (2-3 sentences)
- **Key Findings** (main points with evidence)
- **Areas of Consensus** (where analyses agree)
- **Conflicting Perspectives** (where analyses differ, with your assessment)
- **Expert Conclusion** (your synthesized judgment)
- **Recommendations** (if applicable)

**Aim for 1000-1500 words. Be authoritative, balanced, and evidence-based.**

Your consensus report:
`;
  }

  calculateConfidence(initialReports, finalConsensus) {
    // Base confidence on successful reports and consensus quality
    const successfulReports = initialReports.filter(report => !report.error).length;
    const baseConfidence = successfulReports / this.initialAnalysisLLMs.length;
    
    // Boost confidence if final consensus was generated successfully
    const finalBoost = finalConsensus && !finalConsensus.error ? 0.2 : 0;
    
    // Calculate final confidence (cap at 0.95)
    return Math.min(0.95, baseConfidence * 0.8 + finalBoost);
  }

  async estimateTokenUsage(topic, sources) {
    // Estimate tokens for the full 4-LLM process
    const initialPrompt = this.buildInitialAnalysisPrompt(topic, sources);
    const estimatedInitialTokens = calculateTokenUsage(initialPrompt, '') * 3; // 3 LLMs
    
    // Estimate final consensus tokens (including initial reports in prompt)
    const estimatedReportsLength = 1000 * 3; // ~1000 words per report
    const finalPromptEstimate = this.buildConsensusReviewPrompt(topic, sources, []).length + estimatedReportsLength;
    const estimatedFinalTokens = Math.ceil(finalPromptEstimate / 4); // Rough token estimate
    
    return {
      estimated: estimatedInitialTokens + estimatedFinalTokens,
      breakdown: {
        initial: estimatedInitialTokens,
        final: estimatedFinalTokens
      }
    };
  }
}

module.exports = new ConsensusEngine(); 