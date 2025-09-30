import React, { useState } from 'react';
import { HelpIcon } from './Tooltip';

function HelpPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [expandedFAQ, setExpandedFAQ] = useState(null);

  const categories = [
    { id: 'all', name: 'All Topics', icon: '📚' },
    { id: 'getting-started', name: 'Getting Started', icon: '🚀' },
    { id: 'consensus-analysis', name: 'Consensus Analysis', icon: '🤖' },
    { id: 'billing', name: 'Billing & Plans', icon: '💳' },
    { id: 'account', name: 'Account Management', icon: '👤' },
    { id: 'technical', name: 'Technical Issues', icon: '🔧' },
    { id: 'api', name: 'API & Integration', icon: '⚡' }
  ];

  const helpArticles = [
    {
      id: 1,
      category: 'getting-started',
      title: 'How to Get Started with Consensus.AI',
      description: 'Complete guide to creating your first consensus analysis',
      content: `
        <h3>Welcome to Consensus.AI!</h3>
        <p>Getting started with AI-powered consensus analysis is easy. Follow these steps:</p>
        
        <h4>1. Create Your Account</h4>
        <ul>
          <li>Sign up with your email address</li>
          <li>Choose a subscription plan or start with pay-as-you-go</li>
          <li>Complete the welcome tutorial</li>
        </ul>
        
        <h4>2. Create Your First Analysis</h4>
        <ul>
          <li>Click "New Analysis" from your dashboard</li>
          <li>Enter a clear, specific question or topic</li>
          <li>Add relevant sources (optional but recommended)</li>
          <li>Upload documents if you have them (PDF, TXT, CSV, JSON)</li>
        </ul>
        
        <h4>3. Review Your Results</h4>
        <ul>
          <li>Wait 60-90 seconds for the 3-phase analysis to complete</li>
          <li>Review the consensus report with confidence scores</li>
          <li>Download the professional PDF report</li>
          <li>Access your report anytime from "Past Reports"</li>
        </ul>
      `,
      tags: ['beginner', 'tutorial', 'first-time']
    },
    {
      id: 2,
      category: 'consensus-analysis',
      title: 'Understanding the 3-Phase Consensus Process',
      description: 'Learn how our AI models work together to create unbiased analysis',
      content: `
        <h3>The 3-Phase Consensus Process</h3>
        <p>Consensus.AI uses a unique 3-phase approach to ensure balanced, comprehensive analysis:</p>
        
        <h4>Phase 1: Independent Analysis</h4>
        <ul>
          <li><strong>GPT-4:</strong> Provides detailed, structured analysis</li>
          <li><strong>Claude:</strong> Offers nuanced, contextual insights</li>
          <li><strong>Gemini:</strong> Delivers comprehensive, multi-perspective views</li>
        </ul>
        <p>Each model analyzes your topic independently without seeing the others' work, preventing bias.</p>
        
        <h4>Phase 2: Peer Review</h4>
        <ul>
          <li>Each AI model reviews and critiques the others' analyses</li>
          <li>Identifies strengths, weaknesses, and gaps in reasoning</li>
          <li>Ensures quality and completeness of the analysis</li>
        </ul>
        
        <h4>Phase 3: Final Arbitration</h4>
        <ul>
          <li><strong>Cohere:</strong> Acts as the final arbiter</li>
          <li>Synthesizes all perspectives into a balanced conclusion</li>
          <li>Provides confidence scores for each finding</li>
          <li>Creates the final consensus report</li>
        </ul>
        
        <h4>Why This Approach Works</h4>
        <ul>
          <li>Reduces individual model biases</li>
          <li>Provides multiple perspectives on complex topics</li>
          <li>Ensures thorough analysis through peer review</li>
          <li>Delivers balanced, well-reasoned conclusions</li>
        </ul>
      `,
      tags: ['process', 'ai-models', 'methodology']
    },
    {
      id: 3,
      category: 'consensus-analysis',
      title: 'Writing Effective Analysis Questions',
      description: 'Tips for crafting questions that produce the best consensus results',
      content: `
        <h3>Writing Great Analysis Questions</h3>
        <p>The quality of your question directly impacts the quality of your analysis. Here's how to write effective questions:</p>
        
        <h4>✅ Good Question Examples</h4>
        <ul>
          <li>"What are the pros and cons of remote work for software development teams?"</li>
          <li>"Should small businesses invest in AI automation tools in 2024?"</li>
          <li>"What are the key factors to consider when choosing a cloud provider?"</li>
          <li>"How effective are different marketing strategies for B2B SaaS companies?"</li>
        </ul>
        
        <h4>❌ Questions to Avoid</h4>
        <ul>
          <li>"Is remote work good?" (too vague)</li>
          <li>"Should I buy Tesla stock?" (requires personal financial advice)</li>
          <li>"What will happen tomorrow?" (requires prediction of specific events)</li>
          <li>"Yes or no: Is AI dangerous?" (oversimplified binary question)</li>
        </ul>
        
        <h4>Best Practices</h4>
        <ul>
          <li><strong>Be Specific:</strong> Include context, timeframe, and scope</li>
          <li><strong>Ask Open-Ended Questions:</strong> Allow for nuanced analysis</li>
          <li><strong>Provide Context:</strong> Include relevant background information</li>
          <li><strong>Focus on Analysis:</strong> Ask for evaluation, comparison, or assessment</li>
          <li><strong>Avoid Personal Advice:</strong> Focus on general principles and insights</li>
        </ul>
        
        <h4>Question Templates</h4>
        <ul>
          <li>"What are the advantages and disadvantages of [topic] for [context]?"</li>
          <li>"How should [type of organization] approach [challenge/opportunity]?"</li>
          <li>"What factors should be considered when [making a decision] about [topic]?"</li>
          <li>"What are the best practices for [activity] in [industry/context]?"</li>
        </ul>
      `,
      tags: ['questions', 'best-practices', 'tips']
    },
    {
      id: 4,
      category: 'billing',
      title: 'Understanding Subscription Plans and Billing',
      description: 'Complete guide to pricing, billing, and subscription management',
      content: `
        <h3>Subscription Plans & Billing</h3>
        <p>Choose the plan that best fits your analysis needs:</p>
        
        <h4>Pay-As-You-Go ($15/report)</h4>
        <ul>
          <li>Perfect for occasional use</li>
          <li>No monthly commitment</li>
          <li>Pay only for reports you generate</li>
          <li>All features included</li>
        </ul>
        
        <h4>Starter Plan ($29/month)</h4>
        <ul>
          <li>3 reports per month included</li>
          <li>$12 per additional report</li>
          <li>Great for individuals and small teams</li>
          <li>7-day free trial</li>
        </ul>
        
        <h4>Professional Plan ($79/month)</h4>
        <ul>
          <li>10 reports per month included</li>
          <li>$10 per additional report</li>
          <li>Priority support</li>
          <li>Custom report branding</li>
          <li>Most popular choice</li>
        </ul>
        
        <h4>Business Plan ($199/month)</h4>
        <ul>
          <li>30 reports per month included</li>
          <li>$8 per additional report</li>
          <li>Dedicated account manager</li>
          <li>Team collaboration tools</li>
          <li>Priority API access</li>
        </ul>
        
        <h4>Billing Information</h4>
        <ul>
          <li><strong>Billing Cycle:</strong> Monthly or yearly (save up to 17%)</li>
          <li><strong>Payment Methods:</strong> Credit card, debit card</li>
          <li><strong>Invoicing:</strong> Available for Business plans</li>
          <li><strong>Refunds:</strong> 7-day free trial, no refunds after reports are generated</li>
        </ul>
        
        <h4>Managing Your Subscription</h4>
        <ul>
          <li>Upgrade or downgrade anytime</li>
          <li>Cancel anytime (access continues until period end)</li>
          <li>View usage and billing history in your dashboard</li>
          <li>Download invoices and receipts</li>
        </ul>
      `,
      tags: ['pricing', 'subscription', 'billing', 'plans']
    }
  ];

  const faqs = [
    {
      id: 1,
      category: 'getting-started',
      question: 'How long does a consensus analysis take?',
      answer: 'Most analyses complete in 60-90 seconds. Complex topics with multiple sources may take up to 3 minutes. You\'ll see real-time progress updates throughout the process.'
    },
    {
      id: 2,
      category: 'consensus-analysis',
      question: 'What file types can I upload as sources?',
      answer: 'We support PDF, TXT, CSV, and JSON files up to 10MB each. You can upload up to 5 files per analysis. We automatically extract and analyze the text content.'
    },
    {
      id: 3,
      category: 'billing',
      question: 'Can I cancel my subscription anytime?',
      answer: 'Yes, you can cancel your subscription at any time. Your access continues until the end of your current billing period, and you can still access all your past reports.'
    },
    {
      id: 4,
      category: 'technical',
      question: 'Is my data secure and private?',
      answer: 'Absolutely. We\'re GDPR compliant, use enterprise-grade encryption, and never store your analysis content longer than necessary. You can export or delete your data at any time.'
    },
    {
      id: 5,
      category: 'consensus-analysis',
      question: 'How accurate are the AI-generated analyses?',
      answer: 'Our 3-phase consensus process significantly improves accuracy by combining multiple AI perspectives and peer review. However, you should always verify important information and use the analysis as a starting point for your own research.'
    },
    {
      id: 6,
      category: 'account',
      question: 'How do I delete my account and data?',
      answer: 'You can request account deletion from your profile settings. We provide a 30-day recovery period, after which all your data is permanently deleted. You can also export your data before deletion.'
    }
  ];

  const filteredArticles = helpArticles.filter(article => {
    const matchesCategory = selectedCategory === 'all' || article.category === selectedCategory;
    const matchesSearch = searchQuery === '' || 
      article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      article.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      article.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  const filteredFAQs = faqs.filter(faq => {
    const matchesCategory = selectedCategory === 'all' || faq.category === selectedCategory;
    const matchesSearch = searchQuery === '' || 
      faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return React.createElement('div', { className: 'min-h-screen bg-gradient-to-br from-indigo-50 to-violet-50' },
    React.createElement('div', { className: 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12' },
      
      // Header
      React.createElement('div', { className: 'text-center mb-12' },
        React.createElement('h1', { className: 'text-4xl font-bold text-slate-900 mb-4' },
          'Help & Documentation'
        ),
        React.createElement('p', { className: 'text-xl text-slate-600 max-w-2xl mx-auto mb-8' },
          'Everything you need to know about using Consensus.AI effectively'
        ),
        
        // Search Bar
        React.createElement('div', { className: 'max-w-md mx-auto' },
          React.createElement('div', { className: 'relative' },
            React.createElement('input', {
              type: 'text',
              placeholder: 'Search help articles and FAQs...',
              value: searchQuery,
              onChange: (e) => setSearchQuery(e.target.value),
              className: 'w-full px-4 py-3 pl-12 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent'
            }),
            React.createElement('svg', {
              className: 'absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400',
              fill: 'none',
              stroke: 'currentColor',
              viewBox: '0 0 24 24'
            },
              React.createElement('path', {
                strokeLinecap: 'round',
                strokeLinejoin: 'round',
                strokeWidth: 2,
                d: 'M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z'
              })
            )
          )
        )
      ),

      React.createElement('div', { className: 'grid lg:grid-cols-4 gap-8' },
        
        // Sidebar - Categories
        React.createElement('div', { className: 'lg:col-span-1' },
          React.createElement('div', { className: 'bg-white rounded-2xl shadow-sm border border-slate-200 p-6 sticky top-8' },
            React.createElement('h3', { className: 'text-lg font-semibold text-slate-900 mb-4' }, 'Categories'),
            React.createElement('div', { className: 'space-y-2' },
              ...categories.map(category =>
                React.createElement('button', {
                  key: category.id,
                  onClick: () => setSelectedCategory(category.id),
                  className: `w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                    selectedCategory === category.id
                      ? 'bg-indigo-100 text-indigo-700 font-medium'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`
                },
                  React.createElement('span', { className: 'mr-2' }, category.icon),
                  category.name
                )
              )
            )
          )
        ),

        // Main Content
        React.createElement('div', { className: 'lg:col-span-3 space-y-8' },
          
          // Help Articles
          filteredArticles.length > 0 && React.createElement('div', null,
            React.createElement('h2', { className: 'text-2xl font-bold text-slate-900 mb-6' }, 'Help Articles'),
            React.createElement('div', { className: 'grid gap-6' },
              ...filteredArticles.map(article =>
                React.createElement('div', {
                  key: article.id,
                  className: 'bg-white rounded-xl border border-slate-200 p-6 hover:shadow-md transition-shadow'
                },
                  React.createElement('h3', { className: 'text-xl font-semibold text-slate-900 mb-2' }, article.title),
                  React.createElement('p', { className: 'text-slate-600 mb-4' }, article.description),
                  React.createElement('div', { className: 'flex items-center justify-between' },
                    React.createElement('div', { className: 'flex flex-wrap gap-2' },
                      ...article.tags.map(tag =>
                        React.createElement('span', {
                          key: tag,
                          className: 'px-2 py-1 bg-slate-100 text-slate-600 text-xs rounded'
                        }, tag)
                      )
                    ),
                    React.createElement('button', {
                      onClick: () => {
                        // Navigate to knowledge base
                        window.location.hash = '#/knowledge-base';
                      },
                      className: 'text-indigo-600 hover:text-indigo-800 font-medium text-sm'
                    }, 'Read Article →')
                  )
                )
              )
            )
          ),

          // FAQ Section
          filteredFAQs.length > 0 && React.createElement('div', null,
            React.createElement('h2', { className: 'text-2xl font-bold text-slate-900 mb-6' }, 'Frequently Asked Questions'),
            React.createElement('div', { className: 'space-y-4' },
              ...filteredFAQs.map(faq =>
                React.createElement('div', {
                  key: faq.id,
                  className: 'bg-white rounded-xl border border-slate-200 overflow-hidden'
                },
                  React.createElement('button', {
                    onClick: () => setExpandedFAQ(expandedFAQ === faq.id ? null : faq.id),
                    className: 'w-full px-6 py-4 text-left flex items-center justify-between hover:bg-slate-50 transition-colors'
                  },
                    React.createElement('h3', { className: 'font-semibold text-slate-900' }, faq.question),
                    React.createElement('svg', {
                      className: `w-5 h-5 text-slate-400 transition-transform ${expandedFAQ === faq.id ? 'rotate-180' : ''}`,
                      fill: 'none',
                      stroke: 'currentColor',
                      viewBox: '0 0 24 24'
                    },
                      React.createElement('path', {
                        strokeLinecap: 'round',
                        strokeLinejoin: 'round',
                        strokeWidth: 2,
                        d: 'M19 9l-7 7-7-7'
                      })
                    )
                  ),
                  expandedFAQ === faq.id && React.createElement('div', { className: 'px-6 pb-4' },
                    React.createElement('p', { className: 'text-slate-600' }, faq.answer)
                  )
                )
              )
            )
          ),

          // No Results
          (filteredArticles.length === 0 && filteredFAQs.length === 0) && React.createElement('div', { className: 'text-center py-12' },
            React.createElement('div', { className: 'w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4' },
              React.createElement('svg', { className: 'w-8 h-8 text-slate-400', fill: 'none', stroke: 'currentColor', viewBox: '0 0 24 24' },
                React.createElement('path', { strokeLinecap: 'round', strokeLinejoin: 'round', strokeWidth: 2, d: 'M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z' })
              )
            ),
            React.createElement('h3', { className: 'text-lg font-semibold text-slate-900 mb-2' }, 'No results found'),
            React.createElement('p', { className: 'text-slate-600 mb-4' }, 'Try adjusting your search or browse different categories'),
            React.createElement('button', {
              onClick: () => {
                setSearchQuery('');
                setSelectedCategory('all');
              },
              className: 'text-indigo-600 hover:text-indigo-800 font-medium'
            }, 'Clear filters')
          )
        )
      ),

      // Contact Support CTA
      React.createElement('div', { className: 'mt-16 bg-gradient-to-r from-indigo-600 to-violet-600 rounded-2xl p-8 text-center text-white' },
        React.createElement('h2', { className: 'text-2xl font-bold mb-4' }, 'Still Need Help?'),
        React.createElement('p', { className: 'text-indigo-100 mb-6' }, 'Can\'t find what you\'re looking for? Our support team is here to help.'),
        React.createElement('a', {
          href: '/contact',
          className: 'inline-block bg-white text-indigo-600 px-6 py-3 rounded-lg hover:bg-gray-100 transition-colors font-medium'
        }, 'Contact Support')
      )
    )
  );
}

export default HelpPage;
