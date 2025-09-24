import React, { useState, useEffect } from 'react';

function WelcomeFlow({ isVisible, onClose, onComplete, user }) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  const steps = [
    {
      id: 'welcome',
      title: `Welcome to Consensus.AI${user?.profile?.firstName ? `, ${user.profile.firstName}` : ''}!`,
      subtitle: 'Let\'s get you started with AI-powered consensus analysis',
      content: React.createElement('div', { className: 'text-center' },
        React.createElement('div', { className: 'w-24 h-24 bg-gradient-to-br from-indigo-500 to-violet-500 rounded-full flex items-center justify-center mx-auto mb-6' },
          React.createElement('svg', { className: 'w-12 h-12 text-white', fill: 'none', stroke: 'currentColor', viewBox: '0 0 24 24' },
            React.createElement('path', { strokeLinecap: 'round', strokeLinejoin: 'round', strokeWidth: 2, d: 'M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z' })
          )
        ),
        React.createElement('p', { className: 'text-lg text-slate-600 mb-6' },
          'You\'re about to experience the power of 4-LLM consensus analysis. Let\'s show you how it works!'
        ),
        React.createElement('div', { className: 'bg-indigo-50 rounded-lg p-4' },
          React.createElement('h4', { className: 'font-semibold text-indigo-900 mb-2' }, 'What makes us different?'),
          React.createElement('p', { className: 'text-sm text-indigo-700' },
            'Instead of relying on a single AI model, we combine insights from GPT-4, Claude, Gemini, and Cohere to give you balanced, comprehensive analysis.'
          )
        )
      ),
      icon: '👋'
    },
    {
      id: 'how-it-works',
      title: 'How Consensus Analysis Works',
      subtitle: 'Our 3-phase process ensures unbiased, comprehensive results',
      content: React.createElement('div', { className: 'space-y-6' },
        React.createElement('div', { className: 'flex items-start space-x-4' },
          React.createElement('div', { className: 'w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0' },
            React.createElement('span', { className: 'text-blue-600 font-bold text-sm' }, '1')
          ),
          React.createElement('div', null,
            React.createElement('h4', { className: 'font-semibold text-slate-900 mb-1' }, 'Independent Analysis'),
            React.createElement('p', { className: 'text-sm text-slate-600' }, 'GPT-4, Claude, and Gemini each analyze your topic separately, without seeing each other\'s work.')
          )
        ),
        React.createElement('div', { className: 'flex items-start space-x-4' },
          React.createElement('div', { className: 'w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center flex-shrink-0' },
            React.createElement('span', { className: 'text-indigo-600 font-bold text-sm' }, '2')
          ),
          React.createElement('div', null,
            React.createElement('h4', { className: 'font-semibold text-slate-900 mb-1' }, 'Peer Review'),
            React.createElement('p', { className: 'text-sm text-slate-600' }, 'Each AI model reviews and critiques the others\' analyses, identifying strengths and weaknesses.')
          )
        ),
        React.createElement('div', { className: 'flex items-start space-x-4' },
          React.createElement('div', { className: 'w-8 h-8 bg-violet-100 rounded-full flex items-center justify-center flex-shrink-0' },
            React.createElement('span', { className: 'text-violet-600 font-bold text-sm' }, '3')
          ),
          React.createElement('div', null,
            React.createElement('h4', { className: 'font-semibold text-slate-900 mb-1' }, 'Final Consensus'),
            React.createElement('p', { className: 'text-sm text-slate-600' }, 'Cohere synthesizes all perspectives into a balanced final report with confidence scores.')
          )
        ),
        React.createElement('div', { className: 'bg-green-50 rounded-lg p-4 mt-6' },
          React.createElement('div', { className: 'flex items-center mb-2' },
            React.createElement('svg', { className: 'w-5 h-5 text-green-500 mr-2', fill: 'currentColor', viewBox: '0 0 20 20' },
              React.createElement('path', { fillRule: 'evenodd', d: 'M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z', clipRule: 'evenodd' })
            ),
            React.createElement('span', { className: 'font-semibold text-green-900' }, 'Result: Unbiased Analysis')
          ),
          React.createElement('p', { className: 'text-sm text-green-700' },
            'You get a comprehensive report that combines the best insights from all models, with clear confidence scores.'
          )
        )
      ),
      icon: '⚙️'
    },
    {
      id: 'dashboard-tour',
      title: 'Your Dashboard Overview',
      subtitle: 'Everything you need is right at your fingertips',
      content: React.createElement('div', { className: 'space-y-4' },
        React.createElement('div', { className: 'grid grid-cols-2 gap-4' },
          React.createElement('div', { className: 'bg-blue-50 rounded-lg p-4' },
            React.createElement('div', { className: 'w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center mb-3' },
              React.createElement('svg', { className: 'w-4 h-4 text-blue-600', fill: 'none', stroke: 'currentColor', viewBox: '0 0 24 24' },
                React.createElement('path', { strokeLinecap: 'round', strokeLinejoin: 'round', strokeWidth: 2, d: 'M12 6v6m0 0v6m0-6h6m-6 0H6' })
              )
            ),
            React.createElement('h4', { className: 'font-semibold text-blue-900 text-sm mb-1' }, 'New Analysis'),
            React.createElement('p', { className: 'text-xs text-blue-700' }, 'Start a new consensus analysis')
          ),
          React.createElement('div', { className: 'bg-green-50 rounded-lg p-4' },
            React.createElement('div', { className: 'w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center mb-3' },
              React.createElement('svg', { className: 'w-4 h-4 text-green-600', fill: 'none', stroke: 'currentColor', viewBox: '0 0 24 24' },
                React.createElement('path', { strokeLinecap: 'round', strokeLinejoin: 'round', strokeWidth: 2, d: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' })
              )
            ),
            React.createElement('h4', { className: 'font-semibold text-green-900 text-sm mb-1' }, 'Past Reports'),
            React.createElement('p', { className: 'text-xs text-green-700' }, 'Access your analysis history')
          )
        ),
        React.createElement('div', { className: 'bg-slate-50 rounded-lg p-4' },
          React.createElement('h4', { className: 'font-semibold text-slate-900 mb-2' }, 'Navigation Tips'),
          React.createElement('ul', { className: 'text-sm text-slate-600 space-y-1' },
            React.createElement('li', null, '• Use the sidebar to switch between sections'),
            React.createElement('li', null, '• Your profile and billing are in the top-right menu'),
            React.createElement('li', null, '• All reports are automatically saved to your account')
          )
        )
      ),
      icon: '🏠'
    },
    {
      id: 'first-analysis',
      title: 'Ready for Your First Analysis?',
      subtitle: 'Let\'s create your first consensus report together',
      content: React.createElement('div', { className: 'text-center' },
        React.createElement('div', { className: 'w-20 h-20 bg-gradient-to-br from-green-400 to-blue-500 rounded-full flex items-center justify-center mx-auto mb-6' },
          React.createElement('svg', { className: 'w-10 h-10 text-white', fill: 'none', stroke: 'currentColor', viewBox: '0 0 24 24' },
            React.createElement('path', { strokeLinecap: 'round', strokeLinejoin: 'round', strokeWidth: 2, d: 'M13 10V3L4 14h7v7l9-11h-7z' })
          )
        ),
        React.createElement('p', { className: 'text-lg text-slate-600 mb-6' },
          'You\'re all set! Click "Start My First Analysis" to begin, or explore the dashboard on your own.'
        ),
        React.createElement('div', { className: 'bg-yellow-50 rounded-lg p-4 mb-6' },
          React.createElement('h4', { className: 'font-semibold text-yellow-900 mb-2' }, '💡 Pro Tip'),
          React.createElement('p', { className: 'text-sm text-yellow-800' },
            'For best results, provide a clear, specific topic and include relevant sources or documents. The more context you give, the better the analysis!'
          )
        ),
        React.createElement('div', { className: 'flex flex-col sm:flex-row gap-3 justify-center' },
          React.createElement('button', {
            onClick: () => {
              onComplete('start-analysis');
              onClose();
            },
            className: 'bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 transition-colors font-medium'
          }, 'Start My First Analysis'),
          React.createElement('button', {
            onClick: () => {
              onComplete('explore');
              onClose();
            },
            className: 'bg-slate-100 text-slate-700 px-6 py-2 rounded-lg hover:bg-slate-200 transition-colors font-medium'
          }, 'Explore Dashboard')
        )
      ),
      icon: '🚀'
    }
  ];

  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      setIsAnimating(true);
      setTimeout(() => {
        setCurrentStep(currentStep + 1);
        setIsAnimating(false);
      }, 150);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setIsAnimating(true);
      setTimeout(() => {
        setCurrentStep(currentStep - 1);
        setIsAnimating(false);
      }, 150);
    }
  };

  const skipTutorial = () => {
    onComplete('skip');
    onClose();
  };

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyPress = (e) => {
      if (!isVisible) return;
      
      if (e.key === 'ArrowRight' || e.key === 'Enter') {
        if (currentStep < steps.length - 1) {
          nextStep();
        }
      } else if (e.key === 'ArrowLeft') {
        prevStep();
      } else if (e.key === 'Escape') {
        skipTutorial();
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [isVisible, currentStep]);

  if (!isVisible) return null;

  const currentStepData = steps[currentStep];

  return React.createElement('div', { 
    className: 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4',
    onClick: (e) => e.target === e.currentTarget && skipTutorial()
  },
    React.createElement('div', { 
      className: `bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden ${isAnimating ? 'opacity-50' : 'opacity-100'} transition-opacity duration-150`
    },
      // Header
      React.createElement('div', { className: 'bg-gradient-to-r from-indigo-500 to-violet-500 text-white p-6' },
        React.createElement('div', { className: 'flex items-center justify-between mb-4' },
          React.createElement('div', { className: 'flex items-center space-x-3' },
            React.createElement('span', { className: 'text-2xl' }, currentStepData.icon),
            React.createElement('div', null,
              React.createElement('h2', { className: 'text-xl font-bold' }, currentStepData.title),
              React.createElement('p', { className: 'text-indigo-100 text-sm' }, currentStepData.subtitle)
            )
          ),
          React.createElement('button', {
            onClick: skipTutorial,
            className: 'text-indigo-200 hover:text-white transition-colors'
          },
            React.createElement('svg', { className: 'w-6 h-6', fill: 'none', stroke: 'currentColor', viewBox: '0 0 24 24' },
              React.createElement('path', { strokeLinecap: 'round', strokeLinejoin: 'round', strokeWidth: 2, d: 'M6 18L18 6M6 6l12 12' })
            )
          )
        ),
        
        // Progress bar
        React.createElement('div', { className: 'w-full bg-indigo-400 rounded-full h-2' },
          React.createElement('div', { 
            className: 'bg-white h-2 rounded-full transition-all duration-300',
            style: { width: `${((currentStep + 1) / steps.length) * 100}%` }
          })
        ),
        React.createElement('div', { className: 'flex justify-between text-xs text-indigo-100 mt-2' },
          React.createElement('span', null, `Step ${currentStep + 1} of ${steps.length}`),
          React.createElement('span', null, `${Math.round(((currentStep + 1) / steps.length) * 100)}% Complete`)
        )
      ),

      // Content
      React.createElement('div', { className: 'p-6 overflow-y-auto max-h-96' },
        currentStepData.content
      ),

      // Footer
      React.createElement('div', { className: 'bg-slate-50 px-6 py-4 flex items-center justify-between' },
        React.createElement('div', { className: 'flex items-center space-x-4' },
          React.createElement('button', {
            onClick: prevStep,
            disabled: currentStep === 0,
            className: `text-slate-600 hover:text-slate-900 disabled:opacity-50 disabled:cursor-not-allowed transition-colors ${currentStep === 0 ? 'invisible' : ''}`
          },
            React.createElement('div', { className: 'flex items-center' },
              React.createElement('svg', { className: 'w-4 h-4 mr-1', fill: 'none', stroke: 'currentColor', viewBox: '0 0 24 24' },
                React.createElement('path', { strokeLinecap: 'round', strokeLinejoin: 'round', strokeWidth: 2, d: 'M15 19l-7-7 7-7' })
              ),
              'Previous'
            )
          ),
          React.createElement('button', {
            onClick: skipTutorial,
            className: 'text-slate-500 hover:text-slate-700 text-sm transition-colors'
          }, 'Skip Tutorial')
        ),

        React.createElement('div', { className: 'flex items-center space-x-3' },
          // Step indicators
          React.createElement('div', { className: 'flex space-x-2' },
            ...steps.map((_, index) =>
              React.createElement('div', {
                key: index,
                className: `w-2 h-2 rounded-full transition-colors ${
                  index === currentStep ? 'bg-indigo-500' : 
                  index < currentStep ? 'bg-indigo-300' : 'bg-slate-300'
                }`
              })
            )
          ),

          // Next button
          currentStep < steps.length - 1 ? (
            React.createElement('button', {
              onClick: nextStep,
              className: 'bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors font-medium'
            },
              React.createElement('div', { className: 'flex items-center' },
                'Next',
                React.createElement('svg', { className: 'w-4 h-4 ml-1', fill: 'none', stroke: 'currentColor', viewBox: '0 0 24 24' },
                  React.createElement('path', { strokeLinecap: 'round', strokeLinejoin: 'round', strokeWidth: 2, d: 'M9 5l7 7-7 7' })
                )
              )
            )
          ) : (
            React.createElement('button', {
              onClick: () => {
                onComplete('complete');
                onClose();
              },
              className: 'bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors font-medium'
            }, 'Get Started!')
          )
        )
      ),

      // Keyboard hints
      React.createElement('div', { className: 'absolute bottom-2 left-6 text-xs text-slate-400' },
        'Use ← → arrow keys or ESC to skip'
      )
    )
  );
}

export default WelcomeFlow;
