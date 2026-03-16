const { Resend } = require('resend');

class EmailService {
  constructor() {
    this.resend = new Resend(process.env.RESEND_API_KEY);
    this.from = process.env.EMAIL_FROM || 'Consensus.AI <noreply@consensus-ai.com>';
  }

  async _send(mailOptions) {
    const { error } = await this.resend.emails.send(mailOptions);
    if (error) {
      throw new Error(`Email sending failed: ${error.message}`);
    }
  }

  async sendWelcomeEmail(userEmail, userName) {
    try {
      await this._send({
        from: this.from,
        to: userEmail,
        subject: 'Welcome to Consensus.AI',
        html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #333;">Welcome to Consensus.AI!</h1>
          <p>Hi ${userName},</p>
          <p>Thank you for joining Consensus.AI. You're now ready to generate comprehensive consensus reports using multiple AI models.</p>

          <div style="background-color: #f5f5f5; padding: 20px; border-radius: 5px; margin: 20px 0;">
            <h3>Getting Started:</h3>
            <ul>
              <li>Visit your dashboard to view your token usage</li>
              <li>Upload sources for consensus analysis</li>
              <li>Generate your first consensus report</li>
            </ul>
          </div>

          <p>If you have any questions, feel free to reach out to our support team.</p>
          <p>Best regards,<br>The Consensus.AI Team</p>
        </div>
      `
      });
      console.log(`Welcome email sent to ${userEmail}`);
    } catch (error) {
      console.error('Failed to send welcome email:', error);
      throw error;
    }
  }

  async sendTokenUsageAlert(userEmail, userName, usageData) {
    const { usagePercentage, used, limit, tier } = usageData;

    let alertType = 'warning';
    let alertMessage = 'approaching your limit';

    if (usagePercentage >= 100) {
      alertType = 'critical';
      alertMessage = 'exceeded your limit';
    } else if (usagePercentage >= 90) {
      alertType = 'critical';
      alertMessage = 'nearly exhausted your tokens';
    }

    try {
      await this._send({
        from: this.from,
        to: userEmail,
        subject: `Token Usage Alert - ${usagePercentage.toFixed(1)}% Used`,
        html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: ${alertType === 'critical' ? '#e74c3c' : '#f39c12'};">Token Usage Alert</h1>
          <p>Hi ${userName},</p>
          <p>You have ${alertMessage} for your ${tier} subscription.</p>

          <div style="background-color: #f5f5f5; padding: 20px; border-radius: 5px; margin: 20px 0;">
            <h3>Current Usage:</h3>
            <p><strong>Used:</strong> ${used.toLocaleString()} tokens</p>
            <p><strong>Limit:</strong> ${limit.toLocaleString()} tokens</p>
            <p><strong>Usage:</strong> ${usagePercentage.toFixed(1)}%</p>
          </div>

          ${usagePercentage >= 100 ?
            '<p style="color: #e74c3c;"><strong>Additional usage will incur overage charges.</strong></p>' :
            '<p>Consider upgrading your plan to avoid overage charges.</p>'
          }

          <p>Visit your dashboard to manage your subscription or view detailed usage statistics.</p>
          <p>Best regards,<br>The Consensus.AI Team</p>
        </div>
      `
      });
      console.log(`Token usage alert sent to ${userEmail}`);
    } catch (error) {
      console.error('Failed to send token usage alert:', error);
      throw error;
    }
  }

  async sendOverageNotification(userEmail, userName, overageData) {
    const { overageTokens, charge, period } = overageData;

    try {
      await this._send({
        from: this.from,
        to: userEmail,
        subject: 'Token Overage Notification',
        html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #e74c3c;">Token Overage Notification</h1>
          <p>Hi ${userName},</p>
          <p>Your account has exceeded the token limit for this billing period.</p>

          <div style="background-color: #fff3cd; padding: 20px; border-radius: 5px; border-left: 4px solid #ffc107; margin: 20px 0;">
            <h3>Overage Details:</h3>
            <p><strong>Overage Tokens:</strong> ${overageTokens.toLocaleString()}</p>
            <p><strong>Overage Charge:</strong> $${charge.toFixed(2)}</p>
            <p><strong>Period:</strong> ${period}</p>
          </div>

          <p>This overage will be added to your next invoice. To avoid future overages, consider upgrading your subscription plan.</p>
          <p>Visit your billing dashboard to view invoice details and manage your subscription.</p>

          <p>Best regards,<br>The Consensus.AI Team</p>
        </div>
      `
      });
      console.log(`Overage notification sent to ${userEmail}`);
    } catch (error) {
      console.error('Failed to send overage notification:', error);
      throw error;
    }
  }

  async sendBillingFailureNotification(userEmail, userName, failureData) {
    try {
      await this._send({
        from: this.from,
        to: userEmail,
        subject: 'Payment Failed - Action Required',
        html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #e74c3c;">Payment Failed</h1>
          <p>Hi ${userName},</p>
          <p>We were unable to process your recent payment. Your account access may be limited until this is resolved.</p>

          <div style="background-color: #f8d7da; padding: 20px; border-radius: 5px; border-left: 4px solid #dc3545; margin: 20px 0;">
            <h3>Action Required:</h3>
            <ul>
              <li>Update your payment method</li>
              <li>Ensure sufficient funds are available</li>
              <li>Contact your bank if the issue persists</li>
            </ul>
          </div>

          <p>Please update your payment information in your billing dashboard to continue using Consensus.AI without interruption.</p>

          <p>If you need assistance, please contact our support team.</p>
          <p>Best regards,<br>The Consensus.AI Team</p>
        </div>
      `
      });
      console.log(`Billing failure notification sent to ${userEmail}`);
    } catch (error) {
      console.error('Failed to send billing failure notification:', error);
      throw error;
    }
  }

  async sendConsensusReport(userEmail, userName, consensusData, pdfBuffer) {
    try {
      await this._send({
        from: this.from,
        to: userEmail,
        subject: 'Your Consensus Report is Ready',
        html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #333;">Your Consensus Report is Ready</h1>
          <p>Hi ${userName},</p>
          <p>Your consensus analysis has been completed and is attached to this email.</p>

          <div style="background-color: #d4edda; padding: 20px; border-radius: 5px; border-left: 4px solid #28a745; margin: 20px 0;">
            <h3>Report Summary:</h3>
            <p><strong>Confidence Level:</strong> ${(consensusData.confidence * 100).toFixed(1)}%</p>
            <p><strong>Sources Analyzed:</strong> ${consensusData.sources?.length || 'N/A'}</p>
            <p><strong>Generated:</strong> ${new Date().toLocaleDateString()}</p>
          </div>

          <p>The detailed analysis is available in the attached PDF report.</p>
          <p>Best regards,<br>The Consensus.AI Team</p>
        </div>
      `,
        attachments: [
          {
            filename: `consensus-report-${Date.now()}.pdf`,
            content: pdfBuffer.toString('base64'),
          }
        ]
      });
      console.log(`Consensus report sent to ${userEmail}`);
    } catch (error) {
      console.error('Failed to send consensus report:', error);
      throw error;
    }
  }

  async sendPasswordResetEmail(userEmail, userName, resetLink) {
    try {
      await this._send({
        from: this.from,
        to: userEmail,
        subject: 'Reset Your Consensus.AI Password',
        html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #333;">Password Reset Request</h1>
          <p>Hi ${userName},</p>
          <p>We received a request to reset the password for your Consensus.AI account. Click the button below to choose a new password:</p>

          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetLink}" style="background-color: #4F46E5; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-size: 16px; display: inline-block;">
              Reset My Password
            </a>
          </div>

          <div style="background-color: #f5f5f5; padding: 20px; border-radius: 5px; margin: 20px 0;">
            <p style="margin: 0; font-size: 14px; color: #666;">
              This link will expire in <strong>1 hour</strong>. If you didn't request a password reset, you can safely ignore this email — your password will not be changed.
            </p>
          </div>

          <p style="font-size: 13px; color: #999;">If the button above doesn't work, copy and paste this link into your browser:<br>
            <a href="${resetLink}" style="color: #4F46E5;">${resetLink}</a>
          </p>

          <p>Best regards,<br>The Consensus.AI Team</p>
        </div>
      `
      });
      console.log(`Password reset email sent to ${userEmail}`);
    } catch (error) {
      console.error('Failed to send password reset email:', error);
      throw error;
    }
  }

  // Send support notification to team
  async sendSupportNotification({ name, email, subject, category, message, priority, submittedAt }) {
    try {
      console.log('📧 Support Notification:', {
        from: `${name} <${email}>`,
        subject: `[${category.toUpperCase()}] ${subject}`,
        priority,
        message: message.substring(0, 100) + '...',
        submittedAt
      });
      return { success: true };
    } catch (error) {
      console.error('❌ Failed to send support notification:', error);
      throw error;
    }
  }

  // Send contact confirmation to user
  async sendContactConfirmation({ name, email, subject }) {
    try {
      console.log('📧 Contact Confirmation:', {
        to: email,
        subject: `We received your message: ${subject}`,
        name
      });
      return { success: true };
    } catch (error) {
      console.error('❌ Failed to send contact confirmation:', error);
      throw error;
    }
  }

  // Send feedback notification to product team
  async sendFeedbackNotification({ type, title, description, category, priority, email, allowContact, submittedAt }) {
    try {
      console.log('💡 Feedback Notification:', {
        type,
        title,
        category,
        priority,
        hasContact: email && allowContact,
        submittedAt
      });
      return { success: true };
    } catch (error) {
      console.error('❌ Failed to send feedback notification:', error);
      throw error;
    }
  }

  // Send feedback confirmation to user
  async sendFeedbackConfirmation({ email, title, type }) {
    try {
      console.log('💡 Feedback Confirmation:', {
        to: email,
        subject: `Thank you for your ${type} feedback: ${title}`,
        type
      });
      return { success: true };
    } catch (error) {
      console.error('❌ Failed to send feedback confirmation:', error);
      throw error;
    }
  }
}

module.exports = new EmailService();
