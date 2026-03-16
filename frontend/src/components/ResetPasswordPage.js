import React, { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { apiHelpers } from '../config/api';

function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setIsLoading(true);
    try {
      await apiHelpers.resetPassword(token, newPassword);
      setSuccess(true);
    } catch (err) {
      setError(
        err.response?.data?.error ||
        'This reset link is invalid or has expired. Please request a new one.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  return React.createElement('div', {
    className: 'min-h-screen bg-gray-50 flex items-center justify-center p-4'
  },
    React.createElement('div', {
      className: 'bg-white rounded-2xl shadow-lg w-full max-w-md p-8'
    },
      // Logo / brand
      React.createElement('div', { className: 'text-center mb-6' },
        React.createElement('h1', {
          className: 'text-2xl font-bold text-gray-900'
        }, 'Consensus.AI'),
        React.createElement('p', {
          className: 'text-gray-500 text-sm mt-1'
        }, 'Set a new password')
      ),

      !token
        // No token in URL
        ? React.createElement('div', null,
            React.createElement('div', {
              className: 'bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm mb-4'
            }, 'Invalid reset link. Please request a new password reset.'),
            React.createElement('button', {
              onClick: () => navigate('/'),
              className: 'w-full bg-indigo-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-indigo-700 transition-colors'
            }, 'Go to Home')
          )

        : success
        // Success state
        ? React.createElement('div', null,
            React.createElement('div', {
              className: 'bg-green-50 border border-green-200 text-green-700 px-4 py-4 rounded-lg text-sm mb-6'
            },
              React.createElement('p', { className: 'font-medium mb-1' }, 'Password reset successfully!'),
              React.createElement('p', null, 'You can now sign in with your new password.')
            ),
            React.createElement('button', {
              onClick: () => navigate('/'),
              className: 'w-full bg-indigo-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-indigo-700 transition-colors'
            }, 'Go to Sign In')
          )

        // Reset form
        : React.createElement('form', { onSubmit: handleSubmit, className: 'space-y-4' },
            error && React.createElement('div', {
              className: 'bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm'
            },
              error,
              error.includes('invalid or has expired') && React.createElement('span', null,
                ' ',
                React.createElement('button', {
                  type: 'button',
                  onClick: () => navigate('/'),
                  className: 'underline font-medium'
                }, 'Request a new link')
              )
            ),

            React.createElement('div', null,
              React.createElement('label', {
                className: 'block text-sm font-medium text-gray-700 mb-2'
              }, 'New Password'),
              React.createElement('input', {
                type: 'password',
                value: newPassword,
                onChange: (e) => setNewPassword(e.target.value),
                className: 'w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent',
                placeholder: 'At least 6 characters',
                autoFocus: true
              })
            ),

            React.createElement('div', null,
              React.createElement('label', {
                className: 'block text-sm font-medium text-gray-700 mb-2'
              }, 'Confirm New Password'),
              React.createElement('input', {
                type: 'password',
                value: confirmPassword,
                onChange: (e) => setConfirmPassword(e.target.value),
                className: 'w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent',
                placeholder: 'Repeat your new password'
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
                  'Resetting...'
                )
              : 'Reset Password'
            )
          )
    )
  );
}

export default ResetPasswordPage;
