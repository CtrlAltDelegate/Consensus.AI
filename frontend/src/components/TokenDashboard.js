import React from 'react';

function TokenDashboard() {
  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-lg p-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-8">Token Dashboard</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-blue-50 p-6 rounded-lg">
            <h3 className="text-lg font-semibold text-blue-900 mb-2">Available Tokens</h3>
            <p className="text-3xl font-bold text-blue-600">25,000</p>
            <p className="text-sm text-blue-700">Lite Plan</p>
          </div>
          
          <div className="bg-green-50 p-6 rounded-lg">
            <h3 className="text-lg font-semibold text-green-900 mb-2">Tokens Used</h3>
            <p className="text-3xl font-bold text-green-600">2,430</p>
            <p className="text-sm text-green-700">This month</p>
          </div>
          
          <div className="bg-purple-50 p-6 rounded-lg">
            <h3 className="text-lg font-semibold text-purple-900 mb-2">Reports Generated</h3>
            <p className="text-3xl font-bold text-purple-600">3</p>
            <p className="text-sm text-purple-700">This month</p>
          </div>
        </div>

        <div className="bg-gray-50 p-6 rounded-lg">
          <h3 className="text-xl font-semibold mb-4">Token Usage Overview</h3>
          <p className="text-gray-600">
            Your 3-phase consensus system is ready! Each report uses approximately 8,000-12,000 tokens 
            across GPT-4o, Claude 3.5 Sonnet, Gemini 1.5 Pro, and Command R+.
          </p>
          <div className="mt-4 bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full" 
              style={{ width: '9.7%' }}
            ></div>
          </div>
          <p className="text-sm text-gray-500 mt-2">9.7% of monthly allocation used</p>
        </div>
      </div>
    </div>
  );
}

export default TokenDashboard; 