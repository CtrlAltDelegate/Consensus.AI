import React from 'react';

function TokenDashboard() {
  return React.createElement('div', { className: 'max-w-6xl mx-auto p-6' },
    React.createElement('div', { className: 'bg-white rounded-lg shadow-lg p-8' },
      React.createElement('h2', { className: 'text-3xl font-bold text-gray-900 mb-8' }, 'Token Dashboard'),
      
      React.createElement('div', { className: 'grid grid-cols-1 md:grid-cols-3 gap-6 mb-8' },
        React.createElement('div', { className: 'bg-blue-50 p-6 rounded-lg' },
          React.createElement('h3', { className: 'text-lg font-semibold text-blue-900 mb-2' }, 'Available Tokens'),
          React.createElement('p', { className: 'text-3xl font-bold text-blue-600' }, '25,000'),
          React.createElement('p', { className: 'text-sm text-blue-700' }, 'Lite Plan')
        ),
        
        React.createElement('div', { className: 'bg-green-50 p-6 rounded-lg' },
          React.createElement('h3', { className: 'text-lg font-semibold text-green-900 mb-2' }, 'Tokens Used'),
          React.createElement('p', { className: 'text-3xl font-bold text-green-600' }, '2,430'),
          React.createElement('p', { className: 'text-sm text-green-700' }, 'This month')
        ),
        
        React.createElement('div', { className: 'bg-purple-50 p-6 rounded-lg' },
          React.createElement('h3', { className: 'text-lg font-semibold text-purple-900 mb-2' }, 'Reports Generated'),
          React.createElement('p', { className: 'text-3xl font-bold text-purple-600' }, '3'),
          React.createElement('p', { className: 'text-sm text-purple-700' }, 'This month')
        )
      ),

      React.createElement('div', { className: 'bg-gray-50 p-6 rounded-lg' },
        React.createElement('h3', { className: 'text-xl font-semibold mb-4' }, 'Token Usage Overview'),
        React.createElement('p', { className: 'text-gray-600' },
          'Your 3-phase consensus system is ready! Each report uses approximately 8,000-12,000 tokens across GPT-4o, Claude 3.5 Sonnet, Gemini 1.5 Pro, and Command R+.'
        ),
        React.createElement('div', { className: 'mt-4 bg-gray-200 rounded-full h-2' },
          React.createElement('div', { 
            className: 'bg-blue-600 h-2 rounded-full', 
            style: { width: '9.7%' }
          })
        ),
        React.createElement('p', { className: 'text-sm text-gray-500 mt-2' }, '9.7% of monthly allocation used')
      )
    )
  );
}

export default TokenDashboard; 