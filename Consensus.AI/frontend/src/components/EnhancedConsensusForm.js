import React, { useState } from 'react';
import { useMutation, useQuery } from 'react-query';
import { useForm } from 'react-hook-form';
import { 
  Plus, 
  Trash2, 
  Brain, 
  FileText, 
  Mail, 
  Download,
  AlertTriangle,
  CheckCircle,
  Clock
} from 'lucide-react';
import toast from 'react-hot-toast';
import OverageModal from './OverageModal';

// Mock API functions
const generateConsensus = async (data) => {
  await new Promise(resolve => setTimeout(resolve, 3000));
  return {
    consensus: `Based on the analysis of "${data.topic}", the consensus indicates a strong correlation between the provided sources. The analysis reveals that there is substantial agreement across multiple perspectives, with key themes emerging around innovation, sustainability, and market dynamics.

The comprehensive review suggests that stakeholders are aligned on fundamental principles while maintaining healthy debate on implementation strategies. This consensus provides a solid foundation for decision-making processes.`,
    confidence: 0.87,
    sources: [
      { provider: 'OpenAI', model: 'GPT-4', tokenUsage: 1250 },
      { provider: 'Anthropic', model: 'Claude-3', tokenUsage: 1180 }
    ],
    totalTokens: 2430
  };
};

const estimateTokens = async (data) => {
  await new Promise(resolve => setTimeout(resolve, 500));
  const baseTokens = 500;
  const topicTokens = Math.ceil(data.topic.length / 4);
  const sourceTokens = data.sources.reduce((sum, source) => sum + Math.ceil(source.length / 4), 0);
  return baseTokens + topicTokens + sourceTokens;
};

function EnhancedConsensusForm() {
  const [sources, setSources] = useState(['', '']);
  const [showOverageModal, setShowOverageModal] = useState(false);
  const [tokenEstimate, setTokenEstimate] = useState(null);
  const [lastResult, setLastResult] = useState(null);

  const { register, handleSubmit, watch, formState: { errors } } = useForm({
    defaultValues: {
      topic: '',
      generatePdf: false,
      emailReport: false
    }
  });

  const watchedValues = watch();

  // Estimate tokens mutation
  const estimateMutation = useMutation(estimateTokens, {
    onSuccess: (estimate) => {
      setTokenEstimate(estimate);
    }
  });

  // Generate consensus mutation
  const generateMutation = useMutation(generateConsensus, {
    onSuccess: (result) => {
      setLastResult(result);
      toast.success('Consensus generated successfully!');
    },
    onError: (error) => {
      if (error.status === 402) {
        setShowOverageModal(true);
      } else {
        toast.error('Failed to generate consensus');
      }
    }
  });

  const addSource = () => {
    if (sources.length < 10) {
      setSources([...sources, '']);
    }
  };

  const removeSource = (index) => {
    if (sources.length > 2) {
      setSources(sources.filter((_, i) => i !== index));
    }
  };

  const updateSource = (index, value) => {
    const newSources = [...sources];
    newSources[index] = value;
    setSources(newSources);
  };

  const handleEstimate = () => {
    const topic = watchedValues.topic;
    const validSources = sources.filter(s => s.trim().length > 0);
    
    if (topic && validSources.length >= 2) {
      estimateMutation.mutate({
        topic,
        sources: validSources
      });
    }
  };

  const onSubmit = (data) => {
    const validSources = sources.filter(s => s.trim().length > 0);
    
    if (validSources.length < 2) {
      toast.error('Please provide at least 2 sources');
      return;
    }

    generateMutation.mutate({
      ...data,
      sources: validSources
    });
  };

  return (
    <div className="container-narrow space-y-8">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900">Generate Consensus</h1>
        <p className="text-gray-600 mt-2">
          Analyze multiple sources to generate comprehensive consensus reports
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Form */}
        <div className="lg:col-span-2">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Topic */}
            <div className="card">
              <div className="card-body">
                <label className="form-label">
                  Topic *
                </label>
                <textarea
                  {...register('topic', { 
                    required: 'Topic is required',
                    minLength: { value: 10, message: 'Topic must be at least 10 characters' }
                  })}
                  className="form-input h-24 resize-none"
                  placeholder="Enter the topic you want to analyze and generate consensus for..."
                />
                {errors.topic && (
                  <p className="form-error">{errors.topic.message}</p>
                )}
              </div>
            </div>

            {/* Sources */}
            <div className="card">
              <div className="card-body">
                <div className="flex items-center justify-between mb-4">
                  <label className="form-label mb-0">
                    Sources * (minimum 2, maximum 10)
                  </label>
                  <button
                    type="button"
                    onClick={addSource}
                    disabled={sources.length >= 10}
                    className="btn btn-secondary btn-sm"
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    Add Source
                  </button>
                </div>

                <div className="space-y-4">
                  {sources.map((source, index) => (
                    <div key={index} className="flex space-x-3">
                      <div className="flex-1">
                        <textarea
                          value={source}
                          onChange={(e) => updateSource(index, e.target.value)}
                          className="form-input h-24 resize-none"
                          placeholder={`Source ${index + 1}: Paste your source content here...`}
                        />
                      </div>
                      {sources.length > 2 && (
                        <button
                          type="button"
                          onClick={() => removeSource(index)}
                          className="btn btn-error btn-sm self-start mt-1"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Options */}
            <div className="card">
              <div className="card-body">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Output Options
                </h3>
                
                <div className="space-y-3">
                  <label className="flex items-center">
                    <input
                      {...register('generatePdf')}
                      type="checkbox"
                      className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">
                      Generate PDF report
                    </span>
                  </label>
                  
                  <label className="flex items-center">
                    <input
                      {...register('emailReport')}
                      type="checkbox"
                      className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">
                      Email report when complete
                    </span>
                  </label>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex space-x-4">
              <button
                type="button"
                onClick={handleEstimate}
                disabled={estimateMutation.isLoading}
                className="btn btn-secondary"
              >
                {estimateMutation.isLoading ? (
                  <div className="spinner w-4 h-4 mr-2" />
                ) : (
                  <Brain className="w-4 h-4 mr-2" />
                )}
                Estimate Tokens
              </button>
              
              <button
                type="submit"
                disabled={generateMutation.isLoading}
                className="btn btn-primary flex-1"
              >
                {generateMutation.isLoading ? (
                  <div className="spinner w-4 h-4 mr-2" />
                ) : (
                  <FileText className="w-4 h-4 mr-2" />
                )}
                {generateMutation.isLoading ? 'Generating...' : 'Generate Consensus'}
              </button>
            </div>
          </form>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Token Estimate */}
          {tokenEstimate && (
            <div className="card">
              <div className="card-body">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">
                  Token Estimate
                </h3>
                
                <div className="text-center">
                  <div className="text-3xl font-bold text-primary-600 mb-2">
                    {tokenEstimate.toLocaleString()}
                  </div>
                  <div className="text-sm text-gray-600">
                    Estimated tokens required
                  </div>
                </div>
                
                <div className="mt-4 p-3 bg-gray-50 rounded-md">
                  <div className="text-xs text-gray-600">
                    <p>This is an estimate based on input length.</p>
                    <p>Actual usage may vary.</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Tips */}
          <div className="card">
            <div className="card-body">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">
                Tips for Better Results
              </h3>
              
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-start">
                  <CheckCircle className="w-4 h-4 text-success-600 mr-2 mt-0.5 flex-shrink-0" />
                  Provide diverse, high-quality sources
                </li>
                <li className="flex items-start">
                  <CheckCircle className="w-4 h-4 text-success-600 mr-2 mt-0.5 flex-shrink-0" />
                  Use clear, specific topics
                </li>
                <li className="flex items-start">
                  <CheckCircle className="w-4 h-4 text-success-600 mr-2 mt-0.5 flex-shrink-0" />
                  Include 3-5 sources for best results
                </li>
                <li className="flex items-start">
                  <AlertTriangle className="w-4 h-4 text-warning-600 mr-2 mt-0.5 flex-shrink-0" />
                  Longer content uses more tokens
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Results */}
      {lastResult && (
        <div className="card">
          <div className="card-body">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-gray-900">
                Consensus Analysis Results
              </h3>
              <div className="flex items-center space-x-3">
                <span className="badge badge-success">
                  {(lastResult.confidence * 100).toFixed(1)}% Confidence
                </span>
                <button className="btn btn-secondary btn-sm">
                  <Download className="w-4 h-4 mr-1" />
                  Download PDF
                </button>
              </div>
            </div>

            <div className="prose max-w-none">
              <div className="bg-gray-50 p-6 rounded-lg mb-6">
                <h4 className="text-lg font-medium text-gray-900 mb-3">
                  Consensus Analysis
                </h4>
                <p className="text-gray-700 leading-relaxed">
                  {lastResult.consensus}
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h5 className="font-medium text-blue-900 mb-2">
                    Confidence Level
                  </h5>
                  <div className="text-2xl font-bold text-blue-600">
                    {(lastResult.confidence * 100).toFixed(1)}%
                  </div>
                </div>

                <div className="bg-green-50 p-4 rounded-lg">
                  <h5 className="font-medium text-green-900 mb-2">
                    Tokens Used
                  </h5>
                  <div className="text-2xl font-bold text-green-600">
                    {lastResult.totalTokens.toLocaleString()}
                  </div>
                </div>
              </div>

              <div className="mt-6">
                <h5 className="font-medium text-gray-900 mb-3">
                  Source Analysis
                </h5>
                <div className="space-y-2">
                  {lastResult.sources.map((source, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
                      <span className="text-sm font-medium text-gray-700">
                        {source.provider} ({source.model})
                      </span>
                      <span className="text-sm text-gray-600">
                        {source.tokenUsage.toLocaleString()} tokens
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Overage Modal */}
      {showOverageModal && (
        <OverageModal
          isOpen={showOverageModal}
          onClose={() => setShowOverageModal(false)}
          onProceed={() => {
            setShowOverageModal(false);
            // Proceed with generation anyway
          }}
          estimatedCost={2.43}
          overageTokens={1200}
        />
      )}
    </div>
  );
}

export default EnhancedConsensusForm; 