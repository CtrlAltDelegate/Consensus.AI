import React from 'react';
import { Routes, Route, Navigate, Link, useLocation } from 'react-router-dom';
import { loadStripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';

// Components
import TokenDashboard from './components/TokenDashboard';
import EnhancedConsensusForm from './components/EnhancedConsensusForm';

// Initialize Stripe
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);

function App() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation Header */}
      <nav className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Consensus.AI
              </h1>
            </div>
            
            <div className="flex items-center space-x-4">
              <NavLink to="/dashboard">Dashboard</NavLink>
              <NavLink to="/consensus">Generate Consensus</NavLink>
              <button className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 transition-colors">
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="py-8">
        <Elements stripe={stripePromise}>
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<TokenDashboard />} />
            <Route path="/consensus" element={<EnhancedConsensusForm />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Elements>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-500">
              © 2024 Consensus.AI. All rights reserved.
            </div>
            <div className="flex items-center space-x-6">
              <a href="#" className="text-sm text-gray-500 hover:text-gray-700">
                Privacy Policy
              </a>
              <a href="#" className="text-sm text-gray-500 hover:text-gray-700">
                Terms of Service
              </a>
              <a href="#" className="text-sm text-gray-500 hover:text-gray-700">
                Support
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

// Navigation Link Component
function NavLink({ to, children }) {
  const location = useLocation();
  const isActive = location.pathname === to;
  
  return (
    <Link
      to={to}
      className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
        isActive
          ? 'bg-blue-100 text-blue-700'
          : 'text-gray-700 hover:text-blue-600 hover:bg-gray-100'
      }`}
    >
      {children}
    </Link>
  );
}

// 404 Not Found Component
function NotFound() {
  return (
    <div className="max-w-md mx-auto text-center py-16">
      <div className="text-6xl font-bold text-gray-300 mb-4">404</div>
      <h1 className="text-2xl font-bold text-gray-900 mb-4">
        Page Not Found
      </h1>
      <p className="text-gray-600 mb-8">
        The page you're looking for doesn't exist or has been moved.
      </p>
      <Link to="/dashboard" className="bg-blue-600 text-white px-6 py-3 rounded-md font-medium hover:bg-blue-700 transition-colors">
        Go to Dashboard
      </Link>
    </div>
  );
}

export default App; 