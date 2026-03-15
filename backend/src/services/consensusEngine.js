const llmOrchestrator = require('./llmOrchestrator');
const { calculateTokenUsage } = require('../utils/tokenCalculator');

class ConsensusEngine {
  constructor() {
    this.draftingLLMs = [
      { provider: 'openai', model: 'gpt-4o', name: 'GPT-4o' },
      { provider: 'anthropic', model: 'claude-sonnet-4-5', name: 'Claude Sonnet 4.5' },
      { provider: 'google', model: 'gemini-2.0-flash', name: 'Gemini 2.0 Flash' }
    ];

    this.arbiterLLM = {
      provider: 'cohere',
      model: 'command-r-plus-08-2024',
      name: 'Command R+'
    };
    // Fallback arbiters if primary is down (single provider outage shouldn't take down product)
    this.arbiterFallbacks = [
      { provider: 'anthropic', model: 'claude-sonnet-4-5', name: 'Claude Sonnet 4.5' },
      { provider: 'openai', model: 'gpt-4o', name: 'GPT-4o' }
    ];
  }

  /** Build partial consensus result from best available draft (graceful degradation) */
  _buildPartialResult(initialDrafts, peerReviews, topic, sources, reason) {
    const successfulDrafts = initialDrafts.filter(d => !d.error);
    const best = successfulDrafts[0];
    if (!best) return null;
    const totalTokens = [...initialDrafts, ...peerReviews]
      .reduce((sum, r) => sum + (r.tokenUsage?.total || 0), 0) + (best.tokenUsage?.total || 0);
    return {
      consensus: `**Note: This is a single-model analysis due to ${reason}.**\n\n${best.content}`,
      confidence: Math.min(0.75, 0.5 + successfulDrafts.length * 0.1),
      phases: {
        phase1_drafts: initialDrafts.map(d => ({
          provider: d.provider,
          model: d.model,
          name: d.name,
          content: d.content,
          tokenUsage: d.tokenUsage,
          error: d.error || false
        })),
        phase2_reviews: (peerReviews || []).map(r => ({
          reviewer: r.reviewer,
          reviewedModel: r.reviewedModel,
          content: r.content,
          tokenUsage: r.tokenUsage,
          error: r.error || false
        })),
        phase3_consensus: {
          provider: best.provider,
          model: best.model,
          name: best.name,
          content: best.content,
          tokenUsage: best.tokenUsage,
          fallback: true,
          partial: true
        }
      },
      totalTokens,
      metadata: {
        topic,
        sourcesCount: sources?.length ?? 0,
        processingTime: Date.now(),
        llmsUsed: initialDrafts.map(d => d.name).filter(Boolean),
        workflow: '3-phase',
        successfulDrafts: successfulDrafts.length,
        totalDrafts: initialDrafts.length,
        arbitrationFallback: true,
        partial: true,
        partialReason: reason
      }
    };
  }

  async generateConsensus(topic, sources, options = {}) {
    const onPhaseChange = options.onPhaseChange;
    let initialDrafts = [];
    let successfulDrafts = [];
    let peerReviews = [];

    try {
      if (onPhaseChange) onPhaseChange('phase1');
      console.log('🚀 Starting 3-phase consensus generation with real LLM APIs...');
      console.log('💡 Topic:', topic);
      console.log('📚 Sources:', sources?.length || 0, 'provided');

      // Phase 1: Independent Drafting (with per-draft retry for transient failures)
      console.log('📝 Phase 1: Independent Drafting...');
      initialDrafts = await this.phase1_IndependentDrafting(topic, sources);
      successfulDrafts = initialDrafts.filter(d => !d.error);
      console.log(`✅ Phase 1 Complete: ${successfulDrafts.length}/${initialDrafts.length} independent drafts generated successfully`);

      if (successfulDrafts.length === 0) {
        throw new Error('All LLM providers failed in Phase 1. Cannot proceed with consensus generation.');
      }

      // Phase 2: Peer Review (only if we have multiple successful drafts)
      if (successfulDrafts.length > 1) {
        if (onPhaseChange) onPhaseChange('phase2');
        console.log('🔍 Phase 2: Peer Review...');
        peerReviews = await this.phase2_PeerReview(topic, initialDrafts);
        const successfulReviews = peerReviews.filter(r => !r.error);
        console.log(`✅ Phase 2 Complete: ${successfulReviews.length}/${peerReviews.length} peer reviews generated successfully`);
      } else {
        console.log('⏭️ Phase 2 Skipped: Only one successful draft available');
      }

      // Phase 3: Final Arbitration (with fallback arbiters so one provider outage doesn't kill the product)
      if (onPhaseChange) onPhaseChange('phase3');
      console.log('⚖️ Phase 3: Final Arbitration...');
      let finalConsensus;
      try {
        finalConsensus = await this.phase3_FinalArbitration(topic, sources, initialDrafts, peerReviews);
        console.log('✅ Phase 3 Complete: Final consensus report generated');
      } catch (arbitrationError) {
        console.warn('⚠️ Phase 3 arbitration failed, using best available draft as fallback:', arbitrationError.message);
        const bestDraft = successfulDrafts[0];
        finalConsensus = {
          provider: bestDraft.provider,
          model: bestDraft.model,
          name: bestDraft.name,
          content: `**Note: This is a single-model analysis due to arbitration issues.**\n\n${bestDraft.content}`,
          tokenUsage: bestDraft.tokenUsage,
          fallback: true
        };
      }

      const allResponses = [...initialDrafts, ...peerReviews, finalConsensus];
      const totalTokens = allResponses.reduce((sum, r) => sum + (r.tokenUsage?.total || 0), 0);

      return {
        consensus: finalConsensus.content,
        confidence: this.calculateConfidence(initialDrafts, peerReviews, finalConsensus),
        phases: {
          phase1_drafts: initialDrafts.map(d => ({
            provider: d.provider,
            model: d.model,
            name: d.name,
            content: d.content,
            tokenUsage: d.tokenUsage,
            error: d.error || false
          })),
          phase2_reviews: peerReviews.map(r => ({
            reviewer: r.reviewer,
            reviewedModel: r.reviewedModel,
            content: r.content,
            tokenUsage: r.tokenUsage,
            error: r.error || false
          })),
          phase3_consensus: {
            provider: finalConsensus.provider,
            model: finalConsensus.model,
            name: finalConsensus.name,
            content: finalConsensus.content,
            tokenUsage: finalConsensus.tokenUsage,
            fallback: finalConsensus.fallback || false
          }
        },
        totalTokens,
        metadata: {
          topic,
          sourcesCount: sources.length,
          processingTime: Date.now(),
          llmsUsed: [...this.draftingLLMs, this.arbiterLLM].map(llm => llm.name),
          workflow: '3-phase',
          successfulDrafts: successfulDrafts.length,
          totalDrafts: initialDrafts.length,
          arbitrationFallback: finalConsensus.fallback || false
        }
      };
    } catch (error) {
      console.error('❌ Consensus generation failed:', error.message);
      // Graceful degradation: return partial result so we don't drop the user's session
      const partial = this._buildPartialResult(initialDrafts, peerReviews, topic, sources, 'pipeline error');
      if (partial) {
        console.warn('📦 Returning partial result so user session is not lost.');
        return partial;
      }
      throw new Error(`Consensus generation failed: ${error.message}`);
    }
  }

  // PHASE 1: Independent Drafting (with one retry per failed draft for transient errors)
  async phase1_IndependentDrafting(topic, sources) {
    const prompt = this.buildDraftingPrompt(topic, sources);
    const GEMINI_STAGGER_MS = 15000;

    const runOne = (llm, delayMs = 0) => {
      const query = { provider: llm.provider, model: llm.model, prompt, options: { maxTokens: 2000, temperature: 0.7 } };
      const run = () => llmOrchestrator.executeQuery(query.provider, query.model, query.prompt, query.options)
        .catch(err => ({ error: err.message, ...query }));
      if (delayMs > 0) {
        return new Promise((resolve) => {
          setTimeout(() => run().then(resolve), delayMs);
        });
      }
      return run();
    };

    const promises = this.draftingLLMs.map((llm) =>
      runOne(llm, llm.provider === 'google' ? GEMINI_STAGGER_MS : 0)
    );
    let responses = await Promise.all(promises);

    // One retry for failed drafts (transient 5xx/timeouts often succeed on retry)
    const retryIndexes = responses
      .map((r, i) => (r.error ? i : -1))
      .filter(i => i >= 0);
    if (retryIndexes.length > 0) {
      const retries = await Promise.all(
        retryIndexes.map(async (index) => {
          const llm = this.draftingLLMs[index];
          console.warn(`🔄 Retrying Phase 1 draft: ${llm.name}`);
          try {
            const res = await llmOrchestrator.executeQuery(llm.provider, llm.model, prompt, { maxTokens: 2000, temperature: 0.7 });
            return { index, response: { ...res, error: undefined } };
          } catch (err) {
            return { index, response: { error: err.message } };
          }
        })
      );
      retries.forEach(({ index, response }) => {
        if (!response.error) responses[index] = response;
      });
    }

    return responses.map((response, index) => {
      const llm = this.draftingLLMs[index];
      if (response.error) {
        console.warn(`⚠️ ${llm.name} drafting failed (after retry):`, response.error);
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
  }

  // PHASE 2: Peer Review (with one retry per review for transient failures)
  async phase2_PeerReview(topic, initialDrafts) {
    const successfulDrafts = initialDrafts.filter(draft => !draft.error);
    const allReviews = [];
    const opts = { maxTokens: 1500, temperature: 0.6, timeout: 60000 };

    for (const reviewer of successfulDrafts) {
      const otherDrafts = successfulDrafts.filter(draft => draft.name !== reviewer.name);
      for (const draftToReview of otherDrafts) {
        const reviewPrompt = this.buildPeerReviewPrompt(topic, draftToReview, reviewer.name);
        let lastErr;
        for (let attempt = 0; attempt <= 1; attempt++) {
          try {
            const response = await llmOrchestrator.executeQuery(
              reviewer.provider,
              reviewer.model,
              reviewPrompt,
              opts
            );
            allReviews.push({
              reviewer: reviewer.name,
              reviewedModel: draftToReview.name,
              content: response.content,
              tokenUsage: response.tokenUsage
            });
            lastErr = null;
            break;
          } catch (error) {
            lastErr = error;
            if (attempt === 0) console.warn(`⚠️ ${reviewer.name} peer review failed, retrying once:`, error.message);
          }
        }
        if (lastErr) {
          console.warn(`⚠️ ${reviewer.name} peer review failed (after retry):`, lastErr.message);
          allReviews.push({
            reviewer: reviewer.name,
            reviewedModel: draftToReview.name,
            content: `Error in peer review: ${lastErr.message}`,
            tokenUsage: { total: 0 },
            error: true
          });
        }
      }
    }

    return allReviews;
  }

  // PHASE 3: Final Arbitration (with fallback arbiters — single provider outage shouldn't take down product)
  async phase3_FinalArbitration(topic, sources, initialDrafts, peerReviews) {
    const prompt = this.buildArbitrationPrompt(topic, sources, initialDrafts, peerReviews);
    const opts = { maxTokens: 3000, temperature: 0.5, timeout: 240000 };
    const fallbacks = this.arbiterFallbacks.map(f => ({ provider: f.provider, model: f.model }));

    const response = await llmOrchestrator.executeQueryWithFallback(
      this.arbiterLLM.provider,
      this.arbiterLLM.model,
      prompt,
      opts,
      fallbacks
    );

    // Identify which provider/model actually succeeded (may be fallback)
    const primaryKey = `${this.arbiterLLM.provider}/${this.arbiterLLM.model}`;
    const fallbackUsed = response._fallbackUsed; // set by orchestrator if fallback was used
    const display = fallbackUsed
      ? this.arbiterFallbacks.find(f => `${f.provider}/${f.model}` === fallbackUsed) || this.arbiterLLM
      : this.arbiterLLM;

    return {
      provider: display.provider,
      model: display.model,
      name: display.name,
      content: response.content,
      tokenUsage: response.tokenUsage
    };
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
${initialDrafts.map((draft) => `\n**${draft.name} Analysis:**\n${draft.content}`).join('\n')}

**Peer Reviews:**
${peerReviews.map((review) => `\n**${review.reviewer} reviewing ${review.reviewedModel}:**\n${review.content}`).join('\n')}

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
