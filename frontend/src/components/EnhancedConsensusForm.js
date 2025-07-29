import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { apiHelpers } from '../config/api';

function EnhancedConsensusForm({ progressModal }) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [result, setResult] = useState(null);
  const [sources, setSources] = useState(['']);
  
  const { register, handleSubmit, watch, formState: { errors } } = useForm({
    defaultValues: {
      topic: '',
      sources: [''],
      priority: 'standard'
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

  // Realistic token estimation for 4-LLM consensus process
  const calculateTokenEstimate = () => {
    const topic = watch('topic') || '';
    const priority = watch('priority') || 'standard';
    const sourcesWithContent = sources.filter(s => s && s.trim() !== '');
    
    // Input token calculation (more conservative)
    const topicTokens = Math.ceil(topic.length / 4); // ~4 chars per token
    const sourceTokens = sourcesWithContent.reduce((total, source) => {
      return total + Math.ceil(source.length / 4);
    }, 0);
    
    const inputTokens = topicTokens + sourceTokens;
    
    // Realistic 4-LLM Consensus Process Token Calculation
    let totalTokens = 0;
    
    // Phase 1: Independent Drafting (4 models)
    // Each model: input + modest output (800-1200 tokens per response)
    const phase1OutputPerModel = priority === 'detailed' ? 1200 : 800;
    const phase1Tokens = 4 * (inputTokens + phase1OutputPerModel);
    totalTokens += phase1Tokens;
    
    // Phase 2: Peer Review (simplified - 3 reviews)
    // Each review: reading one draft + generating review (400-600 tokens per review)
    const phase2OutputPerReview = priority === 'detailed' ? 600 : 400;
    const phase2Tokens = 3 * (phase1OutputPerModel + phase2OutputPerReview);
    totalTokens += phase2Tokens;
    
    // Phase 3: Final Arbitration (1 model)
    // Reading all drafts + reviews + generating final consensus (1000-1500 tokens)
    const phase3Input = (4 * phase1OutputPerModel) + (3 * phase2OutputPerReview);
    const phase3Output = priority === 'detailed' ? 1500 : 1000;
    const phase3Tokens = phase3Input + phase3Output;
    totalTokens += phase3Tokens;
    
    // Add small processing overhead (5%)
    totalTokens = Math.ceil(totalTokens * 1.05);
    
    // Realistic minimums based on topic complexity
    const baseMinimum = priority === 'detailed' ? 8000 : 6000;
    const topicComplexityMultiplier = Math.min(2.0, Math.max(1.0, topicTokens / 50));
    const adjustedMinimum = Math.ceil(baseMinimum * topicComplexityMultiplier);
    
    return Math.max(totalTokens, adjustedMinimum);
  };

  const estimatedTokens = calculateTokenEstimate();

  const onSubmit = async (data) => {
    setIsGenerating(true);

    try {
      console.log('🚀 Starting consensus generation...', data);
      
      // Show progress modal and start with phase 1
      if (progressModal) {
        progressModal.showProgress('phase1', 120); // More realistic time estimate
        progressModal.updateStage('phase1');
      }
      
      // Prepare the request data with output options always included
      const requestData = {
        topic: data.topic,
        sources: sources.filter(source => source && source.trim() !== ''),
        options: {
          includeMetadata: true,  // Always include
          generatePdf: true,      // Always include
          emailReport: false,     // Could be made configurable later
          priority: data.priority
        }
      };
      
      // Update to phase 2 after preparing request
      if (progressModal) {
        progressModal.updateStage('phase2');
      }
      
      // Make real API call to Railway backend (this is the actual time-consuming process)
      console.log('📡 Sending request to backend:', requestData);
      console.log('📡 API URL:', import.meta.env.VITE_API_URL);
      
      const response = await apiHelpers.generateConsensus(requestData);
      
      console.log('✅ RAW RESPONSE RECEIVED:', response);
      console.log('✅ Response status:', response.status);
      console.log('✅ Response headers:', response.headers);
      console.log('✅ Response data:', response.data);
      console.log('📊 Response data type:', typeof response.data);
      console.log('📊 Response data keys:', Object.keys(response.data || {}));
      console.log('📊 Detailed response structure:', {
        success: !!response.data,
        hasConsensus: !!response.data?.consensus,
        consensusType: typeof response.data?.consensus,
        consensusLength: response.data?.consensus?.length,
        hasConfidence: !!response.data?.confidence,
        confidenceValue: response.data?.confidence,
        hasMetadata: !!response.data?.metadata,
        metadataKeys: Object.keys(response.data?.metadata || {}),
        hasTotalTokens: !!response.data?.metadata?.totalTokens,
        totalTokensValue: response.data?.metadata?.totalTokens,
        hasPhases: !!response.data?.phases,
        phasesKeys: Object.keys(response.data?.phases || {})
      });
      
      // Update to phase 3 (synthesis)
      if (progressModal) {
        progressModal.updateStage('phase3');
      }
      
      // Small delay to show final phase
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Hide progress modal only after real API completes
      if (progressModal) {
        progressModal.hideProgress();
      }
      
      // Set the real result from the 4-LLM system
      setResult({
        consensus: response.data.consensus,
        confidence: response.data.confidence,
        totalTokens: response.data.metadata?.totalTokens || estimatedTokens,
        llmsUsed: response.data.metadata?.llmsUsed || ['GPT-4o', 'Claude 3.5 Sonnet', 'Gemini 1.5 Pro', 'Command R+'],
        phases: response.data.phases,
        generatedAt: new Date().toISOString(),
        title: data.topic.substring(0, 100) + (data.topic.length > 100 ? '...' : ''),
        id: `rep_${Date.now()}`
      });
      
    } catch (error) {
      console.error('❌ Error generating consensus:', error);
      console.error('❌ Error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        statusText: error.response?.statusText,
        stack: error.stack
      });
      
      // Hide progress modal on error
      if (progressModal) {
        progressModal.hideProgress();
      }
      
      // Show user-friendly error with more details
      let errorMessage = 'Failed to generate consensus. Please try again.';
      
      if (error.message?.includes('CORS')) {
        errorMessage = 'Connection blocked by browser security. Please contact support.';
      } else if (error.response?.status === 400) {
        errorMessage = 'Invalid request data. Please check your input and try again.';
      } else if (error.response?.status === 401) {
        errorMessage = 'Authentication required. Please sign in and try again.';
      } else if (error.response?.status === 429) {
        errorMessage = 'Rate limit exceeded. Please wait a moment and try again.';
      } else if (error.response?.status >= 500) {
        errorMessage = 'Server error. Our team has been notified. Please try again later.';
      } else if (error.code === 'NETWORK_ERROR' || error.message?.includes('Network Error')) {
        errorMessage = 'Network connection failed. Please check your internet and try again.';
      }
      
      setResult({
        consensus: `Error: ${errorMessage}`,
        confidence: 0,
        totalTokens: 0,
        error: true,
        errorDetails: error.response?.data || error.message
      });
    } finally {
      setIsGenerating(false);
    }
  };

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

          // Analysis Depth Section (removed token counts)
          React.createElement('div', { className: 'mb-8' },
            React.createElement('h3', { className: 'text-lg font-semibold text-slate-900 mb-4' }, 'Analysis Depth'),
            React.createElement('div', { className: 'space-y-3' },
              React.createElement('label', { className: 'flex items-start space-x-3 p-4 border border-slate-200 rounded-lg hover:border-indigo-200 hover:bg-indigo-50/30 transition-all duration-200 cursor-pointer' },
                React.createElement('input', {
                  ...register('priority'),
                  type: 'radio',
                  value: 'standard',
                  className: 'h-4 w-4 text-indigo-600 focus:ring-indigo-500 mt-1'
                }),
                React.createElement('div', null,
                  React.createElement('div', { className: 'font-medium text-slate-900' }, 'Standard Analysis'),
                  React.createElement('div', { className: 'text-sm text-slate-600 mt-1' }, 
                    '60-90 seconds • Comprehensive consensus report with balanced perspectives'
                  )
                )
              ),
              React.createElement('label', { className: 'flex items-start space-x-3 p-4 border border-slate-200 rounded-lg hover:border-indigo-200 hover:bg-indigo-50/30 transition-all duration-200 cursor-pointer' },
                React.createElement('input', {
                  ...register('priority'),
                  type: 'radio',
                  value: 'detailed',
                  className: 'h-4 w-4 text-indigo-600 focus:ring-indigo-500 mt-1'
                }),
                React.createElement('div', null,
                  React.createElement('div', { className: 'font-medium text-slate-900' }, 'Detailed Analysis'),
                  React.createElement('div', { className: 'text-sm text-slate-600 mt-1' }, 
                    '2-3 minutes • In-depth analysis with extended reasoning and comprehensive review'
                  )
                )
              )
            )
          ),

          // Accurate Token Usage Estimation
          React.createElement('div', { className: 'mb-8 p-4 bg-slate-50 rounded-lg border border-slate-200' },
            React.createElement('div', { className: 'flex items-center justify-between' },
              React.createElement('div', null,
                React.createElement('h4', { className: 'text-sm font-semibold text-slate-700 mb-1' }, 'Estimated Token Usage'),
                React.createElement('p', { className: 'text-sm text-slate-600' }, 
                  `~${estimatedTokens.toLocaleString()} tokens for complete 4-LLM consensus analysis`
                )
              ),
              React.createElement('div', { className: 'text-right' },
                React.createElement('div', { className: 'text-sm font-medium text-slate-900' }, '4 AI Models'),
                React.createElement('div', { className: 'text-xs text-slate-500' }, 'GPT-4o • Claude • Gemini • Command R+')
              )
            )
          ),

          // Included Features
          React.createElement('div', { className: 'mb-8 p-4 bg-emerald-50 rounded-lg border border-emerald-200' },
            React.createElement('h4', { className: 'text-sm font-semibold text-emerald-800 mb-3' }, 'Included with Every Report'),
            React.createElement('div', { className: 'grid grid-cols-1 sm:grid-cols-2 gap-2' },
              React.createElement('div', { className: 'flex items-center text-sm text-emerald-700' },
                React.createElement('span', { className: 'mr-2' }, '✓'),
                'Detailed metadata & analysis breakdown'
              ),
              React.createElement('div', { className: 'flex items-center text-sm text-emerald-700' },
                React.createElement('span', { className: 'mr-2' }, '✓'),
                'Professional PDF export'
              ),
              React.createElement('div', { className: 'flex items-center text-sm text-emerald-700' },
                React.createElement('span', { className: 'mr-2' }, '✓'),
                'Token usage analytics'
              ),
              React.createElement('div', { className: 'flex items-center text-sm text-emerald-700' },
                React.createElement('span', { className: 'mr-2' }, '✓'),
                'Confidence scoring & methodology notes'
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