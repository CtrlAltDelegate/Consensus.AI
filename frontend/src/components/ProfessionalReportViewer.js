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
    if (confidence >= 0.8) return { label: 'High', color: 'emerald' };
    if (confidence >= 0.6) return { label: 'Moderate', color: 'amber' };
    return { label: 'Low', color: 'red' };
  };

  const confidenceLevel = getConfidenceLevel(report.confidence || 0);
  const reportDate = report.generatedAt || report.createdAt || new Date().toISOString();
  const reportTokens = report.totalTokens || report.tokenUsage || 0;

  console.log('🎨 ProfessionalReportViewer rendering with data:', {
    confidenceLevel,
    reportDate,
    reportTokens,
    consensusPreview: report.consensus?.substring(0, 100) + '...'
  });

  return React.createElement('div', { className: 'fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4' },
    React.createElement('div', { className: 'bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden' },
      
      // Header
      React.createElement('div', { className: 'bg-slate-50 border-b border-slate-200 px-8 py-6' },
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

      // Report Content
      React.createElement('div', { className: 'overflow-y-auto max-h-[calc(90vh-140px)]' },
        React.createElement('div', { className: 'px-8 py-8' },

          // Executive Summary Section
          React.createElement('section', { className: 'mb-10' },
            React.createElement('div', { className: 'flex items-center justify-between mb-6' },
              React.createElement('h2', { className: 'text-xl font-semibold text-slate-900' }, 'Executive Summary'),
              React.createElement('div', { className: 'flex items-center space-x-4' },
                React.createElement('div', { className: 'text-right' },
                  React.createElement('div', { className: 'text-sm text-slate-600' }, 'Confidence Level'),
                  React.createElement('span', { 
                    className: `inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-${confidenceLevel.color}-100 text-${confidenceLevel.color}-800`
                  }, `${confidenceLevel.label} (${((report.confidence || 0) * 100).toFixed(1)}%)`)
                )
              )
            ),
            React.createElement('div', { className: 'bg-slate-50 rounded-lg p-6 border border-slate-200' },
              React.createElement('h3', { className: 'font-semibold text-slate-900 mb-2' }, 'Research Question'),
              React.createElement('p', { className: 'text-slate-700 mb-4 leading-relaxed' }, report.title || 'Analysis Topic'),
              
              React.createElement('h3', { className: 'font-semibold text-slate-900 mb-2' }, 'Key Findings'),
              React.createElement('div', { className: 'prose prose-slate max-w-none' },
                React.createElement('p', { className: 'text-slate-700 leading-relaxed whitespace-pre-wrap' }, 
                  (report.consensus || 'Analysis content not available.').substring(0, 300) + 
                  ((report.consensus || '').length > 300 ? '...' : '')
                )
              )
            )
          ),

          // Methodology Section
          React.createElement('section', { className: 'mb-10' },
            React.createElement('h2', { className: 'text-xl font-semibold text-slate-900 mb-6' }, 'Methodology'),
            React.createElement('div', { className: 'grid grid-cols-1 md:grid-cols-2 gap-6' },
              React.createElement('div', { className: 'bg-white border border-slate-200 rounded-lg p-6' },
                React.createElement('h3', { className: 'font-semibold text-slate-900 mb-3' }, 'Analysis Framework'),
                React.createElement('p', { className: 'text-sm text-slate-600 mb-4' }, 
                  'Our 3-phase consensus methodology ensures comprehensive analysis through multiple AI perspectives:'
                ),
                React.createElement('div', { className: 'space-y-2' },
                  React.createElement('div', { className: 'flex items-center text-sm' },
                    React.createElement('span', { className: 'w-6 h-6 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center text-xs font-semibold mr-3' }, '1'),
                    React.createElement('span', { className: 'text-slate-700' }, 'Independent Drafting')
                  ),
                  React.createElement('div', { className: 'flex items-center text-sm' },
                    React.createElement('span', { className: 'w-6 h-6 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center text-xs font-semibold mr-3' }, '2'),
                    React.createElement('span', { className: 'text-slate-700' }, 'Peer Review Process')
                  ),
                  React.createElement('div', { className: 'flex items-center text-sm' },
                    React.createElement('span', { className: 'w-6 h-6 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center text-xs font-semibold mr-3' }, '3'),
                    React.createElement('span', { className: 'text-slate-700' }, 'Final Arbitration')
                  )
                )
              ),
              
              React.createElement('div', { className: 'bg-white border border-slate-200 rounded-lg p-6' },
                React.createElement('h3', { className: 'font-semibold text-slate-900 mb-3' }, 'AI Models Utilized'),
                React.createElement('div', { className: 'space-y-3' },
                  (report.llmsUsed || report.models || ['GPT-4o', 'Claude 3.5 Sonnet', 'Gemini 1.5 Pro', 'Command R+']).map(model =>
                    React.createElement('div', { key: model, className: 'flex items-center justify-between' },
                      React.createElement('span', { className: 'text-sm text-slate-700' }, model),
                      React.createElement('span', { className: 'inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800' }, '✓')
                    )
                  )
                ),
                React.createElement('div', { className: 'mt-4 pt-4 border-t border-slate-100' },
                  React.createElement('div', { className: 'flex justify-between text-sm' },
                    React.createElement('span', { className: 'text-slate-600' }, 'Total Tokens'),
                    React.createElement('span', { className: 'font-medium text-slate-900' }, reportTokens?.toLocaleString() || 'N/A')
                  )
                )
              )
            )
          ),

          // Detailed Analysis Section
          React.createElement('section', { className: 'mb-10' },
            React.createElement('h2', { className: 'text-xl font-semibold text-slate-900 mb-6' }, 'Detailed Analysis'),
            
            // Phase 1: Independent Drafts
            report.phases?.phase1_drafts && React.createElement('div', { className: 'mb-8' },
              React.createElement('h3', { className: 'text-lg font-semibold text-slate-800 mb-4' }, 'Phase 1: Independent Analysis'),
              React.createElement('p', { className: 'text-sm text-slate-600 mb-4' }, 
                `${report.phases.phase1_drafts.length} AI models independently analyzed the research question to provide diverse perspectives.`
              ),
              React.createElement('div', { className: 'grid gap-4' },
                report.phases.phase1_drafts.slice(0, 2).map((draft, index) =>
                  React.createElement('div', { key: index, className: 'bg-slate-50 border border-slate-200 rounded-lg p-4' },
                    React.createElement('div', { className: 'flex items-center justify-between mb-2' },
                      React.createElement('h4', { className: 'font-medium text-slate-800' }, `Draft ${index + 1}`),
                      React.createElement('span', { className: 'text-xs text-slate-500' }, draft.model || `Model ${index + 1}`)
                    ),
                    React.createElement('p', { className: 'text-sm text-slate-700 leading-relaxed' }, 
                      (draft.content || draft).substring(0, 200) + '...'
                    )
                  )
                )
              )
            ),

            // Phase 2: Peer Reviews
            report.phases?.phase2_reviews && React.createElement('div', { className: 'mb-8' },
              React.createElement('h3', { className: 'text-lg font-semibold text-slate-800 mb-4' }, 'Phase 2: Peer Review'),
              React.createElement('p', { className: 'text-sm text-slate-600 mb-4' }, 
                'Each initial analysis was cross-reviewed by other AI models to identify strengths, weaknesses, and areas of consensus.'
              ),
              React.createElement('div', { className: 'bg-slate-50 border border-slate-200 rounded-lg p-4' },
                React.createElement('p', { className: 'text-sm text-slate-700' }, 
                  `${report.phases.phase2_reviews.length} peer reviews completed, focusing on accuracy, completeness, and logical consistency.`
                )
              )
            ),

            // Phase 3: Final Consensus
            React.createElement('div', { className: 'mb-8' },
              React.createElement('h3', { className: 'text-lg font-semibold text-slate-800 mb-4' }, 'Phase 3: Final Consensus'),
              React.createElement('div', { className: 'bg-gradient-to-r from-indigo-50 to-violet-50 border border-indigo-200 rounded-lg p-6' },
                React.createElement('h4', { className: 'font-semibold text-slate-900 mb-3' }, 'Synthesized Conclusion'),
                React.createElement('div', { className: 'prose prose-slate max-w-none' },
                  React.createElement('div', { 
                    className: 'text-slate-800 leading-relaxed whitespace-pre-wrap max-h-96 overflow-y-auto',
                    style: { fontSize: '15px', lineHeight: '1.6' }
                  }, report.consensus || 'Analysis content not available.')
                )
              )
            )
          ),

          // Technical Details Section
          React.createElement('section', { className: 'mb-8' },
            React.createElement('h2', { className: 'text-xl font-semibold text-slate-900 mb-6' }, 'Technical Details'),
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

      // Footer
      React.createElement('div', { className: 'bg-slate-50 border-t border-slate-200 px-8 py-4' },
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