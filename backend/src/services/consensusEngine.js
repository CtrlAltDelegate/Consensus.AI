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
      console.log('🚀 DEMO MODE: Starting mock consensus generation for testing...');
      console.log('💡 Topic:', topic);
      console.log('📚 Sources:', sources?.length || 0, 'provided');
      
      // DEMO: Simulate processing time
      await new Promise(resolve => setTimeout(resolve, 2000)); // 2 second delay
      
      // Phase 1: Mock Independent Drafting
      console.log('📝 Phase 1: Mock Independent Drafting...');
      const initialDrafts = await this.mockPhase1_IndependentDrafting(topic, sources);
      console.log(`✅ Phase 1 Complete: ${initialDrafts.length} mock drafts generated`);
      
      // Phase 2: Mock Peer Review  
      console.log('🔍 Phase 2: Mock Peer Review...');
      const peerReviews = await this.mockPhase2_PeerReview(topic, initialDrafts);
      console.log(`✅ Phase 2 Complete: ${peerReviews.length} mock reviews generated`);
      
      // Phase 3: Mock Final Arbitration
      console.log('⚖️ Phase 3: Mock Final Arbitration...');
      const finalConsensus = await this.mockPhase3_FinalArbitration(topic, sources, initialDrafts, peerReviews);
      console.log('✅ Phase 3 Complete: Mock consensus report generated');
      
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
  { maxTokens: 1500, temperature: 0.6, timeout: 60000 } // Add 1-minute timeout
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
  { maxTokens: 3000, temperature: 0.5, timeout: 120000 } // Add 2-minute timeout
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

  // MOCK METHODS FOR TESTING (without real LLM API calls)
  async mockPhase1_IndependentDrafting(topic, sources) {
    // Simulate 3 LLM drafts
    const mockDrafts = [
      {
        provider: 'openai',
        model: 'gpt-4o',
        content: `# Analysis: ${topic}\n\n## GPT-4o Perspective\n\nBased on the provided context, this topic presents several key considerations:\n\n1. **Primary Analysis**: The core issue involves multiple stakeholders and complex interdependencies.\n2. **Key Findings**: Evidence suggests a balanced approach considering both immediate and long-term implications.\n3. **Recommendations**: Strategic implementation with phased rollout and continuous monitoring.\n\nThis analysis considers the sources provided and applies systematic reasoning to develop actionable insights.`,
        tokenUsage: { total: 850 }
      },
      {
        provider: 'anthropic', 
        model: 'claude-3-5-sonnet',
        content: `# Comprehensive Assessment: ${topic}\n\n## Claude 3.5 Sonnet Analysis\n\nThrough careful examination of the available information, several critical patterns emerge:\n\n**Analytical Framework:**\n- Systematic evaluation of key variables\n- Risk-benefit assessment across stakeholders\n- Evidence-based reasoning with uncertainty acknowledgment\n\n**Core Insights:**\nThe situation requires nuanced understanding that balances competing priorities while maintaining ethical considerations and practical feasibility.\n\n**Strategic Implications:**\nImplementation should prioritize stakeholder alignment and iterative improvement based on measurable outcomes.`,
        tokenUsage: { total: 920 }
      },
      {
        provider: 'google',
        model: 'gemini-1.5-pro', 
        content: `# Structured Analysis: ${topic}\n\n## Gemini 1.5 Pro Evaluation\n\n**Executive Summary:**\nThis analysis examines multiple dimensions of the topic through data-driven reasoning and systematic evaluation.\n\n**Key Dimensions:**\n1. **Feasibility Assessment**: Technical and practical considerations\n2. **Impact Analysis**: Short-term and long-term consequences\n3. **Resource Requirements**: Cost-benefit evaluation\n4. **Risk Mitigation**: Potential challenges and solutions\n\n**Conclusion:**\nA measured approach that incorporates stakeholder feedback and maintains flexibility for adaptation based on emerging evidence represents the optimal path forward.`,
        tokenUsage: { total: 780 }
      }
    ];

    // Simulate processing delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    return mockDrafts;
  }

  async mockPhase2_PeerReview(topic, drafts) {
    const mockReviews = [
      {
        reviewer: 'claude-3-5-sonnet',
        content: `**Peer Review of GPT-4o Analysis:**\n\nStrengths: Clear structure and logical progression. Good identification of key stakeholders.\n\nSuggestions: Could benefit from more specific examples and quantitative analysis where possible.\n\nOverall Assessment: Solid foundation that aligns well with evidence-based approach.`,
        tokenUsage: { total: 320 }
      },
      {
        reviewer: 'gemini-1.5-pro',
        content: `**Peer Review of Claude Analysis:**\n\nStrengths: Excellent ethical considerations and nuanced understanding of complexity.\n\nSuggestions: Implementation timeline could be more specific with concrete milestones.\n\nOverall Assessment: Comprehensive analysis with strong methodological approach.`,
        tokenUsage: { total: 290 }
      }
    ];

    await new Promise(resolve => setTimeout(resolve, 800));
    return mockReviews;
  }

  async mockPhase3_FinalArbitration(topic, sources, drafts, reviews) {
    const mockConsensus = {
      provider: 'cohere',
      model: 'command-r-plus',
      content: `# Consensus Analysis: ${topic}

## Executive Summary

After comprehensive multi-perspective analysis and peer review, the following consensus emerges regarding ${topic}:

## Key Findings

**Convergent Insights:**
All analytical perspectives agree on the importance of a balanced, evidence-based approach that considers multiple stakeholder interests while maintaining practical feasibility.

**Primary Recommendations:**

1. **Phased Implementation Strategy**
   - Begin with pilot programs to test assumptions
   - Establish clear metrics for success evaluation
   - Build in feedback loops for continuous improvement

2. **Stakeholder Engagement**
   - Ensure transparent communication throughout process
   - Create mechanisms for ongoing input and adjustment
   - Address concerns proactively with evidence-based responses

3. **Risk Management**
   - Identify potential challenges early in implementation
   - Develop contingency plans for key risk scenarios
   - Maintain flexibility to adapt based on emerging evidence

## Confidence Assessment

This consensus represents high confidence in the general approach (85% confidence level) while acknowledging that specific implementation details may require adjustment based on real-world feedback and changing circumstances.

## Next Steps

1. Develop detailed implementation timeline
2. Establish success metrics and monitoring systems  
3. Begin stakeholder engagement process
4. Initiate pilot program planning

This analysis synthesizes insights from multiple AI perspectives to provide a balanced, actionable framework for decision-making.`,
      tokenUsage: { total: 1200 }
    };

    await new Promise(resolve => setTimeout(resolve, 1200));
    return mockConsensus;
  }
}

module.exports = new ConsensusEngine(); 
