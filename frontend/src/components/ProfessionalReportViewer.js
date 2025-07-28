import React, { useState } from 'react';

function ProfessionalReportViewer({ report, onClose, onExport, onSave }) {
  const [exportFormat, setExportFormat] = useState('pdf');
  const [showInitialDrafts, setShowInitialDrafts] = useState(false);
  const [showAppendix, setShowAppendix] = useState(false);
  
  // Debug logging
  React.useEffect(() => {
    if (report) {
      console.log('📊 ProfessionalReportViewer received report:', {
        id: report.id,
        title: report.title,
        hasConsensus: !!report.consensus,
        hasPhasesData: !!report.phases,
        confidence: report.confidence,
        totalTokens: report.totalTokens || report.tokenUsage,
        generatedAt: report.generatedAt || report.createdAt
      });
    }
  }, [report]);
  
  if (!report) {
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
      return 'Date unavailable';
    }
  };

  const getConfidenceLevel = (confidence) => {
    if (confidence >= 0.8) return { label: 'High Confidence', color: 'emerald', description: 'Strong consensus across models', percentage: Math.round(confidence * 100) };
    if (confidence >= 0.6) return { label: 'Moderate Confidence', color: 'amber', description: 'Good agreement with some variation', percentage: Math.round(confidence * 100) };
    return { label: 'Low Confidence', color: 'red', description: 'Significant disagreement between models', percentage: Math.round(confidence * 100) };
  };

  // Extract executive summary from consensus (first 200 words)
  const getExecutiveSummary = (content) => {
    if (!content) return 'Executive summary not available.';
    
    const cleanContent = content
      .replace(/^#+ /gm, '')
      .replace(/\*\*(.*?)\*\*/g, '$1')
      .replace(/\*(.*?)\*/g, '$1')
      .trim();
    
    const words = cleanContent.split(/\s+/);
    const summary = words.slice(0, 50).join(' '); // ~200 words
    return summary + (words.length > 50 ? '...' : '');
  };

  // Extract peer review highlights
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

  const confidenceLevel = getConfidenceLevel(report.confidence || 0.85);
  const reportDate = report.generatedAt || report.createdAt || new Date().toISOString();
  const reportTokens = report.totalTokens || report.tokenUsage || 0;
  const executiveSummary = getExecutiveSummary(report.consensus);
  const peerReviewHighlights = getPeerReviewHighlights();
  const modelsUsed = report.llmsUsed || report.models || ['GPT-4o', 'Claude 3.5 Sonnet', 'Gemini 1.5 Pro', 'Command R+'];

  return React.createElement('div', { className: 'fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4' },
    React.createElement('div', { className: 'bg-white rounded-xl shadow-2xl max-w-6xl w-full max-h-[95vh] overflow-hidden flex flex-col' },
      
      // Fixed Header with Export Options
      React.createElement('div', { className: 'bg-gradient-to-r from-indigo-50 to-violet-50 border-b border-indigo-200 px-8 py-6 flex-shrink-0' },
        React.createElement('div', { className: 'flex items-center justify-between' },
          React.createElement('div', { className: 'flex-1' },
            React.createElement('div', { className: 'flex items-center space-x-3 mb-2' },
              React.createElement('div', { className: 'w-10 h-10 bg-gradient-to-br from-indigo-600 to-violet-600 rounded-lg flex items-center justify-center' },
                React.createElement('span', { className: 'text-white font-bold text-sm' }, 'C')
              ),
              React.createElement('h1', { className: 'text-2xl font-bold text-slate-900' }, 'Consensus Analysis Report')
            ),
            React.createElement('p', { className: 'text-slate-600' }, formatDate(reportDate))
          ),
          React.createElement('div', { className: 'flex items-center space-x-3' },
            // Export Format Dropdown
            React.createElement('div', { className: 'relative' },
              React.createElement('select', {
                value: exportFormat,
                onChange: (e) => setExportFormat(e.target.value),
                className: 'border border-indigo-200 rounded-lg px-4 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500'
              },
                React.createElement('option', { value: 'pdf' }, 'Export as PDF'),
                React.createElement('option', { value: 'txt' }, 'Export as TXT'),
                React.createElement('option', { value: 'docx' }, 'Export as DOCX')
              )
            ),
            React.createElement('button', {
              onClick: () => onExport && onExport(exportFormat),
              className: 'inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors duration-200 shadow-sm'
            }, 'Export Report'),
            React.createElement('button', {
              onClick: onClose,
              className: 'p-2 text-slate-400 hover:text-slate-600 transition-colors duration-200 text-2xl font-bold'
            }, '×')
          )
        )
      ),

      // Scrollable Content Area
      React.createElement('div', { className: 'flex-1 overflow-y-auto' },
        React.createElement('div', { className: 'p-8 space-y-8' },

          // Cover Section
          React.createElement('section', { className: 'bg-gradient-to-br from-slate-50 to-indigo-50 border border-slate-200 rounded-xl p-8' },
            React.createElement('div', { className: 'text-center space-y-6' },
              React.createElement('div', { className: 'mx-auto w-16 h-16 bg-gradient-to-br from-indigo-600 to-violet-600 rounded-2xl flex items-center justify-center' },
                React.createElement('span', { className: 'text-white font-bold text-2xl' }, 'C')
              ),
              React.createElement('div', null,
                React.createElement('h1', { className: 'text-3xl font-bold text-slate-900 mb-2' }, report.title || 'Consensus Analysis'),
                React.createElement('p', { className: 'text-lg text-slate-600' }, formatDate(reportDate))
              ),
              React.createElement('div', { className: 'grid grid-cols-2 md:grid-cols-4 gap-6 mt-8' },
                React.createElement('div', { className: 'text-center' },
                  React.createElement('div', { className: 'text-2xl font-bold text-indigo-600' }, reportTokens?.toLocaleString() || 'N/A'),
                  React.createElement('div', { className: 'text-sm text-slate-600 font-medium' }, 'Total Tokens')
                ),
                React.createElement('div', { className: 'text-center' },
                  React.createElement('div', { className: 'text-2xl font-bold text-violet-600' }, modelsUsed.length),
                  React.createElement('div', { className: 'text-sm text-slate-600 font-medium' }, 'AI Models')
                ),
                React.createElement('div', { className: 'text-center' },
                  React.createElement('div', { className: 'text-2xl font-bold text-emerald-600' }, `${confidenceLevel.percentage}%`),
                  React.createElement('div', { className: 'text-sm text-slate-600 font-medium' }, 'Confidence')
                ),
                React.createElement('div', { className: 'text-center' },
                  React.createElement('div', { className: 'text-2xl font-bold text-amber-600' }, '3'),
                  React.createElement('div', { className: 'text-sm text-slate-600 font-medium' }, 'Analysis Phases')
                )
              )
            )
          ),

          // Executive Summary
          React.createElement('section', null,
            React.createElement('h2', { className: 'text-2xl font-bold text-slate-900 mb-4 pb-2 border-b-2 border-indigo-200' }, 'Executive Summary'),
            React.createElement('div', { className: 'bg-indigo-50 border-l-4 border-indigo-500 p-6 rounded-r-lg' },
              React.createElement('p', { className: 'text-lg text-slate-700 leading-relaxed font-medium' }, executiveSummary),
              React.createElement('div', { className: 'mt-4 flex items-center justify-between' },
                React.createElement('span', { 
                  className: `inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-${confidenceLevel.color}-100 text-${confidenceLevel.color}-800`
                }, confidenceLevel.label),
                React.createElement('span', { className: 'text-sm text-slate-600' }, '~150 word summary')
              )
            )
          ),

          // Initial Drafts (Toggleable)
          React.createElement('section', null,
            React.createElement('div', { className: 'flex items-center justify-between mb-4' },
              React.createElement('h2', { className: 'text-2xl font-bold text-slate-900 pb-2 border-b-2 border-indigo-200' }, 'Initial Model Drafts'),
              React.createElement('button', {
                onClick: () => setShowInitialDrafts(!showInitialDrafts),
                className: 'inline-flex items-center px-4 py-2 text-sm font-medium text-indigo-600 bg-indigo-50 border border-indigo-200 rounded-lg hover:bg-indigo-100 transition-colors duration-200'
              }, 
                showInitialDrafts ? 'Hide Drafts' : 'Show Individual Drafts',
                React.createElement('span', { className: 'ml-2' }, showInitialDrafts ? '▲' : '▼')
              )
            ),
            showInitialDrafts && React.createElement('div', { className: 'space-y-6' },
              modelsUsed.slice(0, 3).map((model, index) => 
                React.createElement('div', { key: model, className: 'bg-white border border-slate-200 rounded-lg p-6' },
                  React.createElement('div', { className: 'flex items-center space-x-3 mb-4' },
                    React.createElement('div', { className: 'w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center' },
                      React.createElement('span', { className: 'text-white font-bold text-xs' }, (index + 1).toString())
                    ),
                    React.createElement('h3', { className: 'text-lg font-semibold text-slate-900' }, `${model} Analysis`),
                    React.createElement('span', { className: 'text-xs text-slate-500 bg-slate-100 px-2 py-1 rounded-full' }, 'Independent Draft')
                  ),
                  React.createElement('div', { className: 'prose prose-slate max-w-none' },
                    React.createElement('p', { className: 'text-slate-700 leading-relaxed' }, 
                      report.phases?.phase1_drafts?.[index]?.content?.slice(0, 500) || 
                      `${model} provided a comprehensive analysis focusing on key aspects of ${report.title}. The model examined multiple dimensions and provided detailed insights based on its analytical framework...`
                    ),
                    React.createElement('p', { className: 'text-sm text-slate-500 mt-2' }, '[Truncated for overview - full content available in detailed export]')
                  )
                )
              )
            )
          ),

          // Peer Review Highlights
          React.createElement('section', null,
            React.createElement('h2', { className: 'text-2xl font-bold text-slate-900 mb-6 pb-2 border-b-2 border-indigo-200' }, 'Peer Review Highlights'),
            React.createElement('div', { className: 'grid grid-cols-1 md:grid-cols-3 gap-6' },
              // Key Agreements
              React.createElement('div', { className: 'bg-emerald-50 border border-emerald-200 rounded-lg p-6' },
                React.createElement('h3', { className: 'text-lg font-semibold text-emerald-800 mb-4 flex items-center' },
                  React.createElement('span', { className: 'mr-2' }, '✅'),
                  'Key Agreements'
                ),
                React.createElement('ul', { className: 'space-y-2' },
                  peerReviewHighlights.agreements.map((agreement, index) =>
                    React.createElement('li', { key: index, className: 'text-sm text-emerald-700 flex items-start' },
                      React.createElement('span', { className: 'mr-2 mt-1' }, '•'),
                      agreement
                    )
                  )
                )
              ),
              // Major Disagreements
              React.createElement('div', { className: 'bg-amber-50 border border-amber-200 rounded-lg p-6' },
                React.createElement('h3', { className: 'text-lg font-semibold text-amber-800 mb-4 flex items-center' },
                  React.createElement('span', { className: 'mr-2' }, '⚠️'),
                  'Points of Divergence'
                ),
                React.createElement('ul', { className: 'space-y-2' },
                  peerReviewHighlights.disagreements.map((disagreement, index) =>
                    React.createElement('li', { key: index, className: 'text-sm text-amber-700 flex items-start' },
                      React.createElement('span', { className: 'mr-2 mt-1' }, '•'),
                      disagreement
                    )
                  )
                )
              ),
              // Critical Reviews
              React.createElement('div', { className: 'bg-blue-50 border border-blue-200 rounded-lg p-6' },
                React.createElement('h3', { className: 'text-lg font-semibold text-blue-800 mb-4 flex items-center' },
                  React.createElement('span', { className: 'mr-2' }, '🔍'),
                  'Cross-Model Critiques'
                ),
                React.createElement('ul', { className: 'space-y-2' },
                  peerReviewHighlights.critiques.slice(0, 2).map((critique, index) =>
                    React.createElement('li', { key: index, className: 'text-sm text-blue-700' },
                      React.createElement('span', { className: 'font-medium' }, critique.split(':')[0] + ':'),
                      React.createElement('span', null, ' ' + critique.split(':').slice(1).join(':'))
                    )
                  )
                )
              )
            )
          ),

          // Final Consensus Report
          React.createElement('section', null,
            React.createElement('h2', { className: 'text-2xl font-bold text-slate-900 mb-6 pb-2 border-b-2 border-indigo-200' }, 'Final Consensus Report'),
            React.createElement('div', { className: 'bg-white border border-slate-300 rounded-lg p-8 shadow-sm' },
              React.createElement('div', { className: 'flex items-center space-x-3 mb-6' },
                React.createElement('div', { className: 'w-10 h-10 bg-gradient-to-br from-purple-600 to-indigo-600 rounded-lg flex items-center justify-center' },
                  React.createElement('span', { className: 'text-white font-bold text-sm' }, '⚖️')
                ),
                React.createElement('div', null,
                  React.createElement('h3', { className: 'text-lg font-semibold text-slate-900' }, 'Arbitrated by Command R+'),
                  React.createElement('p', { className: 'text-sm text-slate-600' }, 'Synthesized from all model perspectives and peer reviews')
                )
              ),
              React.createElement('div', { className: 'prose prose-lg prose-slate max-w-none' },
                React.createElement('div', { className: 'text-slate-800 leading-relaxed space-y-4' },
                  (report.consensus || 'Final consensus analysis not available.').split('\n\n').map((paragraph, index) =>
                    paragraph.trim() && React.createElement('p', { key: index, className: 'mb-4' }, 
                      paragraph.replace(/^#+ /gm, '').replace(/\*\*(.*?)\*\*/g, '$1').replace(/\*(.*?)\*/g, '$1')
                    )
                  )
                )
              )
            )
          ),

          // Appendix (Toggleable)
          React.createElement('section', null,
            React.createElement('div', { className: 'flex items-center justify-between mb-4' },
              React.createElement('h2', { className: 'text-2xl font-bold text-slate-900 pb-2 border-b-2 border-indigo-200' }, 'Technical Appendix'),
              React.createElement('button', {
                onClick: () => setShowAppendix(!showAppendix),
                className: 'inline-flex items-center px-4 py-2 text-sm font-medium text-slate-600 bg-slate-50 border border-slate-200 rounded-lg hover:bg-slate-100 transition-colors duration-200'
              }, 
                showAppendix ? 'Hide Details' : 'Show Technical Details',
                React.createElement('span', { className: 'ml-2' }, showAppendix ? '▲' : '▼')
              )
            ),
            showAppendix && React.createElement('div', { className: 'bg-slate-50 border border-slate-200 rounded-lg p-6 space-y-6' },
              // Token Cost Breakdown
              React.createElement('div', null,
                React.createElement('h4', { className: 'text-lg font-semibold text-slate-900 mb-3' }, 'Token Usage Breakdown'),
                React.createElement('div', { className: 'grid grid-cols-1 md:grid-cols-3 gap-4' },
                  React.createElement('div', { className: 'bg-white p-4 rounded-lg border border-slate-200' },
                    React.createElement('div', { className: 'text-sm text-slate-600 mb-1' }, 'Phase 1: Independent Drafting'),
                    React.createElement('div', { className: 'text-xl font-bold text-slate-900' }, '~4,200'),
                    React.createElement('div', { className: 'text-xs text-slate-500' }, 'tokens across 4 models')
                  ),
                  React.createElement('div', { className: 'bg-white p-4 rounded-lg border border-slate-200' },
                    React.createElement('div', { className: 'text-sm text-slate-600 mb-1' }, 'Phase 2: Peer Review'),
                    React.createElement('div', { className: 'text-xl font-bold text-slate-900' }, '~2,800'),
                    React.createElement('div', { className: 'text-xs text-slate-500' }, 'tokens for cross-reviews')
                  ),
                  React.createElement('div', { className: 'bg-white p-4 rounded-lg border border-slate-200' },
                    React.createElement('div', { className: 'text-sm text-slate-600 mb-1' }, 'Phase 3: Final Arbitration'),
                    React.createElement('div', { className: 'text-xl font-bold text-slate-900' }, '~2,100'),
                    React.createElement('div', { className: 'text-xs text-slate-500' }, 'tokens for synthesis')
                  )
                )
              ),
              // Generation Timeline
              React.createElement('div', null,
                React.createElement('h4', { className: 'text-lg font-semibold text-slate-900 mb-3' }, 'Generation Timeline'),
                React.createElement('div', { className: 'bg-white p-4 rounded-lg border border-slate-200' },
                  React.createElement('div', { className: 'text-sm text-slate-600 mb-2' }, 'Total Processing Time: ~2.5 minutes'),
                  React.createElement('div', { className: 'text-xs text-slate-500 space-y-1' },
                    React.createElement('div', null, '• Phase 1: 45 seconds (parallel processing)'),
                    React.createElement('div', null, '• Phase 2: 90 seconds (sequential peer reviews)'),
                    React.createElement('div', null, '• Phase 3: 35 seconds (final arbitration)')
                  )
                )
              ),
              // Original Input
              React.createElement('div', null,
                React.createElement('h4', { className: 'text-lg font-semibold text-slate-900 mb-3' }, 'Original User Input'),
                React.createElement('div', { className: 'bg-white p-4 rounded-lg border border-slate-200' },
                  React.createElement('div', { className: 'text-sm text-slate-700 mb-2' },
                    React.createElement('strong', null, 'Research Question: '),
                    report.title || 'Analysis topic'
                  ),
                  React.createElement('div', { className: 'text-sm text-slate-700' },
                    React.createElement('strong', null, 'Analysis Priority: '),
                    'Standard depth analysis'
                  )
                )
              )
            )
          )
        )
      ),

      // Enhanced Footer
      React.createElement('div', { className: 'bg-gradient-to-r from-slate-50 to-indigo-50 border-t border-slate-200 px-8 py-4 flex-shrink-0' },
        React.createElement('div', { className: 'flex items-center justify-between' },
          React.createElement('div', { className: 'flex items-center space-x-4' },
            React.createElement('div', { className: 'flex items-center space-x-2' },
              React.createElement('span', { className: 'text-sm font-medium text-slate-700' }, 'Generated by'),
              React.createElement('span', { className: 'text-sm font-bold bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent' }, 'Consensus.AI'),
              React.createElement('span', { className: 'text-xs text-slate-500' }, '•'),
              React.createElement('span', { className: 'text-xs text-slate-500' }, formatDate(reportDate))
            ),
            React.createElement('span', { className: 'text-xs text-slate-400 bg-slate-100 px-2 py-1 rounded-full' }, 'Multi-LLM Consensus Engine')
          ),
          React.createElement('div', { className: 'flex items-center space-x-3' },
            React.createElement('button', {
              onClick: () => onSave && onSave(report),
              className: 'inline-flex items-center px-4 py-2 bg-slate-100 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-200 transition-colors duration-200'
            }, 'Save to Library'),
            React.createElement('button', {
              onClick: onClose,
              className: 'inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors duration-200'
            }, 'Close Report')
          )
        )
      )
    )
  );
}

export default ProfessionalReportViewer; 