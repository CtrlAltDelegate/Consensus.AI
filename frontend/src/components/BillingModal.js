// frontend/src/components/BillingModal.js
import React, { useState, useEffect } from 'react';
import { useUser } from '../contexts/UserContext';
import { apiHelpers } from '../config/api';

function BillingModal({ isVisible, onClose }) {
  const { user, refreshUserData } = useUser();
  const [activeTab, setActiveTab] = useState('subscription');
  const [plans, setPlans] = useState([]);
  const [billingHistory, setBillingHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isVisible) {
      loadBillingData();
    }
  }, [isVisible]);

  const loadBillingData = async () => {
    setLoading(true);
    try {
      const [plansResponse, historyResponse] = await Promise.all([
        apiHelpers.getAvailablePlans(),
        apiHelpers.getBillingHistory({ limit: 10 })
      ]);

      if (plansResponse.data.success) {
        setPlans(plansResponse.data.plans);
      }

      if (historyResponse.data.success) {
        setBillingHistory(historyResponse.data.invoices);
      }
    } catch (error) {
      console.error('Failed to load billing data:', error);
      setError('Failed to load billing information');
    } finally {
      setLoading(false);
    }
  };

  const handlePlanUpgrade = async (planId) => {
    setLoading(true);
    setError('');

    try {
      const response = await apiHelpers.updateSubscription({
        tier: planId,
        billingPeriod: 'monthly'
      });

      if (response.data.success) {
        await refreshUserData();
        alert('Subscription updated successfully!');
      }
    } catch (error) {
      console.error('Subscription update failed:', error);
      setError(error.response?.data?.error || 'Failed to update subscription');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelSubscription = async () => {
    if (!confirm('Are you sure you want to cancel your subscription? You will lose access to premium features at the end of your billing period.')) {
      return;
    }

    setLoading(true);
    try {
      const response = await apiHelpers.cancelSubscription();
      if (response.data.success) {
        await refreshUserData();
        alert('Subscription canceled successfully');
      }
    } catch (error) {
      console.error('Cancellation failed:', error);
      setError(error.response?.data?.error || 'Failed to cancel subscription');
    } finally {
      setLoading(false);
    }
  };

  if (!isVisible) return null;

  return React.createElement('div', {
    className: 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4',
    onClick: (e) => e.target === e.currentTarget && onClose()
  },
    React.createElement('div', {
      className: 'bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden'
    },
      // Header
      React.createElement('div', {
        className: 'flex items-center justify-between p-6 border-b border-gray-200'
      },
        React.createElement('h2', {
          className: 'text-2xl font-bold text-gray-900'
        }, 'Billing & Subscription'),
        React.createElement('button', {
          onClick: onClose,
          className: 'text-gray-400 hover:text-gray-600 text-2xl'
        }, '×')
      ),

      // Tab Navigation
      React.createElement('div', {
        className: 'flex border-b border-gray-200'
      },
        ['subscription', 'billing', 'usage'].map(tab =>
          React.createElement('button', {
            key: tab,
            onClick: () => setActiveTab(tab),
            className: `px-6 py-3 text-sm font-medium capitalize ${
              activeTab === tab
                ? 'border-b-2 border-indigo-500 text-indigo-600'
                : 'text-gray-500 hover:text-gray-700'
            }`
          }, tab)
        )
      ),

      // Content Area
      React.createElement('div', {
        className: 'p-6 overflow-y-auto max-h-[60vh]'
      },
        // Error Display
        error && React.createElement('div', {
          className: 'bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6'
        }, error),

        // Subscription Tab
        activeTab === 'subscription' && React.createElement('div', null,
          // Current Plan
          React.createElement('div', {
            className: 'bg-gradient-to-r from-indigo-50 to-violet-50 rounded-lg p-6 mb-6'
          },
            React.createElement('h3', {
              className: 'text-lg font-semibold text-gray-900 mb-2'
            }, 'Current Plan'),
            React.createElement('div', {
              className: 'flex items-center justify-between'
            },
              React.createElement('div', null,
                React.createElement('p', {
                  className: 'text-2xl font-bold text-indigo-600'
                }, user?.subscription?.tier || 'Free'),
                React.createElement('p', {
                  className: 'text-gray-600'
                }, `${user?.availableTokens?.toLocaleString() || 0} tokens remaining`)
              ),
              user?.subscription?.tier !== 'Free' && React.createElement('button', {
                onClick: handleCancelSubscription,
                disabled: loading,
                className: 'text-red-600 hover:text-red-700 text-sm font-medium'
              }, 'Cancel Subscription')
            )
          ),

          // Available Plans
          React.createElement('h3', {
            className: 'text-lg font-semibold text-gray-900 mb-4'
          }, 'Available Plans'),
          React.createElement('div', {
            className: 'grid grid-cols-1 md:grid-cols-3 gap-4'
          },
            plans.map(plan =>
              React.createElement('div', {
                key: plan.id,
                className: `border rounded-lg p-4 ${
                  user?.subscription?.tier === plan.name
                    ? 'border-indigo-500 bg-indigo-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`
              },
                React.createElement('h4', {
                  className: 'font-semibold text-lg mb-2'
                }, plan.name),
                React.createElement('p', {
                  className: 'text-2xl font-bold text-gray-900 mb-2'
                }, `$${plan.monthlyPrice}/mo`),
                React.createElement('p', {
                  className: 'text-sm text-gray-600 mb-4'
                }, plan.description),
                React.createElement('ul', {
                  className: 'text-sm text-gray-600 mb-4 space-y-1'
                },
                  plan.features.map((feature, index) =>
                    React.createElement('li', {
                      key: index,
                      className: 'flex items-center'
                    },
                      React.createElement('span', {
                        className: 'text-green-500 mr-2'
                      }, '✓'),
                      feature
                    )
                  )
                ),
                user?.subscription?.tier !== plan.name && React.createElement('button', {
                  onClick: () => handlePlanUpgrade(plan.id),
                  disabled: loading,
                  className: 'w-full bg-indigo-600 text-white py-2 px-4 rounded-lg hover:bg-indigo-700 disabled:opacity-50'
                }, 
                  loading ? 'Processing...' : 
                  (user?.subscription?.tier === 'Free' ? 'Upgrade' : 'Switch Plan')
                )
              )
            )
          )
        ),

        // Billing History Tab
        activeTab === 'billing' && React.createElement('div', null,
          React.createElement('h3', {
            className: 'text-lg font-semibold text-gray-900 mb-4'
          }, 'Billing History'),
          billingHistory.length === 0 
            ? React.createElement('p', {
                className: 'text-gray-500 text-center py-8'
              }, 'No billing history available')
            : React.createElement('div', {
                className: 'space-y-4'
              },
                billingHistory.map((invoice, index) =>
                  React.createElement('div', {
                    key: index,
                    className: 'border border-gray-200 rounded-lg p-4'
                  },
                    React.createElement('div', {
                      className: 'flex items-center justify-between'
                    },
                      React.createElement('div', null,
                        React.createElement('p', {
                          className: 'font-medium'
                        }, `Invoice #${invoice.number || 'N/A'}`),
                        React.createElement('p', {
                          className: 'text-sm text-gray-600'
                        }, new Date(invoice.created * 1000).toLocaleDateString())
                      ),
                      React.createElement('div', {
                        className: 'text-right'
                      },
                        React.createElement('p', {
                          className: 'font-medium'
                        }, `$${(invoice.amount_paid / 100).toFixed(2)}`),
                        React.createElement('span', {
                          className: `text-sm px-2 py-1 rounded ${
                            invoice.status === 'paid' 
                              ? 'bg-green-100 text-green-700'
                              : 'bg-yellow-100 text-yellow-700'
                          }`
                        }, invoice.status)
                      )
                    )
                  )
                )
              )
        ),

        // Usage Tab
        activeTab === 'usage' && React.createElement('div', null,
          React.createElement('h3', {
            className: 'text-lg font-semibold text-gray-900 mb-4'
          }, 'Token Usage'),
          React.createElement('div', {
            className: 'grid grid-cols-1 md:grid-cols-2 gap-6'
          },
            // Current Usage
            React.createElement('div', {
              className: 'bg-gray-50 rounded-lg p-4'
            },
              React.createElement('h4', {
                className: 'font-medium text-gray-900 mb-3'
              }, 'Current Period'),
              React.createElement('div', {
                className: 'space-y-2'
              },
                React.createElement('div', {
                  className: 'flex justify-between'
                },
                  React.createElement('span', {
                    className: 'text-gray-600'
                  }, 'Available Tokens'),
                  React.createElement('span', {
                    className: 'font-medium'
                  }, user?.availableTokens?.toLocaleString() || '0')
                ),
                React.createElement('div', {
                  className: 'flex justify-between'
                },
                  React.createElement('span', {
                    className: 'text-gray-600'
                  }, 'Plan Limit'),
                  React.createElement('span', {
                    className: 'font-medium'
                  }, user?.subscription?.tokenLimit?.toLocaleString() || '25,000')
                )
              )
            ),
            
            // Token Expiration Warning
            React.createElement('div', {
              className: 'bg-yellow-50 rounded-lg p-4'
            },
              React.createElement('h4', {
                className: 'font-medium text-yellow-800 mb-3'
              }, 'Token Expiration'),
              React.createElement('p', {
                className: 'text-sm text-yellow-700'
              }, 'Tokens expire after 90 days. Use them before they expire to avoid losing them.')
            )
          )
        )
      )
    )
  );
}

export default BillingModal;
