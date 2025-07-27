import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { apiHelpers } from '../config/api';

function EnhancedConsensusForm() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [result, setResult] = useState(null);
  const { register, handleSubmit, watch } = useForm({
    defaultValues: {
      topic: '',
      sources: ['']
    }
  });

  const onSubmit = async (data) => {
    setIsGenerating(true);
    try {
      console.log('🚀 Starting consensus generation...', data);
      
      // Prepare the request data
      const requestData = {
        topic: data.topic,
        sources: data.sources.filter(source => source && source.trim() !== ''),
        options: {
          includeMetadata: true,
          generatePdf: false,
          emailReport: false
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
        phases: response.data.phases
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

  return React.createElement('div', { className: 'max-w-4xl mx-auto p-6' },
    React.createElement('div', { className: 'bg-white rounded-lg shadow-lg p-8' },
      React.createElement('h2', { className: 'text-3xl font-bold text-gray-900 mb-8' }, 'Generate Consensus Report'),
      
      React.createElement('form', { onSubmit: handleSubmit(onSubmit), className: 'space-y-6' },
        React.createElement('div', null,
          React.createElement('label', { htmlFor: 'topic', className: 'block text-sm font-medium text-gray-700 mb-2' },
            'Question or Topic'
          ),
          React.createElement('textarea', {
            ...register('topic', { required: true }),
            id: 'topic',
            rows: 3,
            className: 'w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500',
            placeholder: 'Enter your question or topic for consensus analysis...'
          })
        ),

        React.createElement('div', null,
          React.createElement('label', { className: 'block text-sm font-medium text-gray-700 mb-2' },
            'Sources (Optional)'
          ),
          React.createElement('textarea', {
            ...register('sources.0'),
            rows: 2,
            className: 'w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500',
            placeholder: 'Add a source or reference...'
          })
        ),

        React.createElement('button', {
          type: 'submit',
          disabled: isGenerating,
          className: 'w-full bg-blue-600 text-white py-3 px-6 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors'
        }, isGenerating ? 'Generating Consensus...' : 'Generate Consensus Report')
      ),

             result && React.createElement('div', { 
         className: `mt-8 p-6 rounded-lg ${result.error ? 'bg-red-50 border border-red-200' : 'bg-gray-50'}` 
       },
         React.createElement('h3', { 
           className: `text-xl font-semibold mb-4 ${result.error ? 'text-red-800' : 'text-gray-900'}` 
         }, result.error ? 'Error' : 'Consensus Report'),
         
         React.createElement('p', { 
           className: `mb-4 ${result.error ? 'text-red-700' : 'text-gray-700'}` 
         }, result.consensus),
         
         !result.error && React.createElement('div', { className: 'space-y-3' },
           // Main stats
           React.createElement('div', { className: 'flex justify-between text-sm text-gray-600' },
             React.createElement('span', null, `Confidence: ${(result.confidence * 100).toFixed(1)}%`),
             React.createElement('span', null, `Tokens Used: ${result.totalTokens}`)
           ),
           
           // LLMs used
           result.llmsUsed && result.llmsUsed.length > 0 && React.createElement('div', { className: 'text-sm text-gray-600' },
             React.createElement('span', { className: 'font-medium' }, 'LLMs Used: '),
             React.createElement('span', null, result.llmsUsed.join(', '))
           ),
           
           // Phases summary (if available)
           result.phases && React.createElement('div', { className: 'mt-4 pt-4 border-t border-gray-200' },
             React.createElement('h4', { className: 'text-sm font-medium text-gray-700 mb-2' }, '3-Phase Process Summary:'),
             React.createElement('div', { className: 'text-xs text-gray-600 space-y-1' },
               result.phases.phase1_drafts && React.createElement('div', null, 
                 `✓ Phase 1: ${result.phases.phase1_drafts.length} independent drafts generated`
               ),
               result.phases.phase2_reviews && React.createElement('div', null, 
                 `✓ Phase 2: ${result.phases.phase2_reviews.length} peer reviews completed`
               ),
               result.phases.phase3_consensus && React.createElement('div', null, 
                 `✓ Phase 3: Final arbitration by ${result.phases.phase3_consensus.name || 'Command R+'}`
               )
             )
           )
         )
       )
    )
  );
}

export default EnhancedConsensusForm; 