// Export Service for Consensus Reports
// Handles PDF, TXT, and DOCX export with professional formatting

class ExportService {
  constructor() {
    this.brandName = 'Consensus.AI';
    this.brandLogo = '/api/placeholder/120/40'; // Would be actual logo
    this.reportVersion = '1.0';
  }

  // Main export function
  async exportReport(report, format = 'pdf', options = {}) {
    try {
      console.log(`🚀 Exporting report "${report.title}" as ${format.toUpperCase()}`);
      
      switch (format.toLowerCase()) {
        case 'pdf':
          return await this.exportToPDF(report, options);
        case 'txt':
          return await this.exportToTXT(report, options);
        case 'docx':
          return await this.exportToDOCX(report, options);
        default:
          throw new Error(`Unsupported export format: ${format}`);
      }
    } catch (error) {
      console.error('❌ Export failed:', error);
      throw error;
    }
  }

  // Export multiple reports as ZIP
  async exportMultipleReports(reports, format = 'pdf', options = {}) {
    try {
      console.log(`📦 Bulk exporting ${reports.length} reports as ${format.toUpperCase()}`);
      
      const exportedFiles = [];
      
      for (const report of reports) {
        const exportedContent = await this.exportReport(report, format, options);
        exportedFiles.push({
          filename: this.generateFilename(report, format),
          content: exportedContent,
          report: report
        });
      }

      // Create ZIP file (mock implementation)
      const zipContent = await this.createZipFile(exportedFiles, format);
      this.downloadFile(zipContent, `consensus-reports-${Date.now()}.zip`, 'application/zip');
      
      return { success: true, fileCount: exportedFiles.length };
    } catch (error) {
      console.error('❌ Bulk export failed:', error);
      throw error;
    }
  }

  // PDF Export (using HTML to PDF conversion)
  async exportToPDF(report, options = {}) {
    const htmlContent = this.generateHTMLReport(report, options);
    
    // In a real implementation, this would use a library like jsPDF, Puppeteer, or a server-side service
    // For now, we'll create a mock PDF and trigger download
    const pdfBlob = await this.htmlToPDF(htmlContent, {
      filename: this.generateFilename(report, 'pdf'),
      margins: { top: 20, bottom: 20, left: 20, right: 20 },
      format: 'A4',
      printBackground: true,
      displayHeaderFooter: true,
      headerTemplate: this.generatePDFHeader(report),
      footerTemplate: this.generatePDFFooter(report)
    });
    
    this.downloadFile(pdfBlob, this.generateFilename(report, 'pdf'), 'application/pdf');
    return pdfBlob;
  }

  // TXT Export
  async exportToTXT(report, options = {}) {
    const txtContent = this.generateTXTReport(report, options);
    const blob = new Blob([txtContent], { type: 'text/plain;charset=utf-8' });
    
    this.downloadFile(blob, this.generateFilename(report, 'txt'), 'text/plain');
    return blob;
  }

  // DOCX Export (mock implementation)
  async exportToDOCX(report, options = {}) {
    // In a real implementation, this would use a library like docx or mammoth
    const docContent = this.generateDOCXContent(report, options);
    const blob = new Blob([docContent], { 
      type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' 
    });
    
    this.downloadFile(blob, this.generateFilename(report, 'docx'), 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
    return blob;
  }

  // Generate HTML for PDF conversion
  generateHTMLReport(report, options = {}) {
    const createdDate = new Date(report.generatedAt || report.createdAt);
    const confidence = report.confidence || 0;
    const confidenceLevel = confidence >= 0.8 ? 'High' : confidence >= 0.6 ? 'Moderate' : 'Low';

    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Consensus Analysis Report - ${report.title}</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6; 
            color: #1e293b; 
            max-width: 210mm; 
            margin: 0 auto; 
            padding: 20mm;
            background: white;
        }
        .header { 
            border-bottom: 3px solid #4f46e5; 
            padding-bottom: 20px; 
            margin-bottom: 30px; 
            text-align: center;
        }
        .logo { 
            font-size: 24px; 
            font-weight: bold; 
            color: #4f46e5; 
            margin-bottom: 10px;
        }
        .report-title { 
            font-size: 28px; 
            font-weight: bold; 
            margin: 20px 0 10px;
            color: #0f172a;
        }
        .report-meta { 
            color: #64748b; 
            font-size: 14px;
            margin-bottom: 20px;
        }
        .section { 
            margin: 30px 0; 
            page-break-inside: avoid;
        }
        .section-title { 
            font-size: 20px; 
            font-weight: bold; 
            margin-bottom: 15px; 
            color: #1e293b;
            border-bottom: 2px solid #e2e8f0;
            padding-bottom: 5px;
        }
        .subsection-title { 
            font-size: 16px; 
            font-weight: 600; 
            margin: 20px 0 10px; 
            color: #374151;
        }
        .content { 
            margin-bottom: 15px; 
            text-align: justify;
        }
        .metadata-grid { 
            display: grid; 
            grid-template-columns: repeat(2, 1fr); 
            gap: 20px; 
            margin: 20px 0;
        }
        .metadata-item { 
            background: #f8fafc; 
            padding: 15px; 
            border-radius: 8px; 
            border-left: 4px solid #4f46e5;
        }
        .metadata-label { 
            font-size: 12px; 
            color: #64748b; 
            text-transform: uppercase; 
            letter-spacing: 0.5px; 
            margin-bottom: 5px;
        }
        .metadata-value { 
            font-size: 18px; 
            font-weight: bold; 
            color: #1e293b;
        }
        .confidence-high { color: #059669; }
        .confidence-moderate { color: #d97706; }
        .confidence-low { color: #dc2626; }
        .model-list { 
            display: grid; 
            grid-template-columns: repeat(2, 1fr); 
            gap: 10px; 
            margin: 15px 0;
        }
        .model-item { 
            background: #f1f5f9; 
            padding: 10px; 
            border-radius: 6px; 
            text-align: center; 
            font-weight: 500;
        }
        .phase-section { 
            background: #f8fafc; 
            padding: 20px; 
            border-radius: 8px; 
            margin: 20px 0;
            border-left: 4px solid #8b5cf6;
        }
        .footer { 
            margin-top: 50px; 
            padding-top: 20px; 
            border-top: 1px solid #e2e8f0; 
            text-align: center; 
            color: #64748b; 
            font-size: 12px;
        }
        .page-break { page-break-before: always; }
        @media print {
            body { margin: 0; padding: 15mm; }
            .no-print { display: none; }
        }
    </style>
</head>
<body>
    <div class="header">
        <div class="logo">${this.brandName}</div>
        <h1 class="report-title">${report.title}</h1>
        <div class="report-meta">
            Generated on ${createdDate.toLocaleDateString('en-US', { 
              year: 'numeric', month: 'long', day: 'numeric', 
              hour: '2-digit', minute: '2-digit' 
            })} | Report Version ${this.reportVersion}
        </div>
    </div>

    <div class="section">
        <h2 class="section-title">Executive Summary</h2>
        <div class="metadata-grid">
            <div class="metadata-item">
                <div class="metadata-label">Confidence Level</div>
                <div class="metadata-value confidence-${confidenceLevel.toLowerCase()}">
                    ${confidenceLevel} (${(confidence * 100).toFixed(1)}%)
                </div>
            </div>
            <div class="metadata-item">
                <div class="metadata-label">Analysis Scope</div>
                <div class="metadata-value">${report.llmsUsed?.length || 4} AI Models</div>
            </div>
            <div class="metadata-item">
                <div class="metadata-label">Token Usage</div>
                <div class="metadata-value">${(report.totalTokens || 0).toLocaleString()}</div>
            </div>
            <div class="metadata-item">
                <div class="metadata-label">Processing Time</div>
                <div class="metadata-value">~90 seconds</div>
            </div>
        </div>
        
        <h3 class="subsection-title">Research Question</h3>
        <div class="content">${report.title}</div>
    </div>

    <div class="section">
        <h2 class="section-title">Methodology</h2>
        <div class="content">
            This analysis was conducted using our proprietary 3-phase consensus methodology, 
            ensuring comprehensive evaluation through multiple AI perspectives:
        </div>
        
        <div class="phase-section">
            <h3 class="subsection-title">Phase 1: Independent Drafting</h3>
            <div class="content">
                Multiple AI models independently analyzed the research question to provide 
                diverse perspectives and comprehensive coverage of the topic.
            </div>
        </div>
        
        <div class="phase-section">
            <h3 class="subsection-title">Phase 2: Peer Review</h3>
            <div class="content">
                Each initial analysis was cross-reviewed by other AI models to identify 
                strengths, weaknesses, and areas of consensus or disagreement.
            </div>
        </div>
        
        <div class="phase-section">
            <h3 class="subsection-title">Phase 3: Final Arbitration</h3>
            <div class="content">
                A specialized arbitrator model synthesized all perspectives and reviews 
                to produce the final consensus analysis.
            </div>
        </div>

        <h3 class="subsection-title">AI Models Utilized</h3>
        <div class="model-list">
            ${(report.llmsUsed || ['GPT-4o', 'Claude 3.5 Sonnet', 'Gemini 1.5 Pro', 'Command R+'])
              .map(model => `<div class="model-item">${model}</div>`).join('')}
        </div>
    </div>

    <div class="section page-break">
        <h2 class="section-title">Consensus Analysis</h2>
        <div class="content" style="white-space: pre-wrap; font-size: 16px; line-height: 1.8;">
${report.consensus || 'Analysis content not available.'}
        </div>
    </div>

    <div class="section">
        <h2 class="section-title">Technical Details</h2>
        <div class="metadata-grid">
            <div class="metadata-item">
                <div class="metadata-label">Total Tokens Processed</div>
                <div class="metadata-value">${(report.totalTokens || 0).toLocaleString()}</div>
            </div>
            <div class="metadata-item">
                <div class="metadata-label">Models Utilized</div>
                <div class="metadata-value">${report.llmsUsed?.length || 4}</div>
            </div>
            <div class="metadata-item">
                <div class="metadata-label">Analysis Phases</div>
                <div class="metadata-value">3</div>
            </div>
            <div class="metadata-item">
                <div class="metadata-label">Report ID</div>
                <div class="metadata-value" style="font-size: 12px; font-family: monospace;">
                    ${report.id || 'N/A'}
                </div>
            </div>
        </div>
    </div>

    <div class="footer">
        <div>Generated by ${this.brandName} | Advanced AI Consensus Analysis Platform</div>
        <div style="margin-top: 5px;">
            This report was generated using proprietary multi-model consensus methodology.
        </div>
        <div style="margin-top: 10px; font-size: 10px;">
            © ${new Date().getFullYear()} Consensus.AI. All rights reserved.
        </div>
    </div>
</body>
</html>`;
  }

  // Generate TXT format
  generateTXTReport(report, options = {}) {
    const createdDate = new Date(report.generatedAt || report.createdAt);
    const confidence = report.confidence || 0;
    const confidenceLevel = confidence >= 0.8 ? 'High' : confidence >= 0.6 ? 'Moderate' : 'Low';

    return `
================================================================================
CONSENSUS ANALYSIS REPORT
${this.brandName} - Advanced AI Consensus Analysis Platform
================================================================================

TITLE: ${report.title}

GENERATED: ${createdDate.toLocaleDateString('en-US', { 
  year: 'numeric', month: 'long', day: 'numeric', 
  hour: '2-digit', minute: '2-digit' 
})}

REPORT ID: ${report.id || 'N/A'}

================================================================================
EXECUTIVE SUMMARY
================================================================================

Research Question: ${report.title}

Confidence Level: ${confidenceLevel} (${(confidence * 100).toFixed(1)}%)
AI Models Used: ${report.llmsUsed?.length || 4}
Token Usage: ${(report.totalTokens || 0).toLocaleString()}
Processing Method: 3-Phase Consensus Analysis

================================================================================
METHODOLOGY
================================================================================

This analysis was conducted using our proprietary 3-phase consensus methodology:

PHASE 1: INDEPENDENT DRAFTING
Multiple AI models independently analyzed the research question to provide 
diverse perspectives and comprehensive coverage of the topic.

PHASE 2: PEER REVIEW  
Each initial analysis was cross-reviewed by other AI models to identify 
strengths, weaknesses, and areas of consensus or disagreement.

PHASE 3: FINAL ARBITRATION
A specialized arbitrator model synthesized all perspectives and reviews 
to produce the final consensus analysis.

AI MODELS UTILIZED:
${(report.llmsUsed || ['GPT-4o', 'Claude 3.5 Sonnet', 'Gemini 1.5 Pro', 'Command R+'])
  .map(model => `- ${model}`).join('\n')}

================================================================================
CONSENSUS ANALYSIS
================================================================================

${report.consensus || 'Analysis content not available.'}

================================================================================
TECHNICAL DETAILS
================================================================================

Total Tokens Processed: ${(report.totalTokens || 0).toLocaleString()}
Models Utilized: ${report.llmsUsed?.length || 4}
Analysis Phases: 3
Report Version: ${this.reportVersion}

================================================================================
FOOTER
================================================================================

Generated by ${this.brandName}
© ${new Date().getFullYear()} Consensus.AI. All rights reserved.

This report was generated using proprietary multi-model consensus methodology.
For questions or support, please contact our team.

================================================================================
    `.trim();
  }

  // Generate DOCX content (simplified)
  generateDOCXContent(report, options = {}) {
    // This would use a proper DOCX library in production
    return this.generateTXTReport(report, options);
  }

  // Mock PDF conversion
  async htmlToPDF(htmlContent, options = {}) {
    // In production, this would use:
    // - jsPDF for client-side PDF generation
    // - Puppeteer for server-side HTML to PDF
    // - A PDF generation service API
    
    // For now, create a simple PDF-like blob
    const pdfContent = `%PDF-1.4
1 0 obj
<<
/Type /Catalog
/Pages 2 0 R
>>
endobj

2 0 obj
<<
/Type /Pages
/Kids [3 0 R]
/Count 1
>>
endobj

3 0 obj
<<
/Type /Page
/Parent 2 0 R
/MediaBox [0 0 612 792]
/Contents 4 0 R
>>
endobj

4 0 obj
<<
/Length 44
>>
stream
BT
/F1 12 Tf
100 700 Td
(Consensus Report - ${options.filename || 'report'}) Tj
ET
endstream
endobj

xref
0 5
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
0000000206 00000 n 
trailer
<<
/Size 5
/Root 1 0 R
>>
startxref
299
%%EOF`;

    return new Blob([pdfContent], { type: 'application/pdf' });
  }

  // Create ZIP file for multiple exports
  async createZipFile(files, format) {
    // In production, use a ZIP library like JSZip
    const mockZipContent = `PK\x03\x04Mock ZIP file containing ${files.length} ${format} reports`;
    return new Blob([mockZipContent], { type: 'application/zip' });
  }

  // Generate filename
  generateFilename(report, format) {
    const date = new Date(report.generatedAt || report.createdAt);
    const dateStr = date.toISOString().slice(0, 10);
    const title = report.title
      .replace(/[^a-zA-Z0-9\s]/g, '')
      .replace(/\s+/g, '-')
      .substring(0, 50);
    
    return `consensus-report-${dateStr}-${title}.${format}`;
  }

  // PDF Header
  generatePDFHeader(report) {
    return `
      <div style="font-size: 10px; text-align: center; color: #666; padding: 10px;">
        ${this.brandName} | Consensus Analysis Report
      </div>
    `;
  }

  // PDF Footer
  generatePDFFooter(report) {
    return `
      <div style="font-size: 10px; text-align: center; color: #666; padding: 10px;">
        <span class="pageNumber"></span> | Generated on ${new Date().toLocaleDateString()}
      </div>
    `;
  }

  // Download file helper
  downloadFile(blob, filename, mimeType) {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.style.display = 'none';
    
    document.body.appendChild(link);
    link.click();
    
    // Cleanup
    setTimeout(() => {
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }, 100);
    
    console.log(`✅ Downloaded: ${filename} (${mimeType})`);
  }

  // Get export options for UI
  getExportFormats() {
    return [
      { value: 'pdf', label: 'PDF Document', icon: '📄', description: 'Professional PDF report' },
      { value: 'txt', label: 'Text File', icon: '📝', description: 'Plain text format' },
      { value: 'docx', label: 'Word Document', icon: '📘', description: 'Microsoft Word format' }
    ];
  }

  // Validate report before export
  validateReport(report) {
    if (!report) throw new Error('Report data is required');
    if (!report.title) throw new Error('Report title is required');
    if (!report.consensus) throw new Error('Report consensus content is required');
    return true;
  }
}

// Export singleton instance
export const exportService = new ExportService();
export default exportService; 