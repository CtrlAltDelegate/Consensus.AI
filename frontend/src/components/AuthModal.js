import React, { useState } from 'react';
import { apiHelpers } from '../config/api';

function AuthModal({ isVisible, onClose, onAuthSuccess }) {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    organization: ''
  });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error for this field when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    // Email validation
    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    // Password validation
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters long';
    }

    // Registration-specific validation
    if (!isLogin) {
      if (!formData.firstName) {
        newErrors.firstName = 'First name is required';
      }
      if (!formData.lastName) {
        newErrors.lastName = 'Last name is required';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    setErrors({});

    try {
      let response;
      
      if (isLogin) {
        // Login
        response = await apiHelpers.login({
          email: formData.email,
          password: formData.password
        });
      } else {
        // Register
        response = await apiHelpers.register({
          email: formData.email,
          password: formData.password,
          profile: {
            firstName: formData.firstName,
            lastName: formData.lastName,
            organization: formData.organization
          }
        });
      }

      if (response.data.success) {
        // Store token
        localStorage.setItem('auth_token', response.data.token);
        localStorage.setItem('user_data', JSON.stringify(response.data.user));
        
        console.log(`✅ ${isLogin ? 'Login' : 'Registration'} successful`);
        
        // Call success callback
        onAuthSuccess(response.data.user, response.data.token);
        
        // Close modal
        onClose();
        
        // Reset form
        setFormData({
          email: '',
          password: '',
          firstName: '',
          lastName: '',
          organization: ''
        });
      }
    } catch (error) {
      console.error(`❌ ${isLogin ? 'Login' : 'Registration'} failed:`, error);
      
      if (error.response?.data?.error) {
        if (error.response.data.field) {
          setErrors({ [error.response.data.field]: error.response.data.error });
        } else {
          setErrors({ general: error.response.data.error });
        }
      } else {
        setErrors({ general: `${isLogin ? 'Login' : 'Registration'} failed. Please try again.` });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const switchMode = () => {
    setIsLogin(!isLogin);
    setErrors({});
    setFormData({
      email: '',
      password: '',
      firstName: '',
      lastName: '',
      organization: ''
    });
  };

  if (!isVisible) return null;

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
        }, isLogin ? 'Welcome Back' : 'Create Account'),
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
        !isLogin && React.createElement('div', {
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

        !isLogin && React.createElement('div', null,
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
          React.createElement('label', {
            className: 'block text-sm font-medium text-gray-700 mb-2'
          }, 'Password'),
          React.createElement('input', {
            type: 'password',
            name: 'password',
            value: formData.password,
            onChange: handleInputChange,
            className: `w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent ${
              errors.password ? 'border-red-300' : 'border-gray-300'
            }`,
            placeholder: isLogin ? 'Enter your password' : 'Create a password (6+ characters)'
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
        }, isLoading ? 
          React.createElement('div', {
            className: 'flex items-center justify-center'
          },
            React.createElement('div', {
              className: 'animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2'
            }),
            isLogin ? 'Signing In...' : 'Creating Account...'
          ) :
          (isLogin ? 'Sign In' : 'Create Account')
        ),

        // Switch mode
        React.createElement('div', {
          className: 'text-center pt-4 border-t border-gray-200'
        },
          React.createElement('p', {
            className: 'text-sm text-gray-600'
          },
            isLogin ? "Don't have an account? " : "Already have an account? ",
            React.createElement('button', {
              type: 'button',
              onClick: switchMode,
              className: 'text-indigo-600 hover:text-indigo-700 font-medium'
            }, isLogin ? 'Sign Up' : 'Sign In')
          )
        )
      )
    )
  );
}

export default AuthModal;
