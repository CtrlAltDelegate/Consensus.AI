import React from 'react';
import { Routes, Route, Navigate, Link, useLocation } from 'react-router-dom';

// Components
import TokenDashboard from './components/TokenDashboard';
import EnhancedConsensusForm from './components/EnhancedConsensusForm';

function App() {
  return React.createElement('div', { className: 'min-h-screen bg-gray-50' },
    // Navigation Header
    React.createElement('nav', { className: 'bg-white shadow-sm border-b border-gray-200' },
      React.createElement('div', { className: 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8' },
        React.createElement('div', { className: 'flex items-center justify-between h-16' },
          React.createElement('div', { className: 'flex items-center' },
            React.createElement('h1', { className: 'text-xl font-bold text-blue-600' }, 'Consensus.AI')
          ),
          React.createElement('div', { className: 'flex items-center space-x-4' },
            React.createElement(NavLink, { to: '/dashboard' }, 'Dashboard'),
            React.createElement(NavLink, { to: '/consensus' }, 'Generate Consensus'),
            React.createElement('button', { 
              className: 'bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 transition-colors'
            }, 'Sign Out')
          )
        )
      )
    ),

    // Main Content
    React.createElement('main', { className: 'py-8' },
      React.createElement(Routes, null,
        React.createElement(Route, { path: '/', element: React.createElement(Navigate, { to: '/dashboard', replace: true }) }),
        React.createElement(Route, { path: '/dashboard', element: React.createElement(TokenDashboard) }),
        React.createElement(Route, { path: '/consensus', element: React.createElement(EnhancedConsensusForm) }),
        React.createElement(Route, { path: '*', element: React.createElement(NotFound) })
      )
    ),

    // Footer
    React.createElement('footer', { className: 'bg-white border-t border-gray-200 mt-16' },
      React.createElement('div', { className: 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8' },
        React.createElement('div', { className: 'flex items-center justify-between' },
          React.createElement('div', { className: 'text-sm text-gray-500' },
            '© 2024 Consensus.AI. All rights reserved.'
          ),
          React.createElement('div', { className: 'flex items-center space-x-6' },
            React.createElement('a', { href: '#', className: 'text-sm text-gray-500 hover:text-gray-700' }, 'Privacy Policy'),
            React.createElement('a', { href: '#', className: 'text-sm text-gray-500 hover:text-gray-700' }, 'Terms of Service'),
            React.createElement('a', { href: '#', className: 'text-sm text-gray-500 hover:text-gray-700' }, 'Support')
          )
        )
      )
    )
  );
}

// Navigation Link Component
function NavLink({ to, children }) {
  const location = useLocation();
  const isActive = location.pathname === to;
  
  return React.createElement(Link, {
    to: to,
    className: `px-3 py-2 rounded-md text-sm font-medium transition-colors ${
      isActive
        ? 'bg-blue-100 text-blue-700'
        : 'text-gray-700 hover:text-blue-600 hover:bg-gray-100'
    }`
  }, children);
}

// 404 Not Found Component
function NotFound() {
  return React.createElement('div', { className: 'max-w-md mx-auto text-center py-16' },
    React.createElement('div', { className: 'text-6xl font-bold text-gray-300 mb-4' }, '404'),
    React.createElement('h1', { className: 'text-2xl font-bold text-gray-900 mb-4' }, 'Page Not Found'),
    React.createElement('p', { className: 'text-gray-600 mb-8' }, 
      "The page you're looking for doesn't exist or has been moved."
    ),
    React.createElement(Link, { 
      to: '/dashboard', 
      className: 'bg-blue-600 text-white px-6 py-3 rounded-md font-medium hover:bg-blue-700 transition-colors'
    }, 'Go to Dashboard')
  );
}

export default App; 