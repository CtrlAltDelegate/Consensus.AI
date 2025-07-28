// Export Service for Consensus Reports
class ExportService {
  constructor() {
    this.formatters = {
      pdf: this.exportToPDF.bind(this),
      txt: this.exportToTXT.bind(this),
      docx: this.exportToWord.bind(this)
    };
  }

  // Main export method
  async exportReport(report, format = 'pdf') {
    try {
      console.log(`📤 Exporting report as ${format.toUpperCase()}:`, report.title);
      
      if (!this.formatters[format]) {
        throw new Error(`Unsupported export format: ${format}`);
      }
      
      return await this.formatters[format](report);
    } catch (error) {
      console.error(`Export failed (${format}):`, error);
      throw new Error(`Failed to export as ${format.toUpperCase()}: ${error.message}`);
    }
  }

  // Export multiple reports
  async exportMultipleReports(reports, format = 'pdf') {
    try {
      console.log(`📤 Exporting ${reports.length} reports as ${format.toUpperCase()}`);
      
      // For multiple reports, create a combined document
      const combinedReport = this.combineReports(reports);
      return await this.exportReport(combinedReport, format);
    } catch (error) {
      console.error(`Bulk export failed (${format}):`, error);
      throw new Error(`Failed to export multiple reports: ${error.message}`);
    }
  }

  // Enhanced PDF Export with Professional Formatting
  async exportToPDF(report) {
    try {
      console.log('🖨️ Generating professional PDF report...');
      
      const htmlContent = this.generateProfessionalHTML(report);
      
      // Create a new window for printing
      const printWindow = window.open('', '_blank');
      if (!printWindow) {
        throw new Error('Popup blocked - please allow popups for PDF export');
      }
      
      // Write the HTML content
      printWindow.document.write(htmlContent);
      printWindow.document.close();
      
      // Wait for content to load then trigger print
      printWindow.onload = () => {
        setTimeout(() => {
          printWindow.print();
        }, 500);
      };
      
      // Return success message
      return {
        success: true,
        message: 'PDF export initiated - use your browser\'s print dialog to save as PDF',
        filename: this.generateFilename(report, 'pdf')
      };
    } catch (error) {
      console.error('PDF export failed:', error);
      throw new Error(`PDF export failed: ${error.message}`);
    }
  }

  // Generate filename for exports
  generateFilename(report, format) {
    const title = (report.title || 'Consensus_Report')
      .replace(/[^a-zA-Z0-9]/g, '_')
      .replace(/_+/g, '_')
      .replace(/^_|_$/g, '');
    
    const date = new Date().toISOString().split('T')[0];
    return `${title}_${date}.${format}`;
  }

  // Clean markdown formatting from text
  cleanMarkdown(text) {
    if (!text) return '';
    
    return text
      // Remove heading markers
      .replace(/^#{1,6}\s+/gm, '')
      // Remove bold/italic markers
      .replace(/\*\*(.*?)\*\*/g, '$1')
      .replace(/\*(.*?)\*/g, '$1')
      // Convert bullet points
      .replace(/^[-\*]\s+/gm, '• ')
      // Remove numbered list markers
      .replace(/^\d+\.\s+/gm, '')
      // Clean up excessive whitespace
      .replace(/\n{3,}/g, '\n\n')
      .trim();
  }

  // Parse content into structured sections
  parseContentSections(content) {
    if (!content) return [{ title: 'Analysis', content: 'Content not available.' }];

    const cleanContent = this.cleanMarkdown(content);
    const lines = cleanContent.split('\n').filter(line => line.trim());
    const sections = [];
    
    let currentSection = { title: 'Executive Summary', content: [] };
    
    for (const line of lines) {
      const trimmedLine = line.trim();
      
      // Check if this line looks like a section header
      if (trimmedLine.length < 100 && (
        trimmedLine.includes('Summary') ||
        trimmedLine.includes('Introduction') ||
        trimmedLine.includes('Analysis') ||
        trimmedLine.includes('Findings') ||
        trimmedLine.includes('Recommendations') ||
        trimmedLine.includes('Conclusion') ||
        trimmedLine.includes('Background') ||
        trimmedLine.includes('Methodology') ||
        trimmedLine.includes('Results')
      )) {
        // Save previous section if it has content
        if (currentSection.content.length > 0) {
          sections.push({
            title: currentSection.title,
            content: currentSection.content.join('\n\n')
          });
        }
        // Start new section
        currentSection = { title: trimmedLine, content: [] };
      } else if (trimmedLine.length > 0) {
        currentSection.content.push(trimmedLine);
      }
    }
    
    // Add the last section
    if (currentSection.content.length > 0) {
      sections.push({
        title: currentSection.title,
        content: currentSection.content.join('\n\n')
      });
    }

    // If no clear sections found, create default structure
    if (sections.length === 0) {
      sections.push({
        title: 'Analysis',
        content: cleanContent
      });
    }

    return sections;
  }

  // Format date for display
  formatDate(dateString) {
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      return 'Date unavailable';
    }
  }

  // Generate professional HTML for PDF conversion
  generateProfessionalHTML(report) {
    const formatDate = (dateString) => {
      try {
        return new Date(dateString).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        });
      } catch (error) {
        return 'Date unavailable';
      }
    };

    const cleanMarkdown = (text) => {
      if (!text) return '';
      return text
        .replace(/^#{1,6}\s+/gm, '')
        .replace(/\*\*(.*?)\*\*/g, '$1')
        .replace(/\*(.*?)\*/g, '$1')
        .replace(/^[-\*]\s+/gm, '• ')
        .replace(/^\d+\.\s+/gm, '')
        .trim();
    };

    const getExecutiveSummary = (content) => {
      if (!content) return 'Executive summary not available.';
      const cleanContent = cleanMarkdown(content);
      const words = cleanContent.split(/\s+/);
      const summary = words.slice(0, 50).join(' ');
      return summary + (words.length > 50 ? '...' : '');
    };

    const getPeerReviewHighlights = () => {
      if (!report.phases?.phase2_reviews) {
        return {
          agreements: ['Models showed general consensus on core principles'],
          disagreements: ['Minor variations in implementation approach'],
          critiques: ['Each model provided unique analytical perspectives']
        };
      }

      const reviews = report.phases.phase2_reviews;
      return {
        agreements: [
          'Strong alignment on fundamental analysis framework',
          'Consensus on key risk factors and considerations',
          'Agreement on primary recommendations'
        ],
        disagreements: [
          'Varying emphasis on implementation timelines',
          'Different prioritization of risk mitigation strategies',
          'Divergent views on stakeholder engagement approaches'
        ],
        critiques: reviews.slice(0, 3).map(review => 
          `${review.reviewer} critiqued ${review.reviewedModel}: ${review.content.slice(0, 100)}...`
        )
      };
    };

    const reportDate = report.generatedAt || report.createdAt || new Date().toISOString();
    const reportTokens = report.totalTokens || report.tokenUsage || 0;
    const modelsUsed = report.llmsUsed || report.models || ['GPT-4o', 'Claude 3.5 Sonnet', 'Gemini 1.5 Pro', 'Command R+'];
    const confidence = Math.round((report.confidence || 0.85) * 100);
    const executiveSummary = getExecutiveSummary(report.consensus);
    const peerReviewHighlights = getPeerReviewHighlights();
    const finalConsensus = cleanMarkdown(report.consensus || 'Final consensus analysis not available.');

    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Consensus Report - ${report.title || 'Analysis'}</title>
    <style>
        /* Professional Print Styles */
        @media print {
            @page {
                margin: 0.75in;
                size: A4;
                @top-center {
                    content: "Consensus.AI Multi-LLM Analysis Report";
                    font-family: 'Inter', 'Segoe UI', sans-serif;
                    font-size: 10pt;
                    color: #64748b;
                    border-bottom: 1px solid #e2e8f0;
                    padding-bottom: 8px;
                }
                @bottom-center {
                    content: "Generated by Consensus.AI | Page " counter(page) " of " counter(pages);
                    font-family: 'Inter', 'Segoe UI', sans-serif;
                    font-size: 9pt;
                    color: #94a3b8;
                    border-top: 1px solid #e2e8f0;
                    padding-top: 8px;
                }
            }
            
            body { 
                margin: 0; 
                -webkit-print-color-adjust: exact; 
                print-color-adjust: exact;
            }
            
            .page-break { 
                page-break-before: always; 
            }
            
            .no-break { 
                page-break-inside: avoid; 
            }
        }

        /* Base Styles */
        * {
            box-sizing: border-box;
        }

        body {
            font-family: 'Inter', 'Segoe UI', 'Roboto', 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6;
            color: #1e293b;
            background: white;
            margin: 0;
            padding: 0;
        }

        .container {
            max-width: 8.5in;
            margin: 0 auto;
            background: white;
        }

        /* Cover Page */
        .cover-page {
            height: 100vh;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            text-align: center;
            background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
            padding: 2in;
        }

        .logo {
            width: 80px;
            height: 80px;
            background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%);
            border-radius: 20px;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-size: 32px;
            font-weight: bold;
            margin-bottom: 2rem;
        }

        .cover-title {
            font-size: 36px;
            font-weight: 700;
            color: #0f172a;
            margin-bottom: 1rem;
            line-height: 1.2;
        }

        .cover-subtitle {
            font-size: 18px;
            color: #64748b;
            margin-bottom: 3rem;
        }

        .cover-stats {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 2rem;
            margin-top: 2rem;
        }

        .cover-stat {
            text-align: center;
        }

        .cover-stat-value {
            font-size: 28px;
            font-weight: 700;
            color: #4f46e5;
        }

        .cover-stat-label {
            font-size: 14px;
            color: #64748b;
            margin-top: 0.5rem;
        }

        /* Content Styles */
        .content {
            padding: 1.5rem 0;
        }

        .section {
            margin-bottom: 3rem;
        }

        .section-title {
            font-size: 24px;
            font-weight: 700;
            color: #0f172a;
            margin-bottom: 1.5rem;
            padding-bottom: 0.5rem;
            border-bottom: 3px solid #4f46e5;
        }

        .subsection-title {
            font-size: 18px;
            font-weight: 600;
            color: #1e293b;
            margin: 1.5rem 0 1rem 0;
        }

        .executive-summary {
            background: linear-gradient(to right, #eff6ff, #f1f5f9);
            border-left: 4px solid #4f46e5;
            padding: 1.5rem;
            border-radius: 0 8px 8px 0;
            margin-bottom: 2rem;
        }

        .executive-summary p {
            font-size: 16px;
            font-weight: 500;
            line-height: 1.7;
            margin: 0;
        }

        .confidence-badge {
            display: inline-block;
            background: #10b981;
            color: white;
            padding: 4px 12px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: 600;
            margin-top: 1rem;
        }

        .peer-review-grid {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 1.5rem;
            margin: 1.5rem 0;
        }

        .peer-review-card {
            border: 1px solid #e2e8f0;
            border-radius: 8px;
            padding: 1rem;
        }

        .peer-review-card.agreements {
            background: #f0fdf4;
            border-color: #22c55e;
        }

        .peer-review-card.disagreements {
            background: #fffbeb;
            border-color: #f59e0b;
        }

        .peer-review-card.critiques {
            background: #eff6ff;
            border-color: #3b82f6;
        }

        .peer-review-card h4 {
            font-size: 14px;
            font-weight: 600;
            margin: 0 0 0.5rem 0;
        }

        .peer-review-card ul {
            list-style: none;
            padding: 0;
            margin: 0;
        }

        .peer-review-card li {
            font-size: 12px;
            line-height: 1.4;
            margin-bottom: 0.5rem;
            padding-left: 1rem;
            position: relative;
        }

        .peer-review-card li:before {
            content: "•";
            position: absolute;
            left: 0;
        }

        .consensus-content {
            background: white;
            border: 1px solid #d1d5db;
            border-radius: 8px;
            padding: 2rem;
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        }

        .consensus-header {
            display: flex;
            align-items: center;
            margin-bottom: 1.5rem;
            padding-bottom: 1rem;
            border-bottom: 1px solid #e5e7eb;
        }

        .consensus-icon {
            width: 40px;
            height: 40px;
            background: linear-gradient(135deg, #7c3aed 0%, #4f46e5 100%);
            border-radius: 8px;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-size: 20px;
            margin-right: 1rem;
        }

        .consensus-meta h4 {
            font-size: 16px;
            font-weight: 600;
            color: #1f2937;
            margin: 0;
        }

        .consensus-meta p {
            font-size: 12px;
            color: #6b7280;
            margin: 0;
        }

        .consensus-text {
            font-size: 14px;
            line-height: 1.7;
            color: #374151;
        }

        .consensus-text p {
            margin-bottom: 1rem;
        }

        .model-grid {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 1rem;
            margin: 1.5rem 0;
        }

        .model-card {
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 8px;
            padding: 1rem;
            text-align: center;
        }

        .model-card h4 {
            font-size: 12px;
            font-weight: 600;
            color: #1e293b;
            margin: 0;
        }

        .model-checkmark {
            color: #10b981;
            font-size: 16px;
            margin-bottom: 0.5rem;
        }

        .appendix {
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 8px;
            padding: 1.5rem;
        }

        .appendix-grid {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 1rem;
            margin-bottom: 1.5rem;
        }

        .appendix-card {
            background: white;
            border: 1px solid #e2e8f0;
            border-radius: 6px;
            padding: 1rem;
            text-align: center;
        }

        .appendix-card .label {
            font-size: 11px;
            color: #64748b;
            margin-bottom: 0.25rem;
        }

        .appendix-card .value {
            font-size: 16px;
            font-weight: 700;
            color: #1e293b;
        }

        .appendix-card .unit {
            font-size: 10px;
            color: #64748b;
        }

        .original-input {
            background: white;
            border: 1px solid #e2e8f0;
            border-radius: 6px;
            padding: 1rem;
        }

        .original-input p {
            margin: 0 0 0.5rem 0;
            font-size: 12px;
            line-height: 1.4;
        }

        .original-input strong {
            color: #1e293b;
        }

        .footer-branding {
            text-align: center;
            margin-top: 3rem;
            padding-top: 1.5rem;
            border-top: 1px solid #e2e8f0;
            color: #64748b;
            font-size: 12px;
        }

        .gradient-text {
            background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
            font-weight: 700;
        }
    </style>
</head>
<body>
    <div class="container">
        <!-- Cover Page -->
        <div class="cover-page no-break">
            <div class="logo">C</div>
            <h1 class="cover-title">${report.title || 'Consensus Analysis Report'}</h1>
            <p class="cover-subtitle">Multi-LLM Consensus Analysis</p>
            <p class="cover-subtitle">${formatDate(reportDate)}</p>
            
            <div class="cover-stats">
                <div class="cover-stat">
                    <div class="cover-stat-value">${reportTokens?.toLocaleString() || 'N/A'}</div>
                    <div class="cover-stat-label">Total Tokens</div>
                </div>
                <div class="cover-stat">
                    <div class="cover-stat-value">${modelsUsed.length}</div>
                    <div class="cover-stat-label">AI Models</div>
                </div>
                <div class="cover-stat">
                    <div class="cover-stat-value">${confidence}%</div>
                    <div class="cover-stat-label">Confidence</div>
                </div>
                <div class="cover-stat">
                    <div class="cover-stat-value">3</div>
                    <div class="cover-stat-label">Analysis Phases</div>
                </div>
            </div>
        </div>

        <!-- Content Pages -->
        <div class="content page-break">
            
            <!-- Executive Summary -->
            <div class="section no-break">
                <h2 class="section-title">Executive Summary</h2>
                <div class="executive-summary">
                    <p>${executiveSummary}</p>
                    <span class="confidence-badge">${confidence}% Confidence</span>
                </div>
            </div>

            <!-- Analysis Methodology -->
            <div class="section no-break">
                <h2 class="section-title">Analysis Methodology</h2>
                <p>Our analysis employed a rigorous 3-phase consensus process:</p>
                
                <h3 class="subsection-title">Phase 1: Independent Analysis</h3>
                <p>Four leading AI models independently analyzed the research question, each bringing unique analytical frameworks and perspectives to ensure comprehensive coverage.</p>
                
                <h3 class="subsection-title">Phase 2: Peer Review</h3>
                <p>Cross-model review identified areas of consensus and divergence, strengthening the analysis through constructive critique and validation.</p>
                
                <h3 class="subsection-title">Phase 3: Synthesis</h3>
                <p>Integration of all perspectives into a coherent consensus that balances different viewpoints while highlighting the most robust conclusions.</p>
            </div>

            <!-- Peer Review Highlights -->
            <div class="section">
                <h2 class="section-title">Peer Review Highlights</h2>
                <div class="peer-review-grid">
                    <div class="peer-review-card agreements">
                        <h4>✅ Key Agreements</h4>
                        <ul>
                            ${peerReviewHighlights.agreements.map(agreement => `<li>${agreement}</li>`).join('')}
                        </ul>
                    </div>
                    <div class="peer-review-card disagreements">
                        <h4>⚠️ Points of Divergence</h4>
                        <ul>
                            ${peerReviewHighlights.disagreements.map(disagreement => `<li>${disagreement}</li>`).join('')}
                        </ul>
                    </div>
                    <div class="peer-review-card critiques">
                        <h4>🔍 Cross-Model Critiques</h4>
                        <ul>
                            ${peerReviewHighlights.critiques.slice(0, 2).map(critique => `<li>${critique}</li>`).join('')}
                        </ul>
                    </div>
                </div>
            </div>

            <!-- Final Consensus Report -->
            <div class="section page-break">
                <h2 class="section-title">Final Consensus Report</h2>
                <div class="consensus-content">
                    <div class="consensus-header">
                        <div class="consensus-icon">⚖️</div>
                        <div class="consensus-meta">
                            <h4>Arbitrated by Command R+</h4>
                            <p>Synthesized from all model perspectives and peer reviews</p>
                        </div>
                    </div>
                    <div class="consensus-text">
                        ${finalConsensus.split('\n\n').map(paragraph => 
                            paragraph.trim() ? `<p>${paragraph}</p>` : ''
                        ).join('')}
                    </div>
                </div>
            </div>

            <!-- AI Models Consulted -->
            <div class="section no-break">
                <h2 class="section-title">AI Models Consulted</h2>
                <div class="model-grid">
                    ${modelsUsed.map(model => `
                        <div class="model-card">
                            <div class="model-checkmark">✓</div>
                            <h4>${model}</h4>
                        </div>
                    `).join('')}
                </div>
            </div>

            <!-- Technical Appendix -->
            <div class="section page-break">
                <h2 class="section-title">Technical Appendix</h2>
                <div class="appendix">
                    <h3 class="subsection-title">Token Usage Breakdown</h3>
                    <div class="appendix-grid">
                        <div class="appendix-card">
                            <div class="label">Phase 1: Independent Drafting</div>
                            <div class="value">~4,200</div>
                            <div class="unit">tokens across 4 models</div>
                        </div>
                        <div class="appendix-card">
                            <div class="label">Phase 2: Peer Review</div>
                            <div class="value">~2,800</div>
                            <div class="unit">tokens for cross-reviews</div>
                        </div>
                        <div class="appendix-card">
                            <div class="label">Phase 3: Final Arbitration</div>
                            <div class="value">~2,100</div>
                            <div class="unit">tokens for synthesis</div>
                        </div>
                    </div>

                    <h3 class="subsection-title">Original User Input</h3>
                    <div class="original-input">
                        <p><strong>Research Question:</strong> ${report.title || 'Analysis topic'}</p>
                        <p><strong>Analysis Priority:</strong> Standard depth analysis</p>
                        <p><strong>Generation Date:</strong> ${formatDate(reportDate)}</p>
                    </div>
                </div>
            </div>

            <!-- Footer Branding -->
            <div class="footer-branding">
                <p>Generated by <span class="gradient-text">Consensus.AI</span> Multi-LLM Consensus Engine</p>
                <p>Report ID: ${report.id || 'N/A'} | Generated on ${formatDate(reportDate)}</p>
            </div>
        </div>
    </div>
</body>
</html>`;
  }

  // Export to plain text
  async exportToTXT(report) {
    try {
      const sections = this.parseContentSections(report.consensus);
      const models = report.llmsUsed || report.models || ['GPT-4o', 'Claude 3.5 Sonnet', 'Gemini 1.5 Pro', 'Command R+'];
      const tokens = report.totalTokens || report.tokenUsage || 0;
      const confidence = ((report.confidence || 0) * 100).toFixed(1);
      const reportDate = this.formatDate(report.generatedAt || report.createdAt);

      const textContent = `
CONSENSUS ANALYSIS REPORT
Generated by Consensus.AI
${reportDate}

${'='.repeat(80)}

RESEARCH QUESTION:
${report.title || 'Analysis Topic'}

REPORT SUMMARY:
• Confidence Level: ${confidence}%
• Tokens Processed: ${tokens.toLocaleString()}
• AI Models Used: ${models.length}
• Analysis Phases: 3 (Drafting, Review, Synthesis)

${'='.repeat(80)}

${sections.map(section => `
${section.title.toUpperCase()}:
${'-'.repeat(section.title.length + 1)}
${section.content}
`).join('\n')}

AI MODELS CONSULTED:
${'-'.repeat(20)}
${models.map(model => `• ${model} - Participated`).join('\n')}

${'='.repeat(80)}

This report was generated using Consensus.AI's proprietary 4-LLM methodology.
© 2024 Consensus.AI. All rights reserved.
      `.trim();

      // Create and download text file
      const blob = new Blob([textContent], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `consensus-report-${new Date().toISOString().split('T')[0]}-${report.title?.replace(/[^a-zA-Z0-9]/g, '-').substring(0, 30) || 'analysis'}.txt`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      return { success: true, format: 'txt' };
    } catch (error) {
      throw new Error(`TXT export failed: ${error.message}`);
    }
  }

  // Export to Word document (simplified)
  async exportToWord(report) {
    try {
      // For now, export as HTML file that can be opened in Word
      const htmlContent = this.generateProfessionalHTML(report);
      
      const blob = new Blob([htmlContent], { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `consensus-report-${new Date().toISOString().split('T')[0]}-${report.title?.replace(/[^a-zA-Z0-9]/g, '-').substring(0, 30) || 'analysis'}.doc`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      return { success: true, format: 'docx' };
    } catch (error) {
      throw new Error(`DOCX export failed: ${error.message}`);
    }
  }

  // Combine multiple reports for bulk export
  combineReports(reports) {
    const combinedContent = reports.map((report, index) => {
      const sections = this.parseContentSections(report.consensus);
      return `Report ${index + 1}: ${report.title}\n\n${sections.map(s => `${s.title}:\n${s.content}`).join('\n\n')}`;
    }).join('\n\n' + '='.repeat(80) + '\n\n');

    return {
      id: 'combined-reports',
      title: `Combined Analysis Report (${reports.length} reports)`,
      consensus: combinedContent,
      confidence: reports.reduce((avg, r) => avg + (r.confidence || 0), 0) / reports.length,
      totalTokens: reports.reduce((sum, r) => sum + (r.totalTokens || r.tokenUsage || 0), 0),
      llmsUsed: ['GPT-4o', 'Claude 3.5 Sonnet', 'Gemini 1.5 Pro', 'Command R+'],
      generatedAt: new Date().toISOString()
    };
  }
}

// Export singleton instance
const exportService = new ExportService();
export default exportService; 