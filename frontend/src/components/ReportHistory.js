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

  const loadReports = async () => {
    setIsLoading(true);
    try {
      console.log('📊 Loading reports from API...');
      const response = await apiHelpers.getConsensusHistory();
      console.log('📊 API Response:', response.data);
      
      if (response.data.success && response.data.analyses) {
        setReports(response.data.analyses);
        console.log(`✅ Loaded ${response.data.analyses.length} reports from database`);
      } else {
        console.log('📊 No reports found, using mock data for demo');
        setReports(mockReports);
      }
    } catch (error) {
      console.error('❌ Error loading reports:', error);
      console.log('📊 Falling back to mock data');
      setReports(mockReports);
    } finally {
      setIsLoading(false);
    }
  };

  // Mock data - fallback for demo
  const mockReports = [
    {
      id: 'rep_001',
      title: 'Analysis: Climate Policy Impact on Economic Growth',
      createdAt: '2024-01-29T14:30:00Z',
      generatedAt: '2024-01-29T14:30:00Z', // Add this for ProfessionalReportViewer
      confidence: 0.87,
      tokenUsage: 8540,
      totalTokens: 8540, // Add this alias for consistency
      status: 'completed',
      tags: ['climate', 'economics', 'policy'],
      models: ['GPT-4o', 'Claude 3.5 Sonnet', 'Gemini 1.5 Pro', 'Command R+'],
      llmsUsed: ['GPT-4o', 'Claude 3.5 Sonnet', 'Gemini 1.5 Pro', 'Command R+'], // Add this alias
      summary: 'Comprehensive analysis of climate policy impacts reveals complex relationships between environmental regulations and economic indicators...',
      consensus: `# Climate Policy Impact Analysis

## Executive Summary

Climate policy initiatives have demonstrated a complex relationship with economic growth patterns across multiple sectors. Our analysis of current policy frameworks reveals both opportunities and challenges for sustainable economic development.

## Key Findings

**Environmental Regulations and Economic Growth:**
- Short-term costs of implementation are offset by long-term economic benefits
- Green technology sectors show accelerated growth in regions with stronger climate policies
- Traditional industries face transition challenges but benefit from innovation incentives

**Sector-Specific Impacts:**
- Energy sector: Significant transformation with job losses in fossil fuels offset by renewable energy job creation
- Manufacturing: Increased compliance costs balanced by efficiency gains and export opportunities
- Financial services: New markets emerging in green finance and sustainable investment

## Policy Recommendations

1. **Graduated Implementation:** Phase in regulations to allow industry adaptation
2. **Innovation Incentives:** Provide tax benefits for clean technology development
3. **Worker Transition Programs:** Support retraining in affected industries
4. **International Coordination:** Align policies with global climate commitments

## Conclusion

Evidence suggests that well-designed climate policies can drive economic growth while achieving environmental objectives. Success depends on careful policy design, stakeholder engagement, and adaptive implementation strategies.`,
      phases: {
        phase1_drafts: [
          { model: 'GPT-4o', content: 'Initial analysis focusing on economic indicators...' },
          { model: 'Claude 3.5 Sonnet', content: 'Comprehensive review of policy frameworks...' },
          { model: 'Gemini 1.5 Pro', content: 'Data-driven assessment of growth patterns...' },
          { model: 'Command R+', content: 'Synthesis of environmental and economic factors...' }
        ],
        phase2_reviews: [
          { reviewer: 'Claude 3.5 Sonnet', content: 'Cross-validation of economic projections...' },
          { reviewer: 'Gemini 1.5 Pro', content: 'Assessment of policy implementation feasibility...' },
          { reviewer: 'Command R+', content: 'Review of stakeholder impact analysis...' }
        ],
        phase3_consensus: {
          name: 'Command R+',
          content: 'Final arbitration and consensus synthesis...'
        }
      }
    },
    {
      id: 'rep_002', 
      title: 'Research: AI Ethics Framework for Healthcare',
      createdAt: '2024-01-28T09:15:00Z',
      generatedAt: '2024-01-28T09:15:00Z',
      confidence: 0.92,
      tokenUsage: 7230,
      totalTokens: 7230,
      status: 'completed',
      tags: ['ai', 'ethics', 'healthcare'],
      models: ['GPT-4o', 'Claude 3.5 Sonnet', 'Gemini 1.5 Pro', 'Command R+'],
      llmsUsed: ['GPT-4o', 'Claude 3.5 Sonnet', 'Gemini 1.5 Pro', 'Command R+'],
      summary: 'Ethical considerations for AI implementation in healthcare systems require balanced approaches between innovation and patient safety...',
      consensus: `# AI Ethics Framework for Healthcare

## Introduction

As artificial intelligence becomes increasingly integrated into healthcare systems, establishing robust ethical frameworks is essential to ensure patient safety, privacy, and equitable care delivery.

## Ethical Principles

**Beneficence and Non-maleficence:**
- AI systems must demonstrate clear patient benefit
- Risk mitigation strategies must be comprehensive
- Continuous monitoring and improvement protocols required

**Autonomy and Informed Consent:**
- Patients must understand AI involvement in their care
- Opt-out mechanisms should be available where feasible
- Healthcare providers must maintain decision-making authority

**Justice and Fairness:**
- AI systems must not perpetuate or amplify healthcare disparities
- Equal access to AI-enhanced care across diverse populations
- Transparent algorithms and bias detection mechanisms

## Implementation Guidelines

1. **Governance Structures:** Establish AI ethics committees in healthcare institutions
2. **Training Programs:** Educate healthcare professionals on AI ethics and limitations
3. **Patient Communication:** Develop clear protocols for AI disclosure to patients
4. **Regulatory Compliance:** Align with emerging AI healthcare regulations

## Conclusion

Successful AI integration in healthcare requires proactive ethical frameworks that balance innovation with patient protection and equitable care delivery.`
    },
    {
      id: 'rep_003',
      title: 'Legal Brief: Contract Analysis and Risk Assessment',
      createdAt: '2024-01-27T16:45:00Z',
      generatedAt: '2024-01-27T16:45:00Z',
      confidence: 0.79,
      tokenUsage: 9120,
      totalTokens: 9120,
      status: 'completed',
      tags: ['legal', 'contracts', 'risk'],
      models: ['GPT-4o', 'Claude 3.5 Sonnet', 'Gemini 1.5 Pro', 'Command R+'],
      llmsUsed: ['GPT-4o', 'Claude 3.5 Sonnet', 'Gemini 1.5 Pro', 'Command R+'],
      summary: 'Contract risk analysis identifies several key areas of concern requiring immediate attention and strategic modifications...',
      consensus: `# Contract Risk Analysis

## Executive Summary

This analysis identifies critical risk factors in the current contract portfolio and provides recommendations for risk mitigation and strategic contract modifications.

## Risk Assessment Matrix

**High-Risk Areas:**
- Liability clauses with unlimited exposure
- Force majeure provisions lacking pandemic language
- Intellectual property assignment ambiguities
- Termination clauses with inadequate notice periods

**Medium-Risk Areas:**
- Payment terms exceeding industry standards
- Dispute resolution mechanisms
- Confidentiality scope and duration
- Performance metrics and penalties

**Mitigation Strategies:**
1. Implement liability caps and mutual limitations
2. Update force majeure language for modern risks
3. Clarify IP ownership and licensing terms
4. Standardize termination notice requirements

## Recommendations

**Immediate Actions:**
- Review and amend high-risk contracts within 30 days
- Establish contract review protocols for new agreements
- Train negotiation teams on identified risk factors

**Long-term Strategy:**
- Develop standardized contract templates
- Implement contract management technology
- Regular portfolio risk assessments

This analysis provides a foundation for more strategic and risk-aware contract management practices.`
    },
    {
      id: 'rep_004',
      title: 'Market Analysis: Emerging Tech Investment Trends',
      createdAt: '2024-01-26T11:20:00Z',
      generatedAt: '2024-01-26T11:20:00Z',
      confidence: 0.84,
      tokenUsage: 6890,
      totalTokens: 6890,
      status: 'completed',
      tags: ['finance', 'technology', 'investment'],
      models: ['GPT-4o', 'Claude 3.5 Sonnet', 'Gemini 1.5 Pro', 'Command R+'],
      llmsUsed: ['GPT-4o', 'Claude 3.5 Sonnet', 'Gemini 1.5 Pro', 'Command R+'],
      summary: 'Investment patterns in emerging technologies show strong preference for AI and quantum computing sectors...',
      consensus: `# Emerging Technology Investment Trends

## Market Overview

The emerging technology investment landscape continues to evolve rapidly, with significant capital flows concentrated in artificial intelligence, quantum computing, and biotechnology sectors.

## Investment Patterns

**Artificial Intelligence (41% of total funding):**
- Enterprise AI solutions leading investment volume
- Generative AI platforms attracting premium valuations
- AI infrastructure and chip development receiving strategic funding

**Quantum Computing (23% of total funding):**
- Government and enterprise contracts driving growth
- Hardware development requiring substantial capital investment
- Software and algorithm development showing accelerated progress

**Biotechnology (19% of total funding):**
- Personalized medicine and gene therapy expansion
- AI-driven drug discovery platforms
- Regulatory approval pathways becoming more predictable

## Investment Recommendations

**Short-term (6-12 months):**
- Focus on AI companies with proven enterprise adoption
- Consider quantum computing firms with government contracts
- Evaluate biotech companies approaching clinical milestones

**Long-term (2-5 years):**
- Build positions in quantum computing infrastructure
- Invest in AI companies developing fundamental technologies
- Target biotech platforms with broad therapeutic applications

The current investment environment favors companies with clear commercial pathways and strong intellectual property portfolios.`
    },
    {
      id: 'rep_005',
      title: 'Policy Review: Remote Work Impact on Urban Development',
      createdAt: '2024-01-25T13:10:00Z',
      generatedAt: '2024-01-25T13:10:00Z',
      confidence: 0.88,
      tokenUsage: 7650,
      totalTokens: 7650,
      status: 'completed',
      tags: ['policy', 'remote-work', 'urban-planning'],
      models: ['GPT-4o', 'Claude 3.5 Sonnet', 'Gemini 1.5 Pro', 'Command R+'],
      llmsUsed: ['GPT-4o', 'Claude 3.5 Sonnet', 'Gemini 1.5 Pro', 'Command R+'],
      summary: 'Remote work policies significantly influence urban development patterns with implications for housing and infrastructure...',
      consensus: `# Remote Work Impact on Urban Development

## Executive Summary

The widespread adoption of remote work policies has created significant shifts in urban development patterns, requiring adaptive planning strategies and policy responses.

## Key Impacts

**Housing Market Transformation:**
- Decreased demand for urban core housing
- Increased demand in suburban and rural areas
- Shifts in housing size and feature preferences
- Geographic arbitrage opportunities

**Commercial Real Estate:**
- Reduced office space demand in central business districts
- Conversion opportunities for mixed-use development
- Co-working space evolution and distribution
- Retail pattern changes in urban cores

**Infrastructure Implications:**
- Reduced peak-hour transportation demand
- Increased residential utility and broadband requirements
- Changes in public service distribution needs
- Environmental impact variations

## Policy Recommendations

**Urban Planning Adaptations:**
1. Flexible zoning for residential/commercial conversions
2. Distributed infrastructure investment strategies
3. Public space repurposing in business districts
4. Transportation system optimization

**Economic Development:**
- Support for distributed economic activity
- Small business incentives in suburban areas
- Technology infrastructure investment
- Workforce development program adjustments

**Long-term Strategic Planning:**
- Scenario planning for various remote work adoption levels
- Adaptive regulatory frameworks
- Regional coordination mechanisms
- Sustainability integration in development patterns

The transition requires coordinated policy responses that balance urban vitality with distributed economic opportunity.`
    }
  ];

  useEffect(() => {
    // Load real reports from API
    const loadReports = async () => {
      setIsLoading(true);
      try {
        const response = await apiHelpers.getReports({
          page: 1,
          limit: 50, // Load more reports initially
          status: 'completed',
          sortBy: 'createdAt',
          sortOrder: 'desc'
        });
        
        if (response.data.success) {
          const reports = response.data.reports.map(report => ({
            ...report,
            // Ensure compatibility with existing component structure
            id: report._id,
            tokenUsage: report.metadata?.totalTokens || 0,
            totalTokens: report.metadata?.totalTokens || 0,
            models: report.metadata?.llmsUsed || [],
            llmsUsed: report.metadata?.llmsUsed || [],
            generatedAt: report.createdAt,
            tags: report.tags || []
          }));
          
          setReports(reports);
          setFilteredReports(reports);
        } else {
          console.error('Failed to load reports:', response.data);
          // Fallback to mock data if API fails
          setReports(mockReports);
          setFilteredReports(mockReports);
        }
      } catch (error) {
        console.error('Error loading reports:', error);
        // Fallback to mock data if API fails
        setReports(mockReports);
        setFilteredReports(mockReports);
      } finally {
        setIsLoading(false);
      }
    };

    loadReports();
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