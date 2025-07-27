import React from 'react';

function TokenDashboard() {
  // Mock data - will connect to real API later
  const tokenData = {
    available: 25000,
    used: 2430,
    plan: 'Lite Plan',
    reportsGenerated: 3,
    usagePercentage: 9.7,
    nextReset: '2024-02-01',
    daysUntilReset: 24
  };

  const recentActivity = [
    { id: 1, title: 'Analysis: Climate Policy Impact', date: '2024-01-29', tokens: 8540, status: 'completed' },
    { id: 2, title: 'Research: AI Ethics Framework', date: '2024-01-28', tokens: 7230, status: 'completed' },
    { id: 3, title: 'Legal Brief: Contract Analysis', date: '2024-01-27', tokens: 9120, status: 'completed' }
  ];

  return React.createElement('div', { className: 'min-h-screen bg-slate-50/50' },
    React.createElement('div', { className: 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8' },
      
      // Header Section
      React.createElement('div', { className: 'mb-10' },
        React.createElement('div', { className: 'flex items-center justify-between' },
          React.createElement('div', null,
            React.createElement('h1', { className: 'text-3xl font-bold text-slate-900 tracking-tight' }, 'Token Dashboard'),
            React.createElement('p', { className: 'mt-2 text-slate-600 font-medium' }, 
              'Monitor your usage and manage your subscription'
            )
          ),
          React.createElement('div', { className: 'flex items-center space-x-3' },
            React.createElement('button', { 
              className: 'inline-flex items-center px-4 py-2.5 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition-all duration-200 shadow-sm'
            }, 'Export Usage'),
            React.createElement('button', { 
              className: 'inline-flex items-center px-4 py-2.5 bg-indigo-600 border border-transparent rounded-lg text-sm font-medium text-white hover:bg-indigo-700 transition-all duration-200 shadow-sm'
            }, 'Upgrade Plan')
          )
        )
      ),

      // Stats Grid
      React.createElement('div', { className: 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10' },
        
        // Available Tokens Card
        React.createElement('div', { className: 'group relative bg-white rounded-xl border border-slate-200/60 p-6 shadow-sm hover:shadow-md hover:border-slate-300/60 transition-all duration-300' },
          React.createElement('div', { className: 'flex items-center justify-between' },
            React.createElement('div', null,
              React.createElement('p', { className: 'text-sm font-medium text-slate-600 mb-1' }, 'Available Tokens'),
              React.createElement('p', { className: 'text-2xl font-bold text-slate-900' }, tokenData.available.toLocaleString()),
              React.createElement('p', { className: 'text-xs font-medium text-emerald-600 mt-1' }, tokenData.plan)
            ),
            React.createElement('div', { className: 'w-12 h-12 bg-emerald-50 rounded-lg flex items-center justify-center group-hover:bg-emerald-100 transition-colors duration-200' },
              React.createElement('div', { className: 'w-6 h-6 bg-emerald-500 rounded-full' })
            )
          )
        ),

        // Used Tokens Card
        React.createElement('div', { className: 'group relative bg-white rounded-xl border border-slate-200/60 p-6 shadow-sm hover:shadow-md hover:border-slate-300/60 transition-all duration-300' },
          React.createElement('div', { className: 'flex items-center justify-between' },
            React.createElement('div', null,
              React.createElement('p', { className: 'text-sm font-medium text-slate-600 mb-1' }, 'Tokens Used'),
              React.createElement('p', { className: 'text-2xl font-bold text-slate-900' }, tokenData.used.toLocaleString()),
              React.createElement('p', { className: 'text-xs font-medium text-slate-500 mt-1' }, 'This month')
            ),
            React.createElement('div', { className: 'w-12 h-12 bg-indigo-50 rounded-lg flex items-center justify-center group-hover:bg-indigo-100 transition-colors duration-200' },
              React.createElement('div', { className: 'w-6 h-6 bg-indigo-500 rounded-full' })
            )
          )
        ),

        // Reports Generated Card
        React.createElement('div', { className: 'group relative bg-white rounded-xl border border-slate-200/60 p-6 shadow-sm hover:shadow-md hover:border-slate-300/60 transition-all duration-300' },
          React.createElement('div', { className: 'flex items-center justify-between' },
            React.createElement('div', null,
              React.createElement('p', { className: 'text-sm font-medium text-slate-600 mb-1' }, 'Reports Generated'),
              React.createElement('p', { className: 'text-2xl font-bold text-slate-900' }, tokenData.reportsGenerated),
              React.createElement('p', { className: 'text-xs font-medium text-slate-500 mt-1' }, 'This month')
            ),
            React.createElement('div', { className: 'w-12 h-12 bg-violet-50 rounded-lg flex items-center justify-center group-hover:bg-violet-100 transition-colors duration-200' },
              React.createElement('div', { className: 'w-6 h-6 bg-violet-500 rounded-full' })
            )
          )
        ),

        // Next Reset Card
        React.createElement('div', { className: 'group relative bg-white rounded-xl border border-slate-200/60 p-6 shadow-sm hover:shadow-md hover:border-slate-300/60 transition-all duration-300' },
          React.createElement('div', { className: 'flex items-center justify-between' },
            React.createElement('div', null,
              React.createElement('p', { className: 'text-sm font-medium text-slate-600 mb-1' }, 'Next Reset'),
              React.createElement('p', { className: 'text-2xl font-bold text-slate-900' }, `${tokenData.daysUntilReset} days`),
              React.createElement('p', { className: 'text-xs font-medium text-slate-500 mt-1' }, 'Feb 1, 2024')
            ),
            React.createElement('div', { className: 'w-12 h-12 bg-amber-50 rounded-lg flex items-center justify-center group-hover:bg-amber-100 transition-colors duration-200' },
              React.createElement('div', { className: 'w-6 h-6 bg-amber-500 rounded-full' })
            )
          )
        )
      ),

      // Usage Overview & Recent Activity Row
      React.createElement('div', { className: 'grid grid-cols-1 lg:grid-cols-3 gap-8' },
        
        // Usage Overview (2/3 width)
        React.createElement('div', { className: 'lg:col-span-2' },
          React.createElement('div', { className: 'bg-white rounded-xl border border-slate-200/60 shadow-sm' },
            React.createElement('div', { className: 'p-6 border-b border-slate-100' },
              React.createElement('h3', { className: 'text-lg font-semibold text-slate-900 mb-1' }, 'Token Usage Overview'),
              React.createElement('p', { className: 'text-sm text-slate-600' }, 
                'Your 3-phase consensus system processes complex analysis through multiple AI models'
              )
            ),
            React.createElement('div', { className: 'p-6' },
              React.createElement('div', { className: 'flex items-center justify-between mb-4' },
                React.createElement('div', null,
                  React.createElement('div', { className: 'flex items-baseline space-x-2' },
                    React.createElement('span', { className: 'text-2xl font-bold text-slate-900' }, `${tokenData.usagePercentage}%`),
                    React.createElement('span', { className: 'text-sm font-medium text-slate-500' }, 'of monthly allocation')
                  ),
                  React.createElement('p', { className: 'text-sm text-slate-600 mt-1' }, 
                    `${tokenData.used.toLocaleString()} of ${tokenData.available.toLocaleString()} tokens used`
                  )
                ),
                React.createElement('div', { className: 'text-right' },
                  React.createElement('span', { className: 'inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800' },
                    'Healthy Usage'
                  )
                )
              ),
              
              // Progress Bar
              React.createElement('div', { className: 'w-full bg-slate-100 rounded-full h-3 mb-6' },
                React.createElement('div', { 
                  className: 'bg-gradient-to-r from-indigo-500 to-violet-500 h-3 rounded-full transition-all duration-700 ease-out',
                  style: { width: `${tokenData.usagePercentage}%` }
                })
              ),
              
              // Model Breakdown
              React.createElement('div', { className: 'space-y-3' },
                React.createElement('h4', { className: 'text-sm font-medium text-slate-700 mb-3' }, 'AI Model Breakdown'),
                React.createElement('div', { className: 'grid grid-cols-2 gap-4' },
                  React.createElement('div', { className: 'flex items-center justify-between py-2' },
                    React.createElement('span', { className: 'text-sm text-slate-600' }, 'GPT-4o'),
                    React.createElement('span', { className: 'text-sm font-medium text-slate-900' }, '~2.1K tokens')
                  ),
                  React.createElement('div', { className: 'flex items-center justify-between py-2' },
                    React.createElement('span', { className: 'text-sm text-slate-600' }, 'Claude 3.5 Sonnet'),
                    React.createElement('span', { className: 'text-sm font-medium text-slate-900' }, '~2.3K tokens')
                  ),
                  React.createElement('div', { className: 'flex items-center justify-between py-2' },
                    React.createElement('span', { className: 'text-sm text-slate-600' }, 'Gemini 1.5 Pro'),
                    React.createElement('span', { className: 'text-sm font-medium text-slate-900' }, '~2.0K tokens')
                  ),
                  React.createElement('div', { className: 'flex items-center justify-between py-2' },
                    React.createElement('span', { className: 'text-sm text-slate-600' }, 'Command R+'),
                    React.createElement('span', { className: 'text-sm font-medium text-slate-900' }, '~2.0K tokens')
                  )
                )
              )
            )
          )
        ),

        // Recent Activity (1/3 width)
        React.createElement('div', { className: 'lg:col-span-1' },
          React.createElement('div', { className: 'bg-white rounded-xl border border-slate-200/60 shadow-sm' },
            React.createElement('div', { className: 'p-6 border-b border-slate-100' },
              React.createElement('div', { className: 'flex items-center justify-between' },
                React.createElement('h3', { className: 'text-lg font-semibold text-slate-900' }, 'Recent Reports'),
                React.createElement('button', { 
                  className: 'text-sm font-medium text-indigo-600 hover:text-indigo-700 transition-colors duration-200'
                }, 'View All')
              )
            ),
            React.createElement('div', { className: 'divide-y divide-slate-100' },
              ...recentActivity.map(report => 
                React.createElement('div', { key: report.id, className: 'p-4 hover:bg-slate-50/50 transition-colors duration-200 cursor-pointer' },
                  React.createElement('div', { className: 'flex items-start justify-between' },
                    React.createElement('div', { className: 'flex-1 min-w-0' },
                      React.createElement('p', { className: 'text-sm font-medium text-slate-900 truncate' }, report.title),
                      React.createElement('p', { className: 'text-xs text-slate-500 mt-1' }, report.date),
                      React.createElement('p', { className: 'text-xs text-slate-600 mt-1' }, `${report.tokens.toLocaleString()} tokens`)
                    ),
                    React.createElement('span', { 
                      className: 'ml-2 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800'
                    }, 'Complete')
                  )
                )
              )
            )
          )
        )
      )
    )
  );
}

export default TokenDashboard; 