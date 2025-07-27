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
  }

  async generateConsensus(topic, sources, options = {}) {
    try {
      console.log('🚀 Starting 3-phase consensus generation...');
      
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
            { maxTokens: 1000, temperature: 0.6 }
          );
          
          allReviews.push({
            reviewer: reviewer.name,
            reviewedModel: draftToReview.name,
            content: response.content,
            tokenUsage: response.tokenUsage
          });
        } catch (error) {
          console.warn(`⚠️ ${reviewer.name} failed to review ${draftToReview.name}:`, error.message);
          allReviews.push({
            reviewer: reviewer.name,
            reviewedModel: draftToReview.name,
            content: `Review failed: ${error.message}`,
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
    const arbitrationPrompt = this.buildArbitrationPrompt(topic, sources, initialDrafts, peerReviews);
    
    try {
      const response = await llmOrchestrator.executeQuery(
        this.arbiterLLM.provider,
        this.arbiterLLM.model,
        arbitrationPrompt,
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
- Draw insights from the provided sources where relevant
- Use your expertise to add context and analysis beyond the sources
- Be clear, logical, and evidence-based
- Structure your response with clear sections and arguments
- Aim for 1000-1500 words

**Your independent analysis:**`;
  }

  buildPeerReviewPrompt(topic, draftToReview, reviewerName) {
    return `You are ${reviewerName}, conducting a peer review of another AI model's response to the same question.

**Original Question:** ${topic}

**Response to Review:**
${draftToReview.content}

**Your task is to provide a structured critique using this format:**

**SUMMARY:** (2-3 sentences summarizing the peer's response)

**STRENGTHS:**
- Clarity and organization
- Depth of analysis  
- Use of evidence/citations
- Logical reasoning
- Coverage of key points

**WEAKNESSES/BLIND SPOTS:**
- Missing perspectives or considerations
- Logical gaps or inconsistencies
- Areas lacking sufficient evidence
- Unclear or confusing sections

**SUGGESTIONS FOR IMPROVEMENT:**
- Specific recommendations to strengthen the response
- Additional angles or perspectives to consider
- Ways to better structure or present the information

Keep your review constructive, specific, and focused on improving the quality of analysis.`;
  }

  buildArbitrationPrompt(topic, sources, initialDrafts, peerReviews) {
    const draftsSection = initialDrafts.filter(d => !d.error).map(draft => 
      `**${draft.name} Response:**\n${draft.content}`
    ).join('\n\n---\n\n');

    const reviewsSection = peerReviews.filter(r => !r.error).map(review =>
      `**${review.reviewer} reviewing ${review.reviewedModel}:**\n${review.content}`
    ).join('\n\n---\n\n');

    return `You are Command R+, the final arbiter in a multi-LLM consensus process. Your task is to synthesize all previous responses and reviews into a definitive, high-quality consensus report.

**Original Question:** ${topic}

**Original Sources:**
${sources.map((source, index) => `${index + 1}. ${source}`).join('\n')}

**PHASE 1 - INDEPENDENT RESPONSES:**
${draftsSection}

**PHASE 2 - PEER REVIEWS:**
${reviewsSection}

**Your task as the arbiter:**
Create a comprehensive, authoritative consensus report that synthesizes the best insights from all responses while addressing the critiques raised in the peer reviews.

**Required structure:**
## Summary
(3-4 sentences capturing the essence of the consensus)

## Key Findings  
(Main insights with supporting evidence)

## Reasoning Process
(How you arrived at these conclusions, considering all perspectives)

## Final Answer
(Clear, definitive response to the original question)

## Confidence Assessment
(Your confidence level in this consensus and why)

**Guidelines:**
- Be authoritative and definitive while acknowledging uncertainty where appropriate
- Integrate the strongest points from each response
- Address weaknesses identified in peer reviews
- Provide a cohesive, well-structured final answer
- Aim for 1500-2000 words
- Focus on delivering maximum value to the user

**Consensus Report:**`;
  }

  calculateConfidence(initialDrafts, peerReviews, finalConsensus) {
    const successfulDrafts = initialDrafts.filter(d => !d.error).length;
    const successfulReviews = peerReviews.filter(r => !r.error).length;
    const maxPossibleReviews = successfulDrafts * (successfulDrafts - 1); // Each reviews all others
    
    // Base confidence on successful completions
    const draftingSuccess = successfulDrafts / this.draftingLLMs.length;
    const reviewSuccess = maxPossibleReviews > 0 ? successfulReviews / maxPossibleReviews : 0;
    const arbitrationSuccess = finalConsensus && !finalConsensus.error ? 1 : 0;
    
    // Weighted confidence score
    const confidence = (draftingSuccess * 0.4) + (reviewSuccess * 0.3) + (arbitrationSuccess * 0.3);
    
    return Math.min(0.98, Math.max(0.1, confidence));
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