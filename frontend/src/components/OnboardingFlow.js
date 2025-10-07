import React, { useState, useEffect } from 'react';
import { apiHelpers } from '../config/api';

const OnboardingFlow = ({ user, isOpen, onComplete, onClose }) => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [plans, setPlans] = useState([]);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [billingPeriod, setBillingPeriod] = useState('monthly');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Slides configuration
  const slides = [
    {
      id: 'welcome',
      title: 'Welcome to Consensus.AI! 🎉',
      type: 'intro',
      content: {
        subtitle: 'Get unbiased analysis from 4 leading AI models',
        points: [
          '🤖 Powered by GPT-4, Claude, Gemini, and Cohere',
          '📊 Comprehensive consensus analysis',
          '🎯 Perfect for research and business decisions',
          '⚡ Get started in under 2 minutes'
        ]
      }
    },
    {
      id: 'navigation',
      title: 'Quick Navigation Tour 🧭',
      type: 'tutorial',
      content: {
        subtitle: 'Master the platform in 30 seconds',
        steps: [
          {
            icon: '📝',
            title: 'Create Reports',
            description: 'Use the main form to submit your questions or topics'
          },
          {
            icon: '📊',
            title: 'View Dashboard',
            description: 'Track your usage, view past reports, and manage settings'
          },
          {
            icon: '💳',
            title: 'Billing & Plans',
            description: 'Upgrade plans, view usage, and manage payment methods'
          },
          {
            icon: '❓',
            title: 'Get Help',
            description: 'Access our knowledge base and contact support'
          }
        ]
      }
    },
    {
      id: 'report-tutorial',
      title: 'Generate Powerful Reports 🚀',
      type: 'tutorial',
      content: {
        subtitle: 'How to get the best consensus analysis',
        tips: [
          {
            icon: '🎯',
            title: 'Be Specific',
            description: 'Clear, detailed questions get better analysis',
            example: '"What are the pros and cons of remote work for tech startups?"'
          },
          {
            icon: '📋',
            title: 'Provide Context',
            description: 'Include relevant background information',
            example: 'Industry, company size, specific constraints'
          },
          {
            icon: '🔍',
            title: 'Review Results',
            description: 'Each AI model provides unique insights - compare them all',
            example: 'Look for consensus points and differing perspectives'
          }
        ]
      }
    },
    {
      id: 'plan-selection',
      title: 'Choose Your Plan 💳',
      type: 'payment',
      content: {
        subtitle: 'Select the plan that fits your needs',
        note: '⚠️ Payment setup is required to access the platform',
        highlight: 'We need your billing information to ensure uninterrupted service'
      }
    }
  ];

  useEffect(() => {
    if (currentSlide === slides.length - 1) {
      loadPlans();
    }
  }, [currentSlide]);

  const loadPlans = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await apiHelpers.getAvailablePlans();
      if (response.data.success) {
        setPlans(response.data.plans);
        // Auto-select Professional plan as recommended
        const professional = response.data.plans.find(p => p.name === 'Professional');
        if (professional) {
          setSelectedPlan(professional);
        } else if (response.data.plans.length > 0) {
          setSelectedPlan(response.data.plans[0]);
        }
      }
    } catch (err) {
      console.error('Failed to load plans:', err);
      setError('Unable to load subscription plans. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleNext = () => {
    if (currentSlide < slides.length - 1) {
      setCurrentSlide(currentSlide + 1);
    }
  };

  const handleBack = () => {
    if (currentSlide > 0) {
      setCurrentSlide(currentSlide - 1);
    }
  };

  const handlePlanSelection = async () => {
    if (!selectedPlan) {
      setError('Please select a plan to continue');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Create checkout session - this will redirect to Stripe
      const response = await apiHelpers.createCheckoutSession({
        tier: selectedPlan._id,
        billingPeriod: billingPeriod
      });

      if (response.data.url) {
        // For demo users, handle mock success
        if (response.data.url.includes('demo=success')) {
          console.log('🧪 Demo checkout completed');
          onComplete();
          return;
        }
        
        // Redirect to Stripe for real payment
        window.location.href = response.data.url;
      } else {
        throw new Error('No checkout URL received');
      }
    } catch (error) {
      console.error('Failed to start checkout:', error);
      setError(error.response?.data?.error || 'Unable to start checkout process. Please try again.');
      setLoading(false);
    }
  };

  const getPriceDisplay = (plan) => {
    if (plan.billingType === 'per_report') {
      return `$${plan.pricePerReport} / report`;
    }
    const price = billingPeriod === 'monthly' ? plan.monthlyPrice : plan.yearlyPrice;
    return `$${price}/${billingPeriod === 'monthly' ? 'month' : 'year'}`;
  };

  const getRecommendedBadge = (plan) => {
    if (plan.name === 'Professional') {
      return (
        <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
          <span className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-3 py-1 rounded-full text-sm font-medium">
            🏆 Best Value
          </span>
        </div>
      );
    }
    return null;
  };

  const renderSlide = () => {
    const slide = slides[currentSlide];

    switch (slide.type) {
      case 'intro':
        return (
          <div className="text-center">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">{slide.title}</h1>
            <p className="text-xl text-gray-600 mb-8">{slide.content.subtitle}</p>
            <div className="space-y-4 max-w-md mx-auto">
              {slide.content.points.map((point, index) => (
                <div key={index} className="flex items-center text-left p-3 bg-blue-50 rounded-lg">
                  <span className="text-2xl mr-3">{point.split(' ')[0]}</span>
                  <span className="text-gray-700">{point.substring(point.indexOf(' ') + 1)}</span>
                </div>
              ))}
            </div>
          </div>
        );

      case 'tutorial':
        if (slide.id === 'navigation') {
          return (
            <div className="text-center">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">{slide.title}</h2>
              <p className="text-lg text-gray-600 mb-8">{slide.content.subtitle}</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
                {slide.content.steps.map((step, index) => (
                  <div key={index} className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
                    <div className="text-4xl mb-3">{step.icon}</div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">{step.title}</h3>
                    <p className="text-gray-600">{step.description}</p>
                  </div>
                ))}
              </div>
            </div>
          );
        } else {
          return (
            <div className="text-center">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">{slide.title}</h2>
              <p className="text-lg text-gray-600 mb-8">{slide.content.subtitle}</p>
              <div className="space-y-6 max-w-3xl mx-auto">
                {slide.content.tips.map((tip, index) => (
                  <div key={index} className="bg-white p-6 rounded-lg shadow-md border border-gray-200 text-left">
                    <div className="flex items-start">
                      <div className="text-3xl mr-4 mt-1">{tip.icon}</div>
                      <div className="flex-1">
                        <h3 className="text-xl font-semibold text-gray-900 mb-2">{tip.title}</h3>
                        <p className="text-gray-600 mb-3">{tip.description}</p>
                        <div className="bg-blue-50 p-3 rounded border-l-4 border-blue-400">
                          <p className="text-sm text-blue-800 italic">💡 {tip.example}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        }

      case 'payment':
        return (
          <div className="text-center">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">{slide.title}</h2>
            <p className="text-lg text-gray-600 mb-4">{slide.content.subtitle}</p>
            
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 max-w-2xl mx-auto">
              <div className="flex items-center justify-center mb-2">
                <span className="text-red-500 text-xl mr-2">⚠️</span>
                <span className="font-semibold text-red-800">Payment Required</span>
              </div>
              <p className="text-red-700">{slide.content.highlight}</p>
            </div>

            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-4 text-gray-600">Loading plans...</p>
              </div>
            ) : error ? (
              <div className="text-center py-8 text-red-500">{error}</div>
            ) : (
              <>
                <div className="flex justify-center mb-6">
                  <div className="relative inline-flex rounded-md shadow-sm">
                    <button
                      onClick={() => setBillingPeriod('monthly')}
                      className={`px-4 py-2 text-sm font-medium rounded-l-md ${
                        billingPeriod === 'monthly' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                      }`}
                    >
                      Monthly
                    </button>
                    <button
                      onClick={() => setBillingPeriod('yearly')}
                      className={`px-4 py-2 text-sm font-medium rounded-r-md ${
                        billingPeriod === 'yearly' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                      }`}
                    >
                      Yearly (Save 20%)
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8 max-w-6xl mx-auto">
                  {plans.map((plan) => (
                    <div
                      key={plan.id}
                      className={`relative p-4 border rounded-lg shadow-sm cursor-pointer transition-all duration-200 ${
                        selectedPlan?.id === plan.id ? 'border-blue-600 ring-2 ring-blue-600 bg-blue-50' : 'border-gray-300 hover:border-gray-400 bg-white'
                      }`}
                      onClick={() => setSelectedPlan(plan)}
                    >
                      {getRecommendedBadge(plan)}
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">{plan.displayName}</h3>
                      <p className="text-gray-500 text-sm mb-3">{plan.description}</p>
                      <div className="text-2xl font-bold text-gray-900 mb-3">
                        {getPriceDisplay(plan)}
                      </div>
                      <ul className="space-y-1 text-gray-600 text-sm">
                        {plan.features.slice(0, 3).map((feature, index) => (
                          <li key={index} className="flex items-center">
                            <svg className="w-3 h-3 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                            </svg>
                            {feature}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>

                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6 max-w-2xl mx-auto">
                  <p className="text-yellow-800 text-sm">
                    🔒 <strong>Secure Payment:</strong> Your payment information is processed securely by Stripe. 
                    You can cancel or change your plan anytime.
                  </p>
                </div>
              </>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-y-auto relative">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-8 py-4 flex justify-between items-center">
          <div className="flex items-center">
            <span className="text-2xl font-bold text-blue-600">Consensus.AI</span>
            <span className="ml-4 text-sm text-gray-500">
              Step {currentSlide + 1} of {slides.length}
            </span>
          </div>
          
          {/* Progress bar */}
          <div className="flex-1 mx-8">
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${((currentSlide + 1) / slides.length) * 100}%` }}
              ></div>
            </div>
          </div>

          {/* Close button - disabled during payment step */}
          <button
            onClick={onClose}
            disabled={currentSlide === slides.length - 1}
            className={`text-2xl ${
              currentSlide === slides.length - 1 
                ? 'text-gray-300 cursor-not-allowed' 
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            &times;
          </button>
        </div>

        {/* Content */}
        <div className="px-8 py-12">
          {renderSlide()}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-white border-t border-gray-200 px-8 py-4 flex justify-between items-center">
          <button
            onClick={handleBack}
            disabled={currentSlide === 0}
            className={`px-4 py-2 rounded-md ${
              currentSlide === 0
                ? 'text-gray-400 cursor-not-allowed'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            ← Back
          </button>

          <div className="flex space-x-2">
            {slides.map((_, index) => (
              <div
                key={index}
                className={`w-2 h-2 rounded-full ${
                  index === currentSlide ? 'bg-blue-600' : 'bg-gray-300'
                }`}
              ></div>
            ))}
          </div>

          {currentSlide < slides.length - 1 ? (
            <button
              onClick={handleNext}
              className="bg-blue-600 text-white px-6 py-2 rounded-md font-medium hover:bg-blue-700"
            >
              Next →
            </button>
          ) : (
            <button
              onClick={handlePlanSelection}
              disabled={!selectedPlan || loading}
              className="bg-green-600 text-white px-8 py-3 rounded-md font-medium hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-lg"
            >
              {loading ? 'Processing...' : `💳 Setup Billing & Start Using Consensus.AI`}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default OnboardingFlow;