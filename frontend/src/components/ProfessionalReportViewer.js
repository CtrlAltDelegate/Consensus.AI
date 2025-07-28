import React, { useState } from 'react';

function ProfessionalReportViewer({ report, onClose, onExport, onSave }) {
  const [exportFormat, setExportFormat] = useState('pdf');
  
  // Debug logging
  React.useEffect(() => {
    if (report) {
      console.log('📊 ProfessionalReportViewer received report:', {
        id: report.id,
        title: report.title,
        hasConsensus: !!report.consensus,
        consensusLength: report.consensus?.length || 0,
        confidence: report.confidence,
        totalTokens: report.totalTokens || report.tokenUsage,
        generatedAt: report.generatedAt || report.createdAt
      });
    } else {
      console.log('⚠️ ProfessionalReportViewer received null/undefined report');
    }
  }, [report]);
  
  if (!report) {
    console.log('🚫 ProfessionalReportViewer: No report provided, not rendering');
    return null;
  }

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
      console.warn('Error formatting date:', dateString, error);
      return 'Date unavailable';
    }
  };

  const getConfidenceLevel = (confidence) => {
    if (confidence >= 0.8) return { label: 'High Confidence', color: 'emerald', description: 'Strong consensus across models' };
    if (confidence >= 0.6) return { label: 'Moderate Confidence', color: 'amber', description: 'Good agreement with some variation' };
    return { label: 'Low Confidence', color: 'red', description: 'Significant disagreement between models' };
  };

  // Parse and clean the consensus content to remove markdown
  const parseConsensusContent = (content) => {
    if (!content) return { sections: [], rawContent: 'Analysis content not available.' };

    // Remove markdown formatting and parse into structured sections
    const cleanContent = content
      .replace(/^#+ /gm, '') // Remove heading markers
      .replace(/\*\*(.*?)\*\*/g, '$1') // Remove bold markers
      .replace(/\*(.*?)\*/g, '$1') // Remove italic markers
      .replace(/^- /gm, '• ') // Convert bullet points
      .replace(/^\d+\. /gm, '') // Remove numbered lists
      .trim();

    // Try to identify sections
    const sections = [];
    const lines = cleanContent.split('\n').filter(line => line.trim());
    
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
          sections.push(currentSection);
        }
        // Start new section
        currentSection = { title: trimmedLine, content: [] };
      } else if (trimmedLine.length > 0) {
        currentSection.content.push(trimmedLine);
      }
    }
    
    // Add the last section
    if (currentSection.content.length > 0) {
      sections.push(currentSection);
    }

    // If no clear sections found, create default structure
    if (sections.length === 0) {
      sections.push({
        title: 'Analysis',
        content: cleanContent.split('\n').filter(line => line.trim())
      });
    }

    return { sections, rawContent: cleanContent };
  };

  const confidenceLevel = getConfidenceLevel(report.confidence || 0);
  const reportDate = report.generatedAt || report.createdAt || new Date().toISOString();
  const reportTokens = report.totalTokens || report.tokenUsage || 0;
  const { sections } = parseConsensusContent(report.consensus);

  console.log('🎨 ProfessionalReportViewer rendering with data:', {
    confidenceLevel,
    reportDate,
    reportTokens,
    sectionsCount: sections.length
  });

  return React.createElement('div', { className: 'fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4' },
    React.createElement('div', { className: 'bg-white rounded-xl shadow-2xl max-w-5xl w-full max-h-[95vh] overflow-hidden flex flex-col' },
      
      // Fixed Header
      React.createElement('div', { className: 'bg-slate-50 border-b border-slate-200 px-8 py-6 flex-shrink-0' },
        React.createElement('div', { className: 'flex items-center justify-between' },
          React.createElement('div', { className: 'flex-1' },
            React.createElement('h1', { className: 'text-2xl font-bold text-slate-900 mb-2' }, 'Consensus Analysis Report'),
            React.createElement('p', { className: 'text-slate-600' }, formatDate(reportDate))
          ),
          React.createElement('div', { className: 'flex items-center space-x-3' },
            // Export Dropdown
            React.createElement('div', { className: 'relative' },
              React.createElement('select', {
                value: exportFormat,
                onChange: (e) => setExportFormat(e.target.value),
                className: 'border border-slate-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500'
              },
                React.createElement('option', { value: 'pdf' }, 'Export as PDF'),
                React.createElement('option', { value: 'txt' }, 'Export as TXT'),
                React.createElement('option', { value: 'docx' }, 'Export as DOCX')
              )
            ),
            React.createElement('button', {
              onClick: () => onExport && onExport(exportFormat),
              className: 'inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors duration-200'
            }, 'Export'),
            React.createElement('button', {
              onClick: onClose,
              className: 'p-2 text-slate-400 hover:text-slate-600 transition-colors duration-200 text-xl'
            }, '×')
          )
        )
      ),

      // Scrollable Content Area (single scroll container)
      React.createElement('div', { className: 'flex-1 overflow-y-auto' },
        React.createElement('div', { className: 'px-8 py-8' },

          // Research Question Header
          React.createElement('section', { className: 'mb-8 bg-gradient-to-r from-indigo-50 to-violet-50 border border-indigo-200 rounded-lg p-6' },
            React.createElement('h2', { className: 'text-xl font-semibold text-slate-900 mb-3' }, 'Research Question'),
            React.createElement('p', { className: 'text-lg text-slate-700 leading-relaxed' }, report.title || 'Analysis Topic'),
            React.createElement('div', { className: 'mt-4 flex items-center justify-between' },
              React.createElement('div', { className: 'flex items-center space-x-4' },
                React.createElement('span', { 
                  className: `inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-${confidenceLevel.color}-100 text-${confidenceLevel.color}-800`
                }, confidenceLevel.label),
                React.createElement('span', { className: 'text-sm text-slate-600' }, confidenceLevel.description)
              ),
              React.createElement('div', { className: 'text-right' },
                React.createElement('div', { className: 'text-sm font-medium text-slate-900' }, `${reportTokens?.toLocaleString() || 'N/A'} tokens`),
                React.createElement('div', { className: 'text-xs text-slate-500' }, '4 AI models consulted')
              )
            )
          ),

          // Analysis Methodology
          React.createElement('section', { className: 'mb-8' },
            React.createElement('h2', { className: 'text-xl font-semibold text-slate-900 mb-6 pb-2 border-b border-slate-200' }, 'Analysis Methodology'),
            React.createElement('div', { className: 'grid grid-cols-1 md:grid-cols-3 gap-6' },
              React.createElement('div', { className: 'bg-white border border-slate-200 rounded-lg p-6' },
                React.createElement('div', { className: 'w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4' },
                  React.createElement('span', { className: 'text-blue-600 font-bold text-lg' }, '1')
                ),
                React.createElement('h3', { className: 'font-semibold text-slate-900 mb-2' }, 'Independent Analysis'),
                React.createElement('p', { className: 'text-sm text-slate-600' }, 'Four leading AI models independently analyzed the research question to generate diverse perspectives.')
              ),
              React.createElement('div', { className: 'bg-white border border-slate-200 rounded-lg p-6' },
                React.createElement('div', { className: 'w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4' },
                  React.createElement('span', { className: 'text-green-600 font-bold text-lg' }, '2')
                ),
                React.createElement('h3', { className: 'font-semibold text-slate-900 mb-2' }, 'Peer Review'),
                React.createElement('p', { className: 'text-sm text-slate-600' }, 'Each model reviewed and critiqued the analyses from other models to identify strengths and weaknesses.')
              ),
              React.createElement('div', { className: 'bg-white border border-slate-200 rounded-lg p-6' },
                React.createElement('div', { className: 'w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4' },
                  React.createElement('span', { className: 'text-purple-600 font-bold text-lg' }, '3')
                ),
                React.createElement('h3', { className: 'font-semibold text-slate-900 mb-2' }, 'Consensus Synthesis'),
                React.createElement('p', { className: 'text-sm text-slate-600' }, 'A specialized arbitrator model synthesized all perspectives into a balanced, comprehensive conclusion.')
              )
            )
          ),

          // Content Sections
          sections.map((section, index) => 
            React.createElement('section', { key: index, className: 'mb-8' },
              React.createElement('h2', { className: 'text-xl font-semibold text-slate-900 mb-6 pb-2 border-b border-slate-200' }, section.title),
              React.createElement('div', { className: 'prose prose-slate max-w-none' },
                section.content.map((paragraph, pIndex) =>
                  React.createElement('p', { 
                    key: pIndex, 
                    className: 'text-slate-700 leading-relaxed mb-4 text-base'
                  }, paragraph)
                )
              )
            )
          ),

          // AI Models Consulted
          React.createElement('section', { className: 'mb-8' },
            React.createElement('h2', { className: 'text-xl font-semibold text-slate-900 mb-6 pb-2 border-b border-slate-200' }, 'AI Models Consulted'),
            React.createElement('div', { className: 'grid grid-cols-2 md:grid-cols-4 gap-4' },
              (report.llmsUsed || report.models || ['GPT-4o', 'Claude 3.5 Sonnet', 'Gemini 1.5 Pro', 'Command R+']).map(model =>
                React.createElement('div', { key: model, className: 'bg-slate-50 border border-slate-200 rounded-lg p-4 text-center' },
                  React.createElement('div', { className: 'w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-2' },
                    React.createElement('span', { className: 'text-indigo-600 font-bold text-sm' }, '✓')
                  ),
                  React.createElement('div', { className: 'text-sm font-medium text-slate-900' }, model),
                  React.createElement('div', { className: 'text-xs text-slate-500 mt-1' }, 'Participated')
                )
              )
            )
          ),

          // Technical Details
          React.createElement('section', { className: 'mb-8' },
            React.createElement('h2', { className: 'text-xl font-semibold text-slate-900 mb-6 pb-2 border-b border-slate-200' }, 'Technical Details'),
            React.createElement('div', { className: 'bg-slate-50 border border-slate-200 rounded-lg p-6' },
              React.createElement('div', { className: 'grid grid-cols-2 md:grid-cols-4 gap-6' },
                React.createElement('div', { className: 'text-center' },
                  React.createElement('div', { className: 'text-2xl font-bold text-slate-900' }, (report.llmsUsed || report.models || []).length || 4),
                  React.createElement('div', { className: 'text-sm text-slate-600' }, 'AI Models')
                ),
                React.createElement('div', { className: 'text-center' },
                  React.createElement('div', { className: 'text-2xl font-bold text-slate-900' }, reportTokens?.toLocaleString() || 'N/A'),
                  React.createElement('div', { className: 'text-sm text-slate-600' }, 'Tokens Processed')
                ),
                React.createElement('div', { className: 'text-center' },
                  React.createElement('div', { className: 'text-2xl font-bold text-slate-900' }, `${((report.confidence || 0) * 100).toFixed(1)}%`),
                  React.createElement('div', { className: 'text-sm text-slate-600' }, 'Confidence Score')
                ),
                React.createElement('div', { className: 'text-center' },
                  React.createElement('div', { className: 'text-2xl font-bold text-slate-900' }, '3'),
                  React.createElement('div', { className: 'text-sm text-slate-600' }, 'Analysis Phases')
                )
              )
            )
          )
        )
      ),

      // Fixed Footer
      React.createElement('div', { className: 'bg-slate-50 border-t border-slate-200 px-8 py-4 flex-shrink-0' },
        React.createElement('div', { className: 'flex items-center justify-between' },
          React.createElement('div', { className: 'flex items-center space-x-4' },
            React.createElement('div', { className: 'w-6 h-6 bg-gradient-to-br from-indigo-600 to-violet-600 rounded flex items-center justify-center' },
              React.createElement('span', { className: 'text-white font-bold text-xs' }, 'C')
            ),
            React.createElement('span', { className: 'text-sm text-slate-600' }, 'Generated by Consensus.AI'),
            React.createElement('span', { className: 'text-sm text-slate-400' }, '•'),
            React.createElement('span', { className: 'text-sm text-slate-600' }, formatDate(reportDate))
          ),
          React.createElement('div', { className: 'flex items-center space-x-3' },
            React.createElement('button', {
              onClick: () => onSave && onSave(report),
              className: 'inline-flex items-center px-3 py-2 bg-slate-100 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-200 transition-colors duration-200'
            }, 'Save to Library'),
            React.createElement('button', {
              onClick: onClose,
              className: 'inline-flex items-center px-3 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors duration-200'
            }, 'Close Report')
          )
        )
      )
    )
  );
}

export default ProfessionalReportViewer; 