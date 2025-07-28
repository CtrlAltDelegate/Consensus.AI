import React, { useState } from 'react';
import { Routes, Route, Navigate, Link, useLocation } from 'react-router-dom';

// Enhanced Components
import TokenDashboard from './components/TokenDashboard';
import EnhancedConsensusForm from './components/EnhancedConsensusForm';
import ProfessionalReportViewer from './components/ProfessionalReportViewer';
import ProgressLoadingModal, { useProgressModal } from './components/ProgressLoadingModal';
import ReportHistory from './components/ReportHistory';

// Services
import exportService from './utils/exportService';

function App() {
  const [currentReport, setCurrentReport] = useState(null);
  const [showReportViewer, setShowReportViewer] = useState(false);
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  
  const progressModal = useProgressModal();

  // Handle report generation with progress tracking
  const handleReportGeneration = async (data) => {
    setIsGeneratingReport(true);
    progressModal.showProgress('phase1', 90);

    try {
      // Phase 1: Independent Drafting
      progressModal.updateStage('phase1');
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Phase 2: Peer Review
      progressModal.updateStage('phase2');
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Phase 3: Final Arbitration
      progressModal.updateStage('phase3');
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Complete generation
      progressModal.hideProgress();
      setIsGeneratingReport(false);
      
      // Show results (this would be handled by the actual form component)
      return true;
    } catch (error) {
      progressModal.hideProgress();
      setIsGeneratingReport(false);
      throw error;
    }
  };

  // Handle viewing a report in the professional viewer
  const handleViewReport = (report) => {
    console.log('📖 Opening report viewer for:', report.title);
    setCurrentReport(report);
    setShowReportViewer(true);
  };

  // Handle closing the report viewer
  const handleCloseReportViewer = () => {
    console.log('❌ Closing report viewer');
    setShowReportViewer(false);
    setCurrentReport(null);
  };

  // Handle exporting reports
  const handleExportReport = async (reports, format = 'pdf') => {
    try {
      console.log('📤 Exporting reports:', reports.length > 1 ? `${reports.length} reports` : reports[0]?.title);
      
      if (Array.isArray(reports) && reports.length > 1) {
        await exportService.exportMultipleReports(reports, format);
      } else {
        const report = Array.isArray(reports) ? reports[0] : reports;
        await exportService.exportReport(report, format);
      }
    } catch (error) {
      console.error('Export failed:', error);
      // Would show user notification in production
    }
  };

  // Handle saving report to library
  const handleSaveReport = (report) => {
    console.log('💾 Saving report to library:', report.title);
    // Would integrate with backend API
    handleCloseReportViewer();
  };

  return React.createElement('div', { className: 'min-h-screen bg-slate-50/50' },
    // Enhanced Navigation Header
    React.createElement('nav', { className: 'bg-white/80 backdrop-blur-sm border-b border-slate-200/60 sticky top-0 z-40' },
      React.createElement('div', { className: 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8' },
        React.createElement('div', { className: 'flex items-center justify-between h-16' },
          // Logo and Brand
          React.createElement('div', { className: 'flex items-center space-x-8' },
            React.createElement('div', { className: 'flex items-center' },
              React.createElement('div', { className: 'w-8 h-8 bg-gradient-to-br from-indigo-600 to-violet-600 rounded-lg flex items-center justify-center mr-3' },
                React.createElement('span', { className: 'text-white font-bold text-sm' }, 'C')
              ),
              React.createElement('h1', { className: 'text-xl font-bold bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent' }, 'Consensus.AI')
            ),
            
            // Navigation Links
            React.createElement('div', { className: 'hidden md:flex items-center space-x-2' },
              React.createElement(NavLink, { to: '/dashboard' }, 'Dashboard'),
              React.createElement(NavLink, { to: '/consensus' }, 'Generate Report'),
              React.createElement(NavLink, { to: '/reports' }, 'Report Library')
            )
          ),
          
          // User Actions - Better spacing and layout
          React.createElement('div', { className: 'flex items-center space-x-6' },
            // Token Display - Better formatted with spacing
            React.createElement('div', { className: 'hidden sm:flex items-center space-x-3 px-3 py-2 bg-slate-50 rounded-lg border border-slate-200' },
              React.createElement('div', { className: 'flex flex-col' },
                React.createElement('span', { className: 'text-xs text-slate-500 font-medium' }, 'Tokens Remaining'),
                React.createElement('span', { className: 'text-sm text-slate-900 font-semibold' }, '22,570')
              ),
              React.createElement('div', { className: 'w-16 h-2 bg-slate-200 rounded-full' },
                React.createElement('div', { className: 'w-3/4 h-2 bg-emerald-500 rounded-full' })
              )
            ),
            
            // Action Buttons
            React.createElement('div', { className: 'flex items-center space-x-3' },
              React.createElement('button', { 
                className: 'p-2 text-slate-500 hover:text-slate-700 transition-colors duration-200 rounded-lg hover:bg-slate-100'
              }, '🔔'),
              React.createElement('button', { 
                className: 'flex items-center space-x-2 bg-slate-100 hover:bg-slate-200 px-3 py-2 rounded-lg text-sm font-medium text-slate-700 transition-colors duration-200'
              }, 
                React.createElement('div', { className: 'w-6 h-6 bg-indigo-500 rounded-full' }),
                React.createElement('span', { className: 'hidden sm:inline' }, 'User')
              )
            )
          )
        )
      )
    ),

    // Main Content Area
    React.createElement('main', { className: 'relative' },
      React.createElement(Routes, null,
        React.createElement(Route, { path: '/', element: React.createElement(Navigate, { to: '/dashboard', replace: true }) }),
        React.createElement(Route, { path: '/dashboard', element: React.createElement(TokenDashboard) }),
        React.createElement(Route, { 
          path: '/consensus', 
          element: React.createElement(EnhancedConsensusForm, {
            onReportGeneration: handleReportGeneration
          })
        }),
        React.createElement(Route, { 
          path: '/reports', 
          element: React.createElement(ReportHistory, {
            onViewReport: handleViewReport,
            onExportReport: handleExportReport
          })
        }),
        React.createElement(Route, { path: '*', element: React.createElement(NotFound) })
      )
    ),

    // Professional Report Viewer Modal (only show when both conditions are met)
    showReportViewer && currentReport && React.createElement(ProfessionalReportViewer, {
      report: currentReport,
      onClose: handleCloseReportViewer,
      onExport: (format) => handleExportReport(currentReport, format),
      onSave: handleSaveReport
    }),

    // Progress Loading Modal
    React.createElement(ProgressLoadingModal, {
      isVisible: progressModal.isVisible,
      currentStage: progressModal.currentStage,
      estimatedTime: progressModal.estimatedTime,
      onClose: () => progressModal.hideProgress()
    }),

    // Enhanced Footer
    React.createElement('footer', { className: 'bg-white border-t border-slate-200/60 mt-20' },
      React.createElement('div', { className: 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12' },
        React.createElement('div', { className: 'grid grid-cols-1 md:grid-cols-4 gap-8' },
          // Brand Column
          React.createElement('div', { className: 'col-span-1 md:col-span-2' },
            React.createElement('div', { className: 'flex items-center mb-4' },
              React.createElement('div', { className: 'w-8 h-8 bg-gradient-to-br from-indigo-600 to-violet-600 rounded-lg flex items-center justify-center mr-3' },
                React.createElement('span', { className: 'text-white font-bold text-sm' }, 'C')
              ),
              React.createElement('span', { className: 'text-xl font-bold text-slate-900' }, 'Consensus.AI')
            ),
            React.createElement('p', { className: 'text-slate-600 max-w-md mb-6' },
              'Advanced AI consensus analysis platform for researchers, analysts, and professionals. Generate comprehensive reports through our proprietary 4-LLM methodology.'
            ),
            React.createElement('div', { className: 'flex items-center space-x-4' },
              React.createElement('div', { className: 'text-sm text-slate-500' }, 
                '© 2024 Consensus.AI. All rights reserved.'
              )
            )
          ),
          
          // Product Column
          React.createElement('div', null,
            React.createElement('h3', { className: 'text-sm font-semibold text-slate-900 mb-4' }, 'Product'),
            React.createElement('div', { className: 'space-y-3' },
              React.createElement('a', { href: '#', className: 'block text-sm text-slate-600 hover:text-indigo-600 transition-colors duration-200' }, 'Features'),
              React.createElement('a', { href: '#', className: 'block text-sm text-slate-600 hover:text-indigo-600 transition-colors duration-200' }, 'Pricing'),
              React.createElement('a', { href: '#', className: 'block text-sm text-slate-600 hover:text-indigo-600 transition-colors duration-200' }, 'API Access'),
              React.createElement('a', { href: '#', className: 'block text-sm text-slate-600 hover:text-indigo-600 transition-colors duration-200' }, 'Documentation')
            )
          ),
          
          // Support Column
          React.createElement('div', null,
            React.createElement('h3', { className: 'text-sm font-semibold text-slate-900 mb-4' }, 'Support'),
            React.createElement('div', { className: 'space-y-3' },
              React.createElement('a', { href: '#', className: 'block text-sm text-slate-600 hover:text-indigo-600 transition-colors duration-200' }, 'Help Center'),
              React.createElement('a', { href: '#', className: 'block text-sm text-slate-600 hover:text-indigo-600 transition-colors duration-200' }, 'Contact Us'),
              React.createElement('a', { href: '#', className: 'block text-sm text-slate-600 hover:text-indigo-600 transition-colors duration-200' }, 'Privacy Policy'),
              React.createElement('a', { href: '#', className: 'block text-sm text-slate-600 hover:text-indigo-600 transition-colors duration-200' }, 'Terms of Service')
            )
          )
        )
      )
    )
  );
}

// Enhanced Navigation Link Component
function NavLink({ to, children }) {
  const location = useLocation();
  const isActive = location.pathname === to;
  
  return React.createElement(Link, {
    to: to,
    className: `px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
      isActive
        ? 'bg-indigo-100 text-indigo-700 shadow-sm'
        : 'text-slate-700 hover:text-indigo-600 hover:bg-slate-100'
    }`
  }, children);
}

// Enhanced 404 Not Found Component
function NotFound() {
  return React.createElement('div', { className: 'min-h-screen bg-slate-50/50 flex items-center justify-center' },
    React.createElement('div', { className: 'max-w-md mx-auto text-center py-16' },
      React.createElement('div', { className: 'text-6xl mb-6' }, '🤖'),
      React.createElement('div', { className: 'text-6xl font-bold text-slate-300 mb-4' }, '404'),
      React.createElement('h1', { className: 'text-2xl font-bold text-slate-900 mb-4' },
        'Page Not Found'
      ),
      React.createElement('p', { className: 'text-slate-600 mb-8' }, 
        "The page you're looking for doesn't exist or has been moved to a different location."
      ),
      React.createElement('div', { className: 'space-y-3' },
        React.createElement(Link, { 
          to: '/dashboard', 
          className: 'inline-flex items-center px-6 py-3 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors duration-200 shadow-sm'
        }, 'Go to Dashboard'),
        React.createElement(Link, { 
          to: '/consensus', 
          className: 'inline-flex items-center px-6 py-3 bg-white border border-slate-200 text-slate-700 rounded-lg font-medium hover:bg-slate-50 transition-colors duration-200 ml-3'
        }, 'Generate Report')
      )
    )
  );
}

export default App; 