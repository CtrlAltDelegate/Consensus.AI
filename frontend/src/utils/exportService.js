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
    const sections = this.parseContentSections(report.consensus);
    const models = report.llmsUsed || report.models || ['GPT-4o', 'Claude 3.5 Sonnet', 'Gemini 1.5 Pro', 'Command R+'];
    const tokens = report.totalTokens || report.tokenUsage || 0;
    const confidence = ((report.confidence || 0) * 100).toFixed(1);
    const reportDate = this.formatDate(report.generatedAt || report.createdAt);

    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Consensus Analysis Report</title>
    <style>
        body {
            font-family: 'Georgia', 'Times New Roman', serif;
            line-height: 1.6;
            color: #2c3e50;
            max-width: 800px;
            margin: 0 auto;
            padding: 40px 20px;
            background: white;
        }
        .header {
            text-align: center;
            border-bottom: 3px solid #3498db;
            padding-bottom: 30px;
            margin-bottom: 40px;
        }
        .header h1 {
            font-size: 28px;
            color: #2c3e50;
            margin: 0 0 10px 0;
            font-weight: bold;
        }
        .header .subtitle {
            font-size: 16px;
            color: #7f8c8d;
            margin: 0;
        }
        .metadata {
            background: #f8f9fa;
            padding: 20px;
            border-radius: 8px;
            margin-bottom: 30px;
            border-left: 4px solid #3498db;
        }
        .metadata h2 {
            margin: 0 0 15px 0;
            font-size: 18px;
            color: #2c3e50;
        }
        .metadata-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 15px;
        }
        .metadata-item {
            display: flex;
            justify-content: space-between;
            font-size: 14px;
        }
        .metadata-label {
            font-weight: bold;
            color: #34495e;
        }
        .metadata-value {
            color: #7f8c8d;
        }
        .question-section {
            background: #e3f2fd;
            padding: 25px;
            border-radius: 8px;
            margin-bottom: 30px;
            border-left: 4px solid #2196f3;
        }
        .question-section h2 {
            margin: 0 0 15px 0;
            font-size: 20px;
            color: #1976d2;
        }
        .question-text {
            font-size: 16px;
            font-style: italic;
            color: #37474f;
            line-height: 1.5;
        }
        .section {
            margin-bottom: 35px;
            page-break-inside: avoid;
        }
        .section h2 {
            font-size: 22px;
            color: #2c3e50;
            border-bottom: 2px solid #ecf0f1;
            padding-bottom: 10px;
            margin-bottom: 20px;
        }
        .section-content {
            font-size: 15px;
            line-height: 1.7;
            text-align: justify;
            color: #34495e;
        }
        .models-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
            gap: 15px;
            margin: 20px 0;
        }
        .model-card {
            background: #f8f9fa;
            padding: 15px;
            border-radius: 6px;
            text-align: center;
            border: 1px solid #e9ecef;
        }
        .model-name {
            font-weight: bold;
            color: #495057;
            font-size: 13px;
        }
        .model-status {
            color: #28a745;
            font-size: 12px;
            margin-top: 5px;
        }
        .footer {
            margin-top: 50px;
            padding-top: 30px;
            border-top: 2px solid #ecf0f1;
            text-align: center;
            color: #7f8c8d;
            font-size: 12px;
        }
        .confidence-badge {
            display: inline-block;
            padding: 4px 12px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: bold;
            color: white;
            background: ${confidence >= 80 ? '#28a745' : confidence >= 60 ? '#ffc107' : '#dc3545'};
        }
        @media print {
            body { padding: 20px; }
            .header { page-break-after: avoid; }
            .section { page-break-inside: avoid; }
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>Consensus Analysis Report</h1>
        <p class="subtitle">Generated by Consensus.AI • ${reportDate}</p>
    </div>

    <div class="metadata">
        <h2>Report Summary</h2>
        <div class="metadata-grid">
            <div class="metadata-item">
                <span class="metadata-label">Confidence Level:</span>
                <span class="metadata-value">${confidence}% <span class="confidence-badge">${confidence >= 80 ? 'High' : confidence >= 60 ? 'Moderate' : 'Low'}</span></span>
            </div>
            <div class="metadata-item">
                <span class="metadata-label">Tokens Processed:</span>
                <span class="metadata-value">${tokens.toLocaleString()}</span>
            </div>
            <div class="metadata-item">
                <span class="metadata-label">AI Models Used:</span>
                <span class="metadata-value">${models.length}</span>
            </div>
            <div class="metadata-item">
                <span class="metadata-label">Analysis Phases:</span>
                <span class="metadata-value">3 (Drafting, Review, Synthesis)</span>
            </div>
        </div>
    </div>

    <div class="question-section">
        <h2>Research Question</h2>
        <p class="question-text">${report.title || 'Analysis Topic'}</p>
    </div>

    ${sections.map(section => `
        <div class="section">
            <h2>${section.title}</h2>
            <div class="section-content">${section.content.replace(/\n/g, '</p><p>')}</div>
        </div>
    `).join('')}

    <div class="section">
        <h2>AI Models Consulted</h2>
        <div class="models-grid">
            ${models.map(model => `
                <div class="model-card">
                    <div class="model-name">${model}</div>
                    <div class="model-status">✓ Participated</div>
                </div>
            `).join('')}
        </div>
    </div>

    <div class="footer">
        <p>This report was generated using Consensus.AI's proprietary 4-LLM methodology.</p>
        <p>© 2024 Consensus.AI. All rights reserved.</p>
    </div>
</body>
</html>`;
  }

  // Export to PDF using browser's print functionality
  async exportToPDF(report) {
    try {
      const htmlContent = this.generateProfessionalHTML(report);
      
      // Create a new window with the formatted content
      const printWindow = window.open('', '_blank');
      printWindow.document.write(htmlContent);
      printWindow.document.close();
      
      // Wait for content to load, then trigger print
      printWindow.onload = () => {
        setTimeout(() => {
          printWindow.print();
          printWindow.close();
        }, 250);
      };
      
      return { success: true, format: 'pdf' };
    } catch (error) {
      throw new Error(`PDF export failed: ${error.message}`);
    }
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