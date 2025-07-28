const llmOrchestrator = require('./llmOrchestrator');
const { calculateTokenUsage } = require('../utils/tokenCalculator');

class ConsensusEngine {
  constructor() {
    // Define the LLM architecture for 3-phase workflow
    this.draftingLLMs = [
      { provider: 'openai', model: 'gpt-4o', name: 'GPT-4o' },
      { provider: 'anthropic', model: 'claude-3-5-sonnet-20241022', name: 'Claude 3.5 Sonnet' },
      { provider: 'google', model: 'gemini-1.5-pro', name: 'Gemini 1.5 Pro' }
    ];
    
    this.arbiterLLM = {
      provider: 'cohere',
      model: 'command-r-plus',
      name: 'Command R+'
    };

    // Always use real API calls - no demo mode
  }

  async generateConsensus(topic, sources, options = {}) {
    try {
      console.log('🚀 Starting 3-phase consensus generation with real LLM APIs...');
      
      // Phase 1: Independent Drafting
      console.log('📝 Phase 1: Independent Drafting...');
      const initialDrafts = await this.phase1_IndependentDrafting(topic, sources);
      console.log(`✅ Phase 1 Complete: ${initialDrafts.length} independent drafts generated`);
      
      // Phase 2: Peer Review
      console.log('🔍 Phase 2: Peer Review...');
      const peerReviews = await this.phase2_PeerReview(topic, initialDrafts);
      console.log(`✅ Phase 2 Complete: ${peerReviews.length} peer reviews generated`);
      
      // Phase 3: Final Arbitration
      console.log('⚖️ Phase 3: Final Arbitration...');
      const finalConsensus = await this.phase3_FinalArbitration(topic, sources, initialDrafts, peerReviews);
      console.log('✅ Phase 3 Complete: Final consensus report generated');
      
      // Calculate total token usage
      const allResponses = [...initialDrafts, ...peerReviews, finalConsensus];
      const totalTokens = allResponses.reduce((sum, response) => sum + (response.tokenUsage?.total || 0), 0);
      
      return {
        consensus: finalConsensus.content,
        confidence: this.calculateConfidence(initialDrafts, peerReviews, finalConsensus),
        phases: {
          phase1_drafts: initialDrafts.map(d => ({
            provider: d.provider,
            model: d.model,
            name: d.name,
            content: d.content,
            tokenUsage: d.tokenUsage
          })),
          phase2_reviews: peerReviews.map(r => ({
            reviewer: r.reviewer,
            reviewedModel: r.reviewedModel,
            content: r.content,
            tokenUsage: r.tokenUsage
          })),
          phase3_consensus: {
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
          llmsUsed: [...this.draftingLLMs, this.arbiterLLM].map(llm => llm.name),
          workflow: '3-phase'
        }
      };
    } catch (error) {
      console.error('❌ Consensus generation failed:', error);
      throw new Error(`Consensus generation failed: ${error.message}`);
    }
  }

  // PHASE 1: Independent Drafting
  async phase1_IndependentDrafting(topic, sources) {
    const prompt = this.buildDraftingPrompt(topic, sources);
    
    const queries = this.draftingLLMs.map(llm => ({
      provider: llm.provider,
      model: llm.model,
      prompt,
      options: { maxTokens: 2000, temperature: 0.7 }
    }));

    try {
      const responses = await llmOrchestrator.runParallelQueries(queries);
      
      return responses.map((response, index) => {
        const llm = this.draftingLLMs[index];
        
        if (response.error) {
          console.warn(`⚠️ ${llm.name} drafting failed:`, response.error);
          return {
            provider: llm.provider,
            model: llm.model,
            name: llm.name,
            content: `Error in drafting phase: ${response.error}`,
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
      throw new Error(`Phase 1 (Independent Drafting) failed: ${error.message}`);
    }
  }

  // PHASE 2: Peer Review
  async phase2_PeerReview(topic, initialDrafts) {
    const successfulDrafts = initialDrafts.filter(draft => !draft.error);
    const allReviews = [];

    // Each model reviews the other models' drafts
    for (const reviewer of successfulDrafts) {
      const otherDrafts = successfulDrafts.filter(draft => draft.name !== reviewer.name);
      
      for (const draftToReview of otherDrafts) {
        const reviewPrompt = this.buildPeerReviewPrompt(topic, draftToReview, reviewer.name);
        
        try {
          const response = await llmOrchestrator.executeQuery(
            reviewer.provider,
            reviewer.model,
            reviewPrompt,
            { maxTokens: 1500, temperature: 0.6 }
          );
          
          allReviews.push({
            reviewer: reviewer.name,
            reviewedModel: draftToReview.name,
            content: response.content,
            tokenUsage: response.tokenUsage
          });
        } catch (error) {
          console.warn(`⚠️ ${reviewer.name} peer review failed:`, error);
          allReviews.push({
            reviewer: reviewer.name,
            reviewedModel: draftToReview.name,
            content: `Error in peer review: ${error.message}`,
            tokenUsage: { total: 0 },
            error: true
          });
        }
      }
    }

    return allReviews;
  }

  // PHASE 3: Final Arbitration
  async phase3_FinalArbitration(topic, sources, initialDrafts, peerReviews) {
    const prompt = this.buildArbitrationPrompt(topic, sources, initialDrafts, peerReviews);
    
    try {
      const response = await llmOrchestrator.executeQuery(
        this.arbiterLLM.provider,
        this.arbiterLLM.model,
        prompt,
        { maxTokens: 3000, temperature: 0.5 }
      );
      
      return {
        provider: this.arbiterLLM.provider,
        model: this.arbiterLLM.model,
        name: this.arbiterLLM.name,
        content: response.content,
        tokenUsage: response.tokenUsage
      };
    } catch (error) {
      throw new Error(`Phase 3 (Final Arbitration) failed: ${error.message}`);
    }
  }

  buildDraftingPrompt(topic, sources) {
    return `You are an expert analyst providing an independent, comprehensive response to a complex question.

**Question/Topic:** ${topic}

**Sources to consider:**
${sources.map((source, index) => `${index + 1}. ${source}`).join('\n')}

**Instructions:**
- Provide a thorough, well-reasoned response to the question
- Consider multiple perspectives and potential implications
- Base your analysis on evidence and logical reasoning
- Structure your response clearly with headings and key points
- Aim for 800-1200 words of substantive analysis

Please provide your independent analysis:`;
  }

  buildPeerReviewPrompt(topic, draftToReview, reviewerName) {
    return `You are conducting a peer review of another AI model's analysis.

**Original Question:** ${topic}

**Analysis to Review:**
${draftToReview.content}

**Your task as ${reviewerName}:**
- Evaluate the strengths and weaknesses of this analysis
- Identify any gaps, biases, or areas for improvement
- Assess the logical consistency and evidence quality
- Provide constructive feedback (300-500 words)

Your peer review:`;
  }

  buildArbitrationPrompt(topic, sources, initialDrafts, peerReviews) {
    return `You are the final arbitrator synthesizing multiple AI analyses into a consensus report.

**Question:** ${topic}

**Available Analyses:**
${initialDrafts.map((draft, i) => `\n**${draft.name} Analysis:**\n${draft.content}`).join('\n')}

**Peer Reviews:**
${peerReviews.map((review, i) => `\n**${review.reviewer} reviewing ${review.reviewedModel}:**\n${review.content}`).join('\n')}

**Your task:**
- Synthesize all perspectives into a balanced, comprehensive consensus
- Identify areas of agreement and disagreement
- Provide nuanced conclusions that acknowledge complexity
- Structure as a formal report with clear sections
- Aim for 1000-1500 words

Generate the final consensus report:`;
  }

  calculateConfidence(initialDrafts, peerReviews, finalConsensus) {
    // Simple confidence calculation based on agreement and quality
    const successfulDrafts = initialDrafts.filter(d => !d.error).length;
    const successfulReviews = peerReviews.filter(r => !r.error).length;
    
    let confidence = 0.5; // Base confidence
    
    // Boost confidence for successful phases
    if (successfulDrafts >= 3) confidence += 0.2;
    if (successfulReviews >= 2) confidence += 0.15;
    if (!finalConsensus.error) confidence += 0.15;
    
    return Math.min(0.95, confidence); // Cap at 95%
  }

  async estimateTokenUsage(topic, sources) {
    // Estimate tokens for the complete 3-phase process
    const draftingPrompt = this.buildDraftingPrompt(topic, sources);
    const estimatedDraftingTokens = calculateTokenUsage(draftingPrompt, '') * 3; // 3 LLMs
    
    // Estimate peer review tokens (each model reviews 2 others)
    const avgDraftLength = 1500; // words
    const reviewPrompt = this.buildPeerReviewPrompt(topic, { content: 'x'.repeat(avgDraftLength) }, 'Reviewer');
    const estimatedReviewTokens = calculateTokenUsage(reviewPrompt, '') * 6; // 3 models × 2 reviews each
    
    // Estimate final arbitration tokens
    const arbitrationPrompt = this.buildArbitrationPrompt(topic, sources, [], []);
    const estimatedArbitrationTokens = calculateTokenUsage(arbitrationPrompt, '') + (avgDraftLength * 3) + (500 * 6); // Include content
    
    const total = estimatedDraftingTokens + estimatedReviewTokens + estimatedArbitrationTokens;
    
    return {
      estimated: total,
      breakdown: {
        phase1_drafting: estimatedDraftingTokens,
        phase2_reviews: estimatedReviewTokens,
        phase3_arbitration: estimatedArbitrationTokens
      }
    };
  }
}

module.exports = new ConsensusEngine(); 