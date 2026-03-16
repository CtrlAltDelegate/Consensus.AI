import React, { useState } from 'react';
import { apiHelpers } from '../config/api';
import { useUser } from '../contexts/UserContext';

function AuthModal({ isVisible, onClose, onAuthSuccess }) {
  const { login, register } = useUser();
  const [view, setView] = useState('login'); // 'login' | 'register' | 'forgotPassword'
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    organization: ''
  });
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotSent, setForgotSent] = useState(false);
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters long';
    }

    if (view === 'register') {
      if (!formData.firstName) newErrors.firstName = 'First name is required';
      if (!formData.lastName) newErrors.lastName = 'Last name is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsLoading(true);
    setErrors({});

    try {
      let result;

      if (view === 'login') {
        result = await login({ email: formData.email, password: formData.password });
      } else {
        result = await register({
          email: formData.email,
          password: formData.password,
          profile: {
            firstName: formData.firstName,
            lastName: formData.lastName,
            organization: formData.organization
          }
        });
      }

      if (result.success) {
        if (result.needsPlanSelection) {
          onAuthSuccess(result.user, result.token);
          onClose();
        } else if (result.requiresBillingSetup) {
          onAuthSuccess(result.user, result.token);
          onClose();
          try {
            const response = await apiHelpers.setupPaymentMethod();
            if (response.data.url) {
              window.location.href = response.data.url;
              return;
            }
          } catch (error) {
            console.error('❌ Failed to setup payment:', error);
            setErrors({ general: 'Registration successful, but failed to setup payment. Please try the "Update Billing Info" button.' });
          }
        } else {
          onAuthSuccess(result.user, result.token);
          onClose();
        }

        setFormData({ email: '', password: '', firstName: '', lastName: '', organization: '' });
      } else {
        setErrors({ general: result.error || `${view === 'login' ? 'Login' : 'Registration'} failed. Please try again.` });
      }
    } catch (error) {
      if (error.response?.data?.error) {
        if (error.response.data.field) {
          setErrors({ [error.response.data.field]: error.response.data.error });
        } else {
          setErrors({ general: error.response.data.error });
        }
      } else {
        setErrors({ general: `${view === 'login' ? 'Login' : 'Registration'} failed. Please try again.` });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotSubmit = async (e) => {
    e.preventDefault();
    if (!forgotEmail) {
      setErrors({ forgotEmail: 'Email is required' });
      return;
    }
    setIsLoading(true);
    setErrors({});
    try {
      await apiHelpers.forgotPassword(forgotEmail);
      setForgotSent(true);
    } catch (error) {
      // Show success even on error to prevent email enumeration
      setForgotSent(true);
    } finally {
      setIsLoading(false);
    }
  };

  const switchToView = (newView) => {
    setView(newView);
    setErrors({});
    setForgotSent(false);
    setForgotEmail('');
    setFormData({ email: '', password: '', firstName: '', lastName: '', organization: '' });
  };

  if (!isVisible) return null;

  // ── Forgot Password View ─────────────────────────────────────────────────
  if (view === 'forgotPassword') {
    return React.createElement('div', {
      className: 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4',
      onClick: (e) => e.target === e.currentTarget && onClose()
    },
      React.createElement('div', {
        className: 'bg-white rounded-2xl shadow-2xl w-full max-w-md'
      },
        // Header
        React.createElement('div', {
          className: 'flex items-center justify-between p-6 border-b border-gray-200'
        },
          React.createElement('h2', {
            className: 'text-2xl font-bold text-gray-900'
          }, 'Reset Password'),
          React.createElement('button', {
            onClick: onClose,
            className: 'text-gray-400 hover:text-gray-600 text-2xl'
          }, '×')
        ),

        // Body
        React.createElement('div', { className: 'p-6' },
          forgotSent
            ? React.createElement('div', null,
                React.createElement('div', {
                  className: 'bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm mb-4'
                }, 'If that email is registered, a reset link has been sent. Check your inbox (and spam folder).'),
                React.createElement('button', {
                  type: 'button',
                  onClick: () => switchToView('login'),
                  className: 'w-full text-sm text-indigo-600 hover:text-indigo-700 font-medium'
                }, '← Back to Sign In')
              )
            : React.createElement('form', { onSubmit: handleForgotSubmit, className: 'space-y-4' },
                React.createElement('p', {
                  className: 'text-sm text-gray-600'
                }, 'Enter your email address and we\'ll send you a link to reset your password.'),

                errors.forgotEmail && React.createElement('div', {
                  className: 'bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm'
                }, errors.forgotEmail),

                React.createElement('div', null,
                  React.createElement('label', {
                    className: 'block text-sm font-medium text-gray-700 mb-2'
                  }, 'Email'),
                  React.createElement('input', {
                    type: 'email',
                    value: forgotEmail,
                    onChange: (e) => setForgotEmail(e.target.value),
                    className: `w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent ${
                      errors.forgotEmail ? 'border-red-300' : 'border-gray-300'
                    }`,
                    placeholder: 'john@example.com',
                    autoFocus: true
                  })
                ),

                React.createElement('button', {
                  type: 'submit',
                  disabled: isLoading,
                  className: `w-full bg-indigo-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-indigo-700 transition-colors ${
                    isLoading ? 'opacity-50 cursor-not-allowed' : ''
                  }`
                }, isLoading
                  ? React.createElement('div', { className: 'flex items-center justify-center' },
                      React.createElement('div', { className: 'animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2' }),
                      'Sending...'
                    )
                  : 'Send Reset Link'
                ),

                React.createElement('div', { className: 'text-center pt-2' },
                  React.createElement('button', {
                    type: 'button',
                    onClick: () => switchToView('login'),
                    className: 'text-sm text-indigo-600 hover:text-indigo-700 font-medium'
                  }, '← Back to Sign In')
                )
              )
        )
      )
    );
  }

  // ── Login / Register View ────────────────────────────────────────────────
  return React.createElement('div', {
    className: 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4',
    onClick: (e) => e.target === e.currentTarget && onClose()
  },
    React.createElement('div', {
      className: 'bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto'
    },
      // Header
      React.createElement('div', {
        className: 'flex items-center justify-between p-6 border-b border-gray-200'
      },
        React.createElement('h2', {
          className: 'text-2xl font-bold text-gray-900'
        }, view === 'login' ? 'Welcome Back' : 'Create Account'),
        React.createElement('button', {
          onClick: onClose,
          className: 'text-gray-400 hover:text-gray-600 text-2xl'
        }, '×')
      ),

      // Form
      React.createElement('form', {
        onSubmit: handleSubmit,
        className: 'p-6 space-y-4'
      },
        // General error
        errors.general && React.createElement('div', {
          className: 'bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm'
        }, errors.general),

        // Registration fields
        view === 'register' && React.createElement('div', {
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
              className: `w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent ${
                errors.firstName ? 'border-red-300' : 'border-gray-300'
              }`,
              placeholder: 'John'
            }),
            errors.firstName && React.createElement('p', {
              className: 'text-red-500 text-xs mt-1'
            }, errors.firstName)
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
              className: `w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent ${
                errors.lastName ? 'border-red-300' : 'border-gray-300'
              }`,
              placeholder: 'Doe'
            }),
            errors.lastName && React.createElement('p', {
              className: 'text-red-500 text-xs mt-1'
            }, errors.lastName)
          )
        ),

        view === 'register' && React.createElement('div', null,
          React.createElement('label', {
            className: 'block text-sm font-medium text-gray-700 mb-2'
          }, 'Organization (Optional)'),
          React.createElement('input', {
            type: 'text',
            name: 'organization',
            value: formData.organization,
            onChange: handleInputChange,
            className: 'w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent',
            placeholder: 'Your Company'
          })
        ),

        // Email
        React.createElement('div', null,
          React.createElement('label', {
            className: 'block text-sm font-medium text-gray-700 mb-2'
          }, 'Email'),
          React.createElement('input', {
            type: 'email',
            name: 'email',
            value: formData.email,
            onChange: handleInputChange,
            className: `w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent ${
              errors.email ? 'border-red-300' : 'border-gray-300'
            }`,
            placeholder: 'john@example.com'
          }),
          errors.email && React.createElement('p', {
            className: 'text-red-500 text-xs mt-1'
          }, errors.email)
        ),

        // Password
        React.createElement('div', null,
          React.createElement('div', {
            className: 'flex items-center justify-between mb-2'
          },
            React.createElement('label', {
              className: 'block text-sm font-medium text-gray-700'
            }, 'Password'),
            view === 'login' && React.createElement('button', {
              type: 'button',
              onClick: () => switchToView('forgotPassword'),
              className: 'text-xs text-indigo-600 hover:text-indigo-700 font-medium'
            }, 'Forgot password?')
          ),
          React.createElement('input', {
            type: 'password',
            name: 'password',
            value: formData.password,
            onChange: handleInputChange,
            className: `w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent ${
              errors.password ? 'border-red-300' : 'border-gray-300'
            }`,
            placeholder: view === 'login' ? 'Enter your password' : 'Create a password (6+ characters)'
          }),
          errors.password && React.createElement('p', {
            className: 'text-red-500 text-xs mt-1'
          }, errors.password)
        ),

        // Submit button
        React.createElement('button', {
          type: 'submit',
          disabled: isLoading,
          className: `w-full bg-indigo-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-indigo-700 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-colors ${
            isLoading ? 'opacity-50 cursor-not-allowed' : ''
          }`
        }, isLoading
          ? React.createElement('div', { className: 'flex items-center justify-center' },
              React.createElement('div', { className: 'animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2' }),
              view === 'login' ? 'Signing In...' : 'Creating Account...'
            )
          : (view === 'login' ? 'Sign In' : 'Create Account')
        ),

        // Switch mode
        React.createElement('div', {
          className: 'text-center pt-4 border-t border-gray-200'
        },
          React.createElement('p', {
            className: 'text-sm text-gray-600'
          },
            view === 'login' ? "Don't have an account? " : "Already have an account? ",
            React.createElement('button', {
              type: 'button',
              onClick: () => switchToView(view === 'login' ? 'register' : 'login'),
              className: 'text-indigo-600 hover:text-indigo-700 font-medium'
            }, view === 'login' ? 'Sign Up' : 'Sign In')
          )
        )
      )
    )
  );
}

export default AuthModal;
