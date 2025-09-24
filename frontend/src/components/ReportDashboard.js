import React, { useState, useEffect } from 'react';
import { useUser } from '../contexts/UserContext';
import { apiHelpers } from '../config/api';
import { HelpIcon, InfoIcon } from './Tooltip';

function ReportDashboard() {
  const { user, isAuthenticated } = useUser();
  const [subscriptionData, setSubscriptionData] = useState(null);
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isAuthenticated) {
      loadDashboardData();
    }
  }, [isAuthenticated]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [subscriptionResponse, plansResponse] = await Promise.all([
        apiHelpers.getSubscription(),
        apiHelpers.getAvailablePlans()
      ]);

      setSubscriptionData(subscriptionResponse.data.subscription);
      setPlans(plansResponse.data.plans);
    } catch (err) {
      console.error('Error loading dashboard data:', err);
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const handleUpgrade = async (planId) => {
    try {
      const response = await apiHelpers.createCheckoutSession({
        tierId: planId,
        billingPeriod: 'monthly'
      });
      
      if (response.data.url) {
        window.location.href = response.data.url;
      }
    } catch (err) {
      console.error('Error creating checkout session:', err);
      setError('Failed to start upgrade process');
    }
  };

  if (!isAuthenticated) {
    return React.createElement('div', { className: 'min-h-screen bg-slate-50/50 flex items-center justify-center' },
      React.createElement('div', { className: 'text-center' },
        React.createElement('h2', { className: 'text-2xl font-bold text-slate-900 mb-4' }, 'Please Login'),
        React.createElement('p', { className: 'text-slate-600' }, 'You need to be logged in to view your dashboard.')
      )
    );
  }

  if (loading) {
    return React.createElement('div', { className: 'min-h-screen bg-slate-50/50 flex items-center justify-center' },
      React.createElement('div', { className: 'animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600' })
    );
  }

  const currentTier = subscriptionData?.tier;
  const reportUsage = subscriptionData?.reportUsage;
  const isPayAsYouGo = currentTier?.billingType === 'per_report';

  return React.createElement('div', { className: 'min-h-screen bg-slate-50/50' },
    React.createElement('div', { className: 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8' },
      
      // Header Section
      React.createElement('div', { className: 'mb-10' },
        React.createElement('div', { className: 'flex items-center justify-between' },
          React.createElement('div', null,
            React.createElement('h1', { className: 'text-3xl font-bold text-slate-900 tracking-tight' }, 'Report Dashboard'),
            React.createElement('p', { className: 'mt-2 text-slate-600 font-medium' }, 
              'Monitor your usage and manage your subscription'
            )
          ),
          React.createElement('div', { className: 'flex items-center space-x-3' },
            React.createElement('button', { 
              className: 'inline-flex items-center px-4 py-2.5 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition-all duration-200 shadow-sm'
            }, 'Export Usage'),
            !isPayAsYouGo && React.createElement('button', { 
              className: 'inline-flex items-center px-4 py-2.5 bg-indigo-600 border border-transparent rounded-lg text-sm font-medium text-white hover:bg-indigo-700 transition-all duration-200 shadow-sm'
            }, 'Upgrade Plan')
          )
        )
      ),

      // Error Display
      error && React.createElement('div', {
        className: 'bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6'
      }, error),

      // Stats Grid
      React.createElement('div', { className: 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10' },
        
        // Current Plan Card
        React.createElement('div', { className: 'group relative bg-white rounded-xl border border-slate-200/60 p-6 shadow-sm hover:shadow-md hover:border-slate-300/60 transition-all duration-300' },
          React.createElement('div', { className: 'flex items-center justify-between' },
            React.createElement('div', null,
              React.createElement('div', { className: 'flex items-center space-x-2 mb-1' },
                React.createElement('p', { className: 'text-sm font-medium text-slate-600' }, 'Current Plan'),
                React.createElement(InfoIcon, {
                  tooltip: isPayAsYouGo 
                    ? 'Pay-as-you-go: You\'re charged per report generated with no monthly commitment.'
                    : 'Subscription plan: You have a monthly allowance of reports with overage charges for additional reports.',
                  size: 'xs'
                })
              ),
              React.createElement('p', { className: 'text-2xl font-bold text-slate-900' }, currentTier?.displayName || 'Loading...'),
              React.createElement('p', { className: 'text-sm text-slate-500 mt-1' }, 
                isPayAsYouGo 
                  ? `$${currentTier?.pricePerReport || 0}/report`
                  : `$${currentTier?.monthlyPrice || 0}/month`
              )
            ),
            React.createElement('div', { className: 'p-3 bg-indigo-50 rounded-lg' },
              React.createElement('svg', { className: 'w-6 h-6 text-indigo-600', fill: 'none', stroke: 'currentColor', viewBox: '0 0 24 24' },
                React.createElement('path', { strokeLinecap: 'round', strokeLinejoin: 'round', strokeWidth: 2, d: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z' })
              )
            )
          )
        ),

        // Available Reports Card (for subscription users)
        !isPayAsYouGo && React.createElement('div', { className: 'group relative bg-white rounded-xl border border-slate-200/60 p-6 shadow-sm hover:shadow-md hover:border-slate-300/60 transition-all duration-300' },
          React.createElement('div', { className: 'flex items-center justify-between' },
            React.createElement('div', null,
              React.createElement('p', { className: 'text-sm font-medium text-slate-600 mb-1' }, 'Available Reports'),
              React.createElement('p', { className: 'text-2xl font-bold text-slate-900' }, 
                reportUsage?.availableReports >= 0 ? reportUsage.availableReports : 'Unlimited'
              ),
              React.createElement('p', { className: 'text-sm text-slate-500 mt-1' }, 
                `${reportUsage?.reportsUsedThisPeriod || 0}/${currentTier?.reportsIncluded || 0} used this period`
              )
            ),
            React.createElement('div', { className: 'p-3 bg-green-50 rounded-lg' },
              React.createElement('svg', { className: 'w-6 h-6 text-green-600', fill: 'none', stroke: 'currentColor', viewBox: '0 0 24 24' },
                React.createElement('path', { strokeLinecap: 'round', strokeLinejoin: 'round', strokeWidth: 2, d: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 00-2-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v4' })
              )
            )
          )
        ),

        // Pay-As-You-Go Status Card
        isPayAsYouGo && React.createElement('div', { className: 'group relative bg-white rounded-xl border border-slate-200/60 p-6 shadow-sm hover:shadow-md hover:border-slate-300/60 transition-all duration-300' },
          React.createElement('div', { className: 'flex items-center justify-between' },
            React.createElement('div', null,
              React.createElement('p', { className: 'text-sm font-medium text-slate-600 mb-1' }, 'Billing Type'),
              React.createElement('p', { className: 'text-2xl font-bold text-slate-900' }, 'Pay-As-You-Go'),
              React.createElement('p', { className: 'text-sm text-slate-500 mt-1' }, 'No monthly commitment')
            ),
            React.createElement('div', { className: 'p-3 bg-blue-50 rounded-lg' },
              React.createElement('svg', { className: 'w-6 h-6 text-blue-600', fill: 'none', stroke: 'currentColor', viewBox: '0 0 24 24' },
                React.createElement('path', { strokeLinecap: 'round', strokeLinejoin: 'round', strokeWidth: 2, d: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1' })
              )
            )
          )
        ),

        // Reports Generated Card
        React.createElement('div', { className: 'group relative bg-white rounded-xl border border-slate-200/60 p-6 shadow-sm hover:shadow-md hover:border-slate-300/60 transition-all duration-300' },
          React.createElement('div', { className: 'flex items-center justify-between' },
            React.createElement('div', null,
              React.createElement('p', { className: 'text-sm font-medium text-slate-600 mb-1' }, 'Reports Generated'),
              React.createElement('p', { className: 'text-2xl font-bold text-slate-900' }, reportUsage?.reportsUsedThisPeriod || 0),
              React.createElement('p', { className: 'text-sm text-slate-500 mt-1' }, 'This billing period')
            ),
            React.createElement('div', { className: 'p-3 bg-purple-50 rounded-lg' },
              React.createElement('svg', { className: 'w-6 h-6 text-purple-600', fill: 'none', stroke: 'currentColor', viewBox: '0 0 24 24' },
                React.createElement('path', { strokeLinecap: 'round', strokeLinejoin: 'round', strokeWidth: 2, d: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' })
              )
            )
          )
        ),

        // Overage Cost Card (for subscription users with overage)
        !isPayAsYouGo && reportUsage?.overageReports > 0 && React.createElement('div', { className: 'group relative bg-white rounded-xl border border-orange-200/60 p-6 shadow-sm hover:shadow-md hover:border-orange-300/60 transition-all duration-300' },
          React.createElement('div', { className: 'flex items-center justify-between' },
            React.createElement('div', null,
              React.createElement('p', { className: 'text-sm font-medium text-slate-600 mb-1' }, 'Overage Cost'),
              React.createElement('p', { className: 'text-2xl font-bold text-orange-600' }, `$${reportUsage.currentOverageCost || 0}`),
              React.createElement('p', { className: 'text-sm text-slate-500 mt-1' }, `${reportUsage.overageReports} overage reports`)
            ),
            React.createElement('div', { className: 'p-3 bg-orange-50 rounded-lg' },
              React.createElement('svg', { className: 'w-6 h-6 text-orange-600', fill: 'none', stroke: 'currentColor', viewBox: '0 0 24 24' },
                React.createElement('path', { strokeLinecap: 'round', strokeLinejoin: 'round', strokeWidth: 2, d: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z' })
              )
            )
          )
        )
      ),

      // Usage Progress Bar (for subscription users)
      !isPayAsYouGo && React.createElement('div', { className: 'bg-white rounded-xl border border-slate-200/60 p-6 shadow-sm mb-10' },
        React.createElement('div', { className: 'flex items-center justify-between mb-4' },
          React.createElement('h3', { className: 'text-lg font-semibold text-slate-900' }, 'Usage This Period'),
          React.createElement('span', { className: 'text-sm text-slate-500' }, 
            `${reportUsage?.reportsUsedThisPeriod || 0} of ${currentTier?.reportsIncluded || 0} reports used`
          )
        ),
        React.createElement('div', { className: 'w-full bg-slate-200 rounded-full h-3 mb-4' },
          React.createElement('div', { 
            className: `h-3 rounded-full transition-all duration-500 ${
              (reportUsage?.reportsUsedThisPeriod || 0) > (currentTier?.reportsIncluded || 0) 
                ? 'bg-orange-500' 
                : 'bg-indigo-600'
            }`,
            style: { 
              width: `${Math.min(100, ((reportUsage?.reportsUsedThisPeriod || 0) / (currentTier?.reportsIncluded || 1)) * 100)}%` 
            }
          })
        ),
        reportUsage?.overageReports > 0 && React.createElement('p', { className: 'text-sm text-orange-600 font-medium' },
          `⚠️ You have ${reportUsage.overageReports} overage reports this period ($${reportUsage.currentOverageCost} additional cost)`
        )
      ),

      // Available Plans Section
      React.createElement('div', { className: 'bg-white rounded-xl border border-slate-200/60 p-6 shadow-sm' },
        React.createElement('h3', { className: 'text-lg font-semibold text-slate-900 mb-6' }, 'Available Plans'),
        React.createElement('div', { className: 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6' },
          plans.map(plan =>
            React.createElement('div', { 
              key: plan.id,
              className: `relative border rounded-lg p-6 ${
                currentTier?.name === plan.name 
                  ? 'border-indigo-200 bg-indigo-50' 
                  : 'border-slate-200 hover:border-slate-300'
              } transition-all duration-200`
            },
              currentTier?.name === plan.name && React.createElement('div', { className: 'absolute -top-3 left-1/2 transform -translate-x-1/2' },
                React.createElement('span', { className: 'bg-indigo-600 text-white px-3 py-1 rounded-full text-xs font-medium' }, 'Current Plan')
              ),
              React.createElement('div', { className: 'text-center' },
                React.createElement('h4', { className: 'text-lg font-semibold text-slate-900 mb-2' }, plan.displayName),
                React.createElement('div', { className: 'mb-4' },
                  plan.billingType === 'per_report' 
                    ? React.createElement('div', null,
                        React.createElement('span', { className: 'text-3xl font-bold text-slate-900' }, `$${plan.pricePerReport}`),
                        React.createElement('span', { className: 'text-slate-500' }, '/report')
                      )
                    : React.createElement('div', null,
                        React.createElement('span', { className: 'text-3xl font-bold text-slate-900' }, `$${plan.monthlyPrice}`),
                        React.createElement('span', { className: 'text-slate-500' }, '/month'),
                        React.createElement('p', { className: 'text-sm text-slate-600 mt-1' }, `${plan.reportsIncluded} reports included`)
                      )
                ),
                React.createElement('p', { className: 'text-sm text-slate-600 mb-4' }, plan.description),
                React.createElement('ul', { className: 'text-sm text-slate-600 space-y-2 mb-6' },
                  plan.features.slice(0, 3).map((feature, index) =>
                    React.createElement('li', { key: index, className: 'flex items-center' },
                      React.createElement('svg', { className: 'w-4 h-4 text-green-500 mr-2', fill: 'none', stroke: 'currentColor', viewBox: '0 0 24 24' },
                        React.createElement('path', { strokeLinecap: 'round', strokeLinejoin: 'round', strokeWidth: 2, d: 'M5 13l4 4L19 7' })
                      ),
                      feature
                    )
                  )
                ),
                currentTier?.name !== plan.name && React.createElement('button', {
                  onClick: () => handleUpgrade(plan.id),
                  className: 'w-full bg-indigo-600 text-white py-2 px-4 rounded-lg hover:bg-indigo-700 transition-colors duration-200'
                }, 
                plan.billingType === 'per_report' ? 'Switch to Pay-As-You-Go' : 'Upgrade Plan')
              )
            )
          )
        )
      )
    )
  );
}

export default ReportDashboard;
