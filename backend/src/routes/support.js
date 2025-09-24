const express = require('express');
const router = express.Router();
const emailService = require('../services/emailService');
const { validateContactForm, validateFeedbackForm } = require('../utils/validation');

// Contact form submission
router.post('/contact', async (req, res) => {
  try {
    console.log('📧 Contact form submission received');
    
    // Validate the contact form data
    const { error } = validateContactForm(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        error: error.details[0].message
      });
    }

    const { name, email, subject, category, message, priority } = req.body;

    // Log the contact request
    console.log('📧 Contact Request:', {
      name,
      email,
      subject,
      category,
      priority,
      timestamp: new Date().toISOString()
    });

    // In a real implementation, you would:
    // 1. Save to database
    // 2. Send email notification to support team
    // 3. Send confirmation email to user
    // 4. Create support ticket in your system

    // For now, we'll simulate the process
    try {
      // Send notification to support team
      await emailService.sendSupportNotification({
        name,
        email,
        subject,
        category,
        message,
        priority,
        submittedAt: new Date().toISOString()
      });

      // Send confirmation to user
      await emailService.sendContactConfirmation({
        name,
        email,
        subject
      });

      console.log('✅ Contact form processed successfully');
    } catch (emailError) {
      console.warn('⚠️ Email sending failed, but contact form was received:', emailError.message);
      // Don't fail the request if email fails - the contact was still received
    }

    res.json({
      success: true,
      message: 'Contact form submitted successfully',
      ticketId: `TICKET-${Date.now()}`, // Generate a simple ticket ID
      estimatedResponse: getEstimatedResponseTime(priority, category)
    });

  } catch (error) {
    console.error('❌ Contact form submission failed:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to submit contact form'
    });
  }
});

// Feedback form submission
router.post('/feedback', async (req, res) => {
  try {
    console.log('💡 Feedback submission received');
    
    // Validate the feedback form data
    const { error } = validateFeedbackForm(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        error: error.details[0].message
      });
    }

    const { type, title, description, category, priority, email, allowContact } = req.body;

    // Log the feedback
    console.log('💡 Feedback Submission:', {
      type,
      title,
      category,
      priority,
      hasEmail: !!email,
      allowContact,
      timestamp: new Date().toISOString()
    });

    // In a real implementation, you would:
    // 1. Save to feedback database
    // 2. Categorize and prioritize
    // 3. Send to product team
    // 4. Track for feature planning

    // For now, we'll simulate the process
    try {
      // Send feedback to product team
      await emailService.sendFeedbackNotification({
        type,
        title,
        description,
        category,
        priority,
        email,
        allowContact,
        submittedAt: new Date().toISOString()
      });

      // Send confirmation if email provided and contact allowed
      if (email && allowContact) {
        await emailService.sendFeedbackConfirmation({
          email,
          title,
          type
        });
      }

      console.log('✅ Feedback processed successfully');
    } catch (emailError) {
      console.warn('⚠️ Email sending failed, but feedback was received:', emailError.message);
      // Don't fail the request if email fails - the feedback was still received
    }

    res.json({
      success: true,
      message: 'Feedback submitted successfully',
      feedbackId: `FB-${Date.now()}`, // Generate a simple feedback ID
      status: 'received'
    });

  } catch (error) {
    console.error('❌ Feedback submission failed:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to submit feedback'
    });
  }
});

// Get support statistics (for admin dashboard)
router.get('/stats', async (req, res) => {
  try {
    // In a real implementation, you would query your database
    // For now, return mock statistics
    const stats = {
      totalContacts: 156,
      totalFeedback: 89,
      averageResponseTime: '4.2 hours',
      satisfactionScore: 4.7,
      categoryBreakdown: {
        technical: 45,
        billing: 32,
        general: 28,
        feature: 51
      },
      priorityBreakdown: {
        low: 67,
        medium: 89,
        high: 34,
        critical: 8
      },
      responseTimeByCategory: {
        technical: '3.1 hours',
        billing: '2.8 hours',
        general: '6.2 hours',
        critical: '0.8 hours'
      }
    };

    res.json({
      success: true,
      stats
    });

  } catch (error) {
    console.error('❌ Failed to get support stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve support statistics'
    });
  }
});

// Helper function to estimate response time
function getEstimatedResponseTime(priority, category) {
  const responseTimeMap = {
    critical: '2 hours',
    high: '6 hours',
    medium: '24 hours',
    low: '48 hours'
  };

  // Billing questions get faster response
  if (category === 'billing') {
    return priority === 'critical' ? '1 hour' : 
           priority === 'high' ? '3 hours' : 
           priority === 'medium' ? '12 hours' : '24 hours';
  }

  return responseTimeMap[priority] || '24 hours';
}

module.exports = router;
