import React, { useState } from 'react';
import { HelpIcon } from './Tooltip';
import { apiHelpers } from '../config/api';

function FeedbackPage() {
  const [feedbackType, setFeedbackType] = useState('feature');
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'general',
    priority: 'medium',
    email: '',
    allowContact: true
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState(null);

  const feedbackTypes = [
    {
      id: 'feature',
      name: 'Feature Request',
      icon: '💡',
      description: 'Suggest new features or improvements',
      color: 'blue'
    },
    {
      id: 'bug',
      name: 'Bug Report',
      icon: '🐛',
      description: 'Report issues or problems',
      color: 'red'
    },
    {
      id: 'improvement',
      name: 'Improvement',
      icon: '⚡',
      description: 'Suggest enhancements to existing features',
      color: 'green'
    },
    {
      id: 'general',
      name: 'General Feedback',
      icon: '💬',
      description: 'Share your thoughts and suggestions',
      color: 'purple'
    }
  ];

  const categories = [
    { value: 'general', label: 'General Platform' },
    { value: 'consensus', label: 'Consensus Analysis' },
    { value: 'reports', label: 'Reports & PDF' },
    { value: 'dashboard', label: 'Dashboard & UI' },
    { value: 'billing', label: 'Billing & Subscription' },
    { value: 'api', label: 'API & Integration' },
    { value: 'mobile', label: 'Mobile Experience' },
    { value: 'performance', label: 'Performance & Speed' }
  ];

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitStatus(null);

    try {
      const feedbackData = {
        type: feedbackType,
        ...formData
      };
      
      console.log('💡 Submitting feedback:', feedbackData);
      
      const response = await apiHelpers.submitFeedback(feedbackData);
      
      if (response.data.success) {
        console.log('✅ Feedback submitted successfully:', response.data);
        setSubmitStatus('success');
        setFormData({
          title: '',
          description: '',
          category: 'general',
          priority: 'medium',
          email: '',
          allowContact: true
        });
      } else {
        throw new Error(response.data.error || 'Failed to submit feedback');
      }
    } catch (error) {
      console.error('❌ Error submitting feedback:', error);
      setSubmitStatus('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedType = feedbackTypes.find(type => type.id === feedbackType);

  return React.createElement('div', { className: 'min-h-screen bg-gradient-to-br from-indigo-50 to-violet-50' },
    React.createElement('div', { className: 'max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12' },
      
      // Header
      React.createElement('div', { className: 'text-center mb-12' },
        React.createElement('h1', { className: 'text-4xl font-bold text-slate-900 mb-4' },
          'Share Your Feedback'
        ),
        React.createElement('p', { className: 'text-xl text-slate-600 max-w-2xl mx-auto' },
          'Help us improve Consensus.AI by sharing your ideas, reporting bugs, or suggesting enhancements.'
        )
      ),

      // Feedback Type Selection
      React.createElement('div', { className: 'mb-8' },
        React.createElement('h2', { className: 'text-xl font-semibold text-slate-900 mb-4' }, 'What type of feedback do you have?'),
        React.createElement('div', { className: 'grid md:grid-cols-2 lg:grid-cols-4 gap-4' },
          ...feedbackTypes.map(type =>
            React.createElement('button', {
              key: type.id,
              onClick: () => setFeedbackType(type.id),
              className: `p-4 rounded-xl border-2 transition-all text-left ${
                feedbackType === type.id
                  ? `border-${type.color}-500 bg-${type.color}-50`
                  : 'border-slate-200 hover:border-slate-300 bg-white'
              }`
            },
              React.createElement('div', { className: 'flex items-center mb-2' },
                React.createElement('span', { className: 'text-2xl mr-3' }, type.icon),
                React.createElement('h3', { className: 'font-semibold text-slate-900' }, type.name)
              ),
              React.createElement('p', { className: 'text-sm text-slate-600' }, type.description)
            )
          )
        )
      ),

      // Feedback Form
      React.createElement('div', { className: 'bg-white rounded-2xl shadow-sm border border-slate-200 p-8' },
        React.createElement('div', { className: 'flex items-center mb-6' },
          React.createElement('span', { className: 'text-3xl mr-4' }, selectedType.icon),
          React.createElement('div', null,
            React.createElement('h2', { className: 'text-2xl font-semibold text-slate-900' }, selectedType.name),
            React.createElement('p', { className: 'text-slate-600' }, selectedType.description)
          )
        ),

        submitStatus === 'success' && React.createElement('div', { className: 'mb-6 p-4 bg-green-50 border border-green-200 rounded-lg' },
          React.createElement('div', { className: 'flex items-center' },
            React.createElement('svg', { className: 'w-5 h-5 text-green-500 mr-2', fill: 'currentColor', viewBox: '0 0 20 20' },
              React.createElement('path', { fillRule: 'evenodd', d: 'M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z', clipRule: 'evenodd' })
            ),
            React.createElement('p', { className: 'text-green-800 font-medium' }, 'Feedback submitted successfully!'),
          ),
          React.createElement('p', { className: 'text-green-700 text-sm mt-1' }, 'Thank you for helping us improve Consensus.AI. We\'ll review your feedback and get back to you if needed.')
        ),

        submitStatus === 'error' && React.createElement('div', { className: 'mb-6 p-4 bg-red-50 border border-red-200 rounded-lg' },
          React.createElement('div', { className: 'flex items-center' },
            React.createElement('svg', { className: 'w-5 h-5 text-red-500 mr-2', fill: 'currentColor', viewBox: '0 0 20 20' },
              React.createElement('path', { fillRule: 'evenodd', d: 'M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z', clipRule: 'evenodd' })
            ),
            React.createElement('p', { className: 'text-red-800 font-medium' }, 'Failed to submit feedback'),
          ),
          React.createElement('p', { className: 'text-red-700 text-sm mt-1' }, 'Please try again or contact us directly at feedback@consensusai.com')
        ),

        React.createElement('form', { onSubmit: handleSubmit, className: 'space-y-6' },
          
          // Title
          React.createElement('div', null,
            React.createElement('label', { htmlFor: 'title', className: 'block text-sm font-medium text-slate-700 mb-2' },
              feedbackType === 'bug' ? 'Bug Summary' : 
              feedbackType === 'feature' ? 'Feature Title' : 'Feedback Title'
            ),
            React.createElement('input', {
              type: 'text',
              id: 'title',
              name: 'title',
              value: formData.title,
              onChange: handleInputChange,
              required: true,
              className: 'w-full px-4 py-3 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent',
              placeholder: feedbackType === 'bug' ? 'Brief description of the bug' :
                          feedbackType === 'feature' ? 'Name of the feature you\'d like to see' :
                          'Brief title for your feedback'
            })
          ),

          // Category and Priority
          React.createElement('div', { className: 'grid md:grid-cols-2 gap-6' },
            React.createElement('div', null,
              React.createElement('div', { className: 'flex items-center space-x-2 mb-2' },
                React.createElement('label', { htmlFor: 'category', className: 'block text-sm font-medium text-slate-700' }, 'Category'),
                React.createElement(HelpIcon, {
                  tooltip: 'Choose the area of the platform this feedback relates to.',
                  size: 'xs'
                })
              ),
              React.createElement('select', {
                id: 'category',
                name: 'category',
                value: formData.category,
                onChange: handleInputChange,
                className: 'w-full px-4 py-3 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent'
              },
                ...categories.map(cat =>
                  React.createElement('option', { key: cat.value, value: cat.value }, cat.label)
                )
              )
            ),
            React.createElement('div', null,
              React.createElement('div', { className: 'flex items-center space-x-2 mb-2' },
                React.createElement('label', { htmlFor: 'priority', className: 'block text-sm font-medium text-slate-700' }, 'Priority'),
                React.createElement(HelpIcon, {
                  tooltip: feedbackType === 'bug' ? 'How severely does this bug affect your work?' : 'How important is this to you?',
                  size: 'xs'
                })
              ),
              React.createElement('select', {
                id: 'priority',
                name: 'priority',
                value: formData.priority,
                onChange: handleInputChange,
                className: 'w-full px-4 py-3 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent'
              },
                React.createElement('option', { value: 'low' }, '🟢 Low - Nice to have'),
                React.createElement('option', { value: 'medium' }, '🟡 Medium - Would be helpful'),
                React.createElement('option', { value: 'high' }, '🟠 High - Important to me'),
                React.createElement('option', { value: 'critical' }, '🔴 Critical - Blocking my work')
              )
            )
          ),

          // Description
          React.createElement('div', null,
            React.createElement('label', { htmlFor: 'description', className: 'block text-sm font-medium text-slate-700 mb-2' },
              'Detailed Description'
            ),
            React.createElement('textarea', {
              id: 'description',
              name: 'description',
              value: formData.description,
              onChange: handleInputChange,
              required: true,
              rows: 6,
              className: 'w-full px-4 py-3 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none',
              placeholder: feedbackType === 'bug' ? 
                'Please describe:\n• What you were trying to do\n• What happened instead\n• Steps to reproduce the issue\n• Any error messages you saw' :
                feedbackType === 'feature' ?
                'Please describe:\n• What you\'d like to be able to do\n• How this would help you\n• Any specific requirements or ideas' :
                'Please provide as much detail as possible about your feedback, suggestions, or ideas...'
            })
          ),

          // Contact Information
          React.createElement('div', null,
            React.createElement('label', { htmlFor: 'email', className: 'block text-sm font-medium text-slate-700 mb-2' },
              'Email Address (Optional)'
            ),
            React.createElement('input', {
              type: 'email',
              id: 'email',
              name: 'email',
              value: formData.email,
              onChange: handleInputChange,
              className: 'w-full px-4 py-3 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent',
              placeholder: 'your@email.com'
            }),
            React.createElement('div', { className: 'mt-3' },
              React.createElement('label', { className: 'flex items-center' },
                React.createElement('input', {
                  type: 'checkbox',
                  name: 'allowContact',
                  checked: formData.allowContact,
                  onChange: handleInputChange,
                  className: 'w-4 h-4 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500'
                }),
                React.createElement('span', { className: 'ml-2 text-sm text-slate-600' },
                  'It\'s okay to contact me about this feedback'
                )
              )
            )
          ),

          // Submit Button
          React.createElement('div', { className: 'flex justify-end' },
            React.createElement('button', {
              type: 'submit',
              disabled: isSubmitting,
              className: `px-8 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-colors font-medium ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`
            },
              isSubmitting ? 'Submitting...' : 'Submit Feedback'
            )
          )
        )
      ),

      // Feedback Guidelines
      React.createElement('div', { className: 'mt-12 bg-blue-50 rounded-2xl p-8' },
        React.createElement('h3', { className: 'text-xl font-semibold text-blue-900 mb-4' }, 'Feedback Guidelines'),
        React.createElement('div', { className: 'grid md:grid-cols-2 gap-6' },
          React.createElement('div', null,
            React.createElement('h4', { className: 'font-semibold text-blue-900 mb-2' }, '✅ Great Feedback Includes:'),
            React.createElement('ul', { className: 'text-sm text-blue-800 space-y-1' },
              React.createElement('li', null, '• Clear, specific descriptions'),
              React.createElement('li', null, '• Steps to reproduce (for bugs)'),
              React.createElement('li', null, '• Use cases and context'),
              React.createElement('li', null, '• Screenshots or examples when helpful')
            )
          ),
          React.createElement('div', null,
            React.createElement('h4', { className: 'font-semibold text-blue-900 mb-2' }, '📋 What Happens Next:'),
            React.createElement('ul', { className: 'text-sm text-blue-800 space-y-1' },
              React.createElement('li', null, '• We review all feedback within 48 hours'),
              React.createElement('li', null, '• Popular requests get prioritized'),
              React.createElement('li', null, '• We\'ll update you on progress'),
              React.createElement('li', null, '• Critical bugs get immediate attention')
            )
          )
        )
      ),

      // Popular Requests
      React.createElement('div', { className: 'mt-12' },
        React.createElement('h3', { className: 'text-2xl font-bold text-slate-900 mb-6' }, 'Popular Feature Requests'),
        React.createElement('div', { className: 'grid md:grid-cols-2 gap-6' },
          React.createElement('div', { className: 'bg-white rounded-xl border border-slate-200 p-6' },
            React.createElement('div', { className: 'flex items-center justify-between mb-3' },
              React.createElement('h4', { className: 'font-semibold text-slate-900' }, '🔗 API Access'),
              React.createElement('span', { className: 'text-xs bg-green-100 text-green-800 px-2 py-1 rounded' }, 'In Development')
            ),
            React.createElement('p', { className: 'text-sm text-slate-600 mb-3' }, 'Programmatic access to consensus analysis'),
            React.createElement('div', { className: 'flex items-center text-xs text-slate-500' },
              React.createElement('span', null, '👍 42 votes'),
              React.createElement('span', { className: 'mx-2' }, '•'),
              React.createElement('span', null, 'Coming Q2 2024')
            )
          ),
          React.createElement('div', { className: 'bg-white rounded-xl border border-slate-200 p-6' },
            React.createElement('div', { className: 'flex items-center justify-between mb-3' },
              React.createElement('h4', { className: 'font-semibold text-slate-900' }, '📱 Mobile App'),
              React.createElement('span', { className: 'text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded' }, 'Planned')
            ),
            React.createElement('p', { className: 'text-sm text-slate-600 mb-3' }, 'Native iOS and Android applications'),
            React.createElement('div', { className: 'flex items-center text-xs text-slate-500' },
              React.createElement('span', null, '👍 38 votes'),
              React.createElement('span', { className: 'mx-2' }, '•'),
              React.createElement('span', null, 'Under consideration')
            )
          ),
          React.createElement('div', { className: 'bg-white rounded-xl border border-slate-200 p-6' },
            React.createElement('div', { className: 'flex items-center justify-between mb-3' },
              React.createElement('h4', { className: 'font-semibold text-slate-900' }, '👥 Team Collaboration'),
              React.createElement('span', { className: 'text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded' }, 'Researching')
            ),
            React.createElement('p', { className: 'text-sm text-slate-600 mb-3' }, 'Share and collaborate on analyses'),
            React.createElement('div', { className: 'flex items-center text-xs text-slate-500' },
              React.createElement('span', null, '👍 29 votes'),
              React.createElement('span', { className: 'mx-2' }, '•'),
              React.createElement('span', null, 'Gathering requirements')
            )
          ),
          React.createElement('div', { className: 'bg-white rounded-xl border border-slate-200 p-6' },
            React.createElement('div', { className: 'flex items-center justify-between mb-3' },
              React.createElement('h4', { className: 'font-semibold text-slate-900' }, '🎨 Custom Branding'),
              React.createElement('span', { className: 'text-xs bg-green-100 text-green-800 px-2 py-1 rounded' }, 'Available')
            ),
            React.createElement('p', { className: 'text-sm text-slate-600 mb-3' }, 'Add your logo and colors to reports'),
            React.createElement('div', { className: 'flex items-center text-xs text-slate-500' },
              React.createElement('span', null, '👍 25 votes'),
              React.createElement('span', { className: 'mx-2' }, '•'),
              React.createElement('span', null, 'Professional+ plans')
            )
          )
        )
      )
    )
  );
}

export default FeedbackPage;
