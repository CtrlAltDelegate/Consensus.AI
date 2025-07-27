import React, { useState } from 'react';
import { useForm } from 'react-hook-form';

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
      // Simulate API call for now
      await new Promise(resolve => setTimeout(resolve, 2000));
      setResult({
        consensus: "This is a sample consensus report. The backend is connected and ready for LLM integration.",
        confidence: 0.85,
        totalTokens: 2400
      });
    } catch (error) {
      console.error('Error generating consensus:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-lg p-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-8">Generate Consensus Report</h2>
        
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div>
            <label htmlFor="topic" className="block text-sm font-medium text-gray-700 mb-2">
              Question or Topic
            </label>
            <textarea
              {...register('topic', { required: true })}
              id="topic"
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter your question or topic for consensus analysis..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Sources (Optional)
            </label>
            <textarea
              {...register('sources.0')}
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Add a source or reference..."
            />
          </div>

          <button
            type="submit"
            disabled={isGenerating}
            className="w-full bg-blue-600 text-white py-3 px-6 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isGenerating ? 'Generating Consensus...' : 'Generate Consensus Report'}
          </button>
        </form>

        {result && (
          <div className="mt-8 p-6 bg-gray-50 rounded-lg">
            <h3 className="text-xl font-semibold mb-4">Consensus Report</h3>
            <p className="text-gray-700 mb-4">{result.consensus}</p>
            <div className="flex justify-between text-sm text-gray-600">
              <span>Confidence: {(result.confidence * 100).toFixed(1)}%</span>
              <span>Tokens Used: {result.totalTokens}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default EnhancedConsensusForm; 