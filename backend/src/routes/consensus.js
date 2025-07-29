const express = require('express');
const router = express.Router();
const consensusEngine = require('../services/consensusEngine');
const tokenManager = require('../services/tokenManager');
const pdfGenerator = require('../services/pdfGenerator');
const emailService = require('../services/emailService');
const auth = require('../middleware/auth');
const tokenCheck = require('../middleware/tokenCheck');
const { validateConsensusRequest } = require('../utils/validation');

// In-memory job storage (in production, use Redis or database)
const jobs = new Map();
const jobResults = new Map();

// Generate consensus analysis (ASYNC VERSION to avoid Railway timeouts)
router.post('/generate', async (req, res) => {
  try {
    const { topic, sources = [], options = {} } = req.body;
    
    // Validate request with detailed logging
    console.log('📥 Request body:', JSON.stringify(req.body, null, 2));
    const { error } = validateConsensusRequest(req.body);
    if (error) {
      console.log('❌ Validation error:', error.details[0].message);
      console.log('🔍 Full error details:', error.details);
      return res.status(400).json({ 
        error: error.details[0].message,
        field: error.details[0].path,
        received: error.details[0].context
      });
    }
    console.log('✅ Validation passed!');
    
    // TESTING: Mock user for demo purposes
    req.user = { 
      id: 'demo-user-123',
      email: 'demo@consensusai.com',
      profile: { firstName: 'Demo' }
    };

    // Estimate token usage
    const sourcesText = Array.isArray(sources) ? sources.join(' ') : '';
    const estimatedTokens = await tokenManager.estimateTokensForOperation(
      'consensus', 
      topic.length + sourcesText.length
    );

    // Generate unique job ID
    const jobId = `consensus_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Store job metadata
    jobs.set(jobId, {
      id: jobId,
      status: 'started',
      progress: 0,
      phase: 'phase1',
      topic,
      sources,
      options,
      estimatedTokens,
      userId: req.user.id,
      startedAt: new Date().toISOString(),
      phases: {
        phase1: { status: 'pending', startedAt: null, completedAt: null },
        phase2: { status: 'pending', startedAt: null, completedAt: null },
        phase3: { status: 'pending', startedAt: null, completedAt: null }
      }
    });

    // Start async processing (don't await - return immediately)
    processConsensusJob(jobId, topic, sources, options, estimatedTokens, req.user)
      .catch(error => {
        console.error(`❌ Job ${jobId} failed:`, error);
        jobs.set(jobId, {
          ...jobs.get(jobId),
          status: 'failed',
          error: error.message,
          completedAt: new Date().toISOString()
        });
      });

    // Return job ID immediately - no waiting!
    console.log(`🚀 Started async consensus job: ${jobId}`);
    res.json({
      success: true,
      jobId,
      status: 'started',
      message: 'Consensus generation started. Use the job ID to check progress.',
      estimatedDuration: '60-90 seconds',
      checkStatusUrl: `/api/consensus/status/${jobId}`
    });

  } catch (error) {
    console.error('💥 Consensus generation error:', error);
    res.status(500).json({ 
      error: 'Failed to start consensus generation',
      message: error.message
    });
  }
});

// Check job status endpoint
router.get('/status/:jobId', (req, res) => {
  const { jobId } = req.params;
  const job = jobs.get(jobId);
  
  if (!job) {
    return res.status(404).json({ error: 'Job not found' });
  }

  // If job is completed, return the result
  if (job.status === 'completed') {
    const result = jobResults.get(jobId);
    return res.json({
      jobId,
      status: 'completed',
      progress: 100,
      phase: 'completed',
      result,
      completedAt: job.completedAt,
      duration: job.duration
    });
  }

  // Return current progress
  res.json({
    jobId,
    status: job.status,
    progress: job.progress,
    phase: job.phase,
    phases: job.phases,
    startedAt: job.startedAt,
    error: job.error
  });
});

// Async processing function
async function processConsensusJob(jobId, topic, sources, options, estimatedTokens, user) {
  try {
    console.log(`🔄 Processing job ${jobId}...`);
    
    // Update job progress
    const updateJob = (updates) => {
      const currentJob = jobs.get(jobId);
      jobs.set(jobId, { ...currentJob, ...updates });
    };

    // Phase 1: Independent Drafting
    updateJob({ 
      status: 'processing', 
      progress: 10, 
      phase: 'phase1',
      phases: {
        ...jobs.get(jobId).phases,
        phase1: { status: 'processing', startedAt: new Date().toISOString(), completedAt: null }
      }
    });
    
    console.log(`🤖 Starting consensus generation for job ${jobId}...`);
    
    // Generate consensus
    const consensus = await consensusEngine.generateConsensus(topic, sources, options);
    
    // Update after phase 1
    updateJob({ 
      progress: 35,
      phases: {
        ...jobs.get(jobId).phases,
        phase1: { status: 'completed', startedAt: jobs.get(jobId).phases.phase1.startedAt, completedAt: new Date().toISOString() },
        phase2: { status: 'processing', startedAt: new Date().toISOString(), completedAt: null }
      }
    });

    // Simulate phase 2 progress
    updateJob({ 
      progress: 65, 
      phase: 'phase2',
      phases: {
        ...jobs.get(jobId).phases,
        phase2: { status: 'completed', startedAt: jobs.get(jobId).phases.phase2.startedAt, completedAt: new Date().toISOString() },
        phase3: { status: 'processing', startedAt: new Date().toISOString(), completedAt: null }
      }
    });

    // Final phase
    updateJob({ 
      progress: 90, 
      phase: 'phase3'
    });
    
    console.log(`✅ Consensus generated successfully for job ${jobId}!`);
    console.log(`🔥 Tokens used: ${consensus.totalTokens || estimatedTokens}`);
    
    // TEMPORARILY DISABLE PDF generation to focus on core consensus functionality
    let pdfBuffer = null;
    console.log('📄 PDF generation temporarily disabled for debugging');

    // TEMPORARILY DISABLE email sending to focus on core consensus functionality
    console.log('📧 Email sending temporarily disabled for debugging');

    // Prepare result
    const result = {
      success: true,
      consensus: consensus.consensus,
      confidence: consensus.confidence,
      metadata: {
        totalTokens: consensus.totalTokens || estimatedTokens,
        llmsUsed: consensus.llmsUsed || ['GPT-4o', 'Claude 3.5 Sonnet', 'Gemini 1.5 Pro', 'Command R+'],
        processingTime: consensus.processingTime || '90 seconds',
        priority: options.priority || 'standard'
      },
      phases: consensus.phases || {
        phase1_drafts: [
          { model: 'GPT-4o', content: 'Analysis completed' },
          { model: 'Claude 3.5 Sonnet', content: 'Analysis completed' },
          { model: 'Gemini 1.5 Pro', content: 'Analysis completed' },
          { model: 'Command R+', content: 'Analysis completed' }
        ],
        phase2_reviews: [
          { reviewer: 'Claude 3.5 Sonnet', content: 'Peer review completed' },
          { reviewer: 'Gemini 1.5 Pro', content: 'Peer review completed' },
          { reviewer: 'Command R+', content: 'Peer review completed' }
        ],
        phase3_consensus: {
          name: 'Command R+',
          content: 'Final arbitration completed'
        }
      },
      tokensRemaining: 25000 - (consensus.totalTokens || estimatedTokens),
      ...(pdfBuffer && { pdfGenerated: true })
    };

    // Store result and mark job complete
    jobResults.set(jobId, result);
    const endTime = new Date();
    const startTime = new Date(jobs.get(jobId).startedAt);
    const duration = Math.round((endTime - startTime) / 1000);

    updateJob({
      status: 'completed',
      progress: 100,
      phase: 'completed',
      completedAt: endTime.toISOString(),
      duration: `${duration} seconds`,
      phases: {
        ...jobs.get(jobId).phases,
        phase3: { status: 'completed', startedAt: jobs.get(jobId).phases.phase3.startedAt, completedAt: endTime.toISOString() }
      }
    });

    console.log(`🎉 Job ${jobId} completed successfully in ${duration} seconds`);

  } catch (error) {
    console.error(`💥 Job ${jobId} failed:`, error);
    throw error;
  }
}

// Get consensus analysis history
router.get('/history', auth, async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    
    // In a real implementation, you'd fetch from a database
    // For now, return mock data
    res.json({
      success: true,
      analyses: [],
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: 0,
        pages: 0
      }
    });
  } catch (error) {
    console.error('Error fetching consensus history:', error);
    res.status(500).json({ 
      error: 'Failed to fetch consensus history',
      message: error.message 
    });
  }
});

// Download consensus report as PDF
router.get('/report/:analysisId/pdf', auth, async (req, res) => {
  try {
    const { analysisId } = req.params;
    
    // In a real implementation, you'd fetch the analysis from database
    // For now, return error
    res.status(404).json({ error: 'Analysis not found' });

  } catch (error) {
    console.error('PDF download error:', error);
    res.status(500).json({ error: 'Failed to generate PDF' });
  }
});

// Token estimation endpoint
router.post('/estimate', async (req, res) => {
  try {
    const { topic, sources = [], options = {} } = req.body;
    
    // TESTING: Mock user for demo purposes
    req.user = { 
      id: 'demo-user-123',
      email: 'demo@consensusai.com'
    };

    const sourcesText = Array.isArray(sources) ? sources.join(' ') : '';
    const estimatedTokens = await tokenManager.estimateTokensForOperation(
      'consensus', 
      topic.length + sourcesText.length
    );

    // TESTING: Skip actual token checking for demo
    const mockTokenCheck = {
      available: 25000,
      sufficient: true,
      overage: 0
    };

    res.json({
      success: true,
      estimated: estimatedTokens,
      available: mockTokenCheck.available,
      sufficient: mockTokenCheck.sufficient,
      overage: mockTokenCheck.overage,
      breakdown: {
        phase1_drafting: Math.round(estimatedTokens * 0.4),
        phase2_reviews: Math.round(estimatedTokens * 0.3),
        phase3_arbitration: Math.round(estimatedTokens * 0.3)
      }
    });
  } catch (error) {
    console.error('Error estimating tokens:', error);
    res.status(500).json({ 
      error: 'Failed to estimate tokens',
      message: error.message 
    });
  }
});

module.exports = router; 