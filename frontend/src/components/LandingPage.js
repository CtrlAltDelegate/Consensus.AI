import React from 'react';
import UseCasesSection from './UseCasesSection';

function LandingPage({ onGetStarted, onLearnMore }) {
  return React.createElement('main', { className: 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20' },
    // Hero Section — one core message
    React.createElement('div', { className: 'text-center mb-20' },
      React.createElement('h1', { className: 'text-4xl sm:text-5xl font-bold text-slate-900 mb-6 leading-tight' },
        'Stop relying on a single AI\'s opinion.'
      ),
      React.createElement('p', { className: 'text-xl text-slate-600 mb-4 max-w-3xl mx-auto' },
        'Consensus.AI combines GPT-4o, Claude, Gemini, and Cohere into one balanced report—so you get nuance, not one model\'s bias.'
      ),
      React.createElement('p', { className: 'text-lg text-slate-500 mb-8 max-w-2xl mx-auto' },
        'Built for researchers, consultants, and strategy professionals who need defensible, multi-perspective analysis.'
      ),
      React.createElement('div', { className: 'flex flex-wrap items-center justify-center gap-3 mb-12' },
        React.createElement('button', {
          onClick: onGetStarted,
          className: 'bg-indigo-600 text-white px-8 py-3 rounded-lg hover:bg-indigo-700 transition-colors duration-200 font-medium text-lg'
        }, 'Start Free Analysis'),
        React.createElement('button', {
          onClick: () => document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' }),
          className: 'text-indigo-600 px-8 py-3 rounded-lg border border-indigo-200 hover:bg-indigo-50 transition-colors duration-200 font-medium text-lg'
        }, 'View Pricing'),
        React.createElement('button', {
          onClick: () => document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' }),
          className: 'text-slate-600 px-8 py-3 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors duration-200 font-medium text-lg'
        }, 'How It Works')
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

    // Pricing Section — prominent with Basic vs Pro comparison
    React.createElement('section', { id: 'pricing', className: 'mb-20 scroll-mt-8' },
      React.createElement('div', { className: 'text-center mb-12' },
        React.createElement('h2', { className: 'text-4xl font-bold text-slate-900 mb-4' }, 'Simple, transparent pricing'),
        React.createElement('p', { className: 'text-xl text-slate-600 max-w-2xl mx-auto' },
          'Choose the plan that fits your workflow. Both include full 4-LLM consensus and PDF reports.'
        )
      ),
      React.createElement('div', { className: 'overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm' },
        React.createElement('table', { className: 'w-full min-w-[600px] text-left' },
          React.createElement('thead', { className: 'bg-slate-50 border-b border-slate-200' },
            React.createElement('tr', null,
              React.createElement('th', { className: 'px-6 py-4 text-sm font-semibold text-slate-900' }, 'Feature'),
              React.createElement('th', { className: 'px-6 py-4 text-sm font-semibold text-slate-900 text-center' }, 'Starter'),
              React.createElement('th', { className: 'px-6 py-4 text-sm font-semibold text-indigo-700 text-center bg-indigo-50/50' }, 'Professional')
            )
          ),
          React.createElement('tbody', { className: 'divide-y divide-slate-100' },
            React.createElement('tr', { className: 'bg-white' },
              React.createElement('td', { className: 'px-6 py-3 text-slate-700' }, 'Price'),
              React.createElement('td', { className: 'px-6 py-3 text-center font-medium text-slate-900' }, '$29/month'),
              React.createElement('td', { className: 'px-6 py-3 text-center font-medium text-indigo-700 bg-indigo-50/30' }, '$79/month')
            ),
            React.createElement('tr', { className: 'bg-slate-50/30' },
              React.createElement('td', { className: 'px-6 py-3 text-slate-700' }, 'Reports included'),
              React.createElement('td', { className: 'px-6 py-3 text-center text-slate-900' }, '3 per month'),
              React.createElement('td', { className: 'px-6 py-3 text-center text-slate-900 bg-indigo-50/20' }, '10 per month')
            ),
            React.createElement('tr', { className: 'bg-white' },
              React.createElement('td', { className: 'px-6 py-3 text-slate-700' }, 'Overage'),
              React.createElement('td', { className: 'px-6 py-3 text-center text-slate-600' }, '$12/report'),
              React.createElement('td', { className: 'px-6 py-3 text-center text-slate-600 bg-indigo-50/30' }, '$10/report')
            ),
            React.createElement('tr', { className: 'bg-slate-50/30' },
              React.createElement('td', { className: 'px-6 py-3 text-slate-700' }, '4-LLM consensus analysis'),
              React.createElement('td', { className: 'px-6 py-3 text-center' }, '\u2713'),
              React.createElement('td', { className: 'px-6 py-3 text-center bg-indigo-50/20' }, '\u2713')
            ),
            React.createElement('tr', { className: 'bg-white' },
              React.createElement('td', { className: 'px-6 py-3 text-slate-700' }, 'Professional PDF reports'),
              React.createElement('td', { className: 'px-6 py-3 text-center' }, '\u2713'),
              React.createElement('td', { className: 'px-6 py-3 text-center bg-indigo-50/30' }, '\u2713')
            ),
            React.createElement('tr', { className: 'bg-slate-50/30' },
              React.createElement('td', { className: 'px-6 py-3 text-slate-700' }, 'Report history & storage'),
              React.createElement('td', { className: 'px-6 py-3 text-center text-slate-600' }, 'Included'),
              React.createElement('td', { className: 'px-6 py-3 text-center text-slate-600 bg-indigo-50/20' }, 'Unlimited')
            ),
            React.createElement('tr', { className: 'bg-white' },
              React.createElement('td', { className: 'px-6 py-3 text-slate-700' }, 'Support'),
              React.createElement('td', { className: 'px-6 py-3 text-center text-slate-600' }, 'Priority email'),
              React.createElement('td', { className: 'px-6 py-3 text-center text-slate-600 bg-indigo-50/30' }, 'Priority + phone')
            ),
            React.createElement('tr', { className: 'bg-slate-50/30' },
              React.createElement('td', { className: 'px-6 py-3 text-slate-700' }, 'Custom report branding'),
              React.createElement('td', { className: 'px-6 py-3 text-center text-slate-400' }, '—'),
              React.createElement('td', { className: 'px-6 py-3 text-center bg-indigo-50/20' }, '\u2713')
            )
          )
        )
      ),
      React.createElement('div', { className: 'mt-6 flex flex-wrap justify-center gap-4' },
        React.createElement('button', { onClick: onGetStarted, className: 'bg-indigo-600 text-white px-6 py-2.5 rounded-lg hover:bg-indigo-700 font-medium' }, 'Get started'),
        React.createElement('button', { onClick: () => { window.location.hash = '#/pricing'; }, className: 'text-indigo-600 border border-indigo-200 px-6 py-2.5 rounded-lg hover:bg-indigo-50 font-medium' }, 'See all plans')
      )
    ),

    React.createElement(UseCasesSection),

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
