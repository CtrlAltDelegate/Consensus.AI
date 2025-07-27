const express = require('express');
const router = express.Router();
const consensusEngine = require('../services/consensusEngine');
const tokenManager = require('../services/tokenManager');
const pdfGenerator = require('../services/pdfGenerator');
const emailService = require('../services/emailService');
const auth = require('../middleware/auth');
const tokenCheck = require('../middleware/tokenCheck');
const { validateConsensusRequest } = require('../utils/validation');

// Generate consensus analysis (auth temporarily disabled for testing)
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

    // TESTING: Skip token checking for demo, but provide mock data
    console.log(`📊 Estimated tokens needed: ${estimatedTokens}`);
    const mockTokenCheck = {
      available: 25000,
      sufficient: true,
      overage: 0
    };
    
    // const tokenCheck = await tokenManager.checkTokenAvailability(req.user.id, estimatedTokens);
    // if (!tokenCheck.sufficient && tokenCheck.overage > estimatedTokens * 0.5) {
    //   return res.status(402).json({
    //     error: 'Insufficient tokens',
    //     required: estimatedTokens,
    //     available: tokenCheck.available,
    //     overage: tokenCheck.overage
    //   });
    // }

    console.log('🤖 Starting consensus generation...');
    
    // Generate consensus
    const consensus = await consensusEngine.generateConsensus(topic, sources, options);
    
    console.log('✅ Consensus generated successfully!');
    console.log(`🔥 Tokens used: ${consensus.totalTokens || estimatedTokens}`);
    
    // TESTING: Skip token consumption for demo
    // await tokenManager.consumeTokens(req.user.id, consensus.totalTokens);

    // Generate PDF if requested
    let pdfBuffer = null;
    if (options.generatePdf) {
      try {
        pdfBuffer = await pdfGenerator.generateConsensusReport({
          topic,
          ...consensus
        });
      } catch (pdfError) {
        console.warn('⚠️ PDF generation failed (non-critical):', pdfError.message);
      }
    }

    // Send email if requested
    if (options.emailReport && pdfBuffer) {
      try {
        await emailService.sendConsensusReport(
          req.user.email,
          req.user.profile?.firstName || 'User',
          consensus,
          pdfBuffer
        );
      } catch (emailError) {
        console.warn('⚠️ Email sending failed (non-critical):', emailError.message);
      }
    }

    // Return comprehensive response
    const response = {
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
      tokensRemaining: mockTokenCheck.available - (consensus.totalTokens || estimatedTokens),
      ...(pdfBuffer && { pdfGenerated: true })
    };

    console.log('📤 Sending response:', {
      success: response.success,
      consensusLength: response.consensus?.length || 0,
      confidence: response.confidence,
      totalTokens: response.metadata.totalTokens
    });

    res.json(response);

  } catch (error) {
    console.error('💥 Consensus generation error:', error);
    console.error('📍 Error stack:', error.stack);
    console.error('🔍 Error details:', {
      name: error.name,
      message: error.message,
      code: error.code,
      status: error.status
    });
    
    res.status(500).json({ 
      error: 'Failed to generate consensus',
      message: error.message,
      type: error.name,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

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
    console.error('History retrieval error:', error);
    res.status(500).json({ error: 'Failed to retrieve history' });
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

// Estimate token usage for a request
router.post('/estimate', async (req, res) => {
  try {
    const { topic, sources = [] } = req.body;
    
    if (!topic) {
      return res.status(400).json({ error: 'Topic is required' });
    }

    // TESTING: Mock user for estimate endpoint
    req.user = { id: 'demo-user-123' };

    const sourcesText = Array.isArray(sources) ? sources.join(' ') : '';
    const estimatedTokens = await tokenManager.estimateTokensForOperation(
      'consensus',
      topic.length + sourcesText.length
    );

    // Mock token availability for demo
    const mockTokenCheck = {
      available: 25000,
      sufficient: true,
      overage: 0
    };

    res.json({
      success: true,
      estimatedTokens,
      available: mockTokenCheck.available,
      sufficient: mockTokenCheck.sufficient,
      overage: mockTokenCheck.overage,
      overageCharge: mockTokenCheck.overage * 0.001 // $0.001 per token
    });

  } catch (error) {
    console.error('Token estimation error:', error);
    res.status(500).json({ error: 'Failed to estimate tokens' });
  }
});

module.exports = router; 