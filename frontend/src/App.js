// frontend/src/App.js - Complete Integration
import React, { useState } from 'react';
import { Routes, Route, Navigate, Link, useLocation } from 'react-router-dom';
import { UserProvider, useUser } from './contexts/UserContext';

// Enhanced Components
import TokenDashboard from './components/TokenDashboard';
import EnhancedConsensusForm from './components/EnhancedConsensusForm';
import ProfessionalReportViewer from './components/ProfessionalReportViewer';
import ProgressLoadingModal, { useProgressModal } from './components/ProgressLoadingModal';
import ReportHistory from './components/ReportHistory';
import AuthModal from './components/AuthModal';
import BillingModal from './components/BillingModal';
import UserProfileModal from './components/UserProfileModal';

// Services
import exportService from './utils/exportService';

// Custom NavLink component with proper styling
const CustomNavLink = ({ to, children }) => {
  const location = useLocation();
  const isActive = location.pathname === to;
  
  return React.createElement(Link, {
    to,
    className: `px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
      isActive 
        ? 'bg-indigo-100 text-indigo-700 border border-indigo-200' 
        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
    }`
  }, children);
};

// User menu dropdown component
const UserMenu = ({ user, onLogout, onProfile, onBilling }) => {
  const [isOpen, setIsOpen] = useState(false);
  
  return React.createElement('div', { className: 'relative' },
    // User button
    React.createElement('button', {
      onClick: () => setIsOpen(!isOpen),
      className: 'flex items-center space-x-2 bg-slate-100 hover:bg-slate-200 px-3 py-2 rounded-lg text-sm font-medium text-slate-700 transition-colors duration-200'
    },
      React.createElement('div', { className: 'w-6 h-6 bg-indigo-500 rounded-full flex items-center justify-center' },
        React.createElement('span', { className: 'text-white text-xs font-bold' },
          user.profile.firstName?.charAt(0)?.toUpperCase() || user.email.charAt(0).toUpperCase()
        )
      ),
      React.createElement('span', { className: 'hidden sm:inline' },
        user.profile.firstName || user.email.split('@')[0]
      ),
      React.createElement('svg', {
        className: `w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`,
        fill: 'none',
        stroke: 'currentColor',
        viewBox: '0 0 24 24'
      },
        React.createElement('path', {
          strokeLinecap: 'round',
          strokeLinejoin: 'round',
          strokeWidth: 2,
          d: 'M19 9l-7 7-7-7'
        })
      )
    ),
    
    // Dropdown menu
    isOpen && React.createElement('div', {
      className: 'absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-slate-200 py-1 z-50',
      onClick: () => setIsOpen(false)
    },
      React.createElement('div', { className: 'px-4 py-2 border-b border-slate-100' },
        React.createElement('p', { className: 'text-sm font-medium text-slate-900' },
          user.profile.firstName && user.profile.lastName
            ? `${user.profile.firstName} ${user.profile.lastName}`
            : user.email
        ),
        React.createElement('p', { className: 'text-xs text-slate-500' }, user.email),
        React.createElement('p', { className: 'text-xs text-indigo-600 font-medium' },
          `${user.subscription?.tier || 'Free'} Plan`
        )
      ),
      React.createElement('button', {
        onClick: onProfile,
        className: 'w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50'
      }, 'Profile & Settings'),
      React.createElement('button', {
        onClick: onBilling,
        className: 'w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50'
      }, 'Billing & Subscription'),
      React.createElement('hr', { className: 'my-1' }),
      React.createElement('button', {
        onClick: onLogout,
        className: 'w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50'
      }, 'Sign Out')
    )
  );
};

// Loading screen component
const LoadingScreen = () => {
  return React.createElement('div', {
    className: 'min-h-screen bg-slate-50 flex items-center justify-center'
  },
    React.createElement('div', { className: 'text-center' },
      React.createElement('div', { className: 'w-12 h-12 bg-gradient-to-br from-indigo-600 to-violet-600 rounded-lg flex items-center justify-center mx-auto mb-4' },
        React.createElement('span', { className: 'text-white font-bold text-lg' }, 'C')
      ),
      React.createElement('div', { className: 'animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto mb-4' }),
      React.createElement('p', { className: 'text-slate-600' }, 'Loading Consensus.AI...')
    )
  );
};

// Main authenticated app component
function AuthenticatedApp() {
  const { user, logout, getAvailableTokens } = useUser();
  const [currentReport, setCurrentReport] = useState(null);
  const [showReportViewer, setShowReportViewer] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showBillingModal, setShowBillingModal] = useState(false);
  
  const progressModal = useProgressModal();

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
    }
  };

  // Handle saving report to library
  const handleSaveReport = (report) => {
    console.log('💾 Saving report to library:', report.title);
    handleCloseReportViewer();
  };

  // Handle logout
  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const availableTokens = getAvailableTokens();
  const tokenLimit = user?.subscription?.tokenLimit || 25000;
  const tokenPercentage = Math.min((availableTokens / tokenLimit) * 100, 100);

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
              React.createElement(CustomNavLink, { to: '/dashboard' }, 'Dashboard'),
              React.createElement(CustomNavLink, { to: '/consensus' }, 'Generate Report'),
              React.createElement(CustomNavLink, { to: '/reports' }, 'Report Library')
            )
          ),
          
          // User Actions
          React.createElement('div', { className: 'flex items-center space-x-6' },
            // Token Display
            React.createElement('div', { className: 'hidden sm:flex items-center space-x-3 px-3 py-2 bg-slate-50 rounded-lg border border-slate-200' },
              React.createElement('div', { className: 'flex flex-col' },
                React.createElement('span', { className: 'text-xs text-slate-500 font-medium' }, 'Tokens Remaining'),
                React.createElement('span', { className: 'text-sm text-slate-900 font-semibold' }, 
                  availableTokens.toLocaleString()
                )
              ),
              React.createElement('div', { className: 'w-16 h-2 bg-slate-200 rounded-full' },
                React.createElement('div', { 
                  className: `h-2 rounded-full ${tokenPercentage > 20 ? 'bg-emerald-500' : 'bg-red-500'}`,
                  style: { width: `${tokenPercentage}%` }
                })
              )
            ),
            
            // User Menu
            React.createElement(UserMenu, {
              user,
              onLogout: handleLogout,
              onProfile: () => setShowProfileModal(true),
              onBilling: () => setShowBillingModal(true)
            })
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
            progressModal: progressModal
          })
        }),
        React.createElement(Route, { 
          path: '/reports', 
          element: React.createElement(ReportHistory, {
            onViewReport: handleViewReport,
            onExportReport: handleExportReport
          })
        }),
        React.createElement(Route, { path: '*', element: React.createElement('div', { className: 'flex flex-col items-center justify-center min-h-screen' },
          React.createElement('h1', { className: 'text-4xl font-bold text-slate-900 mb-4' }, '404'),
          React.createElement('p', { className: 'text-slate-600 mb-8' }, 'Page not found'),
          React.createElement(Link, { 
            to: '/dashboard', 
            className: 'bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700'
          }, 'Go to Dashboard')
        ) })
      )
    ),

    // Modals
    showReportViewer && currentReport && React.createElement(ProfessionalReportViewer, {
      report: currentReport,
      onClose: handleCloseReportViewer,
      onExport: (format) => handleExportReport(currentReport, format),
      onSave: handleSaveReport
    }),

    React.createElement(ProgressLoadingModal, {
      isVisible: progressModal.isVisible,
      currentStage: progressModal.currentStage,
      estimatedTime: progressModal.estimatedTime,
      onClose: () => progressModal.hideProgress()
    }),

    React.createElement(UserProfileModal, {
      isVisible: showProfileModal,
      onClose: () => setShowProfileModal(false)
    }),

    React.createElement(BillingModal, {
      isVisible: showBillingModal,
      onClose: () => setShowBillingModal(false)
    }),

    // Enhanced Footer
    React.createElement('footer', { className: 'bg-white border-t border-slate-200/60 mt-20' },
      React.createElement('div', { className: 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12' },
        React.createElement('div', { className: 'grid grid-cols-1 md:grid-cols-4 gap-8' },
          React.createElement('div', { className: 'col-span-1 md:col-span-2' },
            React.createElement('div', { className: 'flex items-center mb-4' },
              React.createElement('div', { className: 'w-8 h-8 bg-gradient-to-br from-indigo-600 to-violet-600 rounded-lg flex items-center justify-center mr-3' },
                React.createElement('span', { className: 'text-white font-bold text-sm' }, 'C')
              ),
              React.createElement('span', { className: 'text-xl font-bold text-slate-900' }, 'Consensus.AI')
            ),
            React.createElement('p', { className: 'text-slate-600 max-w-md mb-6' },
              'Advanced AI consensus analysis platform for researchers, analysts, and professionals.'
            ),
            React.createElement('div', { className: 'text-sm text-slate-500' }, 
              '© 2024 Consensus.AI. All rights reserved.'
            )
          ),
          React.createElement('div', null,
            React.createElement('h3', { className: 'text-sm font-semibold text-slate-900 mb-4' }, 'Product'),
            React.createElement('div', { className: 'space-y-3' },
              React.createElement('a', { href: '#', className: 'block text-sm text-slate-600 hover:text-indigo-600' }, 'Features'),
              React.createElement('a', { href: '#', className: 'block text-sm text-slate-600 hover:text-indigo-600' }, 'Pricing'),
              React.createElement('a', { href: '#', className: 'block text-sm text-slate-600 hover:text-indigo-600' }, 'API Access')
            )
          ),
          React.createElement('div', null,
            React.createElement('h3', { className: 'text-sm font-semibold text-slate-900 mb-4' }, 'Support'),
            React.createElement('div', { className: 'space-y-3' },
              React.createElement('a', { href: '#', className: 'block text-sm text-slate-600 hover:text-indigo-600' }, 'Help Center'),
              React.createElement('a', { href: '#', className: 'block text-sm text-slate-600 hover:text-indigo-600' }, 'Contact Us'),
              React.createElement('a', { href: '#', className: 'block text-sm text-slate-600 hover:text-indigo-600' }, 'Privacy Policy')
            )
          )
        )
      )
    )
  );
}

// Login/Landing page component
function UnauthenticatedApp() {
  const [showAuthModal, setShowAuthModal] = useState(false);

  const handleAuthSuccess = async (user, token) => {
    console.log('✅ Authentication successful:', user.email);
    setShowAuthModal(false);
  };

  return React.createElement('div', { className: 'min-h-screen bg-gradient-to-br from-indigo-50 to-violet-50' },
    // Header
    React.createElement('nav', { className: 'bg-white/80 backdrop-blur-sm border-b border-slate-200/60' },
      React.createElement('div', { className: 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8' },
        React.createElement('div', { className: 'flex items-center justify-between h-16' },
          React.createElement('div', { className: 'flex items-center' },
            React.createElement('div', { className: 'w-8 h-8 bg-gradient-to-br from-indigo-600 to-violet-600 rounded-lg flex items-center justify-center mr-3' },
              React.createElement('span', { className: 'text-white font-bold text-sm' }, 'C')
            ),
            React.createElement('h1', { className: 'text-xl font-bold bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent' }, 'Consensus.AI')
          ),
          React.createElement('button', {
            onClick: () => setShowAuthModal(true),
            className: 'bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors duration-200'
          }, 'Sign In')
        )
      )
    ),

    // Hero Section
    React.createElement('main', { className: 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20' },
      React.createElement('div', { className: 'text-center' },
        React.createElement('h1', { className: 'text-5xl font-bold text-slate-900 mb-6' },
          'AI Consensus Analysis',
          React.createElement('br'),
          React.createElement('span', { className: 'bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent' },
            'Powered by 4 Leading LLMs'
          )
        ),
        React.createElement('p', { className: 'text-xl text-slate-600 mb-8 max-w-3xl mx-auto' },
          'Generate comprehensive, unbiased analysis by leveraging multiple AI models. Get consensus-driven insights with professional reports for research, business, and decision-making.'
        ),
        React.createElement('div', { className: 'flex items-center justify-center space-x-4' },
          React.createElement('button', {
            onClick: () => setShowAuthModal(true),
            className: 'bg-indigo-600 text-white px-8 py-3 rounded-lg hover:bg-indigo-700 transition-colors duration-200 font-medium'
          }, 'Get Started Free'),
          React.createElement('button', {
            className: 'text-indigo-600 px-8 py-3 rounded-lg border border-indigo-200 hover:bg-indigo-50 transition-colors duration-200 font-medium'
          }, 'Learn More')
        )
      )
    ),

    // Auth Modal
    React.createElement(AuthModal, {
      isVisible: showAuthModal,
      onClose: () => setShowAuthModal(false),
      onAuthSuccess: handleAuthSuccess
    })
  );
}

// Main App component with context provider
function App() {
  return React.createElement(UserProvider, null,
    React.createElement(AppRouter)
  );
}

// App router component
function AppRouter() {
  const { isAuthenticated, isLoading } = useUser();

  if (isLoading) {
    return React.createElement(LoadingScreen);
  }

  return isAuthenticated 
    ? React.createElement(AuthenticatedApp)
    : React.createElement(UnauthenticatedApp);
}

export default App;
