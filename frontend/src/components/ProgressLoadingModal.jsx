import React, { useState } from 'react';

const DEFAULT_STAGES = [
  { id: 'phase1', title: 'Independent Drafting', description: 'Generating initial responses from AI models...', icon: '🤖' },
  { id: 'phase2', title: 'Peer Review', description: 'Cross-reviewing and analyzing drafts...', icon: '🔍' },
  { id: 'phase3', title: 'Final Arbitration', description: 'Synthesizing consensus...', icon: '⚖️' }
];

function ProgressLoadingModal({ isVisible, onClose, stages, currentStage, completedResult }) {
  const list = stages || DEFAULT_STAGES;
  const currentIndex = Math.max(0, list.findIndex((s) => s.id === currentStage));
  const showReport = completedResult && typeof completedResult.consensus === 'string';

  if (!isVisible) return null;

  if (showReport) {
    return (
      <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] flex flex-col overflow-hidden">
          <div className="bg-gradient-to-r from-emerald-50 to-indigo-50 px-6 py-4 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600">✓</div>
              <div>
                <h2 className="text-lg font-bold text-slate-900">Report ready</h2>
                <p className="text-slate-600 text-sm">Your consensus report is below</p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-800 font-medium transition-colors"
            >
              Close
            </button>
          </div>
          <div className="flex-1 overflow-y-auto px-6 py-4 min-h-0">
            <div className="prose prose-slate max-w-none text-slate-700 whitespace-pre-wrap text-sm leading-relaxed">
              {completedResult.consensus}
            </div>
            {!completedResult.error && (
              <div className="mt-6 pt-4 border-t border-slate-200 flex flex-wrap gap-4 text-sm">
                <span className="text-slate-600">Confidence: <strong className="text-slate-900">{((completedResult.confidence || 0) * 100).toFixed(1)}%</strong></span>
                {completedResult.llmsUsed?.length > 0 && (
                  <span className="text-slate-600">Models: <strong className="text-slate-900">{completedResult.llmsUsed.join(', ')}</strong></span>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full overflow-hidden">
        <div className="bg-gradient-to-r from-indigo-50 to-violet-50 px-6 py-6 text-center">
          <div className="w-14 h-14 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
          </div>
          <h2 className="text-lg font-bold text-slate-900">Generating Consensus Report</h2>
          <p className="text-slate-600 text-sm mt-1">Analyzing your question across multiple AI models</p>
        </div>

        <div className="px-6 py-4 space-y-3">
          {list.map((stage, index) => {
            const done = index < currentIndex;
            const current = index === currentIndex;
            return (
              <div key={stage.id} className={`flex items-center gap-3 ${current ? 'opacity-100' : index > currentIndex ? 'opacity-50' : 'opacity-80'}`}>
                <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ${
                  done ? 'bg-emerald-100 text-emerald-600' : current ? 'bg-indigo-100 text-indigo-600' : 'bg-slate-100 text-slate-400'
                }`}>
                  {done ? <span className="text-sm">✓</span> : current ? (
                    <div className="w-4 h-4 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <span className="text-sm">{stage.icon}</span>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="font-medium text-slate-800">{stage.title}</div>
                  <div className="text-xs text-slate-500">{stage.description}</div>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded ${done ? 'bg-emerald-100 text-emerald-700' : current ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-500'}`}>
                  {done ? 'Done' : current ? 'In progress' : 'Pending'}
                </span>
              </div>
            );
          })}
        </div>

        <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 text-center text-xs text-slate-500">
          GPT-4o · Claude · Gemini · Command R+
        </div>
      </div>
    </div>
  );
}

export function useProgressModal() {
  const [isVisible, setIsVisible] = useState(false);
  const [currentStage, setCurrentStage] = useState('phase1');
  const [estimatedTime, setEstimatedTime] = useState(90);
  const [completedResult, setCompletedResult] = useState(null);

  const showProgress = (stage = 'phase1', time = 90) => {
    setCompletedResult(null);
    setCurrentStage(stage);
    setEstimatedTime(time);
    setIsVisible(true);
  };

  const updateStage = (stage) => setCurrentStage(stage);

  const showReport = (result) => {
    setCompletedResult(result || null);
    setCurrentStage('phase3');
    setIsVisible(true);
  };

  const hideProgress = () => {
    setIsVisible(false);
    setCompletedResult(null);
  };

  return { isVisible, currentStage, estimatedTime, completedResult, showProgress, updateStage, showReport, hideProgress };
}

export default ProgressLoadingModal;
