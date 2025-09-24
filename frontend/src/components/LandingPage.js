import React from 'react';

function LandingPage({ onGetStarted, onLearnMore }) {
  return React.createElement('main', { className: 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20' },
    // Hero Section
    React.createElement('div', { className: 'text-center mb-20' },
      React.createElement('h1', { className: 'text-5xl font-bold text-slate-900 mb-6' },
        'AI Consensus Analysis',
        React.createElement('br'),
        React.createElement('span', { className: 'bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent' },
          'Powered by 4 Leading LLMs'
        )
      ),
      React.createElement('p', { className: 'text-xl text-slate-600 mb-8 max-w-3xl mx-auto' },
        'Get unbiased, comprehensive analysis by combining insights from GPT-4, Claude, Gemini, and Cohere. Perfect for research, business decisions, and complex problem-solving.'
      ),
      React.createElement('div', { className: 'flex items-center justify-center space-x-4 mb-12' },
        React.createElement('button', {
          onClick: onGetStarted,
          className: 'bg-indigo-600 text-white px-8 py-3 rounded-lg hover:bg-indigo-700 transition-colors duration-200 font-medium text-lg'
        }, 'Start Free Analysis'),
        React.createElement('button', {
          onClick: () => document.getElementById('how-it-works').scrollIntoView({ behavior: 'smooth' }),
          className: 'text-indigo-600 px-8 py-3 rounded-lg border border-indigo-200 hover:bg-indigo-50 transition-colors duration-200 font-medium text-lg'
        }, 'See How It Works')
      ),
      
      // Trust indicators
      React.createElement('div', { className: 'flex items-center justify-center space-x-8 text-sm text-slate-500' },
        React.createElement('div', { className: 'flex items-center' },
          React.createElement('svg', { className: 'w-5 h-5 text-green-500 mr-2', fill: 'currentColor', viewBox: '0 0 20 20' },
            React.createElement('path', { fillRule: 'evenodd', d: 'M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z', clipRule: 'evenodd' })
          ),
          'No Credit Card Required'
        ),
        React.createElement('div', { className: 'flex items-center' },
          React.createElement('svg', { className: 'w-5 h-5 text-green-500 mr-2', fill: 'currentColor', viewBox: '0 0 20 20' },
            React.createElement('path', { fillRule: 'evenodd', d: 'M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z', clipRule: 'evenodd' })
          ),
          'Enterprise Security'
        ),
        React.createElement('div', { className: 'flex items-center' },
          React.createElement('svg', { className: 'w-5 h-5 text-green-500 mr-2', fill: 'currentColor', viewBox: '0 0 20 20' },
            React.createElement('path', { d: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z' })
          ),
          'GDPR Compliant'
        )
      )
    ),

    // How It Works Section
    React.createElement('section', { id: 'how-it-works', className: 'mb-20' },
      React.createElement('div', { className: 'text-center mb-16' },
        React.createElement('h2', { className: 'text-4xl font-bold text-slate-900 mb-4' }, 'How Consensus.AI Works'),
        React.createElement('p', { className: 'text-xl text-slate-600 max-w-2xl mx-auto' },
          'Our 3-phase process ensures balanced, comprehensive analysis from multiple AI perspectives'
        )
      ),
      
      React.createElement('div', { className: 'grid md:grid-cols-3 gap-8 mb-16' },
        // Phase 1
        React.createElement('div', { className: 'text-center p-6 bg-white rounded-xl shadow-sm border border-slate-200' },
          React.createElement('div', { className: 'w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4' },
            React.createElement('span', { className: 'text-2xl font-bold text-blue-600' }, '1')
          ),
          React.createElement('h3', { className: 'text-xl font-semibold text-slate-900 mb-3' }, 'Independent Analysis'),
          React.createElement('p', { className: 'text-slate-600 mb-4' },
            'GPT-4, Claude, and Gemini each analyze your topic independently, providing diverse perspectives without bias.'
          ),
          React.createElement('div', { className: 'flex justify-center space-x-2' },
            React.createElement('span', { className: 'px-2 py-1 bg-green-100 text-green-800 text-xs rounded' }, 'GPT-4'),
            React.createElement('span', { className: 'px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded' }, 'Claude'),
            React.createElement('span', { className: 'px-2 py-1 bg-orange-100 text-orange-800 text-xs rounded' }, 'Gemini')
          )
        ),
        
        // Phase 2
        React.createElement('div', { className: 'text-center p-6 bg-white rounded-xl shadow-sm border border-slate-200' },
          React.createElement('div', { className: 'w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4' },
            React.createElement('span', { className: 'text-2xl font-bold text-indigo-600' }, '2')
          ),
          React.createElement('h3', { className: 'text-xl font-semibold text-slate-900 mb-3' }, 'Peer Review'),
          React.createElement('p', { className: 'text-slate-600 mb-4' },
            'Each AI model reviews and critiques the others\' analyses, identifying strengths, weaknesses, and gaps.'
          ),
          React.createElement('div', { className: 'text-sm text-slate-500' },
            'Cross-validation ensures quality and completeness'
          )
        ),
        
        // Phase 3
        React.createElement('div', { className: 'text-center p-6 bg-white rounded-xl shadow-sm border border-slate-200' },
          React.createElement('div', { className: 'w-16 h-16 bg-violet-100 rounded-full flex items-center justify-center mx-auto mb-4' },
            React.createElement('span', { className: 'text-2xl font-bold text-violet-600' }, '3')
          ),
          React.createElement('h3', { className: 'text-xl font-semibold text-slate-900 mb-3' }, 'Final Consensus'),
          React.createElement('p', { className: 'text-slate-600 mb-4' },
            'Cohere synthesizes all perspectives into a balanced, comprehensive final report with confidence scores.'
          ),
          React.createElement('div', { className: 'flex justify-center' },
            React.createElement('span', { className: 'px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded' }, 'Cohere Arbiter')
          )
        )
      ),

      // What You Get Section
      React.createElement('div', { className: 'bg-gradient-to-r from-indigo-50 to-violet-50 rounded-2xl p-8' },
        React.createElement('h3', { className: 'text-2xl font-semibold text-center text-slate-900 mb-8' }, 'What You Get'),
        React.createElement('div', { className: 'grid md:grid-cols-2 gap-8' },
          React.createElement('div', { className: 'space-y-4' },
            React.createElement('div', { className: 'flex items-start' },
              React.createElement('svg', { className: 'w-6 h-6 text-green-500 mr-3 mt-1', fill: 'currentColor', viewBox: '0 0 20 20' },
                React.createElement('path', { fillRule: 'evenodd', d: 'M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z', clipRule: 'evenodd' })
              ),
              React.createElement('div', null,
                React.createElement('h4', { className: 'font-semibold text-slate-900' }, 'Professional PDF Reports'),
                React.createElement('p', { className: 'text-slate-600 text-sm' }, 'Beautifully formatted reports ready for presentations and sharing')
              )
            ),
            React.createElement('div', { className: 'flex items-start' },
              React.createElement('svg', { className: 'w-6 h-6 text-green-500 mr-3 mt-1', fill: 'currentColor', viewBox: '0 0 20 20' },
                React.createElement('path', { fillRule: 'evenodd', d: 'M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z', clipRule: 'evenodd' })
              ),
              React.createElement('div', null,
                React.createElement('h4', { className: 'font-semibold text-slate-900' }, 'Confidence Scores'),
                React.createElement('p', { className: 'text-slate-600 text-sm' }, 'Know how certain the AI consensus is about each conclusion')
              )
            ),
            React.createElement('div', { className: 'flex items-start' },
              React.createElement('svg', { className: 'w-6 h-6 text-green-500 mr-3 mt-1', fill: 'currentColor', viewBox: '0 0 20 20' },
                React.createElement('path', { fillRule: 'evenodd', d: 'M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z', clipRule: 'evenodd' })
              ),
              React.createElement('div', null,
                React.createElement('h4', { className: 'font-semibold text-slate-900' }, 'Source Integration'),
                React.createElement('p', { className: 'text-slate-600 text-sm' }, 'Upload PDFs, documents, or provide URLs for comprehensive analysis')
              )
            )
          ),
          React.createElement('div', { className: 'space-y-4' },
            React.createElement('div', { className: 'flex items-start' },
              React.createElement('svg', { className: 'w-6 h-6 text-green-500 mr-3 mt-1', fill: 'currentColor', viewBox: '0 0 20 20' },
                React.createElement('path', { fillRule: 'evenodd', d: 'M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z', clipRule: 'evenodd' })
              ),
              React.createElement('div', null,
                React.createElement('h4', { className: 'font-semibold text-slate-900' }, 'Detailed Methodology'),
                React.createElement('p', { className: 'text-slate-600 text-sm' }, 'See exactly how each AI model contributed to the final consensus')
              )
            ),
            React.createElement('div', { className: 'flex items-start' },
              React.createElement('svg', { className: 'w-6 h-6 text-green-500 mr-3 mt-1', fill: 'currentColor', viewBox: '0 0 20 20' },
                React.createElement('path', { fillRule: 'evenodd', d: 'M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z', clipRule: 'evenodd' })
              ),
              React.createElement('div', null,
                React.createElement('h4', { className: 'font-semibold text-slate-900' }, 'Report History'),
                React.createElement('p', { className: 'text-slate-600 text-sm' }, 'Access all your past analyses and track your research over time')
              )
            ),
            React.createElement('div', { className: 'flex items-start' },
              React.createElement('svg', { className: 'w-6 h-6 text-green-500 mr-3 mt-1', fill: 'currentColor', viewBox: '0 0 20 20' },
                React.createElement('path', { fillRule: 'evenodd', d: 'M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z', clipRule: 'evenodd' })
              ),
              React.createElement('div', null,
                React.createElement('h4', { className: 'font-semibold text-slate-900' }, 'Fast & Reliable'),
                React.createElement('p', { className: 'text-slate-600 text-sm' }, 'Get comprehensive analysis in 60-90 seconds with 99.9% uptime')
              )
            )
          )
        )
      )
    ),

    // Use Cases Section
    React.createElement('section', { className: 'mb-20' },
      React.createElement('div', { className: 'text-center mb-16' },
        React.createElement('h2', { className: 'text-4xl font-bold text-slate-900 mb-4' }, 'Perfect For'),
        React.createElement('p', { className: 'text-xl text-slate-600 max-w-2xl mx-auto' },
          'Professionals who need unbiased, comprehensive analysis for critical decisions'
        )
      ),
      
      React.createElement('div', { className: 'grid md:grid-cols-3 gap-8' },
        React.createElement('div', { className: 'bg-white p-6 rounded-xl shadow-sm border border-slate-200' },
          React.createElement('div', { className: 'w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4' },
            React.createElement('svg', { className: 'w-6 h-6 text-blue-600', fill: 'none', stroke: 'currentColor', viewBox: '0 0 24 24' },
              React.createElement('path', { strokeLinecap: 'round', strokeLinejoin: 'round', strokeWidth: 2, d: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' })
            )
          ),
          React.createElement('h3', { className: 'text-xl font-semibold text-slate-900 mb-3' }, 'Researchers & Analysts'),
          React.createElement('p', { className: 'text-slate-600 mb-4' },
            'Get balanced perspectives on complex topics, validate hypotheses, and identify research gaps.'
          ),
          React.createElement('ul', { className: 'text-sm text-slate-500 space-y-1' },
            React.createElement('li', null, '• Literature reviews'),
            React.createElement('li', null, '• Market analysis'),
            React.createElement('li', null, '• Policy research')
          )
        ),
        
        React.createElement('div', { className: 'bg-white p-6 rounded-xl shadow-sm border border-slate-200' },
          React.createElement('div', { className: 'w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4' },
            React.createElement('svg', { className: 'w-6 h-6 text-green-600', fill: 'none', stroke: 'currentColor', viewBox: '0 0 24 24' },
              React.createElement('path', { strokeLinecap: 'round', strokeLinejoin: 'round', strokeWidth: 2, d: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4' })
            )
          ),
          React.createElement('h3', { className: 'text-xl font-semibold text-slate-900 mb-3' }, 'Business Leaders'),
          React.createElement('p', { className: 'text-slate-600 mb-4' },
            'Make informed strategic decisions with comprehensive analysis of market trends and opportunities.'
          ),
          React.createElement('ul', { className: 'text-sm text-slate-500 space-y-1' },
            React.createElement('li', null, '• Strategic planning'),
            React.createElement('li', null, '• Investment decisions'),
            React.createElement('li', null, '• Risk assessment')
          )
        ),
        
        React.createElement('div', { className: 'bg-white p-6 rounded-xl shadow-sm border border-slate-200' },
          React.createElement('div', { className: 'w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4' },
            React.createElement('svg', { className: 'w-6 h-6 text-purple-600', fill: 'none', stroke: 'currentColor', viewBox: '0 0 24 24' },
              React.createElement('path', { strokeLinecap: 'round', strokeLinejoin: 'round', strokeWidth: 2, d: 'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253' })
            )
          ),
          React.createElement('h3', { className: 'text-xl font-semibold text-slate-900 mb-3' }, 'Consultants & Advisors'),
          React.createElement('p', { className: 'text-slate-600 mb-4' },
            'Deliver comprehensive, unbiased analysis to clients with professional reports and clear methodology.'
          ),
          React.createElement('ul', { className: 'text-sm text-slate-500 space-y-1' },
            React.createElement('li', null, '• Client presentations'),
            React.createElement('li', null, '• Due diligence'),
            React.createElement('li', null, '• Expert opinions')
          )
        )
      )
    ),

    // CTA Section
    React.createElement('section', { className: 'text-center bg-gradient-to-r from-indigo-600 to-violet-600 rounded-2xl p-12 text-white' },
      React.createElement('h2', { className: 'text-3xl font-bold mb-4' }, 'Ready to Get Started?'),
      React.createElement('p', { className: 'text-xl mb-8 opacity-90' },
        'Join professionals who trust Consensus.AI for unbiased, comprehensive analysis'
      ),
      React.createElement('button', {
        onClick: onGetStarted,
        className: 'bg-white text-indigo-600 px-8 py-3 rounded-lg hover:bg-gray-100 transition-colors duration-200 font-medium text-lg'
      }, 'Start Your Free Analysis'),
      React.createElement('p', { className: 'text-sm mt-4 opacity-75' },
        'No credit card required • Get started in 30 seconds'
      )
    )
  );
}

export default LandingPage;
