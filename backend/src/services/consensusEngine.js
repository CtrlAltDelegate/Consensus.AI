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

    // Demo mode for testing without real API calls
    this.demoMode = process.env.NODE_ENV === 'development' || !process.env.OPENAI_API_KEY;
  }

  async generateConsensus(topic, sources, options = {}) {
    try {
      console.log('🚀 Starting 3-phase consensus generation...');
      console.log(`🎭 Demo mode: ${this.demoMode ? 'ENABLED' : 'DISABLED'}`);
      
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
    if (this.demoMode) {
      return this.generateMockDrafts(topic, sources);
    }

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
    if (this.demoMode) {
      return this.generateMockReviews(topic, initialDrafts);
    }

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
    if (this.demoMode) {
      return this.generateMockFinalConsensus(topic, sources, initialDrafts, peerReviews);
    }

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

  // DEMO MODE: Mock drafts for testing
  async generateMockDrafts(topic, sources) {
    // Simulate processing time
    await new Promise(resolve => setTimeout(resolve, 2000));

    const mockDrafts = [
      {
        provider: 'openai',
        model: 'gpt-4o',
        name: 'GPT-4o',
        content: this.generateMockAnalysis(topic, 'gpt4o'),
        tokenUsage: { prompt: 180, completion: 850, total: 1030 }
      },
      {
        provider: 'anthropic',
        model: 'claude-3-5-sonnet-20241022',
        name: 'Claude 3.5 Sonnet',
        content: this.generateMockAnalysis(topic, 'claude'),
        tokenUsage: { prompt: 185, completion: 920, total: 1105 }
      },
      {
        provider: 'google',
        model: 'gemini-1.5-pro',
        name: 'Gemini 1.5 Pro',
        content: this.generateMockAnalysis(topic, 'gemini'),
        tokenUsage: { prompt: 175, completion: 880, total: 1055 }
      }
    ];

    return mockDrafts;
  }

  // DEMO MODE: Mock reviews
  async generateMockReviews(topic, initialDrafts) {
    await new Promise(resolve => setTimeout(resolve, 1500));

    return [
      {
        reviewer: 'Claude 3.5 Sonnet',
        reviewedModel: 'GPT-4o',
        content: 'Strong analytical framework with comprehensive coverage. The reasoning is sound and well-structured.',
        tokenUsage: { prompt: 920, completion: 340, total: 1260 }
      },
      {
        reviewer: 'Gemini 1.5 Pro',
        reviewedModel: 'Claude 3.5 Sonnet',
        content: 'Excellent depth of analysis with nuanced perspectives. Minor gaps in implementation considerations.',
        tokenUsage: { prompt: 950, completion: 380, total: 1330 }
      },
      {
        reviewer: 'GPT-4o',
        reviewedModel: 'Gemini 1.5 Pro',
        content: 'Well-balanced assessment with practical insights. Could benefit from additional risk analysis.',
        tokenUsage: { prompt: 880, completion: 360, total: 1240 }
      }
    ];
  }

  // DEMO MODE: Mock final consensus
  async generateMockFinalConsensus(topic, sources, initialDrafts, peerReviews) {
    await new Promise(resolve => setTimeout(resolve, 2000));

    return {
      provider: 'cohere',
      model: 'command-r-plus',
      name: 'Command R+',
      content: this.generateComprehensiveAnalysis(topic),
      tokenUsage: { prompt: 2850, completion: 1450, total: 4300 }
    };
  }

  generateMockAnalysis(topic, modelType) {
    const analysisTemplates = {
      gpt4o: `## Executive Summary

${topic} presents a multifaceted challenge requiring careful analysis across several dimensions. This analysis examines the core issues, implications, and potential pathways forward.

## Key Findings

**Primary Considerations:**
The central aspects of this topic involve complex interconnections between stakeholder interests, practical implementation challenges, and longer-term strategic implications.

**Risk Assessment:**
Several factors contribute to both opportunities and challenges in this domain, requiring balanced approaches that account for diverse perspectives and potential unintended consequences.

**Strategic Recommendations:**
1. Comprehensive stakeholder engagement throughout the process
2. Phased implementation with regular assessment points
3. Robust monitoring and feedback mechanisms
4. Adaptive management strategies to respond to changing conditions

## Conclusion

This analysis suggests that success requires a nuanced understanding of the various factors at play, combined with flexible implementation strategies that can adapt to emerging developments.`,

      claude: `## Introduction

${topic} represents a significant area of inquiry that demands thorough examination from multiple analytical perspectives. This assessment provides a structured evaluation of the key dimensions and considerations.

## Analysis Framework

**Contextual Background:**
The current landscape presents both established patterns and emerging trends that influence how we approach this topic. Historical precedents provide valuable insights while contemporary developments introduce new variables.

**Stakeholder Perspectives:**
Different groups bring varying priorities and concerns to this discussion, creating a complex web of interests that must be carefully balanced in any comprehensive approach.

**Implementation Considerations:**
Practical execution involves navigating regulatory frameworks, resource constraints, and operational challenges while maintaining focus on core objectives.

## Evidence-Based Assessment

The available evidence suggests that successful approaches typically share certain characteristics: clear communication, stakeholder buy-in, adequate resource allocation, and adaptive management capabilities.

## Recommendations

Based on this analysis, the most promising path forward involves a collaborative approach that leverages diverse expertise while maintaining clear accountability structures and measurable outcomes.`,

      gemini: `## Comprehensive Analysis

${topic} requires examination through multiple analytical lenses to develop a complete understanding of its implications and potential approaches.

## Methodological Approach

This analysis employs a systematic framework that considers:
- Historical context and precedents
- Current state assessment
- Future scenario planning
- Risk-benefit evaluation

## Core Findings

**Fundamental Drivers:**
The key forces shaping this domain include technological advancement, regulatory evolution, stakeholder expectations, and resource availability.

**Critical Success Factors:**
Research indicates that successful initiatives in this area typically demonstrate strong leadership, clear communication, adequate resources, and adaptive capacity.

**Potential Challenges:**
Common obstacles include coordination difficulties, resource constraints, stakeholder resistance, and implementation complexity.

## Strategic Options

Multiple pathways exist for addressing this topic, each with distinct advantages and trade-offs. The optimal approach likely involves elements from several strategies, customized to specific circumstances and objectives.

## Implementation Roadmap

A phased approach with clear milestones, regular evaluation points, and built-in flexibility appears most promising for achieving sustained success while managing associated risks.`
    };

    return analysisTemplates[modelType] || analysisTemplates.gpt4o;
  }

  generateComprehensiveAnalysis(topic) {
    return `# Consensus Analysis: ${topic}

## Executive Summary

This comprehensive analysis synthesizes insights from multiple AI perspectives to provide a balanced assessment of ${topic}. Through our 3-phase consensus methodology, we have identified key themes, evaluated different approaches, and developed actionable recommendations.

## Methodology

Our analysis employed a rigorous 3-phase process:

**Phase 1: Independent Analysis**
Three leading AI models independently analyzed the research question, each bringing unique analytical frameworks and perspectives to ensure comprehensive coverage.

**Phase 2: Peer Review**
Cross-model review identified areas of consensus and divergence, strengthening the analysis through constructive critique and validation.

**Phase 3: Synthesis**
Integration of all perspectives into a coherent consensus that balances different viewpoints while highlighting the most robust conclusions.

## Key Findings

### Primary Conclusions

The analysis reveals several critical insights about ${topic}:

1. **Complexity Recognition**: This topic involves multiple interconnected factors that require careful consideration of trade-offs and unintended consequences.

2. **Stakeholder Diversity**: Different groups bring legitimate but sometimes conflicting interests that must be balanced in any comprehensive approach.

3. **Implementation Challenges**: Success requires not just good planning but also adaptive execution that can respond to emerging circumstances.

### Areas of Consensus

All analytical perspectives converged on several key points:
- The importance of stakeholder engagement throughout any process
- The need for evidence-based decision making
- The value of phased implementation with regular assessment
- The critical role of clear communication and transparency

### Points of Divergence

While there was broad agreement on principles, perspectives differed on:
- The optimal timeline for implementation
- The relative importance of different risk factors
- The most effective governance structures
- Resource allocation priorities

## Strategic Recommendations

### Immediate Actions
1. **Stakeholder Mapping**: Identify and engage all relevant parties early in the process
2. **Baseline Assessment**: Establish clear metrics and current state evaluation
3. **Governance Framework**: Develop transparent decision-making processes
4. **Communication Strategy**: Create channels for ongoing dialogue and feedback

### Medium-term Initiatives
1. **Pilot Programs**: Test approaches on a smaller scale before full implementation
2. **Capacity Building**: Develop necessary skills and resources
3. **Partnership Development**: Build collaborative relationships with key stakeholders
4. **Risk Management**: Implement monitoring and mitigation strategies

### Long-term Vision
The ultimate goal should be creating sustainable, adaptive systems that can evolve with changing circumstances while maintaining core principles and achieving desired outcomes.

## Risk Assessment

**High-probability Risks:**
- Implementation complexity leading to delays or cost overruns
- Stakeholder resistance due to insufficient engagement
- Unintended consequences from incomplete understanding

**Mitigation Strategies:**
- Comprehensive planning with built-in flexibility
- Proactive stakeholder engagement and communication
- Regular monitoring and adaptive management

## Success Metrics

Effective evaluation should include both quantitative and qualitative measures:
- Achievement of stated objectives
- Stakeholder satisfaction levels
- Resource efficiency
- Unintended consequences (positive and negative)
- Adaptability to changing circumstances

## Conclusion

${topic} presents both significant opportunities and meaningful challenges. Success will depend on thoughtful planning, inclusive stakeholder engagement, adaptive implementation, and commitment to evidence-based decision making.

The consensus view is that while the path forward may be complex, there are viable approaches that can achieve positive outcomes when implemented with appropriate care and attention to the various factors identified in this analysis.

Through continued collaboration, monitoring, and willingness to adapt based on evidence, it is possible to make meaningful progress while managing associated risks and challenges.

---

*This analysis was generated through Consensus.AI's proprietary 4-LLM methodology, ensuring comprehensive evaluation from multiple AI perspectives.*`;
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