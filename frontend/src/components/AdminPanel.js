// frontend/src/components/AdminPanel.js
import React, { useState, useEffect } from 'react';
import { useUser } from '../contexts/UserContext';
import { apiHelpers } from '../config/api';

function AdminPanel() {
  const { user, isAdmin } = useUser();
  const [activeTab, setActiveTab] = useState('users');
  const [users, setUsers] = useState([]);
  const [reports, setReports] = useState([]);
  const [systemStats, setSystemStats] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isAdmin()) {
      loadAdminData();
    }
  }, []);

  const loadAdminData = async () => {
    setLoading(true);
    try {
      // Note: These endpoints would need to be added to your backend
      const [usersResponse, reportsResponse, statsResponse] = await Promise.all([
        fetch('/api/admin/users', { 
          headers: { Authorization: `Bearer ${localStorage.getItem('auth_token')}` }
        }),
        fetch('/api/admin/reports', {
          headers: { Authorization: `Bearer ${localStorage.getItem('auth_token')}` }
        }),
        fetch('/api/admin/stats', {
          headers: { Authorization: `Bearer ${localStorage.getItem('auth_token')}` }
        })
      ]);

      if (usersResponse.ok) {
        const usersData = await usersResponse.json();
        setUsers(usersData.users || []);
      }

      if (reportsResponse.ok) {
        const reportsData = await reportsResponse.json();
        setReports(reportsData.reports || []);
      }

      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        setSystemStats(statsData.stats || {});
      }
    } catch (error) {
      console.error('Failed to load admin data:', error);
      setError('Failed to load admin data');
    } finally {
      setLoading(false);
    }
  };

  const handleUserAction = async (userId, action) => {
    try {
      const response = await fetch(`/api/admin/users/${userId}/${action}`, {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        await loadAdminData(); // Refresh data
        alert(`User ${action} successful`);
      }
    } catch (error) {
      console.error(`Failed to ${action} user:`, error);
      alert(`Failed to ${action} user`);
    }
  };

  // Redirect if not admin
  if (!isAdmin()) {
    return React.createElement('div', {
      className: 'min-h-screen flex items-center justify-center bg-gray-50'
    },
      React.createElement('div', { className: 'text-center' },
        React.createElement('h2', {
          className: 'text-2xl font-bold text-gray-900 mb-4'
        }, 'Access Denied'),
        React.createElement('p', {
          className: 'text-gray-600'
        }, 'You do not have admin privileges to access this page.')
      )
    );
  }

  return React.createElement('div', { className: 'min-h-screen bg-gray-50' },
    // Header
    React.createElement('div', { className: 'bg-white shadow' },
      React.createElement('div', { className: 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8' },
        React.createElement('div', { className: 'py-6' },
          React.createElement('h1', {
            className: 'text-3xl font-bold text-gray-900'
          }, 'Admin Panel'),
          React.createElement('p', {
            className: 'mt-1 text-sm text-gray-500'
          }, 'Manage users, reports, and system settings')
        )
      )
    ),

    // Tab Navigation
    React.createElement('div', { className: 'bg-white border-b border-gray-200' },
      React.createElement('div', { className: 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8' },
        React.createElement('nav', { className: 'flex space-x-8' },
          ['users', 'reports', 'stats', 'settings'].map(tab =>
            React.createElement('button', {
              key: tab,
              onClick: () => setActiveTab(tab),
              className: `py-4 px-1 border-b-2 font-medium text-sm capitalize ${
                activeTab === tab
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`
            }, tab)
          )
        )
      )
    ),

    // Content Area
    React.createElement('div', { className: 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8' },
      loading && React.createElement('div', {
        className: 'flex justify-center py-12'
      },
        React.createElement('div', {
          className: 'animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600'
        })
      ),

      error && React.createElement('div', {
        className: 'bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6'
      }, error),

      // Users Tab
      activeTab === 'users' && React.createElement('div', null,
        React.createElement('div', {
          className: 'bg-white shadow overflow-hidden sm:rounded-md'
        },
          React.createElement('div', {
            className: 'px-4 py-5 sm:px-6 border-b border-gray-200'
          },
            React.createElement('h3', {
              className: 'text-lg leading-6 font-medium text-gray-900'
            }, 'User Management'),
            React.createElement('p', {
              className: 'mt-1 max-w-2xl text-sm text-gray-500'
            }, 'Manage user accounts and permissions')
          ),
          React.createElement('ul', { className: 'divide-y divide-gray-200' },
            users.map(user =>
              React.createElement('li', { key: user.id, className: 'px-4 py-4' },
                React.createElement('div', {
                  className: 'flex items-center justify-between'
                },
                  React.createElement('div', { className: 'flex items-center' },
                    React.createElement('div', {
                      className: 'flex-shrink-0 h-10 w-10 bg-indigo-500 rounded-full flex items-center justify-center'
                    },
                      React.createElement('span', {
                        className: 'text-white font-medium text-sm'
                      }, user.email.charAt(0).toUpperCase())
                    ),
                    React.createElement('div', { className: 'ml-4' },
                      React.createElement('div', {
                        className: 'text-sm font-medium text-gray-900'
                      }, `${user.profile?.firstName || ''} ${user.profile?.lastName || ''}`.trim() || user.email),
                      React.createElement('div', {
                        className: 'text-sm text-gray-500'
                      }, user.email),
                      React.createElement('div', {
                        className: 'text-xs text-gray-400'
                      }, `${user.subscription?.tier || 'Free'} • ${user.availableTokens || 0} tokens`)
                    )
                  ),
                  React.createElement('div', { className: 'flex items-center space-x-2' },
                    React.createElement('span', {
                      className: `px-2 py-1 text-xs rounded-full ${
                        user.isActive 
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`
                    }, user.isActive ? 'Active' : 'Inactive'),
                    React.createElement('button', {
                      onClick: () => handleUserAction(user.id, user.isActive ? 'deactivate' : 'activate'),
                      className: `text-sm text-indigo-600 hover:text-indigo-700`
                    }, user.isActive ? 'Deactivate' : 'Activate'),
                    React.createElement('button', {
                      onClick: () => handleUserAction(user.id, 'reset-tokens'),
                      className: 'text-sm text-blue-600 hover:text-blue-700'
                    }, 'Reset Tokens')
                  )
                )
              )
            )
          )
        )
      ),

      // Reports Tab
      activeTab === 'reports' && React.createElement('div', null,
        React.createElement('div', {
          className: 'bg-white shadow overflow-hidden sm:rounded-md'
        },
          React.createElement('div', {
            className: 'px-4 py-5 sm:px-6 border-b border-gray-200'
          },
            React.createElement('h3', {
              className: 'text-lg leading-6 font-medium text-gray-900'
            }, 'Report Management'),
            React.createElement('p', {
              className: 'mt-1 max-w-2xl text-sm text-gray-500'
            }, 'Monitor and manage system reports')
          ),
          React.createElement('div', { className: 'px-4 py-5' },
            React.createElement('div', {
              className: 'grid grid-cols-1 gap-5 sm:grid-cols-3'
            },
              React.createElement('div', {
                className: 'bg-white overflow-hidden shadow rounded-lg'
              },
                React.createElement('div', { className: 'p-5' },
                  React.createElement('div', { className: 'flex items-center' },
                    React.createElement('div', { className: 'flex-shrink-0' },
                      React.createElement('div', {
                        className: 'text-2xl font-bold text-gray-900'
                      }, reports.length)
                    ),
                    React.createElement('div', { className: 'ml-5 w-0 flex-1' },
                      React.createElement('dl', null,
                        React.createElement('dt', {
                          className: 'text-sm font-medium text-gray-500 truncate'
                        }, 'Total Reports'),
                        React.createElement('dd', null,
                          React.createElement('div', {
                            className: 'text-lg font-medium text-gray-900'
                          }, 'Generated')
                        )
                      )
                    )
                  )
                )
              )
            )
          )
        )
      ),

      // Stats Tab
      activeTab === 'stats' && React.createElement('div', null,
        React.createElement('div', { className: 'grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4' },
          [
            { title: 'Total Users', value: systemStats.totalUsers || 0, change: '+12%' },
            { title: 'Active Subscriptions', value: systemStats.activeSubscriptions || 0, change: '+5%' },
            { title: 'Reports Generated', value: systemStats.totalReports || 0, change: '+18%' },
            { title: 'Revenue (MTD)', value: `${systemStats.monthlyRevenue || 0}`, change: '+23%' }
          ].map((stat, index) =>
            React.createElement('div', {
              key: index,
              className: 'bg-white overflow-hidden shadow rounded-lg'
            },
              React.createElement('div', { className: 'p-5' },
                React.createElement('div', { className: 'flex items-center' },
                  React.createElement('div', { className: 'flex-shrink-0' },
                    React.createElement('div', {
                      className: 'text-2xl font-bold text-gray-900'
                    }, stat.value)
                  ),
                  React.createElement('div', { className: 'ml-5 w-0 flex-1' },
                    React.createElement('dl', null,
                      React.createElement('dt', {
                        className: 'text-sm font-medium text-gray-500 truncate'
                      }, stat.title),
                      React.createElement('dd', null,
                        React.createElement('div', {
                          className: 'text-sm font-medium text-green-600'
                        }, stat.change)
                      )
                    )
                  )
                )
              )
            )
          )
        )
      ),

      // Settings Tab
      activeTab === 'settings' && React.createElement('div', null,
        React.createElement('div', {
          className: 'bg-white shadow sm:rounded-lg'
        },
          React.createElement('div', {
            className: 'px-4 py-5 sm:p-6'
          },
            React.createElement('h3', {
              className: 'text-lg leading-6 font-medium text-gray-900'
            }, 'System Settings'),
            React.createElement('div', { className: 'mt-5 space-y-6' },
              // Token Management
              React.createElement('div', null,
                React.createElement('h4', {
                  className: 'text-md font-medium text-gray-900 mb-3'
                }, 'Token Management'),
                React.createElement('div', { className: 'space-y-3' },
                  React.createElement('button', {
                    onClick: () => handleSystemAction('reset-all-tokens'),
                    className: 'bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700'
                  }, 'Reset All User Tokens'),
                  React.createElement('button', {
                    onClick: () => handleSystemAction('bulk-token-grant'),
                    className: 'bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 ml-3'
                  }, 'Grant Bonus Tokens')
                )
              ),
              
              // System Maintenance
              React.createElement('div', null,
                React.createElement('h4', {
                  className: 'text-md font-medium text-gray-900 mb-3'
                }, 'System Maintenance'),
                React.createElement('div', { className: 'space-y-3' },
                  React.createElement('button', {
                    onClick: () => handleSystemAction('clear-cache'),
                    className: 'bg-yellow-600 text-white px-4 py-2 rounded-lg hover:bg-yellow-700'
                  }, 'Clear System Cache'),
                  React.createElement('button', {
                    onClick: () => handleSystemAction('export-data'),
                    className: 'bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 ml-3'
                  }, 'Export System Data')
                )
              )
            )
          )
        )
      )
    )
  );

  async function handleSystemAction(action) {
    try {
      const response = await fetch(`/api/admin/system/${action}`, {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        alert(`${action} completed successfully`);
        await loadAdminData();
      }
    } catch (error) {
      console.error(`Failed to execute ${action}:`, error);
      alert(`Failed to execute ${action}`);
    }
  }
}

export default AdminPanel;
