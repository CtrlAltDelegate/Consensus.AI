import React, { useState } from 'react';
import { HelpIcon } from './Tooltip';
import { apiHelpers } from '../config/api';

function ContactPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    category: 'general',
    message: '',
    priority: 'normal'
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState(null);

  const supportCategories = [
    { value: 'general', label: 'General Question', icon: '❓' },
    { value: 'technical', label: 'Technical Issue', icon: '🔧' },
    { value: 'billing', label: 'Billing & Subscription', icon: '💳' },
    { value: 'feature', label: 'Feature Request', icon: '💡' },
    { value: 'bug', label: 'Bug Report', icon: '🐛' },
    { value: 'account', label: 'Account Issue', icon: '👤' }
  ];

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitStatus(null);

    try {
      console.log('📧 Submitting contact form:', formData);
      
      const response = await apiHelpers.submitContactForm(formData);
      
      if (response.data.success) {
        console.log('✅ Contact form submitted successfully:', response.data);
        setSubmitStatus('success');
        setFormData({
          name: '',
          email: '',
          subject: '',
          category: 'general',
          message: '',
          priority: 'normal'
        });
      } else {
        throw new Error(response.data.error || 'Failed to submit contact form');
      }
    } catch (error) {
      console.error('❌ Error submitting contact form:', error);
      setSubmitStatus('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return React.createElement('div', { className: 'min-h-screen bg-gradient-to-br from-indigo-50 to-violet-50' },
    React.createElement('div', { className: 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12' },
      
      // Header
      React.createElement('div', { className: 'text-center mb-12' },
        React.createElement('h1', { className: 'text-4xl font-bold text-slate-900 mb-4' },
          'Get Help & Support'
        ),
        React.createElement('p', { className: 'text-xl text-slate-600 max-w-2xl mx-auto' },
          'We\'re here to help you get the most out of Consensus.AI. Choose the best way to reach us.'
        )
      ),

      React.createElement('div', { className: 'grid lg:grid-cols-3 gap-8' },
        
        // Contact Options
        React.createElement('div', { className: 'lg:col-span-1' },
          React.createElement('div', { className: 'bg-white rounded-2xl shadow-sm border border-slate-200 p-6 mb-8' },
            React.createElement('h2', { className: 'text-xl font-semibold text-slate-900 mb-6' }, 'Contact Options'),
            
            React.createElement('div', { className: 'space-y-6' },
              // Email Support
              React.createElement('div', { className: 'flex items-start space-x-4' },
                React.createElement('div', { className: 'w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0' },
                  React.createElement('svg', { className: 'w-6 h-6 text-blue-600', fill: 'none', stroke: 'currentColor', viewBox: '0 0 24 24' },
                    React.createElement('path', { strokeLinecap: 'round', strokeLinejoin: 'round', strokeWidth: 2, d: 'M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z' })
                  )
                ),
                React.createElement('div', null,
                  React.createElement('h3', { className: 'font-semibold text-slate-900 mb-1' }, 'Email Support'),
                  React.createElement('p', { className: 'text-sm text-slate-600 mb-2' }, 'Get help via email within 24 hours'),
                  React.createElement('a', { 
                    href: 'mailto:support@consensusai.com',
                    className: 'text-blue-600 hover:text-blue-800 text-sm font-medium'
                  }, 'support@consensusai.com')
                )
              ),

              // Live Chat (Coming Soon)
              React.createElement('div', { className: 'flex items-start space-x-4 opacity-75' },
                React.createElement('div', { className: 'w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0' },
                  React.createElement('svg', { className: 'w-6 h-6 text-green-600', fill: 'none', stroke: 'currentColor', viewBox: '0 0 24 24' },
                    React.createElement('path', { strokeLinecap: 'round', strokeLinejoin: 'round', strokeWidth: 2, d: 'M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z' })
                  )
                ),
                React.createElement('div', null,
                  React.createElement('h3', { className: 'font-semibold text-slate-900 mb-1' }, 'Live Chat'),
                  React.createElement('p', { className: 'text-sm text-slate-600 mb-2' }, 'Real-time support (coming soon)'),
                  React.createElement('span', { className: 'text-xs text-slate-500 bg-slate-100 px-2 py-1 rounded' }, 'Coming Soon')
                )
              ),

              // Phone Support (Premium)
              React.createElement('div', { className: 'flex items-start space-x-4' },
                React.createElement('div', { className: 'w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0' },
                  React.createElement('svg', { className: 'w-6 h-6 text-purple-600', fill: 'none', stroke: 'currentColor', viewBox: '0 0 24 24' },
                    React.createElement('path', { strokeLinecap: 'round', strokeLinejoin: 'round', strokeWidth: 2, d: 'M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z' })
                  )
                ),
                React.createElement('div', null,
                  React.createElement('h3', { className: 'font-semibold text-slate-900 mb-1' }, 'Phone Support'),
                  React.createElement('p', { className: 'text-sm text-slate-600 mb-2' }, 'Professional & Business plans'),
                  React.createElement('span', { className: 'text-xs text-purple-600 bg-purple-50 px-2 py-1 rounded' }, 'Premium Feature')
                )
              )
            )
          ),

          // Response Times
          React.createElement('div', { className: 'bg-white rounded-2xl shadow-sm border border-slate-200 p-6' },
            React.createElement('h3', { className: 'text-lg font-semibold text-slate-900 mb-4' }, 'Response Times'),
            React.createElement('div', { className: 'space-y-3' },
              React.createElement('div', { className: 'flex justify-between items-center' },
                React.createElement('span', { className: 'text-sm text-slate-600' }, 'General Questions'),
                React.createElement('span', { className: 'text-sm font-medium text-slate-900' }, '24 hours')
              ),
              React.createElement('div', { className: 'flex justify-between items-center' },
                React.createElement('span', { className: 'text-sm text-slate-600' }, 'Technical Issues'),
                React.createElement('span', { className: 'text-sm font-medium text-slate-900' }, '12 hours')
              ),
              React.createElement('div', { className: 'flex justify-between items-center' },
                React.createElement('span', { className: 'text-sm text-slate-600' }, 'Billing Questions'),
                React.createElement('span', { className: 'text-sm font-medium text-slate-900' }, '6 hours')
              ),
              React.createElement('div', { className: 'flex justify-between items-center' },
                React.createElement('span', { className: 'text-sm text-slate-600' }, 'Critical Issues'),
                React.createElement('span', { className: 'text-sm font-medium text-green-600' }, '2 hours')
              )
            )
          )
        ),

        // Contact Form
        React.createElement('div', { className: 'lg:col-span-2' },
          React.createElement('div', { className: 'bg-white rounded-2xl shadow-sm border border-slate-200 p-8' },
            React.createElement('h2', { className: 'text-2xl font-semibold text-slate-900 mb-6' }, 'Send us a Message'),
            
            submitStatus === 'success' && React.createElement('div', { className: 'mb-6 p-4 bg-green-50 border border-green-200 rounded-lg' },
              React.createElement('div', { className: 'flex items-center' },
                React.createElement('svg', { className: 'w-5 h-5 text-green-500 mr-2', fill: 'currentColor', viewBox: '0 0 20 20' },
                  React.createElement('path', { fillRule: 'evenodd', d: 'M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z', clipRule: 'evenodd' })
                ),
                React.createElement('p', { className: 'text-green-800 font-medium' }, 'Message sent successfully!'),
              ),
              React.createElement('p', { className: 'text-green-700 text-sm mt-1' }, 'We\'ll get back to you within 24 hours.')
            ),

            submitStatus === 'error' && React.createElement('div', { className: 'mb-6 p-4 bg-red-50 border border-red-200 rounded-lg' },
              React.createElement('div', { className: 'flex items-center' },
                React.createElement('svg', { className: 'w-5 h-5 text-red-500 mr-2', fill: 'currentColor', viewBox: '0 0 20 20' },
                  React.createElement('path', { fillRule: 'evenodd', d: 'M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z', clipRule: 'evenodd' })
                ),
                React.createElement('p', { className: 'text-red-800 font-medium' }, 'Failed to send message'),
              ),
              React.createElement('p', { className: 'text-red-700 text-sm mt-1' }, 'Please try again or email us directly at support@consensusai.com')
            ),

            React.createElement('form', { onSubmit: handleSubmit, className: 'space-y-6' },
              
              // Name and Email
              React.createElement('div', { className: 'grid md:grid-cols-2 gap-6' },
                React.createElement('div', null,
                  React.createElement('label', { htmlFor: 'name', className: 'block text-sm font-medium text-slate-700 mb-2' }, 'Your Name'),
                  React.createElement('input', {
                    type: 'text',
                    id: 'name',
                    name: 'name',
                    value: formData.name,
                    onChange: handleInputChange,
                    required: true,
                    className: 'w-full px-4 py-3 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent',
                    placeholder: 'John Doe'
                  })
                ),
                React.createElement('div', null,
                  React.createElement('label', { htmlFor: 'email', className: 'block text-sm font-medium text-slate-700 mb-2' }, 'Email Address'),
                  React.createElement('input', {
                    type: 'email',
                    id: 'email',
                    name: 'email',
                    value: formData.email,
                    onChange: handleInputChange,
                    required: true,
                    className: 'w-full px-4 py-3 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent',
                    placeholder: 'john@example.com'
                  })
                )
              ),

              // Category and Priority
              React.createElement('div', { className: 'grid md:grid-cols-2 gap-6' },
                React.createElement('div', null,
                  React.createElement('div', { className: 'flex items-center space-x-2 mb-2' },
                    React.createElement('label', { htmlFor: 'category', className: 'block text-sm font-medium text-slate-700' }, 'Category'),
                    React.createElement(HelpIcon, {
                      tooltip: 'Choose the category that best describes your question or issue for faster routing.',
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
                    ...supportCategories.map(cat =>
                      React.createElement('option', { key: cat.value, value: cat.value },
                        `${cat.icon} ${cat.label}`
                      )
                    )
                  )
                ),
                React.createElement('div', null,
                  React.createElement('div', { className: 'flex items-center space-x-2 mb-2' },
                    React.createElement('label', { htmlFor: 'priority', className: 'block text-sm font-medium text-slate-700' }, 'Priority'),
                    React.createElement(HelpIcon, {
                      tooltip: 'High priority for urgent issues affecting your work. Normal for general questions.',
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
                    React.createElement('option', { value: 'low' }, '🟢 Low - General question'),
                    React.createElement('option', { value: 'normal' }, '🟡 Normal - Standard support'),
                    React.createElement('option', { value: 'high' }, '🟠 High - Urgent issue'),
                    React.createElement('option', { value: 'critical' }, '🔴 Critical - Service down')
                  )
                )
              ),

              // Subject
              React.createElement('div', null,
                React.createElement('label', { htmlFor: 'subject', className: 'block text-sm font-medium text-slate-700 mb-2' }, 'Subject'),
                React.createElement('input', {
                  type: 'text',
                  id: 'subject',
                  name: 'subject',
                  value: formData.subject,
                  onChange: handleInputChange,
                  required: true,
                  className: 'w-full px-4 py-3 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent',
                  placeholder: 'Brief description of your question or issue'
                })
              ),

              // Message
              React.createElement('div', null,
                React.createElement('label', { htmlFor: 'message', className: 'block text-sm font-medium text-slate-700 mb-2' }, 'Message'),
                React.createElement('textarea', {
                  id: 'message',
                  name: 'message',
                  value: formData.message,
                  onChange: handleInputChange,
                  required: true,
                  rows: 6,
                  className: 'w-full px-4 py-3 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none',
                  placeholder: 'Please provide as much detail as possible about your question or issue...'
                })
              ),

              // Submit Button
              React.createElement('div', { className: 'flex justify-end' },
                React.createElement('button', {
                  type: 'submit',
                  disabled: isSubmitting,
                  className: `px-8 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-colors font-medium ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`
                },
                  isSubmitting ? 'Sending...' : 'Send Message'
                )
              )
            )
          )
        )
      ),

      // Quick Help Section
      React.createElement('div', { className: 'mt-16' },
        React.createElement('div', { className: 'text-center mb-8' },
          React.createElement('h2', { className: 'text-2xl font-bold text-slate-900 mb-4' }, 'Quick Help'),
          React.createElement('p', { className: 'text-slate-600' }, 'Common questions and helpful resources')
        ),
        
        React.createElement('div', { className: 'grid md:grid-cols-3 gap-6' },
          React.createElement('div', { className: 'bg-white rounded-xl border border-slate-200 p-6 text-center hover:shadow-md transition-shadow' },
            React.createElement('div', { className: 'w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-4' },
              React.createElement('span', { className: 'text-2xl' }, '📚')
            ),
            React.createElement('h3', { className: 'font-semibold text-slate-900 mb-2' }, 'Help Documentation'),
            React.createElement('p', { className: 'text-sm text-slate-600 mb-4' }, 'Comprehensive guides and tutorials'),
            React.createElement('a', { 
              href: '/help',
              className: 'text-blue-600 hover:text-blue-800 text-sm font-medium'
            }, 'Browse Help Docs →')
          ),
          
          React.createElement('div', { className: 'bg-white rounded-xl border border-slate-200 p-6 text-center hover:shadow-md transition-shadow' },
            React.createElement('div', { className: 'w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-4' },
              React.createElement('span', { className: 'text-2xl' }, '❓')
            ),
            React.createElement('h3', { className: 'font-semibold text-slate-900 mb-2' }, 'FAQ'),
            React.createElement('p', { className: 'text-sm text-slate-600 mb-4' }, 'Answers to frequently asked questions'),
            React.createElement('a', { 
              href: '/faq',
              className: 'text-green-600 hover:text-green-800 text-sm font-medium'
            }, 'View FAQ →')
          ),
          
          React.createElement('div', { className: 'bg-white rounded-xl border border-slate-200 p-6 text-center hover:shadow-md transition-shadow' },
            React.createElement('div', { className: 'w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-4' },
              React.createElement('span', { className: 'text-2xl' }, '💡')
            ),
            React.createElement('h3', { className: 'font-semibold text-slate-900 mb-2' }, 'Feature Requests'),
            React.createElement('p', { className: 'text-sm text-slate-600 mb-4' }, 'Suggest new features and improvements'),
            React.createElement('a', { 
              href: '/feedback',
              className: 'text-purple-600 hover:text-purple-800 text-sm font-medium'
            }, 'Submit Feedback →')
          )
        )
      )
    )
  );
}

export default ContactPage;
