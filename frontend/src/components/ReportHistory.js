import React, { useState, useEffect } from 'react';
import { apiHelpers } from '../config/api';

function ReportHistory({ onViewReport, onExportReport }) {
  const [reports, setReports] = useState([]);
  const [filteredReports, setFilteredReports] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('date');
  const [sortOrder, setSortOrder] = useState('desc');
  const [selectedReports, setSelectedReports] = useState(new Set());
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'
  const [isLoading, setIsLoading] = useState(true);

  // Load reports from API
  useEffect(() => {
    loadReports();
  }, []);

  // Refresh reports manually
  const refreshReports = () => {
    console.log('🔄 Manual refresh triggered');
    loadReports();
  };

  const loadReports = async () => {
    setIsLoading(true);
    try {
      console.log('📊 Loading reports from API...');
      console.log('📊 API URL:', import.meta.env.VITE_API_URL);
      console.log('📊 Calling endpoint: /api/consensus/history');
      
      const response = await apiHelpers.getConsensusHistory();
      console.log('📊 API Response status:', response.status);
      console.log('📊 API Response data:', response.data);
      
      if (response.data.success && response.data.analyses) {
        console.log(`✅ Found ${response.data.analyses.length} reports in database`);
        setReports(response.data.analyses);
        setFilteredReports(response.data.analyses);
      } else {
        console.log('📊 API returned success=false or no analyses array');
        console.log('📊 Response structure:', Object.keys(response.data));
        console.log('📊 No real reports found - showing empty state');
        setReports([]);
        setFilteredReports([]);
      }
    } catch (error) {
      console.error('❌ Error loading reports:', error);
      console.error('❌ Error details:', error.response?.data || error.message);
      console.log('📊 API error - showing empty state');
      setReports([]);
      setFilteredReports([]);
    } finally {
      setIsLoading(false);
    }
  };

  // No mock data - show real reports only

  // Removed duplicate useEffect - using the loadReports function from above instead

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

  const handleBulkExport = async () => {
    try {
      const selectedIds = Array.from(selectedReports);
      if (selectedIds.length === 0) {
        alert('Please select reports to export');
        return;
      }

      // Export as JSON by default
      const response = await apiHelpers.exportReports(selectedIds, 'json');
      
      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `reports-export-${Date.now()}.json`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      console.log(`✅ Exported ${selectedIds.length} reports`);
    } catch (error) {
      console.error('Export failed:', error);
      alert('Failed to export reports. Please try again.');
    }
  };

  const handleDeleteSelected = async () => {
    try {
      const selectedIds = Array.from(selectedReports);
      if (selectedIds.length === 0) {
        alert('Please select reports to delete');
        return;
      }

      if (!confirm(`Are you sure you want to delete ${selectedIds.length} report(s)? This action cannot be undone.`)) {
        return;
      }

      await apiHelpers.bulkDeleteReports(selectedIds);
      
      // Remove deleted reports from local state
      setReports(reports.filter(r => !selectedReports.has(r.id)));
      setSelectedReports(new Set());
      
      console.log(`✅ Deleted ${selectedIds.length} reports`);
    } catch (error) {
      console.error('Delete failed:', error);
      alert('Failed to delete reports. Please try again.');
    }
  };

  // Enhanced view report handler with debugging
  const handleViewReportClick = (report) => {
    console.log('🔍 Report clicked in ReportHistory:', {
      id: report.id,
      title: report.title,
      hasConsensus: !!report.consensus,
      dataStructure: Object.keys(report)
    });
    
    if (onViewReport) {
      onViewReport(report);
    } else {
      console.warn('⚠️ No onViewReport handler provided to ReportHistory');
    }
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
              // Refresh Button
              React.createElement('button', {
                onClick: refreshReports,
                disabled: isLoading,
                className: `px-4 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-indigo-400 disabled:cursor-not-allowed transition-all duration-200 flex items-center space-x-2 ${isLoading ? 'opacity-50' : ''}`,
                title: 'Refresh reports'
              },
                React.createElement('span', { className: 'text-sm font-medium' }, isLoading ? 'Refreshing...' : 'Refresh'),
                !isLoading && React.createElement('span', { className: 'text-lg' }, '🔄')
              ),
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
                  onView: () => handleViewReportClick(report),
                  onExport: () => onExportReport && onExportReport([report]),
                  formatDate,
                  getConfidenceColor
                })
              : React.createElement(ReportListItem, { 
                  key: report.id, 
                  report,
                  isSelected: selectedReports.has(report.id),
                  onSelect: () => toggleSelectReport(report.id),
                  onView: () => handleViewReportClick(report),
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
  const estimateReadingTime = (tokenUsage) => {
    // Rough estimate: ~2-3 minutes for 6k-12k tokens
    const minutes = Math.max(1, Math.round(tokenUsage / 3000));
    return `~${minutes}m`;
  };

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
      
      // Enhanced Token Usage Metadata
      React.createElement('div', { className: 'space-y-2 mb-4' },
        React.createElement('div', { className: 'flex items-center justify-between' },
          React.createElement('div', { className: 'flex items-center text-sm text-emerald-700' },
            React.createElement('span', { className: 'mr-2' }, '🟢'),
            React.createElement('span', { className: 'font-medium' }, 'Tokens used:'),
            React.createElement('span', { className: 'ml-1 font-semibold' }, report.tokenUsage?.toLocaleString() || '0')
          ),
          React.createElement('div', { className: 'flex items-center text-sm text-indigo-700' },
            React.createElement('span', { className: 'mr-2' }, '🧠'),
            React.createElement('span', { className: 'font-medium' }, 'LLMs used:'),
            React.createElement('span', { className: 'ml-1 font-semibold' }, report.models?.length || 4)
          )
        ),
        React.createElement('div', { className: 'flex items-center text-sm text-amber-700' },
          React.createElement('span', { className: 'mr-2' }, '🕒'),
          React.createElement('span', { className: 'font-medium' }, 'Time generated:'),
          React.createElement('span', { className: 'ml-1 font-semibold' }, estimateReadingTime(report.tokenUsage || 8000))
        )
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
  const estimateReadingTime = (tokenUsage) => {
    // Rough estimate: ~2-3 minutes for 6k-12k tokens
    const minutes = Math.max(1, Math.round(tokenUsage / 3000));
    return `~${minutes}m`;
  };

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
              
              // Enhanced metadata with icons
              React.createElement('div', { className: 'flex items-center space-x-6 text-sm mb-2' },
                React.createElement('span', { className: 'text-slate-500' }, formatDate(report.createdAt)),
                React.createElement('span', { 
                  className: `inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getConfidenceColor(report.confidence)}`
                }, `${(report.confidence * 100).toFixed(0)}% confidence`)
              ),
              React.createElement('div', { className: 'flex items-center space-x-6 text-sm' },
                React.createElement('div', { className: 'flex items-center text-emerald-700' },
                  React.createElement('span', { className: 'mr-1' }, '🟢'),
                  React.createElement('span', { className: 'font-medium' }, `${report.tokenUsage?.toLocaleString() || '0'} tokens`)
                ),
                React.createElement('div', { className: 'flex items-center text-indigo-700' },
                  React.createElement('span', { className: 'mr-1' }, '🧠'),
                  React.createElement('span', { className: 'font-medium' }, `${report.models?.length || 4} LLMs`)
                ),
                React.createElement('div', { className: 'flex items-center text-amber-700' },
                  React.createElement('span', { className: 'mr-1' }, '🕒'),
                  React.createElement('span', { className: 'font-medium' }, estimateReadingTime(report.tokenUsage || 8000))
                )
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