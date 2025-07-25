const express = require('express');
const router = express.Router();
const consensusEngine = require('../services/consensusEngine');
const tokenManager = require('../services/tokenManager');
const pdfGenerator = require('../services/pdfGenerator');
const emailService = require('../services/emailService');
const auth = require('../middleware/auth');
const tokenCheck = require('../middleware/tokenCheck');
const { validateConsensusRequest } = require('../utils/validation');

// Generate consensus analysis
router.post('/generate', auth, async (req, res) => {
  try {
    const { topic, sources, options = {} } = req.body;
    
    // Validate request
    const { error } = validateConsensusRequest(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    // Estimate token usage
    const estimatedTokens = await tokenManager.estimateTokensForOperation(
      'consensus', 
      topic.length + sources.join(' ').length
    );

    // Check token availability
    const tokenCheck = await tokenManager.checkTokenAvailability(req.user.id, estimatedTokens);
    if (!tokenCheck.sufficient && tokenCheck.overage > estimatedTokens * 0.5) {
      return res.status(402).json({
        error: 'Insufficient tokens',
        required: estimatedTokens,
        available: tokenCheck.available,
        overage: tokenCheck.overage
      });
    }

    // Generate consensus
    const consensus = await consensusEngine.generateConsensus(topic, sources, options);
    
    // Consume actual tokens used
    await tokenManager.consumeTokens(req.user.id, consensus.totalTokens);

    // Generate PDF if requested
    let pdfBuffer = null;
    if (options.generatePdf) {
      pdfBuffer = await pdfGenerator.generateConsensusReport({
        topic,
        ...consensus
      });
    }

    // Send email if requested
    if (options.emailReport && pdfBuffer) {
      await emailService.sendConsensusReport(
        req.user.email,
        req.user.profile?.firstName || 'User',
        consensus,
        pdfBuffer
      );
    }

    res.json({
      success: true,
      consensus: consensus.consensus,
      confidence: consensus.confidence,
      sources: consensus.sources,
      totalTokens: consensus.totalTokens,
      tokensRemaining: tokenCheck.available - consensus.totalTokens,
      ...(pdfBuffer && { pdfGenerated: true })
    });

  } catch (error) {
    console.error('Consensus generation error:', error);
    res.status(500).json({ error: 'Failed to generate consensus' });
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
router.post('/estimate', auth, async (req, res) => {
  try {
    const { topic, sources } = req.body;
    
    if (!topic || !sources || !Array.isArray(sources)) {
      return res.status(400).json({ error: 'Topic and sources are required' });
    }

    const estimatedTokens = await tokenManager.estimateTokensForOperation(
      'consensus',
      topic.length + sources.join(' ').length
    );

    const tokenCheck = await tokenManager.checkTokenAvailability(req.user.id, estimatedTokens);

    res.json({
      success: true,
      estimatedTokens,
      available: tokenCheck.available,
      sufficient: tokenCheck.sufficient,
      overage: tokenCheck.overage,
      overageCharge: tokenCheck.overage * 0.001 // $0.001 per token
    });

  } catch (error) {
    console.error('Token estimation error:', error);
    res.status(500).json({ error: 'Failed to estimate tokens' });
  }
});

module.exports = router; 