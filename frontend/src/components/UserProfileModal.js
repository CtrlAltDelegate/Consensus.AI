// frontend/src/components/UserProfileModal.js
import React, { useState, useEffect } from 'react';
import { useUser } from '../contexts/UserContext';
import { apiHelpers } from '../config/api';

function UserProfileModal({ isVisible, onClose }) {
  const { user, updateUser } = useUser();
  const [activeTab, setActiveTab] = useState('profile');
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    organization: '',
    preferences: {
      emailNotifications: {
        tokenLowWarning: true,
        reportReady: true,
        billing: true,
        marketing: false
      },
      defaultReportFormat: 'pdf'
    }
  });
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (isVisible && user) {
      setFormData({
        firstName: user.profile?.firstName || '',
        lastName: user.profile?.lastName || '',
        organization: user.profile?.organization || '',
        preferences: {
          emailNotifications: {
            tokenLowWarning: user.preferences?.emailNotifications?.tokenLowWarning ?? true,
            reportReady: user.preferences?.emailNotifications?.reportReady ?? true,
            billing: user.preferences?.emailNotifications?.billing ?? true,
            marketing: user.preferences?.emailNotifications?.marketing ?? false
          },
          defaultReportFormat: user.preferences?.defaultReportFormat || 'pdf'
        }
      });
    }
  }, [isVisible, user]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleNestedChange = (path, value) => {
    setFormData(prev => {
      const newData = { ...prev };
      const keys = path.split('.');
      let current = newData;
      
      for (let i = 0; i < keys.length - 1; i++) {
        current = current[keys[i]];
      }
      
      current[keys[keys.length - 1]] = value;
      return newData;
    });
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await updateUser({
        profile: {
          firstName: formData.firstName,
          lastName: formData.lastName,
          organization: formData.organization
        },
        preferences: formData.preferences
      });

      if (response.success) {
        setSuccess('Profile updated successfully!');
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError(response.error || 'Failed to update profile');
      }
    } catch (error) {
      setError('Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setError('New passwords do not match');
      setLoading(false);
      return;
    }

    if (passwordData.newPassword.length < 6) {
      setError('New password must be at least 6 characters long');
      setLoading(false);
      return;
    }

    try {
      const response = await apiHelpers.changePassword({
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword
      });

      if (response.data.success) {
        setSuccess('Password changed successfully!');
        setPasswordData({
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        });
        setTimeout(() => setSuccess(''), 3000);
      }
    } catch (error) {
      setError(error.response?.data?.error || 'Failed to change password');
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
      className: 'bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden'
    },
      // Header
      React.createElement('div', {
        className: 'flex items-center justify-between p-6 border-b border-gray-200'
      },
        React.createElement('h2', {
          className: 'text-2xl font-bold text-gray-900'
        }, 'Profile & Settings'),
        React.createElement('button', {
          onClick: onClose,
          className: 'text-gray-400 hover:text-gray-600 text-2xl'
        }, '×')
      ),

      // Tab Navigation
      React.createElement('div', {
        className: 'flex border-b border-gray-200'
      },
        ['profile', 'security', 'preferences'].map(tab =>
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
        // Success/Error Messages
        (success || error) && React.createElement('div', {
          className: `px-4 py-3 rounded-lg mb-6 ${
            success 
              ? 'bg-green-50 border border-green-200 text-green-700'
              : 'bg-red-50 border border-red-200 text-red-700'
          }`
        }, success || error),

        // Profile Tab
        activeTab === 'profile' && React.createElement('form', {
          onSubmit: handleProfileSubmit,
          className: 'space-y-6'
        },
          React.createElement('div', {
            className: 'grid grid-cols-2 gap-4'
          },
            React.createElement('div', null,
              React.createElement('label', {
                className: 'block text-sm font-medium text-gray-700 mb-2'
              }, 'First Name'),
              React.createElement('input', {
                type: 'text',
                name: 'firstName',
                value: formData.firstName,
                onChange: handleInputChange,
                className: 'w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent'
              })
            ),
            React.createElement('div', null,
              React.createElement('label', {
                className: 'block text-sm font-medium text-gray-700 mb-2'
              }, 'Last Name'),
              React.createElement('input', {
                type: 'text',
                name: 'lastName',
                value: formData.lastName,
                onChange: handleInputChange,
                className: 'w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent'
              })
            )
          ),
          React.createElement('div', null,
            React.createElement('label', {
              className: 'block text-sm font-medium text-gray-700 mb-2'
            }, 'Email Address'),
            React.createElement('input', {
              type: 'email',
              value: user?.email || '',
              disabled: true,
              className: 'w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500'
            }),
            React.createElement('p', {
              className: 'text-xs text-gray-500 mt-1'
            }, 'Email address cannot be changed')
          ),
          React.createElement('div', null,
            React.createElement('label', {
              className: 'block text-sm font-medium text-gray-700 mb-2'
            }, 'Organization'),
            React.createElement('input', {
              type: 'text',
              name: 'organization',
              value: formData.organization,
              onChange: handleInputChange,
              className: 'w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent',
              placeholder: 'Your company or organization'
            })
          ),
          React.createElement('button', {
            type: 'submit',
            disabled: loading,
            className: 'w-full bg-indigo-600 text-white py-2 px-4 rounded-lg hover:bg-indigo-700 disabled:opacity-50'
          }, loading ? 'Saving...' : 'Save Profile')
        ),

        // Security Tab
        activeTab === 'security' && React.createElement('form', {
          onSubmit: handlePasswordSubmit,
          className: 'space-y-6'
        },
          React.createElement('div', null,
            React.createElement('label', {
              className: 'block text-sm font-medium text-gray-700 mb-2'
            }, 'Current Password'),
            React.createElement('input', {
              type: 'password',
              name: 'currentPassword',
              value: passwordData.currentPassword,
              onChange: handlePasswordChange,
              className: 'w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent',
              required: true
            })
          ),
          React.createElement('div', null,
            React.createElement('label', {
              className: 'block text-sm font-medium text-gray-700 mb-2'
            }, 'New Password'),
            React.createElement('input', {
              type: 'password',
              name: 'newPassword',
              value: passwordData.newPassword,
              onChange: handlePasswordChange,
              className: 'w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent',
              required: true,
              minLength: 6
            }),
            React.createElement('p', {
              className: 'text-xs text-gray-500 mt-1'
            }, 'Must be at least 6 characters long')
          ),
          React.createElement('div', null,
            React.createElement('label', {
              className: 'block text-sm font-medium text-gray-700 mb-2'
            }, 'Confirm New Password'),
            React.createElement('input', {
              type: 'password',
              name: 'confirmPassword',
              value: passwordData.confirmPassword,
              onChange: handlePasswordChange,
              className: 'w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent',
              required: true
            })
          ),
          React.createElement('button', {
            type: 'submit',
            disabled: loading,
            className: 'w-full bg-indigo-600 text-white py-2 px-4 rounded-lg hover:bg-indigo-700 disabled:opacity-50'
          }, loading ? 'Changing Password...' : 'Change Password')
        ),

        // Preferences Tab
        activeTab === 'preferences' && React.createElement('div', {
          className: 'space-y-6'
        },
          // Email Notifications
          React.createElement('div', null,
            React.createElement('h3', {
              className: 'text-lg font-medium text-gray-900 mb-4'
            }, 'Email Notifications'),
            React.createElement('div', {
              className: 'space-y-3'
            },
              [
                { key: 'tokenLowWarning', label: 'Token low warning (when < 10% remaining)' },
                { key: 'reportReady', label: 'Report generation complete' },
                { key: 'billing', label: 'Billing and subscription updates' },
                { key: 'marketing', label: 'Product updates and marketing emails' }
              ].map(notification =>
                React.createElement('label', {
                  key: notification.key,
                  className: 'flex items-center'
                },
                  React.createElement('input', {
                    type: 'checkbox',
                    checked: formData.preferences.emailNotifications[notification.key],
                    onChange: (e) => handleNestedChange(
                      `preferences.emailNotifications.${notification.key}`,
                      e.target.checked
                    ),
                    className: 'mr-3 h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded'
                  }),
                  React.createElement('span', {
                    className: 'text-sm text-gray-700'
                  }, notification.label)
                )
              )
            )
          ),

          // Default Report Format
          React.createElement('div', null,
            React.createElement('h3', {
              className: 'text-lg font-medium text-gray-900 mb-4'
            }, 'Default Report Format'),
            React.createElement('div', {
              className: 'space-y-2'
            },
              ['pdf', 'html', 'markdown'].map(format =>
                React.createElement('label', {
                  key: format,
                  className: 'flex items-center'
                },
                  React.createElement('input', {
                    type: 'radio',
                    name: 'defaultReportFormat',
                    value: format,
                    checked: formData.preferences.defaultReportFormat === format,
                    onChange: (e) => handleNestedChange(
                      'preferences.defaultReportFormat',
                      e.target.value
                    ),
                    className: 'mr-3 h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300'
                  }),
                  React.createElement('span', {
                    className: 'text-sm text-gray-700 capitalize'
                  }, format.toUpperCase())
                )
              )
            )
          ),

          React.createElement('button', {
            onClick: handleProfileSubmit,
            disabled: loading,
            className: 'w-full bg-indigo-600 text-white py-2 px-4 rounded-lg hover:bg-indigo-700 disabled:opacity-50'
          }, loading ? 'Saving...' : 'Save Preferences')
        )
      )
    )
  );
}

export default UserProfileModal;
