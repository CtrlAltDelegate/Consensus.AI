import React, { useState } from 'react';

function PricingPage({ onGetStarted }) {
  const [billingPeriod, setBillingPeriod] = useState('monthly');

  const plans = [
    {
      id: 'payasyougo',
      name: 'Pay-As-You-Go',
      description: 'Perfect for occasional analysis',
      price: { monthly: 15, yearly: 15 },
      priceUnit: 'per report',
      features: [
        'No monthly commitment',
        'Pay only for what you use',
        '4-LLM consensus analysis',
        'Professional PDF reports',
        'Report history & storage',
        'Email support',
        'GDPR compliant data handling'
      ],
      limitations: [],
      popular: false,
      cta: 'Start Analysis',
      highlight: 'No subscription required'
    },
    {
      id: 'starter',
      name: 'Starter',
      description: 'Great for individuals and small teams',
      price: { monthly: 29, yearly: 290 },
      priceUnit: 'per month',
      reportsIncluded: 3,
      overageRate: 12,
      features: [
        '3 reports per month included',
        '$12 per additional report',
        '4-LLM consensus analysis',
        'Professional PDF reports',
        'Report history & storage',
        'Priority email support',
        'Advanced export options',
        'GDPR compliant data handling'
      ],
      limitations: [],
      popular: false,
      cta: 'Start Free Trial',
      highlight: '7-day free trial'
    },
    {
      id: 'professional',
      name: 'Professional',
      description: 'Best for researchers and consultants',
      price: { monthly: 79, yearly: 790 },
      priceUnit: 'per month',
      reportsIncluded: 10,
      overageRate: 10,
      features: [
        '10 reports per month included',
        '$10 per additional report',
        '4-LLM consensus analysis',
        'Professional PDF reports',
        'Unlimited report history',
        'Priority support & phone',
        'Advanced export options',
        'Custom report branding',
        'API access (coming soon)',
        'GDPR compliant data handling'
      ],
      limitations: [],
      popular: true,
      cta: 'Start Free Trial',
      highlight: '7-day free trial'
    },
    {
      id: 'business',
      name: 'Business',
      description: 'For teams and organizations',
      price: { monthly: 199, yearly: 1990 },
      priceUnit: 'per month',
      reportsIncluded: 30,
      overageRate: 8,
      features: [
        '30 reports per month included',
        '$8 per additional report',
        '4-LLM consensus analysis',
        'Professional PDF reports',
        'Unlimited report history',
        'Dedicated account manager',
        'Advanced export options',
        'Custom report branding',
        'Priority API access',
        'Team collaboration tools',
        'SSO integration (coming soon)',
        'GDPR compliant data handling'
      ],
      limitations: [],
      popular: false,
      cta: 'Contact Sales',
      highlight: 'Custom onboarding'
    }
  ];

  const getDisplayPrice = (plan) => {
    if (plan.id === 'payasyougo') {
      return `$${plan.price.monthly}`;
    }
    
    const price = billingPeriod === 'yearly' ? plan.price.yearly : plan.price.monthly;
    if (billingPeriod === 'yearly') {
      return `$${Math.round(price / 12)}`;
    }
    return `$${price}`;
  };

  const getYearlySavings = (plan) => {
    if (plan.id === 'payasyougo') return null;
    const monthlyCost = plan.price.monthly * 12;
    const yearlyCost = plan.price.yearly;
    const savings = monthlyCost - yearlyCost;
    const percentage = Math.round((savings / monthlyCost) * 100);
    return { amount: savings, percentage };
  };

  return React.createElement('div', { className: 'min-h-screen bg-gradient-to-br from-indigo-50 to-violet-50' },
    // Header
    React.createElement('div', { className: 'bg-white border-b border-slate-200' },
      React.createElement('div', { className: 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8' },
        React.createElement('div', { className: 'text-center' },
          React.createElement('h1', { className: 'text-4xl font-bold text-slate-900 mb-4' },
            'Simple, Transparent Pricing'
          ),
          React.createElement('p', { className: 'text-xl text-slate-600 max-w-2xl mx-auto mb-8' },
            'Choose the plan that fits your needs. All plans include our full 4-LLM consensus analysis.'
          ),
          
          // Billing toggle
          React.createElement('div', { className: 'flex items-center justify-center mb-8' },
            React.createElement('div', { className: 'bg-slate-100 p-1 rounded-lg flex' },
              React.createElement('button', {
                onClick: () => setBillingPeriod('monthly'),
                className: `px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  billingPeriod === 'monthly' 
                    ? 'bg-white text-slate-900 shadow-sm' 
                    : 'text-slate-600 hover:text-slate-900'
                }`
              }, 'Monthly'),
              React.createElement('button', {
                onClick: () => setBillingPeriod('yearly'),
                className: `px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  billingPeriod === 'yearly' 
                    ? 'bg-white text-slate-900 shadow-sm' 
                    : 'text-slate-600 hover:text-slate-900'
                }`
              }, 'Yearly'),
              billingPeriod === 'yearly' && React.createElement('span', { 
                className: 'ml-2 px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full' 
              }, 'Save up to 17%')
            )
          )
        )
      )
    ),

    // Pricing Cards
    React.createElement('div', { className: 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16' },
      React.createElement('div', { className: 'grid lg:grid-cols-4 md:grid-cols-2 gap-8' },
        ...plans.map(plan => 
          React.createElement('div', { 
            key: plan.id,
            className: `relative bg-white rounded-2xl shadow-sm border-2 p-8 ${
              plan.popular 
                ? 'border-indigo-500 ring-2 ring-indigo-200' 
                : 'border-slate-200 hover:border-slate-300'
            } transition-all duration-200`
          },
            // Popular badge
            plan.popular && React.createElement('div', { 
              className: 'absolute -top-4 left-1/2 transform -translate-x-1/2' 
            },
              React.createElement('span', { 
                className: 'bg-indigo-500 text-white px-4 py-1 rounded-full text-sm font-medium' 
              }, 'Most Popular')
            ),

            // Plan header
            React.createElement('div', { className: 'text-center mb-8' },
              React.createElement('h3', { className: 'text-2xl font-bold text-slate-900 mb-2' }, plan.name),
              React.createElement('p', { className: 'text-slate-600 mb-4' }, plan.description),
              
              // Price
              React.createElement('div', { className: 'mb-4' },
                React.createElement('span', { className: 'text-4xl font-bold text-slate-900' }, 
                  getDisplayPrice(plan)
                ),
                React.createElement('span', { className: 'text-slate-600 ml-2' }, plan.priceUnit),
                
                // Yearly savings
                billingPeriod === 'yearly' && plan.id !== 'payasyougo' && (() => {
                  const savings = getYearlySavings(plan);
                  return savings && React.createElement('div', { className: 'text-sm text-green-600 mt-1' },
                    `Save $${savings.amount}/year (${savings.percentage}% off)`
                  );
                })()
              ),

              // Reports included
              plan.reportsIncluded && React.createElement('div', { className: 'text-sm text-slate-600' },
                `${plan.reportsIncluded} reports included`,
                plan.overageRate && React.createElement('div', { className: 'text-xs text-slate-500 mt-1' },
                  `$${plan.overageRate} per additional report`
                )
              ),

              // Highlight
              plan.highlight && React.createElement('div', { 
                className: 'mt-3 px-3 py-1 bg-indigo-50 text-indigo-700 text-sm rounded-full inline-block' 
              }, plan.highlight)
            ),

            // Features
            React.createElement('ul', { className: 'space-y-3 mb-8' },
              ...plan.features.map((feature, index) =>
                React.createElement('li', { key: index, className: 'flex items-start' },
                  React.createElement('svg', { 
                    className: 'w-5 h-5 text-green-500 mr-3 mt-0.5 flex-shrink-0', 
                    fill: 'currentColor', 
                    viewBox: '0 0 20 20' 
                  },
                    React.createElement('path', { 
                      fillRule: 'evenodd', 
                      d: 'M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z', 
                      clipRule: 'evenodd' 
                    })
                  ),
                  React.createElement('span', { className: 'text-slate-600 text-sm' }, feature)
                )
              )
            ),

            // CTA Button
            React.createElement('button', {
              onClick: () => onGetStarted(plan),
              className: `w-full py-3 px-4 rounded-lg font-medium transition-colors ${
                plan.popular
                  ? 'bg-indigo-600 text-white hover:bg-indigo-700'
                  : 'bg-slate-100 text-slate-900 hover:bg-slate-200'
              }`
            }, plan.cta)
          )
        )
      )
    ),

    // FAQ Section
    React.createElement('div', { className: 'bg-white' },
      React.createElement('div', { className: 'max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16' },
        React.createElement('h2', { className: 'text-3xl font-bold text-center text-slate-900 mb-12' }, 
          'Frequently Asked Questions'
        ),
        
        React.createElement('div', { className: 'space-y-8' },
          React.createElement('div', null,
            React.createElement('h3', { className: 'text-lg font-semibold text-slate-900 mb-2' },
              'What exactly is included in a consensus analysis?'
            ),
            React.createElement('p', { className: 'text-slate-600' },
              'Each analysis includes independent analysis from GPT-4, Claude, and Gemini, followed by peer review and final arbitration by Cohere. You receive a comprehensive PDF report with confidence scores, methodology details, and professional formatting.'
            )
          ),
          
          React.createElement('div', null,
            React.createElement('h3', { className: 'text-lg font-semibold text-slate-900 mb-2' },
              'How long does an analysis take?'
            ),
            React.createElement('p', { className: 'text-slate-600' },
              'Most analyses complete in 60-90 seconds. Complex topics with multiple sources may take up to 3 minutes. You\'ll see real-time progress updates throughout the process.'
            )
          ),
          
          React.createElement('div', null,
            React.createElement('h3', { className: 'text-lg font-semibold text-slate-900 mb-2' },
              'Can I cancel my subscription anytime?'
            ),
            React.createElement('p', { className: 'text-slate-600' },
              'Yes, you can cancel your subscription at any time. Your access continues until the end of your current billing period, and you can still access all your past reports.'
            )
          ),
          
          React.createElement('div', null,
            React.createElement('h3', { className: 'text-lg font-semibold text-slate-900 mb-2' },
              'What file types can I upload as sources?'
            ),
            React.createElement('p', { className: 'text-slate-600' },
              'We support PDF, TXT, CSV, and JSON files up to 10MB each. You can upload up to 5 files per analysis, and we\'ll extract and analyze the text content automatically.'
            )
          ),
          
          React.createElement('div', null,
            React.createElement('h3', { className: 'text-lg font-semibold text-slate-900 mb-2' },
              'Is my data secure and private?'
            ),
            React.createElement('p', { className: 'text-slate-600' },
              'Absolutely. We\'re GDPR compliant, use enterprise-grade encryption, and never store your analysis content longer than necessary. You can export or delete your data at any time.'
            )
          ),
          
          React.createElement('div', null,
            React.createElement('h3', { className: 'text-lg font-semibold text-slate-900 mb-2' },
              'Do you offer refunds?'
            ),
            React.createElement('p', { className: 'text-slate-600' },
              'We offer a 7-day free trial for subscription plans. Pay-as-you-go reports are non-refundable once generated, but we\'ll work with you if there are technical issues with your analysis.'
            )
          )
        )
      )
    ),

    // Final CTA
    React.createElement('div', { className: 'bg-gradient-to-r from-indigo-600 to-violet-600' },
      React.createElement('div', { className: 'max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center' },
        React.createElement('h2', { className: 'text-3xl font-bold text-white mb-4' },
          'Ready to Get Unbiased AI Analysis?'
        ),
        React.createElement('p', { className: 'text-xl text-indigo-100 mb-8' },
          'Join researchers, analysts, and business leaders who trust Consensus.AI'
        ),
        React.createElement('button', {
          onClick: () => onGetStarted(),
          className: 'bg-white text-indigo-600 px-8 py-3 rounded-lg hover:bg-gray-100 transition-colors duration-200 font-medium text-lg'
        }, 'Start Your Free Analysis'),
        React.createElement('p', { className: 'text-sm text-indigo-200 mt-4' },
          'No credit card required • Get started in 30 seconds'
        )
      )
    )
  );
}

export default PricingPage;
