import React, { useState, useEffect } from 'react';

function ProgressLoadingModal({ isVisible, onClose, stages, currentStage, estimatedTime }) {
  const [progress, setProgress] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState(estimatedTime || 90);
  const [startTime, setStartTime] = useState(Date.now());

  // Default stages if none provided
  const defaultStages = [
    {
      id: 'phase1',
      title: 'Independent Drafting',
      description: 'Generating initial responses from 4 AI models...',
      duration: 30,
      icon: '🤖'
    },
    {
      id: 'phase2', 
      title: 'Peer Review',
      description: 'Cross-reviewing and analyzing initial drafts...',
      duration: 25,
      icon: '🔍'
    },
    {
      id: 'phase3',
      title: 'Final Arbitration',
      description: 'Synthesizing consensus from all perspectives...',
      duration: 35,
      icon: '⚖️'
    }
  ];

  const processStages = stages || defaultStages;
  const currentStageIndex = processStages.findIndex(stage => stage.id === currentStage) || 0;

  // Update progress based on current stage
  useEffect(() => {
    if (isVisible) {
      const stageProgress = (currentStageIndex / processStages.length) * 100;
      setProgress(stageProgress);
      setStartTime(Date.now());
    }
  }, [currentStage, isVisible, currentStageIndex, processStages.length]);

  // Update time remaining
  useEffect(() => {
    if (!isVisible) return;

    const interval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startTime) / 1000);
      const remaining = Math.max(0, (estimatedTime || 90) - elapsed);
      setTimeRemaining(remaining);
    }, 1000);

    return () => clearInterval(interval);
  }, [isVisible, startTime, estimatedTime]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!isVisible) return null;

  return React.createElement('div', { className: 'fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4' },
    React.createElement('div', { className: 'bg-white rounded-xl shadow-2xl max-w-lg w-full overflow-hidden' },
      
      // Header
      React.createElement('div', { className: 'bg-gradient-to-r from-indigo-50 to-violet-50 px-6 py-8 text-center' },
        React.createElement('div', { className: 'w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4' },
          React.createElement('div', { className: 'w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin' })
        ),
        React.createElement('h2', { className: 'text-xl font-bold text-slate-900 mb-2' }, 'Generating Consensus Report'),
        React.createElement('p', { className: 'text-slate-600 text-sm' }, 
          'Our AI models are working together to analyze your question'
        ),
        React.createElement('div', { className: 'mt-4 flex items-center justify-center space-x-4 text-sm' },
          React.createElement('span', { className: 'text-slate-500' }, 'Time remaining:'),
          React.createElement('span', { className: 'font-mono font-semibold text-indigo-600' }, formatTime(timeRemaining))
        )
      ),

      // Progress Bar
      React.createElement('div', { className: 'px-6 py-4 bg-slate-50' },
        React.createElement('div', { className: 'flex justify-between text-xs text-slate-600 mb-2' },
          React.createElement('span', null, `Step ${currentStageIndex + 1} of ${processStages.length}`),
          React.createElement('span', null, `${Math.round(progress)}% complete`)
        ),
        React.createElement('div', { className: 'w-full bg-slate-200 rounded-full h-2' },
          React.createElement('div', { 
            className: 'h-2 bg-gradient-to-r from-indigo-500 to-violet-500 rounded-full transition-all duration-1000 ease-out',
            style: { width: `${progress}%` }
          })
        )
      ),

      // Stages List
      React.createElement('div', { className: 'px-6 py-6' },
        React.createElement('div', { className: 'space-y-4' },
          ...processStages.map((stage, index) => {
            const isCompleted = index < currentStageIndex;
            const isCurrent = index === currentStageIndex;
            const isPending = index > currentStageIndex;

            return React.createElement('div', { 
              key: stage.id, 
              className: `flex items-start space-x-4 ${isCurrent ? 'opacity-100' : isPending ? 'opacity-50' : 'opacity-75'}`
            },
              // Icon/Status
              React.createElement('div', { 
                className: `w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                  isCompleted ? 'bg-emerald-100 text-emerald-600' :
                  isCurrent ? 'bg-indigo-100 text-indigo-600' :
                  'bg-slate-100 text-slate-400'
                }`
              },
                isCompleted ? React.createElement('span', { className: 'text-lg' }, '✓') :
                isCurrent ? React.createElement('div', { className: 'w-4 h-4 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin' }) :
                React.createElement('span', { className: 'text-lg' }, stage.icon)
              ),
              
              // Content
              React.createElement('div', { className: 'flex-1 min-w-0' },
                React.createElement('div', { className: 'flex items-center justify-between' },
                  React.createElement('h3', { 
                    className: `font-semibold ${
                      isCompleted ? 'text-emerald-700' :
                      isCurrent ? 'text-indigo-700' :
                      'text-slate-500'
                    }`
                  }, stage.title),
                  React.createElement('span', { 
                    className: `text-xs px-2 py-1 rounded-full ${
                      isCompleted ? 'bg-emerald-100 text-emerald-700' :
                      isCurrent ? 'bg-indigo-100 text-indigo-700' :
                      'bg-slate-100 text-slate-500'
                    }`
                  }, 
                    isCompleted ? 'Complete' :
                    isCurrent ? 'In Progress' :
                    'Pending'
                  )
                ),
                React.createElement('p', { 
                  className: `text-sm mt-1 ${
                    isCurrent ? 'text-slate-700' : 'text-slate-500'
                  }`
                }, stage.description),
                
                // Mini progress for current stage
                isCurrent && React.createElement('div', { className: 'mt-2' },
                  React.createElement('div', { className: 'w-full bg-slate-200 rounded-full h-1' },
                    React.createElement('div', { 
                      className: 'h-1 bg-indigo-500 rounded-full transition-all duration-500 ease-out animate-pulse',
                      style: { width: '60%' }
                    })
                  )
                )
              )
            );
          })
        )
      ),

      // AI Models Working
      React.createElement('div', { className: 'px-6 py-4 bg-slate-50 border-t border-slate-200' },
        React.createElement('div', { className: 'flex items-center justify-between' },
          React.createElement('div', null,
            React.createElement('h4', { className: 'text-sm font-semibold text-slate-700 mb-1' }, 'AI Models Active'),
            React.createElement('div', { className: 'flex items-center space-x-2' },
              ['GPT-4o', 'Claude 3.5', 'Gemini 1.5', 'Command R+'].map((model, index) =>
                React.createElement('span', { 
                  key: model,
                  className: `text-xs px-2 py-1 rounded-full transition-all duration-300 ${
                    index <= currentStageIndex ? 
                    'bg-emerald-100 text-emerald-700' : 
                    'bg-slate-200 text-slate-500'
                  }`
                }, model)
              )
            )
          ),
          React.createElement('div', { className: 'text-right' },
            React.createElement('div', { className: 'text-sm font-semibold text-slate-700' }, '4 Models'),
            React.createElement('div', { className: 'text-xs text-slate-500' }, 'Working in parallel')
          )
        )
      ),

      // Quality Indicators
      React.createElement('div', { className: 'px-6 py-4 bg-gradient-to-r from-indigo-50 to-violet-50' },
        React.createElement('div', { className: 'grid grid-cols-3 gap-4 text-center' },
          React.createElement('div', null,
            React.createElement('div', { className: 'text-lg font-bold text-indigo-600' }, '~8-12K'),
            React.createElement('div', { className: 'text-xs text-slate-600' }, 'Tokens')
          ),
          React.createElement('div', null,
            React.createElement('div', { className: 'text-lg font-bold text-indigo-600' }, '3'),
            React.createElement('div', { className: 'text-xs text-slate-600' }, 'Phases')
          ),
          React.createElement('div', null,
            React.createElement('div', { className: 'text-lg font-bold text-indigo-600' }, '85%+'),
            React.createElement('div', { className: 'text-xs text-slate-600' }, 'Accuracy')
          )
        )
      ),

      // Cancel Button (Optional)
      onClose && React.createElement('div', { className: 'px-6 py-4 border-t border-slate-200 text-center' },
        React.createElement('button', {
          onClick: onClose,
          className: 'text-sm text-slate-500 hover:text-slate-700 transition-colors duration-200'
        }, 'Cancel Generation')
      )
    )
  );
}

// Hook for using the progress modal
export const useProgressModal = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [currentStage, setCurrentStage] = useState('phase1');
  const [estimatedTime, setEstimatedTime] = useState(90);

  const showProgress = (initialStage = 'phase1', duration = 90) => {
    setCurrentStage(initialStage);
    setEstimatedTime(duration);
    setIsVisible(true);
  };

  const updateStage = (stage) => {
    setCurrentStage(stage);
  };

  const hideProgress = () => {
    setIsVisible(false);
  };

  return {
    isVisible,
    currentStage,
    estimatedTime,
    showProgress,
    updateStage,
    hideProgress
  };
};

export default ProgressLoadingModal; 