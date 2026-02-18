import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { apiHelpers } from '../config/api';
import { HelpIcon, InfoIcon } from './Tooltip';

// Report categories with preset AI models (user can change after selecting)
const REPORT_CATEGORIES = [
  { id: 'general', label: 'General', description: 'Balanced analysis for any topic' },
  { id: 'legal', label: 'Legal', description: 'Contracts, compliance, case law' },
  { id: 'financial', label: 'Financial', description: 'Modeling, risk, valuations' },
  { id: 'technical', label: 'Technical', description: 'Code, architecture, systems' },
  { id: 'creative', label: 'Creative', description: 'Content, marketing, strategy' }
];

// All models: available = API ready today; others shown for future use
const AI_MODELS = [
  { id: 'gpt-4o', name: 'GPT-4o', available: true },
  { id: 'claude-3-5-sonnet', name: 'Claude 3.5 Sonnet', available: true },
  { id: 'gemini-1-5-pro', name: 'Gemini 1.5 Pro', available: true },
  { id: 'command-r-plus', name: 'Command R+', available: true },
  { id: 'gpt-4o-mini', name: 'GPT-4o Mini', available: false },
  { id: 'claude-3-5-haiku', name: 'Claude 3.5 Haiku', available: false },
  { id: 'gemini-1-5-flash', name: 'Gemini 1.5 Flash', available: false },
  { id: 'claude-3-opus', name: 'Claude 3 Opus', available: false },
  { id: 'gpt-4-turbo', name: 'GPT-4 Turbo', available: false },
  { id: 'perplexity-pro', name: 'Perplexity Pro', available: false },
  { id: 'codestral', name: 'Codestral', available: false }
];

const CATEGORY_MODEL_PRESETS = {
  general: ['gpt-4o', 'claude-3-5-sonnet', 'gemini-1-5-pro', 'command-r-plus'],
  legal: ['claude-3-opus', 'gpt-4-turbo', 'perplexity-pro', 'claude-3-5-sonnet', 'gpt-4o'],
  financial: ['gpt-4o', 'claude-3-5-sonnet', 'gemini-1-5-pro', 'command-r-plus', 'claude-3-opus'],
  technical: ['claude-3-5-sonnet', 'gpt-4o', 'codestral', 'gpt-4-turbo', 'claude-3-opus'],
  creative: ['gpt-4o', 'claude-3-5-sonnet', 'gemini-1-5-pro', 'gpt-4-turbo', 'claude-3-opus']
};

function EnhancedConsensusForm({ progressModal }) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [result, setResult] = useState(null);
  const [sources, setSources] = useState(['']);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [supportedTypes, setSupportedTypes] = useState(null);
  const [reportCategory, setReportCategory] = useState('general');
  const [selectedModelIds, setSelectedModelIds] = useState([...CATEGORY_MODEL_PRESETS.general]);
  
  const { register, handleSubmit, watch, formState: { errors } } = useForm({
    defaultValues: {
      topic: '',
      sources: [''],
      priority: 'standard'
    }
  });

  // When category changes, preselect models for that category (user can still change)
  useEffect(() => {
    const preset = CATEGORY_MODEL_PRESETS[reportCategory] || CATEGORY_MODEL_PRESETS.general;
    setSelectedModelIds([...preset]);
  }, [reportCategory]);

  const toggleModel = (modelId) => {
    setSelectedModelIds(prev => {
      if (prev.includes(modelId)) {
        const next = prev.filter(id => id !== modelId);
        return next.length >= 1 ? next : prev;
      }
      return [...prev, modelId];
    });
  };

  const addSource = () => {
    setSources([...sources, '']);
  };

  const removeSource = (index) => {
    if (sources.length > 1) {
      const newSources = sources.filter((_, i) => i !== index);
      setSources(newSources);
    }
  };

  // Load supported file types on component mount
  useEffect(() => {
    const loadSupportedTypes = async () => {
      try {
        const response = await apiHelpers.getSupportedFileTypes();
        setSupportedTypes(response.data.supportedTypes);
      } catch (error) {
        console.error('Failed to load supported file types:', error);
      }
    };
    loadSupportedTypes();
  }, []);

  // Handle file upload
  const handleFileUpload = async (event) => {
    const files = Array.from(event.target.files);
    if (files.length === 0) return;

    setIsUploading(true);
    setUploadError('');

    try {
      console.log('📁 Uploading files:', files.map(f => f.name));
      const response = await apiHelpers.uploadFiles(files);
      
      if (response.data.success) {
        const newUploadedFiles = response.data.processedFiles.map(file => ({
          id: Date.now() + Math.random(),
          filename: file.filename,
          text: file.text,
          size: file.size,
          extractedLength: file.extractedLength,
          mimeType: file.mimeType
        }));
        
        setUploadedFiles(prev => [...prev, ...newUploadedFiles]);
        
        // Add extracted text to sources
        const newSources = [...sources];
        newUploadedFiles.forEach(file => {
          newSources.push(`[From ${file.filename}]\n${file.text}`);
        });
        setSources(newSources);
        
        console.log(`✅ Successfully uploaded ${newUploadedFiles.length} files`);
        
        // Show errors if any
        if (response.data.errors && response.data.errors.length > 0) {
          const errorMessages = response.data.errors.map(err => `${err.filename}: ${err.error}`).join('\n');
          setUploadError(`Some files had issues:\n${errorMessages}`);
        }
      } else {
        setUploadError(response.data.error || 'Upload failed');
      }
    } catch (error) {
      console.error('File upload error:', error);
      setUploadError(error.response?.data?.error || 'Upload failed. Please try again.');
    } finally {
      setIsUploading(false);
      // Clear the file input
      event.target.value = '';
    }
  };

  // Remove uploaded file
  const removeUploadedFile = (fileId) => {
    setUploadedFiles(prev => prev.filter(f => f.id !== fileId));
    
    // Remove corresponding source
    const fileToRemove = uploadedFiles.find(f => f.id === fileId);
    if (fileToRemove) {
      const sourceToRemove = `[From ${fileToRemove.filename}]`;
      const newSources = sources.filter(source => !source.startsWith(sourceToRemove));
      setSources(newSources);
    }
  };


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
      
      // Make API call to start async job (returns immediately)
      console.log('📡 Sending request to backend:', requestData);
      console.log('📡 API URL:', import.meta.env.VITE_API_URL);
      
      const jobResponse = await apiHelpers.generateConsensus(requestData);
      console.log('✅ Job started successfully:', jobResponse.data);
      
      if (!jobResponse.data.jobId) {
        throw new Error('No job ID received from server');
      }

      const jobId = jobResponse.data.jobId;
      console.log(`🔄 Polling job status for: ${jobId}`);

      // Start polling for job completion
      const result = await pollJobStatus(jobId);

      // Defensive: server may have restarted and lost in-memory result
      if (!result || typeof result.consensus !== 'string') {
        if (progressModal) progressModal.hideProgress();
        setResult({
          consensus: 'Report completed but the result was unavailable (server may have restarted). Please try generating again.',
          confidence: 0,
          error: true,
          errorDetails: 'Missing or invalid result from server'
        });
        return;
      }

      const resultData = {
        consensus: result.consensus,
        confidence: typeof result.confidence === 'number' ? result.confidence : 0,
        llmsUsed: result.metadata?.llmsUsed || ['GPT-4o', 'Claude 3.5 Sonnet', 'Gemini 1.5 Pro', 'Command R+'],
        phases: result.phases || null,
        generatedAt: new Date().toISOString(),
        title: (data.topic || '').substring(0, 100) + ((data.topic || '').length > 100 ? '...' : ''),
        id: `rep_${Date.now()}`
      };
      setResult(resultData);

      // Show report in the pop-up so user sees it without going to Report Library
      if (progressModal) {
        progressModal.showReport({
          consensus: resultData.consensus,
          confidence: resultData.confidence,
          llmsUsed: resultData.llmsUsed,
          error: resultData.error,
          jobId,
          pdfAvailable: !!result.pdfAvailable
        });
      }
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
        error: true,
        errorDetails: error.response?.data || error.message
      });
    } finally {
      setIsGenerating(false);
    }
  };

  // Polling function for job status (uses api so auth token is sent)
  const pollJobStatus = async (jobId) => {
    const maxAttempts = 600; // 10 min max so we wait for Phase 3 (Cohere arbitration) to finish
    let attempts = 0;

    while (attempts < maxAttempts) {
      try {
        const response = await apiHelpers.getJobStatus(jobId);
        const statusData = response.data;

        // Update progress modal with current phase from backend
        if (progressModal && statusData.phase) {
          const phase = statusData.phase === 'phase1' ? 'phase1' :
                       statusData.phase === 'phase2' ? 'phase2' :
                       statusData.phase === 'phase3' ? 'phase3' :
                       statusData.phase === 'completed' ? 'phase3' : 'phase1';
          progressModal.updateStage(phase);
        }

        if (statusData.status === 'completed') {
          return statusData.result;
        }

        if (statusData.status === 'failed') {
          throw new Error(statusData.error || 'Job failed');
        }

        await new Promise(resolve => setTimeout(resolve, 1000));
        attempts++;
      } catch (pollError) {
        if (pollError.response?.status === 401) {
          throw new Error('Authentication required. Please sign in and try again.');
        }
        if (pollError.response?.status === 404) {
          throw new Error('Job was lost (server may have restarted). Please try again.');
        }
        if (pollError.response?.data?.error) {
          throw new Error(pollError.response.data.error);
        }
        if (pollError.code === 'ERR_NETWORK' || pollError.message?.includes('Network')) {
          throw new Error('Connection lost. The server may be restarting. Please try again.');
        }
        throw new Error(pollError.message || 'Job status check failed');
      }
    }

    throw new Error('Job polling timeout - process may still be running');
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
              React.createElement('div', { className: 'flex items-center space-x-2' },
                React.createElement('label', { htmlFor: 'topic', className: 'text-lg font-semibold text-slate-900' },
                  'Your Question or Research Topic'
                ),
                React.createElement(HelpIcon, {
                  tooltip: 'Be specific and clear. Good examples: "What are the pros and cons of remote work?" or "Should companies invest in AI automation?" Avoid yes/no questions.',
                  size: 'sm'
                })
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
              React.createElement('div', { className: 'flex items-center space-x-2' },
                React.createElement('label', { className: 'text-lg font-semibold text-slate-900' },
                  'Supporting Sources & References'
                ),
                React.createElement(HelpIcon, {
                  tooltip: 'Add URLs, document excerpts, research papers, or any relevant information. You can also upload files (PDF, TXT, CSV, JSON) for automatic text extraction.',
                  size: 'sm'
                })
              ),
              React.createElement('span', { className: 'text-sm text-slate-500' }, 'Optional')
            ),
            React.createElement('p', { className: 'text-sm text-slate-600 mb-4' },
              'Add relevant sources, documents, or context to improve analysis quality'
            ),
            
            // File Upload Section
            React.createElement('div', { className: 'mb-6 p-4 bg-slate-50 rounded-lg border border-slate-200' },
              React.createElement('div', { className: 'flex items-center justify-between mb-3' },
                React.createElement('div', { className: 'flex items-center space-x-2' },
                  React.createElement('h4', { className: 'text-sm font-medium text-slate-900' }, 'Upload Documents'),
                  React.createElement(InfoIcon, {
                    tooltip: 'Upload up to 5 files (PDF, TXT, CSV, JSON) for automatic text extraction. Files are processed securely and deleted after analysis.',
                    size: 'xs'
                  })
                ),
                React.createElement('span', { className: 'text-xs text-slate-500' }, 
                  supportedTypes ? `${supportedTypes.extensions.join(', ')} • Max ${Math.round(supportedTypes.maxSize / 1024 / 1024)}MB` : 'Loading...'
                )
              ),
              
              // File Upload Input
              React.createElement('div', { className: 'mb-3' },
                React.createElement('input', {
                  type: 'file',
                  multiple: true,
                  accept: supportedTypes ? supportedTypes.extensions.join(',') : '.txt,.pdf,.csv,.json',
                  onChange: handleFileUpload,
                  disabled: isUploading,
                  className: 'block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 disabled:opacity-50 disabled:cursor-not-allowed'
                })
              ),
              
              // Upload Status
              isUploading && React.createElement('div', { className: 'flex items-center text-sm text-indigo-600 mb-2' },
                React.createElement('svg', { className: 'animate-spin -ml-1 mr-2 h-4 w-4 text-indigo-600', fill: 'none', viewBox: '0 0 24 24' },
                  React.createElement('circle', { className: 'opacity-25', cx: '12', cy: '12', r: '10', stroke: 'currentColor', strokeWidth: '4' }),
                  React.createElement('path', { className: 'opacity-75', fill: 'currentColor', d: 'M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z' })
                ),
                'Processing files...'
              ),
              
              // Upload Error
              uploadError && React.createElement('div', { className: 'text-sm text-red-600 mb-2 whitespace-pre-line' }, uploadError),
              
              // Uploaded Files List
              uploadedFiles.length > 0 && React.createElement('div', { className: 'space-y-2' },
                React.createElement('h5', { className: 'text-xs font-medium text-slate-700 mb-2' }, 'Uploaded Files:'),
                ...uploadedFiles.map(file =>
                  React.createElement('div', { key: file.id, className: 'flex items-center justify-between p-2 bg-white rounded border border-slate-200' },
                    React.createElement('div', { className: 'flex-1' },
                      React.createElement('div', { className: 'text-sm font-medium text-slate-900' }, file.filename),
                      React.createElement('div', { className: 'text-xs text-slate-500' }, 
                        `${Math.round(file.size / 1024)}KB • ${file.extractedLength} characters extracted`
                      )
                    ),
                    React.createElement('button', {
                      type: 'button',
                      onClick: () => removeUploadedFile(file.id),
                      className: 'ml-2 text-red-500 hover:text-red-700 text-sm'
                    }, '×')
                  )
                )
              )
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

          // Report category & AI model selection
          React.createElement('div', { className: 'mb-8' },
            React.createElement('h3', { className: 'text-lg font-semibold text-slate-900 mb-4' }, 'Report setup'),
            React.createElement('div', { className: 'space-y-4' },
              React.createElement('div', null,
                React.createElement('label', { className: 'block text-sm font-medium text-slate-700 mb-2' }, 'Category (preselects recommended models)'),
                React.createElement('select', {
                  value: reportCategory,
                  onChange: (e) => setReportCategory(e.target.value),
                  className: 'w-full max-w-md px-4 py-2 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent'
                },
                  REPORT_CATEGORIES.map(cat =>
                    React.createElement('option', { key: cat.id, value: cat.id }, `${cat.label} — ${cat.description}`)
                  )
                )
              ),
              React.createElement('div', null,
                React.createElement('div', { className: 'flex items-center justify-between mb-2' },
                  React.createElement('label', { className: 'block text-sm font-medium text-slate-700' }, 'AI models for this report'),
                  React.createElement('span', { className: 'text-xs text-slate-500' }, `${selectedModelIds.length} selected`)
                ),
                React.createElement('p', { className: 'text-sm text-slate-600 mb-3' },
                  'Choose at least one. Models marked "Available" are used today; others will be enabled as we add APIs.'
                ),
                React.createElement('div', { className: 'flex flex-wrap gap-3' },
                  ...AI_MODELS.map(model =>
                    React.createElement('label', {
                      key: model.id,
                      className: `flex items-center space-x-2 px-3 py-2 rounded-lg border cursor-pointer transition-all ${
                        selectedModelIds.includes(model.id)
                          ? 'border-indigo-500 bg-indigo-50 text-indigo-800'
                          : 'border-slate-200 hover:border-slate-300 bg-white text-slate-700'
                      }`
                    },
                      React.createElement('input', {
                        type: 'checkbox',
                        checked: selectedModelIds.includes(model.id),
                        onChange: () => toggleModel(model.id),
                        className: 'h-4 w-4 text-indigo-600 focus:ring-indigo-500 rounded'
                      }),
                      React.createElement('span', { className: 'text-sm font-medium' }, model.name),
                      !model.available && React.createElement('span', { className: 'text-xs text-slate-400' }, '(coming soon)')
                    )
                  )
                )
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
            React.createElement('div', { className: 'grid grid-cols-1 md:grid-cols-2 gap-6' },
              React.createElement('div', { className: 'text-center' },
                React.createElement('div', { className: 'text-2xl font-bold text-slate-900' }, `${(result.confidence * 100).toFixed(1)}%`),
                React.createElement('div', { className: 'text-sm text-slate-600' }, 'Confidence Score')
              ),
              React.createElement('div', { className: 'text-center' },
                React.createElement('div', { className: 'text-2xl font-bold text-slate-900' }, result.llmsUsed?.length || 4),
                React.createElement('div', { className: 'text-sm text-slate-600' }, 'AI Models used')
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
