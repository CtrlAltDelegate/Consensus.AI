const express = require('express');
const router = express.Router();
const Report = require('../models/reportModel');
const auth = require('../middleware/auth');
const { body, validationResult, query } = require('express-validator');

// Get user's reports with pagination and filtering
router.get('/', auth, [
  query('page').optional().isInt({ min: 1 }).toInt(),
  query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
  query('status').optional().isIn(['draft', 'completed', 'failed', 'archived']),
  query('sortBy').optional().isIn(['createdAt', 'title', 'confidence', 'metadata.totalTokens']),
  query('sortOrder').optional().isIn(['asc', 'desc']),
  query('search').optional().trim(),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        error: 'Invalid query parameters',
        details: errors.array()
      });
    }

    const {
      page = 1,
      limit = 10,
      status = 'completed',
      sortBy = 'createdAt',
      sortOrder = 'desc',
      search
    } = req.query;

    // Build query
    let query = { userId: req.user.id };
    if (status !== 'all') {
      query.status = status;
    }
    
    // Add search functionality
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { topic: { $regex: search, $options: 'i' } },
        { tags: { $regex: search, $options: 'i' } }
      ];
    }

    // Execute query with pagination
    const skip = (page - 1) * limit;
    const sort = { [sortBy]: sortOrder === 'desc' ? -1 : 1 };

    const [reports, totalCount] = await Promise.all([
      Report.find(query)
        .sort(sort)
        .skip(skip)
        .limit(parseInt(limit))
        .populate('userId', 'email profile.firstName profile.lastName')
        .lean(),
      Report.countDocuments(query)
    ]);

    const totalPages = Math.ceil(totalCount / limit);

    res.json({
      success: true,
      reports,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: totalCount,
        pages: totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1
      }
    });

  } catch (error) {
    console.error('Error fetching reports:', error);
    res.status(500).json({ 
      error: 'Failed to fetch reports',
      message: error.message 
    });
  }
});

// Get a specific report by ID
router.get('/:reportId', auth, async (req, res) => {
  try {
    const { reportId } = req.params;

    const report = await Report.findOne({ 
      _id: reportId, 
      userId: req.user.id 
    }).populate('userId', 'email profile.firstName profile.lastName');

    if (!report) {
      return res.status(404).json({ error: 'Report not found' });
    }

    // Increment view count
    await report.incrementViews();

    res.json({
      success: true,
      report
    });

  } catch (error) {
    console.error('Error fetching report:', error);
    res.status(500).json({ 
      error: 'Failed to fetch report',
      message: error.message 
    });
  }
});

// Save a completed consensus job as a report
router.post('/', auth, [
  body('jobId').notEmpty().trim().withMessage('Job ID is required'),
  body('title').optional().trim().isLength({ max: 500 }).withMessage('Title must be less than 500 characters'),
  body('tags').optional().isArray().withMessage('Tags must be an array'),
  body('visibility').optional().isIn(['private', 'shared', 'public']).withMessage('Invalid visibility setting')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { jobId, title, tags, visibility = 'private' } = req.body;

    // Check if report already exists for this job
    const existingReport = await Report.findOne({ jobId });
    if (existingReport) {
      return res.status(409).json({ error: 'Report already exists for this job' });
    }

    // In a real implementation, you'd fetch the job result from your job storage
    // For now, we'll use a placeholder - this should be replaced with actual job data retrieval
    const mockJobResult = {
      topic: 'Sample consensus topic',
      consensus: 'Sample consensus content',
      confidence: 0.85,
      metadata: {
        totalTokens: 8500,
        llmsUsed: ['GPT-4o', 'Claude 3.5 Sonnet', 'Gemini 1.5 Pro', 'Command R+'],
        processingTime: '90 seconds',
        priority: 'standard'
      },
      phases: {
        phase1_drafts: [],
        phase2_reviews: [],
        phase3_consensus: {}
      },
      sources: [],
      pdfGenerated: false
    };

    // Create new report
    const report = new Report({
      title: title || mockJobResult.topic,
      topic: mockJobResult.topic,
      userId: req.user.id,
      jobId,
      consensus: mockJobResult.consensus,
      confidence: mockJobResult.confidence,
      metadata: mockJobResult.metadata,
      phases: mockJobResult.phases,
      sources: mockJobResult.sources || [],
      tags: tags || [],
      visibility,
      pdf: {
        available: mockJobResult.pdfGenerated || false,
        filename: mockJobResult.pdfGenerated ? `consensus-report-${Date.now()}.pdf` : null,
        generatedAt: mockJobResult.pdfGenerated ? new Date() : null
      }
    });

    await report.save();

    res.status(201).json({
      success: true,
      message: 'Report saved successfully',
      report: {
        id: report._id,
        title: report.title,
        createdAt: report.createdAt,
        confidence: report.confidence,
        tokenUsage: report.metadata.totalTokens
      }
    });

  } catch (error) {
    console.error('Error saving report:', error);
    res.status(500).json({ 
      error: 'Failed to save report',
      message: error.message 
    });
  }
});

// Update report (title, tags, visibility)
router.patch('/:reportId', auth, [
  body('title').optional().trim().isLength({ max: 500 }).withMessage('Title must be less than 500 characters'),
  body('tags').optional().isArray().withMessage('Tags must be an array'),
  body('visibility').optional().isIn(['private', 'shared', 'public']).withMessage('Invalid visibility setting')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { reportId } = req.params;
    const updateData = {};

    // Only include fields that are provided
    if (req.body.title !== undefined) updateData.title = req.body.title;
    if (req.body.tags !== undefined) updateData.tags = req.body.tags;
    if (req.body.visibility !== undefined) updateData.visibility = req.body.visibility;

    const report = await Report.findOneAndUpdate(
      { _id: reportId, userId: req.user.id },
      updateData,
      { new: true, runValidators: true }
    );

    if (!report) {
      return res.status(404).json({ error: 'Report not found' });
    }

    res.json({
      success: true,
      message: 'Report updated successfully',
      report
    });

  } catch (error) {
    console.error('Error updating report:', error);
    res.status(500).json({ 
      error: 'Failed to update report',
      message: error.message 
    });
  }
});

// Delete report
router.delete('/:reportId', auth, async (req, res) => {
  try {
    const { reportId } = req.params;

    const report = await Report.findOneAndDelete({ 
      _id: reportId, 
      userId: req.user.id 
    });

    if (!report) {
      return res.status(404).json({ error: 'Report not found' });
    }

    res.json({
      success: true,
      message: 'Report deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting report:', error);
    res.status(500).json({ 
      error: 'Failed to delete report',
      message: error.message 
    });
  }
});

// Bulk delete reports
router.delete('/', auth, [
  body('reportIds').isArray({ min: 1 }).withMessage('Report IDs array is required'),
  body('reportIds.*').isMongoId().withMessage('Invalid report ID format')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { reportIds } = req.body;

    const result = await Report.deleteMany({
      _id: { $in: reportIds },
      userId: req.user.id
    });

    res.json({
      success: true,
      message: `${result.deletedCount} reports deleted successfully`,
      deletedCount: result.deletedCount
    });

  } catch (error) {
    console.error('Error bulk deleting reports:', error);
    res.status(500).json({ 
      error: 'Failed to delete reports',
      message: error.message 
    });
  }
});

// Get user's report statistics
router.get('/stats/overview', auth, async (req, res) => {
  try {
    const [stats, recentReports] = await Promise.all([
      Report.getUserStats(req.user.id),
      Report.find({ userId: req.user.id })
        .sort({ createdAt: -1 })
        .limit(5)
        .select('title createdAt confidence metadata.totalTokens')
        .lean()
    ]);

    // Process stats into a more readable format
    const processedStats = {
      totalReports: 0,
      totalTokens: 0,
      avgConfidence: 0,
      statusBreakdown: {}
    };

    stats.forEach(stat => {
      processedStats.totalReports += stat.count;
      processedStats.totalTokens += stat.totalTokens;
      processedStats.statusBreakdown[stat._id] = {
        count: stat.count,
        totalTokens: stat.totalTokens,
        avgConfidence: stat.avgConfidence
      };
    });

    if (processedStats.totalReports > 0) {
      processedStats.avgConfidence = stats.reduce((sum, stat) => 
        sum + (stat.avgConfidence * stat.count), 0) / processedStats.totalReports;
    }

    res.json({
      success: true,
      stats: processedStats,
      recentReports
    });

  } catch (error) {
    console.error('Error fetching report stats:', error);
    res.status(500).json({ 
      error: 'Failed to fetch report statistics',
      message: error.message 
    });
  }
});

// Export reports (multiple formats)
router.post('/export', auth, [
  body('reportIds').isArray({ min: 1 }).withMessage('Report IDs array is required'),
  body('format').isIn(['json', 'csv']).withMessage('Format must be json or csv'),
  body('reportIds.*').isMongoId().withMessage('Invalid report ID format')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { reportIds, format } = req.body;

    const reports = await Report.find({
      _id: { $in: reportIds },
      userId: req.user.id
    }).lean();

    if (reports.length === 0) {
      return res.status(404).json({ error: 'No reports found' });
    }

    if (format === 'json') {
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="reports-export-${Date.now()}.json"`);
      res.json(reports);
    } else if (format === 'csv') {
      // Simple CSV export
      const csvHeaders = 'Title,Topic,Confidence,Total Tokens,Created At,Status\n';
      const csvRows = reports.map(report => {
        return `"${report.title}","${report.topic}",${report.confidence},${report.metadata.totalTokens},"${report.createdAt}","${report.status}"`;
      }).join('\n');
      
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="reports-export-${Date.now()}.csv"`);
      res.send(csvHeaders + csvRows);
    }

  } catch (error) {
    console.error('Error exporting reports:', error);
    res.status(500).json({ 
      error: 'Failed to export reports',
      message: error.message 
    });
  }
});

module.exports = router;