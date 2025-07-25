import React from 'react';
import { AlertTriangle, CreditCard, TrendingUp } from 'lucide-react';

function OverageModal({ 
  isOpen, 
  onClose, 
  onProceed, 
  estimatedCost, 
  overageTokens,
  currentUsage = { used: 48500, limit: 50000, tier: 'pro' }
}) {
  if (!isOpen) return null;

  const remainingTokens = currentUsage.limit - currentUsage.used;
  const usagePercentage = (currentUsage.used / currentUsage.limit) * 100;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-md w-full p-6">
        {/* Header */}
        <div className="flex items-center mb-4">
          <div className="w-12 h-12 bg-warning-100 rounded-full flex items-center justify-center mr-4">
            <AlertTriangle className="w-6 h-6 text-warning-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              Token Overage Warning
            </h3>
            <p className="text-sm text-gray-600">
              This operation will exceed your token limit
            </p>
          </div>
        </div>

        {/* Current Usage */}
        <div className="mb-6">
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="text-sm font-medium text-gray-900 mb-3">
              Current Usage ({currentUsage.tier.toUpperCase()} Plan)
            </h4>
            
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Used</span>
                <span className="font-medium">
                  {currentUsage.used.toLocaleString()} tokens
                </span>
              </div>
              
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Remaining</span>
                <span className="font-medium">
                  {remainingTokens.toLocaleString()} tokens
                </span>
              </div>
              
              <div className="progress">
                <div
                  className="progress-warning"
                  style={{ width: `${Math.min(usagePercentage, 100)}%` }}
                />
              </div>
              
              <div className="text-center text-sm text-gray-600">
                {usagePercentage.toFixed(1)}% of monthly limit used
              </div>
            </div>
          </div>
        </div>

        {/* Overage Details */}
        <div className="mb-6">
          <h4 className="text-sm font-medium text-gray-900 mb-3">
            Overage Details
          </h4>
          
          <div className="space-y-3">
            <div className="flex justify-between items-center p-3 bg-warning-50 border border-warning-200 rounded-md">
              <div>
                <div className="text-sm font-medium text-warning-800">
                  Overage Tokens
                </div>
                <div className="text-xs text-warning-600">
                  Tokens beyond your limit
                </div>
              </div>
              <div className="text-lg font-bold text-warning-700">
                {overageTokens.toLocaleString()}
              </div>
            </div>
            
            <div className="flex justify-between items-center p-3 bg-error-50 border border-error-200 rounded-md">
              <div>
                <div className="text-sm font-medium text-error-800">
                  Estimated Cost
                </div>
                <div className="text-xs text-error-600">
                  $0.001 per overage token
                </div>
              </div>
              <div className="text-lg font-bold text-error-700">
                ${estimatedCost.toFixed(2)}
              </div>
            </div>
          </div>
        </div>

        {/* Recommendations */}
        <div className="mb-6">
          <h4 className="text-sm font-medium text-gray-900 mb-3">
            Recommendations
          </h4>
          
          <div className="space-y-2">
            <div className="flex items-start p-3 bg-blue-50 border border-blue-200 rounded-md">
              <TrendingUp className="w-4 h-4 text-blue-600 mr-2 mt-0.5 flex-shrink-0" />
              <div className="text-sm">
                <div className="font-medium text-blue-800">
                  Upgrade Your Plan
                </div>
                <div className="text-blue-700">
                  Get more tokens and avoid overage charges
                </div>
              </div>
            </div>
            
            <div className="flex items-start p-3 bg-gray-50 border border-gray-200 rounded-md">
              <CreditCard className="w-4 h-4 text-gray-600 mr-2 mt-0.5 flex-shrink-0" />
              <div className="text-sm">
                <div className="font-medium text-gray-800">
                  Wait for Reset
                </div>
                <div className="text-gray-700">
                  Your tokens reset on the 1st of each month
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex space-x-3">
          <button
            onClick={onClose}
            className="btn btn-secondary flex-1"
          >
            Cancel
          </button>
          
          <button
            onClick={onProceed}
            className="btn btn-warning flex-1"
          >
            Proceed with Overage
          </button>
        </div>

        {/* Fine Print */}
        <div className="mt-4 text-xs text-gray-500 text-center">
          Overage charges will be added to your next invoice
        </div>
      </div>
    </div>
  );
}

export default OverageModal; 