import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { apiHelpers } from '../config/api';

function EnhancedConsensusForm() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [result, setResult] = useState(null);
  const [sources, setSources] = useState(['']);
  
  const { register, handleSubmit, watch, formState: { errors } } = useForm({
    defaultValues: {
      topic: '',
      sources: [''],
      priority: 'standard',
      includeMetadata: true
    }
  });

  const addSource = () => {
    setSources([...sources, '']);
  };

  const removeSource = (index) => {
    if (sources.length > 1) {
      const newSources = sources.filter((_, i) => i !== index);
      setSources(newSources);
    }
  };

  const onSubmit = async (data) => {
    setIsGenerating(true);
    try {
      console.log('🚀 Starting consensus generation...', data);
      
      // Prepare the request data
      const requestData = {
        topic: data.topic,
        sources: sources.filter(source => source && source.trim() !== ''),
        options: {
          includeMetadata: data.includeMetadata || true,
          generatePdf: false,
          emailReport: false,
          priority: data.priority
        }
      };
      
      // Make real API call to Railway backend
      const response = await apiHelpers.generateConsensus(requestData);
      console.log('✅ Consensus generated successfully:', response.data);
      
      // Set the real result from the 4-LLM system
      setResult({
        consensus: response.data.consensus,
        confidence: response.data.confidence,
        totalTokens: response.data.metadata?.totalTokens || 0,
        llmsUsed: response.data.metadata?.llmsUsed || [],
        phases: response.data.phases,
        generatedAt: new Date().toISOString(),
        title: data.topic.substring(0, 100) + (data.topic.length > 100 ? '...' : '')
      });
      
    } catch (error) {
      console.error('❌ Error generating consensus:', error);
      
      // Show user-friendly error
      setResult({
        consensus: `Error: ${error.response?.data?.message || error.message || 'Failed to generate consensus. Please try again.'}`,
        confidence: 0,
        totalTokens: 0,
        error: true
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const estimatedTokens = watch('topic')?.length ? Math.ceil((watch('topic').length / 4) * 12) : 8000;
  const estimatedCost = (estimatedTokens * 0.001).toFixed(3);

  return React.createElement('div', { className: 'min-h-screen bg-slate-50/50' },
    React.createElement('div', { className: 'max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8' },
      
      // Header Section
      React.createElement('div', { className: 'mb-10' },
        React.createElement('div', { className: 'text-center' },
          React.createElement('h1', { className: 'text-3xl font-bold text-slate-900 tracking-tight mb-3' }, 'Generate Consensus Report'),
          React.createElement('p', { className: 'text-lg text-slate-600 max-w-2xl mx-auto' }, 
            'Submit complex questions and receive structured analysis from our 4-LLM consensus engine'
          )
        )
      ),

      // Main Form Card
      React.createElement('div', { className: 'bg-white rounded-xl border border-slate-200/60 shadow-sm' },
        React.createElement('form', { onSubmit: handleSubmit(onSubmit), className: 'p-8' },
          
          // Question/Topic Section
          React.createElement('div', { className: 'mb-8' },
            React.createElement('div', { className: 'flex items-center justify-between mb-4' },
              React.createElement('label', { htmlFor: 'topic', className: 'text-lg font-semibold text-slate-900' },
                'Your Question or Research Topic'
              ),
              React.createElement('span', { className: 'text-sm text-slate-500' }, 'Required')
            ),
            React.createElement('div', { className: 'relative' },
              React.createElement('textarea', {
                ...register('topic', { 
                  required: 'Please enter your question or topic',
                  minLength: { value: 10, message: 'Please provide more detail (minimum 10 characters)' }
                }),
                id: 'topic',
                rows: 4,
                className: `w-full px-4 py-3 border rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none transition-all duration-200 ${
                  errors.topic ? 'border-red-300 bg-red-50' : 'border-slate-200 hover:border-slate-300'
                }`,
                placeholder: 'e.g., "What are the ethical implications of AI in healthcare decision-making?" or "Analyze the economic impact of remote work policies on urban development"'
              }),
              React.createElement('div', { className: 'absolute bottom-3 right-3 text-xs text-slate-400' },
                `${watch('topic')?.length || 0} characters`
              )
            ),
            errors.topic && React.createElement('p', { className: 'mt-2 text-sm text-red-600' }, errors.topic.message)
          ),

          // Sources Section
          React.createElement('div', { className: 'mb-8' },
            React.createElement('div', { className: 'flex items-center justify-between mb-4' },
              React.createElement('label', { className: 'text-lg font-semibold text-slate-900' },
                'Supporting Sources & References'
              ),
              React.createElement('span', { className: 'text-sm text-slate-500' }, 'Optional')
            ),
            React.createElement('p', { className: 'text-sm text-slate-600 mb-4' },
              'Add relevant sources, documents, or context to improve analysis quality'
            ),
            
            // Dynamic Sources
            React.createElement('div', { className: 'space-y-3' },
              ...sources.map((source, index) =>
                React.createElement('div', { key: index, className: 'flex items-center space-x-3' },
                  React.createElement('div', { className: 'flex-1' },
                    React.createElement('textarea', {
                      value: source,
                      onChange: (e) => {
                        const newSources = [...sources];
                        newSources[index] = e.target.value;
                        setSources(newSources);
                      },
                      rows: 2,
                      className: 'w-full px-4 py-3 border border-slate-200 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none hover:border-slate-300 transition-all duration-200',
                      placeholder: `Source ${index + 1}: URL, document excerpt, or reference...`
                    })
                  ),
                  sources.length > 1 && React.createElement('button', {
                    type: 'button',
                    onClick: () => removeSource(index),
                    className: 'p-2 text-slate-400 hover:text-red-500 transition-colors duration-200'
                  }, '×')
                )
              )
            ),
            
            React.createElement('button', {
              type: 'button',
              onClick: addSource,
              className: 'inline-flex items-center px-4 py-2 text-sm font-medium text-indigo-600 bg-indigo-50 rounded-lg hover:bg-indigo-100 transition-colors duration-200'
            }, '+ Add Another Source')
          ),

          // Options Section
          React.createElement('div', { className: 'mb-8' },
            React.createElement('h3', { className: 'text-lg font-semibold text-slate-900 mb-4' }, 'Analysis Options'),
            React.createElement('div', { className: 'grid grid-cols-1 md:grid-cols-2 gap-6' },
              
              // Priority Level
              React.createElement('div', null,
                React.createElement('label', { className: 'block text-sm font-medium text-slate-700 mb-3' }, 'Priority Level'),
                React.createElement('div', { className: 'space-y-2' },
                  React.createElement('label', { className: 'flex items-center' },
                    React.createElement('input', {
                      ...register('priority'),
                      type: 'radio',
                      value: 'standard',
                      className: 'h-4 w-4 text-indigo-600 focus:ring-indigo-500'
                    }),
                    React.createElement('span', { className: 'ml-3 text-sm text-slate-700' },
                      React.createElement('span', { className: 'font-medium' }, 'Standard'),
                      ' (60-90 seconds)'
                    )
                  ),
                  React.createElement('label', { className: 'flex items-center' },
                    React.createElement('input', {
                      ...register('priority'),
                      type: 'radio',
                      value: 'detailed',
                      className: 'h-4 w-4 text-indigo-600 focus:ring-indigo-500'
                    }),
                    React.createElement('span', { className: 'ml-3 text-sm text-slate-700' },
                      React.createElement('span', { className: 'font-medium' }, 'Detailed'),
                      ' (2-3 minutes)'
                    )
                  )
                )
              ),

              // Include Metadata
              React.createElement('div', null,
                React.createElement('label', { className: 'block text-sm font-medium text-slate-700 mb-3' }, 'Output Options'),
                React.createElement('div', { className: 'space-y-2' },
                  React.createElement('label', { className: 'flex items-center' },
                    React.createElement('input', {
                      ...register('includeMetadata'),
                      type: 'checkbox',
                      className: 'h-4 w-4 text-indigo-600 focus:ring-indigo-500 rounded'
                    }),
                    React.createElement('span', { className: 'ml-3 text-sm text-slate-700' }, 'Include detailed metadata')
                  ),
                  React.createElement('label', { className: 'flex items-center' },
                    React.createElement('input', {
                      type: 'checkbox',
                      className: 'h-4 w-4 text-indigo-600 focus:ring-indigo-500 rounded'
                    }),
                    React.createElement('span', { className: 'ml-3 text-sm text-slate-700' }, 'Generate PDF export')
                  )
                )
              )
            )
          ),

          // Cost Estimation
          React.createElement('div', { className: 'mb-8 p-4 bg-slate-50 rounded-lg border border-slate-200' },
            React.createElement('div', { className: 'flex items-center justify-between' },
              React.createElement('div', null,
                React.createElement('h4', { className: 'text-sm font-semibold text-slate-700 mb-1' }, 'Estimated Usage'),
                React.createElement('p', { className: 'text-sm text-slate-600' }, 
                  `~${estimatedTokens.toLocaleString()} tokens • $${estimatedCost} cost`
                )
              ),
              React.createElement('div', { className: 'text-right' },
                React.createElement('div', { className: 'text-sm font-medium text-slate-900' }, '4 AI Models'),
                React.createElement('div', { className: 'text-xs text-slate-500' }, 'GPT-4o • Claude • Gemini • Command R+')
              )
            )
          ),

          // Submit Button
          React.createElement('button', {
            type: 'submit',
            disabled: isGenerating || !watch('topic'),
            className: `w-full py-4 px-6 bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-semibold rounded-lg hover:from-indigo-700 hover:to-violet-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-sm hover:shadow-md ${
              isGenerating ? 'animate-pulse' : ''
            }`
          }, isGenerating ? 'Generating Consensus Report...' : 'Generate Consensus Report')
        )
      ),

      // Results Section (if exists)
      result && React.createElement('div', { 
        className: `mt-8 bg-white rounded-xl border shadow-sm ${result.error ? 'border-red-200' : 'border-slate-200/60'}` 
      },
        React.createElement('div', { className: 'p-8' },
          React.createElement('div', { className: 'flex items-center justify-between mb-6' },
            React.createElement('h3', { 
              className: `text-xl font-semibold ${result.error ? 'text-red-800' : 'text-slate-900'}` 
            }, result.error ? 'Generation Failed' : 'Consensus Report Generated'),
            !result.error && React.createElement('div', { className: 'flex items-center space-x-3' },
              React.createElement('button', { 
                className: 'inline-flex items-center px-3 py-2 bg-indigo-50 text-indigo-600 rounded-lg text-sm font-medium hover:bg-indigo-100 transition-colors duration-200'
              }, 'Export PDF'),
              React.createElement('button', { 
                className: 'inline-flex items-center px-3 py-2 bg-slate-100 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-200 transition-colors duration-200'
              }, 'Save Report')
            )
          ),
          
          React.createElement('div', { 
            className: `prose max-w-none ${result.error ? 'text-red-700' : 'text-slate-700'}` 
          }, 
            React.createElement('p', { className: 'text-base leading-relaxed whitespace-pre-wrap' }, result.consensus)
          ),
          
          !result.error && React.createElement('div', { className: 'mt-8 pt-6 border-t border-slate-100' },
            React.createElement('div', { className: 'grid grid-cols-1 md:grid-cols-3 gap-6' },
              React.createElement('div', { className: 'text-center' },
                React.createElement('div', { className: 'text-2xl font-bold text-slate-900' }, `${(result.confidence * 100).toFixed(1)}%`),
                React.createElement('div', { className: 'text-sm text-slate-600' }, 'Confidence Score')
              ),
              React.createElement('div', { className: 'text-center' },
                React.createElement('div', { className: 'text-2xl font-bold text-slate-900' }, result.totalTokens?.toLocaleString() || 'N/A'),
                React.createElement('div', { className: 'text-sm text-slate-600' }, 'Tokens Used')
              ),
              React.createElement('div', { className: 'text-center' },
                React.createElement('div', { className: 'text-2xl font-bold text-slate-900' }, result.llmsUsed?.length || 4),
                React.createElement('div', { className: 'text-sm text-slate-600' }, 'AI Models')
              )
            ),
            
            // Phases breakdown
            result.phases && React.createElement('div', { className: 'mt-6 p-4 bg-slate-50 rounded-lg' },
              React.createElement('h4', { className: 'text-sm font-semibold text-slate-700 mb-3' }, '3-Phase Process Completed'),
              React.createElement('div', { className: 'space-y-2 text-sm text-slate-600' },
                result.phases.phase1_drafts && React.createElement('div', { className: 'flex items-center' },
                  React.createElement('span', { className: 'text-emerald-500 mr-2' }, '✓'),
                  `Phase 1: ${result.phases.phase1_drafts.length} independent drafts generated`
                ),
                result.phases.phase2_reviews && React.createElement('div', { className: 'flex items-center' },
                  React.createElement('span', { className: 'text-emerald-500 mr-2' }, '✓'),
                  `Phase 2: ${result.phases.phase2_reviews.length} peer reviews completed`
                ),
                result.phases.phase3_consensus && React.createElement('div', { className: 'flex items-center' },
                  React.createElement('span', { className: 'text-emerald-500 mr-2' }, '✓'),
                  `Phase 3: Final arbitration by ${result.phases.phase3_consensus.name || 'Command R+'}`
                )
              )
            )
          )
        )
      )
    )
  );
}

export default EnhancedConsensusForm; 