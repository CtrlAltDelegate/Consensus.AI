import React, { useState, useEffect } from 'react';

function ReportHistory({ onViewReport, onExportReport }) {
  const [reports, setReports] = useState([]);
  const [filteredReports, setFilteredReports] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('date');
  const [sortOrder, setSortOrder] = useState('desc');
  const [selectedReports, setSelectedReports] = useState(new Set());
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'
  const [isLoading, setIsLoading] = useState(true);

  // Mock data - would connect to real API
  const mockReports = [
    {
      id: 'rep_001',
      title: 'Analysis: Climate Policy Impact on Economic Growth',
      createdAt: '2024-01-29T14:30:00Z',
      confidence: 0.87,
      tokenUsage: 8540,
      status: 'completed',
      tags: ['climate', 'economics', 'policy'],
      models: ['GPT-4o', 'Claude 3.5', 'Gemini 1.5', 'Command R+'],
      summary: 'Comprehensive analysis of climate policy impacts reveals complex relationships between environmental regulations and economic indicators...'
    },
    {
      id: 'rep_002', 
      title: 'Research: AI Ethics Framework for Healthcare',
      createdAt: '2024-01-28T09:15:00Z',
      confidence: 0.92,
      tokenUsage: 7230,
      status: 'completed',
      tags: ['ai', 'ethics', 'healthcare'],
      models: ['GPT-4o', 'Claude 3.5', 'Gemini 1.5', 'Command R+'],
      summary: 'Ethical considerations for AI implementation in healthcare systems require balanced approaches between innovation and patient safety...'
    },
    {
      id: 'rep_003',
      title: 'Legal Brief: Contract Analysis and Risk Assessment',
      createdAt: '2024-01-27T16:45:00Z',
      confidence: 0.79,
      tokenUsage: 9120,
      status: 'completed',
      tags: ['legal', 'contracts', 'risk'],
      models: ['GPT-4o', 'Claude 3.5', 'Gemini 1.5', 'Command R+'],
      summary: 'Contract risk analysis identifies several key areas of concern requiring immediate attention and strategic modifications...'
    },
    {
      id: 'rep_004',
      title: 'Market Analysis: Emerging Tech Investment Trends',
      createdAt: '2024-01-26T11:20:00Z',
      confidence: 0.84,
      tokenUsage: 6890,
      status: 'completed',
      tags: ['finance', 'technology', 'investment'],
      models: ['GPT-4o', 'Claude 3.5', 'Gemini 1.5', 'Command R+'],
      summary: 'Investment patterns in emerging technologies show strong preference for AI and quantum computing sectors...'
    },
    {
      id: 'rep_005',
      title: 'Policy Review: Remote Work Impact on Urban Development',
      createdAt: '2024-01-25T13:10:00Z',
      confidence: 0.88,
      tokenUsage: 7650,
      status: 'completed',
      tags: ['policy', 'remote-work', 'urban-planning'],
      models: ['GPT-4o', 'Claude 3.5', 'Gemini 1.5', 'Command R+'],
      summary: 'Remote work policies significantly influence urban development patterns with implications for housing and infrastructure...'
    }
  ];

  useEffect(() => {
    // Simulate loading
    setTimeout(() => {
      setReports(mockReports);
      setFilteredReports(mockReports);
      setIsLoading(false);
    }, 1000);
  }, []);

  // Filter and search
  useEffect(() => {
    let filtered = reports.filter(report =>
      report.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      report.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase())) ||
      report.summary.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Sort
    filtered.sort((a, b) => {
      let aVal, bVal;
      switch (sortBy) {
        case 'date':
          aVal = new Date(a.createdAt);
          bVal = new Date(b.createdAt);
          break;
        case 'confidence':
          aVal = a.confidence;
          bVal = b.confidence;
          break;
        case 'tokens':
          aVal = a.tokenUsage;
          bVal = b.tokenUsage;
          break;
        case 'title':
          aVal = a.title;
          bVal = b.title;
          break;
        default:
          return 0;
      }

      if (sortOrder === 'asc') {
        return aVal > bVal ? 1 : -1;
      } else {
        return aVal < bVal ? 1 : -1;
      }
    });

    setFilteredReports(filtered);
  }, [reports, searchQuery, sortBy, sortOrder]);

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getConfidenceColor = (confidence) => {
    if (confidence >= 0.8) return 'text-emerald-600 bg-emerald-100';
    if (confidence >= 0.6) return 'text-amber-600 bg-amber-100';
    return 'text-red-600 bg-red-100';
  };

  const toggleSelectReport = (reportId) => {
    const newSelected = new Set(selectedReports);
    if (newSelected.has(reportId)) {
      newSelected.delete(reportId);
    } else {
      newSelected.add(reportId);
    }
    setSelectedReports(newSelected);
  };

  const handleBulkExport = () => {
    const selectedReportsList = reports.filter(r => selectedReports.has(r.id));
    onExportReport && onExportReport(selectedReportsList);
  };

  const handleDeleteSelected = () => {
    setReports(reports.filter(r => !selectedReports.has(r.id)));
    setSelectedReports(new Set());
  };

  if (isLoading) {
    return React.createElement('div', { className: 'min-h-screen bg-slate-50/50 flex items-center justify-center' },
      React.createElement('div', { className: 'text-center' },
        React.createElement('div', { className: 'w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4' }),
        React.createElement('p', { className: 'text-slate-600' }, 'Loading your reports...')
      )
    );
  }

  return React.createElement('div', { className: 'min-h-screen bg-slate-50/50' },
    React.createElement('div', { className: 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8' },
      
      // Header
      React.createElement('div', { className: 'mb-8' },
        React.createElement('div', { className: 'flex items-center justify-between' },
          React.createElement('div', null,
            React.createElement('h1', { className: 'text-3xl font-bold text-slate-900 tracking-tight' }, 'Report History'),
            React.createElement('p', { className: 'mt-2 text-slate-600' }, 
              `${reports.length} consensus reports generated`
            )
          ),
          React.createElement('div', { className: 'flex items-center space-x-3' },
            React.createElement('button', {
              onClick: handleBulkExport,
              disabled: selectedReports.size === 0,
              className: 'inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200'
            }, `Export Selected (${selectedReports.size})`),
            React.createElement('button', { 
              className: 'inline-flex items-center px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors duration-200'
            }, 'Create New Report')
          )
        )
      ),

      // Filters and Search
      React.createElement('div', { className: 'bg-white rounded-xl border border-slate-200/60 shadow-sm mb-8' },
        React.createElement('div', { className: 'p-6' },
          React.createElement('div', { className: 'flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0' },
            // Search
            React.createElement('div', { className: 'flex-1 max-w-md' },
              React.createElement('input', {
                type: 'text',
                placeholder: 'Search reports, tags, or content...',
                value: searchQuery,
                onChange: (e) => setSearchQuery(e.target.value),
                className: 'w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200'
              })
            ),
            
            // Controls
            React.createElement('div', { className: 'flex items-center space-x-4' },
              // Sort
              React.createElement('select', {
                value: `${sortBy}-${sortOrder}`,
                onChange: (e) => {
                  const [field, order] = e.target.value.split('-');
                  setSortBy(field);
                  setSortOrder(order);
                },
                className: 'border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500'
              },
                React.createElement('option', { value: 'date-desc' }, 'Newest First'),
                React.createElement('option', { value: 'date-asc' }, 'Oldest First'),
                React.createElement('option', { value: 'confidence-desc' }, 'Highest Confidence'),
                React.createElement('option', { value: 'confidence-asc' }, 'Lowest Confidence'),
                React.createElement('option', { value: 'tokens-desc' }, 'Most Tokens'),
                React.createElement('option', { value: 'title-asc' }, 'Title A-Z')
              ),
              
              // View Mode
              React.createElement('div', { className: 'flex items-center border border-slate-200 rounded-lg' },
                React.createElement('button', {
                  onClick: () => setViewMode('grid'),
                  className: `px-3 py-2 text-sm ${viewMode === 'grid' ? 'bg-indigo-100 text-indigo-600' : 'text-slate-500 hover:text-slate-700'} transition-colors duration-200`
                }, 'Grid'),
                React.createElement('button', {
                  onClick: () => setViewMode('list'),
                  className: `px-3 py-2 text-sm ${viewMode === 'list' ? 'bg-indigo-100 text-indigo-600' : 'text-slate-500 hover:text-slate-700'} transition-colors duration-200`
                }, 'List')
              )
            )
          )
        )
      ),

      // Bulk Actions
      selectedReports.size > 0 && React.createElement('div', { className: 'mb-6 p-4 bg-indigo-50 border border-indigo-200 rounded-lg' },
        React.createElement('div', { className: 'flex items-center justify-between' },
          React.createElement('span', { className: 'text-sm font-medium text-indigo-800' }, 
            `${selectedReports.size} report${selectedReports.size === 1 ? '' : 's'} selected`
          ),
          React.createElement('div', { className: 'flex items-center space-x-3' },
            React.createElement('button', {
              onClick: handleBulkExport,
              className: 'text-sm font-medium text-indigo-600 hover:text-indigo-700 transition-colors duration-200'
            }, 'Export All'),
            React.createElement('button', {
              onClick: handleDeleteSelected,
              className: 'text-sm font-medium text-red-600 hover:text-red-700 transition-colors duration-200'
            }, 'Delete Selected'),
            React.createElement('button', {
              onClick: () => setSelectedReports(new Set()),
              className: 'text-sm font-medium text-slate-600 hover:text-slate-700 transition-colors duration-200'
            }, 'Clear Selection')
          )
        )
      ),

      // Reports Grid/List
      filteredReports.length === 0 ? (
        React.createElement('div', { className: 'text-center py-12' },
          React.createElement('div', { className: 'text-6xl mb-4' }, '📄'),
          React.createElement('h3', { className: 'text-lg font-semibold text-slate-900 mb-2' }, 
            searchQuery ? 'No reports found' : 'No reports yet'
          ),
          React.createElement('p', { className: 'text-slate-600 mb-6' }, 
            searchQuery ? 'Try adjusting your search terms' : 'Generate your first consensus report to get started'
          ),
          React.createElement('button', { 
            className: 'inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors duration-200'
          }, 'Create First Report')
        )
      ) : (
        React.createElement('div', { 
          className: viewMode === 'grid' 
            ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' 
            : 'space-y-4'
        },
          ...filteredReports.map(report => 
            viewMode === 'grid' 
              ? React.createElement(ReportCard, { 
                  key: report.id, 
                  report, 
                  isSelected: selectedReports.has(report.id),
                  onSelect: () => toggleSelectReport(report.id),
                  onView: () => onViewReport && onViewReport(report),
                  onExport: () => onExportReport && onExportReport([report]),
                  formatDate,
                  getConfidenceColor
                })
              : React.createElement(ReportListItem, { 
                  key: report.id, 
                  report,
                  isSelected: selectedReports.has(report.id),
                  onSelect: () => toggleSelectReport(report.id),
                  onView: () => onViewReport && onViewReport(report),
                  onExport: () => onExportReport && onExportReport([report]),
                  formatDate,
                  getConfidenceColor
                })
          )
        )
      )
    )
  );
}

// Report Card Component (Grid View)
function ReportCard({ report, isSelected, onSelect, onView, onExport, formatDate, getConfidenceColor }) {
  return React.createElement('div', { 
    className: `bg-white rounded-xl border border-slate-200/60 shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden ${
      isSelected ? 'ring-2 ring-indigo-500 border-indigo-200' : ''
    }`
  },
    React.createElement('div', { className: 'p-6' },
      React.createElement('div', { className: 'flex items-start justify-between mb-4' },
        React.createElement('div', { className: 'flex items-center space-x-3' },
          React.createElement('input', {
            type: 'checkbox',
            checked: isSelected,
            onChange: onSelect,
            className: 'h-4 w-4 text-indigo-600 focus:ring-indigo-500 rounded'
          }),
          React.createElement('span', { 
            className: `inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getConfidenceColor(report.confidence)}`
          }, `${(report.confidence * 100).toFixed(0)}%`)
        ),
        React.createElement('span', { className: 'text-xs text-slate-500' }, formatDate(report.createdAt))
      ),
      
      React.createElement('h3', { 
        className: 'text-lg font-semibold text-slate-900 mb-3 line-clamp-2 cursor-pointer hover:text-indigo-600 transition-colors duration-200',
        onClick: onView
      }, report.title),
      
      React.createElement('p', { className: 'text-sm text-slate-600 mb-4 line-clamp-3' }, report.summary),
      
      React.createElement('div', { className: 'flex flex-wrap gap-2 mb-4' },
        ...report.tags.slice(0, 3).map(tag =>
          React.createElement('span', { 
            key: tag,
            className: 'inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-slate-100 text-slate-700'
          }, tag)
        ),
        report.tags.length > 3 && React.createElement('span', { 
          className: 'inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-slate-100 text-slate-700'
        }, `+${report.tags.length - 3}`)
      ),
      
      React.createElement('div', { className: 'flex items-center justify-between text-sm text-slate-500 mb-4' },
        React.createElement('span', null, `${report.tokenUsage.toLocaleString()} tokens`),
        React.createElement('span', null, `${report.models.length} models`)
      )
    ),
    
    React.createElement('div', { className: 'bg-slate-50 px-6 py-3 border-t border-slate-100' },
      React.createElement('div', { className: 'flex items-center justify-between' },
        React.createElement('button', {
          onClick: onView,
          className: 'text-sm font-medium text-indigo-600 hover:text-indigo-700 transition-colors duration-200'
        }, 'View Report'),
        React.createElement('div', { className: 'flex items-center space-x-3' },
          React.createElement('button', {
            onClick: onExport,
            className: 'text-sm font-medium text-slate-600 hover:text-slate-700 transition-colors duration-200'
          }, 'Export'),
          React.createElement('button', {
            className: 'text-sm font-medium text-slate-600 hover:text-slate-700 transition-colors duration-200'
          }, '⋯')
        )
      )
    )
  );
}

// Report List Item Component (List View)
function ReportListItem({ report, isSelected, onSelect, onView, onExport, formatDate, getConfidenceColor }) {
  return React.createElement('div', { 
    className: `bg-white rounded-lg border border-slate-200/60 shadow-sm hover:shadow-md transition-all duration-300 ${
      isSelected ? 'ring-2 ring-indigo-500 border-indigo-200' : ''
    }`
  },
    React.createElement('div', { className: 'p-6' },
      React.createElement('div', { className: 'flex items-start space-x-4' },
        React.createElement('input', {
          type: 'checkbox',
          checked: isSelected,
          onChange: onSelect,
          className: 'h-4 w-4 text-indigo-600 focus:ring-indigo-500 rounded mt-1'
        }),
        
        React.createElement('div', { className: 'flex-1 min-w-0' },
          React.createElement('div', { className: 'flex items-start justify-between' },
            React.createElement('div', { className: 'flex-1' },
              React.createElement('h3', { 
                className: 'text-lg font-semibold text-slate-900 mb-2 cursor-pointer hover:text-indigo-600 transition-colors duration-200',
                onClick: onView
              }, report.title),
              React.createElement('p', { className: 'text-sm text-slate-600 mb-3' }, report.summary),
              
              React.createElement('div', { className: 'flex items-center space-x-6 text-sm text-slate-500' },
                React.createElement('span', null, formatDate(report.createdAt)),
                React.createElement('span', { 
                  className: `inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getConfidenceColor(report.confidence)}`
                }, `${(report.confidence * 100).toFixed(0)}% confidence`),
                React.createElement('span', null, `${report.tokenUsage.toLocaleString()} tokens`),
                React.createElement('span', null, `${report.models.length} models`)
              )
            ),
            
            React.createElement('div', { className: 'flex items-center space-x-3 ml-4' },
              React.createElement('button', {
                onClick: onView,
                className: 'inline-flex items-center px-3 py-2 bg-indigo-50 text-indigo-600 rounded-lg text-sm font-medium hover:bg-indigo-100 transition-colors duration-200'
              }, 'View'),
              React.createElement('button', {
                onClick: onExport,
                className: 'inline-flex items-center px-3 py-2 bg-slate-100 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-200 transition-colors duration-200'
              }, 'Export')
            )
          )
        )
      )
    )
  );
}

export default ReportHistory; 