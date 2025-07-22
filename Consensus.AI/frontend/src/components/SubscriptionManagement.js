import React, { useState } from 'react';
import { useQuery, useMutation } from 'react-query';
import { useStripe, useElements, CardElement } from '@stripe/react-stripe-js';
import { Check, CreditCard, Star, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';

// Mock API functions
const fetchSubscription = async () => {
  await new Promise(resolve => setTimeout(resolve, 1000));
  return {
    tier: 'pro',
    status: 'active',
    currentPeriodEnd: new Date('2024-02-01'),
    cancelAtPeriodEnd: false
  };
};

const fetchPlans = async () => {
  await new Promise(resolve => setTimeout(resolve, 500));
  return [
    {
      id: 'basic',
      name: 'Basic',
      description: 'Perfect for individuals getting started',
      tokenLimit: 10000,
      monthlyPrice: 19.99,
      yearlyPrice: 199.99,
      features: [
        '10,000 tokens per month',
        'Basic consensus analysis',
        'PDF report generation',
        'Email support'
      ]
    },
    {
      id: 'pro',
      name: 'Pro',
      description: 'Ideal for professionals and small teams',
      tokenLimit: 50000,
      monthlyPrice: 49.99,
      yearlyPrice: 499.99,
      features: [
        '50,000 tokens per month',
        'Advanced consensus analysis',
        'Priority processing',
        'PDF and email reports',
        'Priority support'
      ],
      popular: true
    },
    {
      id: 'enterprise',
      name: 'Enterprise',
      description: 'For large organizations with high volume needs',
      tokenLimit: 200000,
      monthlyPrice: 149.99,
      yearlyPrice: 1499.99,
      features: [
        '200,000 tokens per month',
        'Premium consensus analysis',
        'Custom integrations',
        'Advanced reporting',
        'Dedicated support',
        'SLA guarantee'
      ]
    }
  ];
};

function SubscriptionManagement() {
  const [billingPeriod, setBillingPeriod] = useState('monthly');
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);

  const stripe = useStripe();
  const elements = useElements();

  const { data: subscription, isLoading: subLoading } = useQuery(
    'subscription',
    fetchSubscription
  );

  const { data: plans, isLoading: plansLoading } = useQuery(
    'plans',
    fetchPlans
  );

  const updateSubscription = useMutation(
    async ({ planId, period }) => {
      // Mock API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      return { success: true };
    },
    {
      onSuccess: () => {
        toast.success('Subscription updated successfully!');
        setShowPaymentForm(false);
      },
      onError: () => {
        toast.error('Failed to update subscription');
      }
    }
  );

  const handlePlanSelect = (plan) => {
    if (plan.id === subscription?.tier) return;
    setSelectedPlan(plan);
    setShowPaymentForm(true);
  };

  const handlePayment = async () => {
    if (!stripe || !elements || !selectedPlan) return;

    const cardElement = elements.getElement(CardElement);
    
    updateSubscription.mutate({
      planId: selectedPlan.id,
      period: billingPeriod
    });
  };

  const getPrice = (plan) => {
    return billingPeriod === 'yearly' ? plan.yearlyPrice : plan.monthlyPrice;
  };

  const getSavings = (plan) => {
    const monthlyCost = plan.monthlyPrice * 12;
    const savings = monthlyCost - plan.yearlyPrice;
    return Math.round((savings / monthlyCost) * 100);
  };

  return (
    <div className="container-narrow space-y-8">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900">Subscription Management</h1>
        <p className="text-gray-600 mt-2">
          Choose the plan that best fits your needs
        </p>
      </div>

      {/* Current Subscription */}
      {subscription && (
        <div className="card">
          <div className="card-body">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  Current Plan: {subscription.tier.toUpperCase()}
                </h3>
                <p className="text-gray-600">
                  {subscription.status === 'active' ? 'Active' : 'Inactive'} • 
                  Renews on {subscription.currentPeriodEnd.toLocaleDateString()}
                </p>
              </div>
              <div className="text-right">
                <span className={`badge badge-${subscription.status === 'active' ? 'success' : 'gray'}`}>
                  {subscription.status}
                </span>
                {subscription.cancelAtPeriodEnd && (
                  <p className="text-sm text-warning-600 mt-1">
                    Cancels at period end
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Billing Period Toggle */}
      <div className="flex justify-center">
        <div className="bg-gray-100 p-1 rounded-lg">
          <button
            onClick={() => setBillingPeriod('monthly')}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
              billingPeriod === 'monthly'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Monthly
          </button>
          <button
            onClick={() => setBillingPeriod('yearly')}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
              billingPeriod === 'yearly'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Yearly
            <span className="ml-1 text-xs text-success-600 font-semibold">
              Save up to 17%
            </span>
          </button>
        </div>
      </div>

      {/* Plans */}
      {plansLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => (
            <div key={i} className="card">
              <div className="card-body">
                <div className="skeleton h-8 w-24 mb-4" />
                <div className="skeleton h-12 w-32 mb-4" />
                <div className="space-y-2 mb-6">
                  {[1, 2, 3, 4].map(j => (
                    <div key={j} className="skeleton h-4 w-full" />
                  ))}
                </div>
                <div className="skeleton h-10 w-full" />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {plans?.map((plan) => (
            <div
              key={plan.id}
              className={`card relative ${
                plan.popular ? 'ring-2 ring-primary-500' : ''
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <span className="bg-primary-600 text-white px-3 py-1 text-xs font-semibold rounded-full flex items-center">
                    <Star className="w-3 h-3 mr-1" />
                    Most Popular
                  </span>
                </div>
              )}
              
              <div className="card-body">
                <div className="text-center">
                  <h3 className="text-xl font-bold text-gray-900 mb-2">
                    {plan.name}
                  </h3>
                  <p className="text-gray-600 text-sm mb-4">
                    {plan.description}
                  </p>
                  
                  <div className="mb-6">
                    <div className="flex items-baseline justify-center">
                      <span className="text-4xl font-bold text-gray-900">
                        ${getPrice(plan)}
                      </span>
                      <span className="text-gray-600 ml-1">
                        /{billingPeriod === 'yearly' ? 'year' : 'month'}
                      </span>
                    </div>
                    
                    {billingPeriod === 'yearly' && (
                      <p className="text-sm text-success-600 mt-1">
                        Save {getSavings(plan)}% with yearly billing
                      </p>
                    )}
                  </div>
                  
                  <button
                    onClick={() => handlePlanSelect(plan)}
                    disabled={plan.id === subscription?.tier}
                    className={`w-full mb-6 ${
                      plan.id === subscription?.tier
                        ? 'btn btn-secondary'
                        : plan.popular
                        ? 'btn btn-primary'
                        : 'btn btn-ghost'
                    }`}
                  >
                    {plan.id === subscription?.tier
                      ? 'Current Plan'
                      : 'Select Plan'
                    }
                  </button>
                </div>
                
                <ul className="space-y-3">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-center text-sm">
                      <Check className="w-4 h-4 text-success-600 mr-3 flex-shrink-0" />
                      <span className="text-gray-700">{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Payment Form Modal */}
      {showPaymentForm && selectedPlan && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Upgrade to {selectedPlan.name}
              </h3>
              <button
                onClick={() => setShowPaymentForm(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ×
              </button>
            </div>
            
            <div className="mb-6">
              <div className="bg-gray-50 p-4 rounded-lg mb-4">
                <div className="flex justify-between items-center">
                  <span className="font-medium">{selectedPlan.name} Plan</span>
                  <span className="font-bold">
                    ${getPrice(selectedPlan)}/{billingPeriod === 'yearly' ? 'year' : 'month'}
                  </span>
                </div>
                <p className="text-sm text-gray-600 mt-1">
                  {selectedPlan.tokenLimit.toLocaleString()} tokens per month
                </p>
              </div>
              
              <div className="border p-3 rounded-md">
                <CardElement
                  options={{
                    style: {
                      base: {
                        fontSize: '16px',
                        color: '#424770',
                        '::placeholder': {
                          color: '#aab7c4',
                        },
                      },
                    },
                  }}
                />
              </div>
            </div>
            
            <div className="flex space-x-3">
              <button
                onClick={() => setShowPaymentForm(false)}
                className="btn btn-secondary flex-1"
              >
                Cancel
              </button>
              <button
                onClick={handlePayment}
                disabled={updateSubscription.isLoading || !stripe}
                className="btn btn-primary flex-1"
              >
                {updateSubscription.isLoading ? (
                  <div className="spinner w-4 h-4 mr-2" />
                ) : (
                  <CreditCard className="w-4 h-4 mr-2" />
                )}
                {updateSubscription.isLoading ? 'Processing...' : 'Subscribe'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default SubscriptionManagement; 