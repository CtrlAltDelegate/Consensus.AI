import React, { useState, useEffect } from 'react';
import { apiHelpers } from '../config/api';

const PlanSelectionModal = ({ isOpen, onPlanSelected, onClose }) => {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [billingPeriod, setBillingPeriod] = useState('monthly');

  useEffect(() => {
    if (isOpen) {
      loadPlans();
    }
  }, [isOpen]);

  const loadPlans = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await apiHelpers.getAvailablePlans();
      if (response.data.success) {
        setPlans(response.data.plans);
        if (response.data.plans.length > 0) {
          setSelectedPlan(response.data.plans[0]);
        }
      }
    } catch (error) {
      console.error('Failed to load plans:', error);
      setError('Unable to load subscription plans. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectPlan = async () => {
    if (!selectedPlan) return;

    setLoading(true);
    try {
      const response = await apiHelpers.createCheckoutSession({
        tier: selectedPlan._id,
        billingPeriod: billingPeriod
      });

      if (response.data.url) {
        window.location.href = response.data.url;
      } else {
        throw new Error('No checkout URL received');
      }
    } catch (error) {
      console.error('Failed to start checkout:', error);
      setError('Unable to start checkout process. Please try again.');
      setLoading(false);
    }
  };

  const formatPrice = (plan) => {
    if (plan.billingType === 'per_report') {
      return `$${plan.pricePerReport}/report`;
    }
    const price = billingPeriod === 'monthly' ? plan.monthlyPrice : plan.yearlyPrice;
    return `$${price}/${billingPeriod === 'monthly' ? 'month' : 'year'}`;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Choose Your Plan
          </h2>
          <p className="text-gray-600">
            Select the plan that best fits your needs. You can change or cancel anytime.
          </p>
        </div>

        {error && (
          <div className="mx-6 mt-4 p-4 bg-red-50 border border-red-200 rounded-md">
            <p className="text-red-600">{error}</p>
          </div>
        )}

        <div className="p-6">
          <div className="flex justify-center mb-8">
            <div className="bg-gray-100 p-1 rounded-lg">
              <button
                onClick={() => setBillingPeriod('monthly')}
                className={`px-4 py-2 rounded-md font-medium transition-colors ${
                  billingPeriod === 'monthly'
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Monthly
              </button>
              <button
                onClick={() => setBillingPeriod('yearly')}
                className={`px-4 py-2 rounded-md font-medium transition-colors ${
                  billingPeriod === 'yearly'
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Yearly
                <span className="ml-1 text-green-600 text-sm">(Save 20%)</span>
              </button>
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {plans.map((plan) => (
                <div
                  key={plan._id}
                  className={`relative border-2 rounded-lg p-6 cursor-pointer transition-all ${
                    selectedPlan?._id === plan._id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => setSelectedPlan(plan)}
                >
                  {plan.name === 'Professional' && (
                    <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                      <span className="bg-blue-500 text-white px-3 py-1 rounded-full text-sm font-medium">
                        Recommended
                      </span>
                    </div>
                  )}
                  
                  <div className="text-center">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      {plan.displayName}
                    </h3>
                    
                    <div className="mb-4">
                      <span className="text-3xl font-bold text-gray-900">
                        {formatPrice(plan)}
                      </span>
                    </div>

                    <div className="space-y-3 text-sm text-gray-600">
                      {plan.billingType === 'per_report' ? (
                        <div>
                          <p>Pay only for what you use</p>
                          <p>No monthly commitment</p>
                        </div>
                      ) : (
                        <div>
                          <p>{plan.reportsIncluded} reports included</p>
                          <p>Additional reports: ${plan.pricePerReport}</p>
                        </div>
                      )}
                      
                      {plan.features && plan.features.length > 0 && (
                        <div className="pt-2 border-t border-gray-200">
                          {plan.features.slice(0, 3).map((feature, index) => (
                            <p key={index} className="flex items-center">
                              <span className="text-green-500 mr-2">✓</span>
                              {feature}
                            </p>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="p-6 border-t bg-gray-50 flex justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium"
            disabled={loading}
          >
            Cancel
          </button>
          
          <button
            onClick={handleSelectPlan}
            disabled={!selectedPlan || loading}
            className="bg-blue-600 text-white px-6 py-2 rounded-md font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Processing...' : `Continue with ${selectedPlan?.displayName || 'Plan'}`}
          </button>
        </div>
      </div>
    </div>
  );
};

export default PlanSelectionModal;
