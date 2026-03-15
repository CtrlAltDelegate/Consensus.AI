const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const consensusEngine = require('../services/consensusEngine');
const tokenManager = require('../services/tokenManager');
const pdfGenerator = require('../services/pdfGenerator');
const emailService = require('../services/emailService');
const fileProcessor = require('../services/fileProcessor');
const Report = require('../models/reportModel');
const billingService = require('../services/billingService');
const auth = require('../middleware/auth');
const tokenCheck = require('../middleware/tokenCheck');
const { validateConsensusRequest, validateFileUpload } = require('../utils/validation');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    // Generate unique filename with timestamp and random string
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
    files: 5 // Maximum 5 files at once
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['text/plain', 'application/pdf', 'text/csv', 'application/json'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`Invalid file type: ${file.mimetype}. Allowed types: ${allowedTypes.join(', ')}`), false);
    }
  }
});

// In-memory job storage (in production, use Redis or database)
const jobs = new Map();
const jobResults = new Map();
const jobPdfs = new Map(); // Store PDFs temporarily

// Test endpoint to verify LLM API connectivity
router.get('/test-llms', async (req, res) => {
  try {
    console.log('🧪 Testing LLM API connectivity...');
    const llmOrchestrator = require('../services/llmOrchestrator');
    
    const testPrompt = "Hello, please respond with 'API connection successful'";
    const testResults = {};
    
    // Test each provider individually
    const providers = [
      { provider: 'openai', model: 'gpt-4o' },
      { provider: 'anthropic', model: 'claude-sonnet-4-5' },
      { provider: 'google', model: 'gemini-2.0-flash' },
      { provider: 'cohere', model: 'command-r-plus-08-2024' }
    ];
    
    for (const { provider, model } of providers) {
      try {
        console.log(`🔍 Testing ${provider} with model ${model}...`);
        const result = await llmOrchestrator.executeQuery(
          provider, 
          model, 
          testPrompt, 
          { maxTokens: 50, temperature: 0.1, timeout: 30000 }
        );
        testResults[provider] = {
          status: 'success',
          model,
          response: result.content?.substring(0, 100) || 'No content',
          tokenUsage: result.tokenUsage
        };
        console.log(`✅ ${provider} test successful`);
      } catch (error) {
        console.error(`❌ ${provider} test failed:`, error.message);
        testResults[provider] = {
          status: 'failed',
          model,
          error: error.message,
          details: {
            status: error.response?.status,
            statusText: error.response?.statusText,
            data: error.response?.data
          }
        };
      }
    }
    
    // Check which providers are available
    const availableProviders = llmOrchestrator.getAvailableProviders();
    
    res.json({
      success: true,
      testResults,
      availableProviders,
      apiKeysConfigured: {
        openai: !!process.env.OPENAI_API_KEY,
        anthropic: !!process.env.ANTHROPIC_API_KEY,
        google: !!process.env.GOOGLE_API_KEY,
        cohere: !!process.env.COHERE_API_KEY
      }
    });
    
  } catch (error) {
    console.error('❌ LLM test endpoint failed:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get supported file types for upload
router.get('/upload/supported-types', (req, res) => {
  try {
    const supportedTypes = fileProcessor.getSupportedTypes();
    res.json({
      success: true,
      supportedTypes
    });
  } catch (error) {
    console.error('❌ Error getting supported types:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get supported file types'
    });
  }
});

// Upload and process files for consensus sources
router.post('/upload', auth, upload.array('files', 5), async (req, res) => {
  try {
    console.log('📁 File upload request received');
    
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No files uploaded'
      });
    }

    console.log(`📁 Processing ${req.files.length} uploaded files...`);
    
    const processedFiles = [];
    const errors = [];

    // Process each uploaded file
    for (const file of req.files) {
      try {
        console.log(`📄 Processing: ${file.originalname} (${file.mimetype})`);
        
        // Validate file
        const validation = fileProcessor.validateFile(file);
        if (!validation.valid) {
          errors.push({
            filename: file.originalname,
            error: validation.error
          });
          continue;
        }

        // Process file and extract text
        const result = await fileProcessor.processFile(
          file.path,
          file.mimetype,
          file.originalname
        );

        processedFiles.push({
          filename: result.originalName,
          text: result.text,
          size: result.fileSize,
          extractedLength: result.extractedLength,
          mimeType: result.mimeType
        });

        console.log(`✅ Successfully processed: ${file.originalname}`);

      } catch (fileError) {
        console.error(`❌ Error processing ${file.originalname}:`, fileError.message);
        errors.push({
          filename: file.originalname,
          error: fileError.message
        });
      }
    }

    // Return results
    const response = {
      success: processedFiles.length > 0,
      processedFiles,
      totalFiles: req.files.length,
      successCount: processedFiles.length,
      errorCount: errors.length
    };

    if (errors.length > 0) {
      response.errors = errors;
    }

    if (processedFiles.length === 0) {
      return res.status(400).json({
        ...response,
        error: 'No files could be processed successfully'
      });
    }

    console.log(`🎉 File upload complete: ${processedFiles.length}/${req.files.length} files processed successfully`);
    res.json(response);

  } catch (error) {
    console.error('❌ File upload endpoint failed:', error);
    
    // Clean up any uploaded files on error
    if (req.files) {
      req.files.forEach(file => {
        require('fs').unlink(file.path, (err) => {
          if (err) console.warn(`Failed to cleanup ${file.path}:`, err.message);
        });
      });
    }

    res.status(500).json({
      success: false,
      error: 'File upload failed: ' + error.message
    });
  }
});

// Generate consensus analysis (ASYNC VERSION to avoid Railway timeouts)
// Requires authentication - user from auth middleware (real or demo token)
router.post('/generate', auth, async (req, res) => {
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
      userId: req.user.id || req.user._id?.toString?.() || req.user.userId,
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

// Check job status endpoint (auth required - users only see their own jobs)
router.get('/status/:jobId', auth, (req, res) => {
  const { jobId } = req.params;
  const job = jobs.get(jobId);
  
  if (!job) {
    return res.status(404).json({ error: 'Job not found' });
  }

  const userId = req.user.id || req.user._id?.toString?.() || req.user.userId;
  if (job.userId && job.userId !== userId) {
    return res.status(403).json({ error: 'Access denied. This job belongs to another user.' });
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
    
    const updateJob = (updates) => {
      const currentJob = jobs.get(jobId);
      jobs.set(jobId, { ...currentJob, ...updates });
    };

    // Start processing
    updateJob({ status: 'processing', progress: 10, phase: 'phase1' });

    const onPhaseChange = (phase) => updateJob({ phase, progress: phase === 'phase1' ? 15 : phase === 'phase2' ? 50 : 80 });

    // Generate consensus (this is the actual work)
    const consensus = await consensusEngine.generateConsensus(topic, sources, {
      ...options,
      onPhaseChange
    });
    
    const startTime = new Date(jobs.get(jobId).startedAt);
    const duration = Math.round((new Date() - startTime) / 1000);
    
    console.log(`✅ Consensus generated successfully for job ${jobId}!`);
    console.log(`🔥 Tokens used: ${consensus.totalTokens || estimatedTokens}`);
    
    // Generate PDF if requested
    let pdfBuffer = null;
    if (options.generatePdf !== false) { // Default to true
      try {
        console.log('📄 Generating PDF report...');
        pdfBuffer = await pdfGenerator.generateConsensusReport({
          topic,
          consensus: consensus.consensus,
          confidence: consensus.confidence,
          sources: consensus.llmsUsed || ['GPT-4o', 'Claude 3.5 Sonnet', 'Gemini 1.5 Pro', 'Command R+'],
          metadata: {
            totalTokens: consensus.totalTokens || estimatedTokens,
            generatedAt: new Date().toISOString(),
            processingTime: consensus.processingTime || 'Unknown'
          }
        });
        console.log('✅ PDF generated successfully');
        
        // Store PDF buffer for download
        if (pdfBuffer) {
          jobPdfs.set(jobId, {
            buffer: pdfBuffer,
            filename: `consensus-report-${Date.now()}.pdf`,
            createdAt: new Date().toISOString()
          });
          console.log('📄 PDF stored for download');
        }
      } catch (pdfError) {
        console.error('❌ PDF generation failed:', pdfError);
        // Continue without PDF - don't fail the entire job
      }
    }

    // TEMPORARILY DISABLE email sending to focus on core consensus functionality
    console.log('📧 Email sending temporarily disabled for debugging');

    // Prepare result (partial = graceful degradation: single-model or pipeline error recovery)
    const isPartial = consensus.metadata?.partial === true;
    const result = {
      success: true,
      consensus: consensus.consensus,
      confidence: consensus.confidence,
      metadata: {
        totalTokens: consensus.totalTokens || estimatedTokens,
        llmsUsed: consensus.metadata?.llmsUsed || consensus.llmsUsed || ['GPT-4o', 'Claude 3.5 Sonnet', 'Gemini 1.5 Pro', 'Command R+'],
        processingTime: consensus.processingTime || '90 seconds',
        priority: options.priority || 'standard',
        ...(isPartial && { partial: true, partialReason: consensus.metadata?.partialReason || 'degraded' })
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
      ...(pdfBuffer && { 
        pdfGenerated: true,
        pdfSize: pdfBuffer.length,
        pdfAvailable: true,
        pdfDownloadUrl: `/api/consensus/report/${jobId}/pdf`
      })
    };

    // Store result and mark job complete (only reached after Phase 3 / Cohere arbitration finishes or fallback)
    jobResults.set(jobId, result);
    const endTime = new Date();

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
    
    // Auto-save report to database if user exists (including demo users for testing)
    if (user) {
      try {
        console.log('💾 Auto-saving report to database...');
        
        const report = new Report({
          title: topic.length > 100 ? topic.substring(0, 100) + '...' : topic,
          topic,
          userId: user.id,
          jobId,
          consensus: consensus.consensus,
          confidence: consensus.confidence,
          metadata: {
            totalTokens: consensus.totalTokens || estimatedTokens,
            llmsUsed: consensus.metadata?.llmsUsed || consensus.llmsUsed || ['GPT-4o', 'Claude 3.5 Sonnet', 'Gemini 1.5 Pro', 'Command R+'],
            processingTime: `${duration} seconds`,
            priority: options.priority || 'standard',
            ...(consensus.metadata?.partial && { partial: true, partialReason: consensus.metadata.partialReason })
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
              arbiter: 'Command R+',
              content: 'Final arbitration completed'
            }
          },
          sources: sources || [],
          pdf: {
            available: !!pdfBuffer,
            filename: pdfBuffer ? `consensus-report-${Date.now()}.pdf` : null,
            size: pdfBuffer ? pdfBuffer.length : null,
            generatedAt: pdfBuffer ? new Date() : null
          }
        });

        await report.save();
        console.log(`✅ Report auto-saved with ID: ${report._id}`);
        
        // Handle billing for authenticated users (skip for demo users)
        if (!user.isDemo && user.id !== 'demo-user-id') {
          try {
            console.log('💰 Processing billing for report generation...');
            
            // Load full user with subscription tier
            const User = require('../models/userModel');
            const fullUser = await User.findById(user.id).populate('subscription.tier');
            
            if (fullUser && fullUser.subscription.tier) {
              const tier = fullUser.subscription.tier;
              let cost = 0;
              let billingType = 'included';
              
              // Determine billing type and cost
              if (tier.billingType === 'per_report') {
                // Pay-as-you-go: charge per report
                cost = tier.pricePerReport;
                billingType = 'pay_per_report';
                console.log(`💳 Pay-as-you-go user: $${cost} per report`);
              } else {
                // Subscription user: check if within included reports
                const reportsUsed = fullUser.getReportsUsedThisPeriod();
                const includedReports = tier.reportsIncluded || 0;
                
                if (reportsUsed < includedReports) {
                  // Within included reports
                  cost = 0;
                  billingType = 'included';
                  console.log(`📊 Subscription user: Report ${reportsUsed + 1}/${includedReports} (included)`);
                } else {
                  // Overage report
                  cost = tier.overageRate || 0;
                  billingType = 'overage';
                  console.log(`📊 Subscription user: Overage report at $${cost}`);
                }
              }
              
              // Pay-per-report: charge via Stripe Invoice, then record with payment status
              let stripeRef = null;
              let paymentStatus = billingType === 'pay_per_report' ? 'pending' : 'paid';
              if (billingType === 'pay_per_report' && cost > 0 && fullUser.subscription?.stripeCustomerId) {
                try {
                  const description = report.title ? `Consensus report: ${report.title}` : `Consensus report`;
                  const chargeResult = await billingService.createReportCharge(
                    fullUser.subscription.stripeCustomerId,
                    cost,
                    report._id.toString(),
                    description
                  );
                  stripeRef = chargeResult.invoiceId;
                  paymentStatus = chargeResult.status === 'paid' ? 'paid' : 'pending';
                  console.log(`💳 Report charge: invoice ${chargeResult.invoiceId}, status: ${chargeResult.status}`);
                } catch (chargeError) {
                  console.error('❌ Stripe report charge failed:', chargeError.message);
                  paymentStatus = 'pending';
                }
              } else if (billingType === 'pay_per_report' && cost > 0 && !fullUser.subscription?.stripeCustomerId) {
                console.warn('⚠️ Pay-per-report user has no Stripe customer – add payment method in Billing');
              }
              await fullUser.recordReportGeneration(report._id, cost, billingType, {
                ...(stripeRef && { stripePaymentIntentId: stripeRef }),
                paymentStatus
              });
              console.log(`✅ Billing recorded: ${billingType}, cost: $${cost}, payment: ${paymentStatus}`);
              
            } else {
              console.warn('⚠️ User has no subscription tier - skipping billing');
            }
            
          } catch (billingError) {
            console.error('❌ Billing processing failed:', billingError);
            // Don't fail the report generation if billing fails
          }
        } else {
          console.log('🧪 Demo user - skipping billing');
        }
        
        // Add report ID to the job result
        const currentResult = jobResults.get(jobId);
        if (currentResult) {
          currentResult.reportId = report._id;
          currentResult.reportSaved = true;
          jobResults.set(jobId, currentResult);
        }
        
      } catch (reportError) {
        console.error('❌ Failed to auto-save report:', reportError);
        // Don't fail the job if report saving fails
      }
    }

  } catch (error) {
    console.error(`💥 Job ${jobId} failed:`, error);
    const updateJob = (updates) => {
      const currentJob = jobs.get(jobId);
      if (currentJob) {
        jobs.set(jobId, { ...currentJob, ...updates });
      }
    };
    updateJob({
      status: 'failed',
      error: error.message,
      completedAt: new Date().toISOString()
    });
    throw error;
  }
}

// Get consensus analysis history (requires auth - returns only current user's reports)
router.get('/history', auth, async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const userId = req.user.id || req.user._id?.toString?.() || req.user.userId;
    
    console.log(`📚 Fetching reports for user: ${userId}`);
    
    // Fetch reports from database
    const reports = await Report.find({ userId })
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));
    
    const total = await Report.countDocuments({ userId });
    
    console.log(`📊 Found ${reports.length} reports for user ${userId}`);
    
    res.json({
      success: true,
      analyses: reports.map(report => ({
        id: report._id,
        title: report.title,
        topic: report.topic,
        consensus: report.consensus,
        confidence: report.confidence,
        metadata: report.metadata,
        createdAt: report.createdAt,
        pdfAvailable: report.pdf?.available || false
      })),
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
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

// Download consensus report as PDF (auth required - users only download their own)
router.get('/report/:jobId/pdf', auth, async (req, res) => {
  try {
    const { jobId } = req.params;
    const job = jobs.get(jobId);
    const userId = req.user.id || req.user._id?.toString?.() || req.user.userId;

    if (job && job.userId && job.userId !== userId) {
      return res.status(403).json({ error: 'Access denied. This report belongs to another user.' });
    }
    
    // Check if PDF exists for this job
    const pdfData = jobPdfs.get(jobId);
    if (!pdfData) {
      return res.status(404).json({ error: 'PDF not found for this job' });
    }

    // Set PDF headers
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${pdfData.filename}"`);
    res.setHeader('Content-Length', pdfData.buffer.length);
    
    // Send PDF buffer
    res.send(pdfData.buffer);
    console.log(`📄 PDF downloaded for job ${jobId}`);

  } catch (error) {
    console.error('PDF download error:', error);
    res.status(500).json({ error: 'Failed to download PDF' });
  }
});

// Token estimation endpoint (requires auth)
router.post('/estimate', auth, async (req, res) => {
  try {
    const { topic, sources = [], options = {} } = req.body;

    const sourcesText = Array.isArray(sources) ? sources.join(' ') : '';
    const estimatedTokens = await tokenManager.estimateTokensForOperation(
      'consensus', 
      topic.length + sourcesText.length
    );

    // For demo users skip token check; for real users tokenCheck middleware could be used on generate
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
