import React, { useState } from 'react';
import { HelpIcon } from './Tooltip';

function KnowledgeBase() {
  const [selectedArticle, setSelectedArticle] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  const categories = [
    { id: 'all', name: 'All Articles', icon: '📚', count: 12 },
    { id: 'getting-started', name: 'Getting Started', icon: '🚀', count: 3 },
    { id: 'use-cases', name: 'Use Cases', icon: '💼', count: 4 },
    { id: 'best-practices', name: 'Best Practices', icon: '⭐', count: 3 },
    { id: 'advanced', name: 'Advanced Topics', icon: '🎓', count: 2 }
  ];

  const knowledgeArticles = [
    {
      id: 1,
      category: 'use-cases',
      title: 'How to Use Consensus.AI for Investment Analysis',
      description: 'Complete guide to analyzing investment opportunities with AI consensus',
      readTime: '8 min read',
      difficulty: 'Intermediate',
      tags: ['investment', 'finance', 'analysis'],
      lastUpdated: '2024-01-15',
      content: `
        <h2>Investment Analysis with Consensus.AI</h2>
        <p>Making informed investment decisions requires analyzing multiple perspectives and data sources. Consensus.AI can help you get unbiased analysis of investment opportunities by combining insights from multiple AI models.</p>
        
        <h3>Step 1: Frame Your Investment Question</h3>
        <p>Start with a clear, specific question about your investment opportunity:</p>
        <ul>
          <li><strong>Good:</strong> "What are the key factors to consider when investing in renewable energy stocks in 2024?"</li>
          <li><strong>Good:</strong> "Should small investors consider REITs vs direct real estate investment?"</li>
          <li><strong>Avoid:</strong> "Should I buy Tesla stock?" (too specific and personal)</li>
        </ul>
        
        <h3>Step 2: Gather Relevant Sources</h3>
        <p>Include diverse, credible sources for comprehensive analysis:</p>
        <ul>
          <li>Financial reports and earnings statements</li>
          <li>Industry analysis reports</li>
          <li>Market research and trends</li>
          <li>Regulatory filings and news</li>
          <li>Expert opinions and analyst reports</li>
        </ul>
        
        <h3>Step 3: Upload Supporting Documents</h3>
        <p>Upload relevant documents to provide context:</p>
        <ul>
          <li>PDF annual reports</li>
          <li>CSV files with financial data</li>
          <li>Text files with research notes</li>
          <li>JSON data from financial APIs</li>
        </ul>
        
        <h3>Step 4: Analyze the Consensus Report</h3>
        <p>Review the AI-generated analysis focusing on:</p>
        <ul>
          <li><strong>Risk Assessment:</strong> What risks are identified?</li>
          <li><strong>Opportunity Analysis:</strong> What potential upsides exist?</li>
          <li><strong>Market Context:</strong> How does this fit current market conditions?</li>
          <li><strong>Confidence Scores:</strong> How certain are the conclusions?</li>
        </ul>
        
        <h3>Example Investment Analysis Questions</h3>
        <div class="bg-blue-50 p-4 rounded-lg">
          <h4>Technology Sector</h4>
          <ul>
            <li>"What are the key risks and opportunities in AI/ML companies for 2024?"</li>
            <li>"How should investors evaluate SaaS companies in the current market?"</li>
          </ul>
          
          <h4>Real Estate</h4>
          <ul>
            <li>"What factors should investors consider in commercial vs residential REITs?"</li>
            <li>"How do rising interest rates affect different real estate investment strategies?"</li>
          </ul>
          
          <h4>ESG Investing</h4>
          <ul>
            <li>"What are the financial performance implications of ESG-focused investing?"</li>
            <li>"How should investors evaluate the long-term viability of green energy investments?"</li>
          </ul>
        </div>
        
        <h3>Best Practices for Investment Analysis</h3>
        <ul>
          <li><strong>Diversify Your Sources:</strong> Include bullish, bearish, and neutral perspectives</li>
          <li><strong>Consider Timeframes:</strong> Specify short-term vs long-term investment horizons</li>
          <li><strong>Include Market Context:</strong> Consider current economic conditions</li>
          <li><strong>Verify Information:</strong> Always fact-check key claims and data</li>
          <li><strong>Consult Professionals:</strong> Use AI analysis as input, not replacement for financial advice</li>
        </ul>
        
        <div class="bg-yellow-50 p-4 rounded-lg border-l-4 border-yellow-400">
          <h4>⚠️ Important Disclaimer</h4>
          <p>Consensus.AI provides analysis and insights for educational purposes only. This is not financial advice. Always consult with qualified financial professionals before making investment decisions. Past performance does not guarantee future results.</p>
        </div>
      `,
      author: 'Consensus.AI Team',
      views: 1247
    },
    {
      id: 2,
      category: 'use-cases',
      title: 'Market Research with AI Consensus Analysis',
      description: 'Learn how to conduct comprehensive market research using multiple AI perspectives',
      readTime: '6 min read',
      difficulty: 'Beginner',
      tags: ['market-research', 'business', 'strategy'],
      lastUpdated: '2024-01-12',
      content: `
        <h2>Market Research with AI Consensus</h2>
        <p>Understanding your market is crucial for business success. Consensus.AI helps you analyze market opportunities, competitive landscapes, and customer needs by combining insights from multiple AI models.</p>
        
        <h3>Types of Market Research Questions</h3>
        
        <h4>Market Size & Opportunity</h4>
        <ul>
          <li>"What is the total addressable market for sustainable packaging solutions?"</li>
          <li>"How is the remote work software market expected to evolve through 2025?"</li>
          <li>"What are the growth opportunities in the plant-based food industry?"</li>
        </ul>
        
        <h4>Competitive Analysis</h4>
        <ul>
          <li>"What are the key differentiators among leading CRM software providers?"</li>
          <li>"How do major e-commerce platforms compare in terms of seller experience?"</li>
          <li>"What competitive advantages do established players have in the fintech space?"</li>
        </ul>
        
        <h4>Customer Insights</h4>
        <ul>
          <li>"What factors influence B2B software purchasing decisions in 2024?"</li>
          <li>"How do consumer preferences for sustainable products vary by demographic?"</li>
          <li>"What are the main pain points in the customer onboarding process for SaaS?"</li>
        </ul>
        
        <h3>Research Methodology</h3>
        
        <h4>1. Define Your Research Objectives</h4>
        <p>Be clear about what you want to learn:</p>
        <ul>
          <li>Market size and growth potential</li>
          <li>Competitive positioning</li>
          <li>Customer needs and preferences</li>
          <li>Industry trends and disruptions</li>
        </ul>
        
        <h4>2. Gather Diverse Data Sources</h4>
        <ul>
          <li>Industry reports and whitepapers</li>
          <li>Survey data and customer feedback</li>
          <li>Competitor analysis and case studies</li>
          <li>Market trend reports</li>
          <li>Academic research and studies</li>
        </ul>
        
        <h4>3. Structure Your Analysis</h4>
        <p>Organize your research into clear sections:</p>
        <ul>
          <li><strong>Market Overview:</strong> Size, growth, key players</li>
          <li><strong>Competitive Landscape:</strong> Major competitors and their strategies</li>
          <li><strong>Customer Analysis:</strong> Needs, preferences, behaviors</li>
          <li><strong>Trends & Opportunities:</strong> Emerging trends and market gaps</li>
        </ul>
        
        <h3>Sample Market Research Template</h3>
        <div class="bg-gray-50 p-4 rounded-lg">
          <h4>Research Question Template:</h4>
          <p>"What are the key market dynamics, competitive factors, and growth opportunities in the [INDUSTRY] sector for [TARGET CUSTOMER] in [TIMEFRAME]?"</p>
          
          <h4>Supporting Questions:</h4>
          <ul>
            <li>What is driving growth in this market?</li>
            <li>Who are the main competitors and what are their strengths/weaknesses?</li>
            <li>What do customers value most in this category?</li>
            <li>What emerging trends could disrupt the market?</li>
            <li>What barriers to entry exist?</li>
          </ul>
        </div>
        
        <h3>Analyzing Your Results</h3>
        <p>When reviewing your consensus analysis:</p>
        <ul>
          <li><strong>Look for Patterns:</strong> What themes emerge across different AI perspectives?</li>
          <li><strong>Identify Gaps:</strong> What areas need more research or data?</li>
          <li><strong>Assess Confidence:</strong> Which findings have high vs low confidence scores?</li>
          <li><strong>Consider Bias:</strong> Are there potential biases in your source material?</li>
        </ul>
        
        <h3>Next Steps</h3>
        <p>Use your market research to:</p>
        <ul>
          <li>Validate business ideas and strategies</li>
          <li>Identify target customer segments</li>
          <li>Develop competitive positioning</li>
          <li>Plan product development priorities</li>
          <li>Create go-to-market strategies</li>
        </ul>
      `,
      author: 'Sarah Chen, Market Research Specialist',
      views: 892
    },
    {
      id: 3,
      category: 'use-cases',
      title: 'Academic Research and Literature Reviews',
      description: 'How researchers can use AI consensus to analyze academic literature and research topics',
      readTime: '10 min read',
      difficulty: 'Advanced',
      tags: ['academic', 'research', 'literature-review'],
      lastUpdated: '2024-01-10',
      content: `
        <h2>Academic Research with Consensus.AI</h2>
        <p>Academic research requires synthesizing multiple sources, identifying research gaps, and developing balanced perspectives on complex topics. Consensus.AI can help researchers analyze literature, identify trends, and develop comprehensive understanding of their field.</p>
        
        <h3>Research Applications</h3>
        
        <h4>Literature Reviews</h4>
        <ul>
          <li>Synthesize findings across multiple studies</li>
          <li>Identify consensus and disagreement in the literature</li>
          <li>Highlight research gaps and future directions</li>
          <li>Compare methodological approaches</li>
        </ul>
        
        <h4>Hypothesis Development</h4>
        <ul>
          <li>Analyze existing theories and frameworks</li>
          <li>Identify potential research questions</li>
          <li>Evaluate the strength of different theoretical approaches</li>
          <li>Consider alternative explanations</li>
        </ul>
        
        <h4>Methodology Analysis</h4>
        <ul>
          <li>Compare different research methodologies</li>
          <li>Evaluate the appropriateness of methods for specific research questions</li>
          <li>Identify best practices in research design</li>
          <li>Assess limitations and potential biases</li>
        </ul>
        
        <h3>Example Research Questions</h3>
        
        <div class="bg-blue-50 p-4 rounded-lg mb-4">
          <h4>Psychology & Social Sciences</h4>
          <ul>
            <li>"What does the current literature reveal about the effectiveness of cognitive behavioral therapy for anxiety disorders?"</li>
            <li>"How do different theoretical frameworks explain the relationship between social media use and mental health?"</li>
            <li>"What are the key factors that influence academic motivation in online learning environments?"</li>
          </ul>
        </div>
        
        <div class="bg-green-50 p-4 rounded-lg mb-4">
          <h4>Business & Economics</h4>
          <ul>
            <li>"What does research show about the impact of remote work on organizational culture and productivity?"</li>
            <li>"How do different economic models explain the relationship between innovation and economic growth?"</li>
            <li>"What factors contribute to successful digital transformation in traditional industries?"</li>
          </ul>
        </div>
        
        <div class="bg-purple-50 p-4 rounded-lg mb-4">
          <h4>Technology & Computer Science</h4>
          <ul>
            <li>"What are the current approaches to addressing bias in machine learning algorithms?"</li>
            <li>"How do different cybersecurity frameworks compare in terms of effectiveness and implementation?"</li>
            <li>"What does research reveal about user experience design principles for mobile applications?"</li>
          </ul>
        </div>
        
        <h3>Best Practices for Academic Research</h3>
        
        <h4>Source Selection</h4>
        <ul>
          <li><strong>Peer-Reviewed Sources:</strong> Prioritize academic journals and conference papers</li>
          <li><strong>Diverse Perspectives:</strong> Include different theoretical approaches and methodologies</li>
          <li><strong>Recent Literature:</strong> Balance current research with foundational studies</li>
          <li><strong>Geographic Diversity:</strong> Consider research from different regions and contexts</li>
        </ul>
        
        <h4>Document Preparation</h4>
        <ul>
          <li>Upload key papers as PDF files</li>
          <li>Include abstracts and key findings in text format</li>
          <li>Provide context about research methodologies</li>
          <li>Include relevant data tables or figures as text descriptions</li>
        </ul>
        
        <h4>Analysis Framework</h4>
        <p>Structure your research questions to address:</p>
        <ul>
          <li><strong>What:</strong> What are the key findings and conclusions?</li>
          <li><strong>How:</strong> What methodologies were used?</li>
          <li><strong>Why:</strong> What theoretical frameworks explain the findings?</li>
          <li><strong>Where:</strong> What are the gaps and limitations?</li>
          <li><strong>When:</strong> How has understanding evolved over time?</li>
        </ul>
        
        <h3>Interpreting Results</h3>
        
        <h4>Identifying Consensus</h4>
        <ul>
          <li>Look for findings that are consistently supported across studies</li>
          <li>Note areas where multiple AI models agree</li>
          <li>Pay attention to high confidence scores</li>
        </ul>
        
        <h4>Recognizing Disagreement</h4>
        <ul>
          <li>Identify conflicting findings or interpretations</li>
          <li>Consider methodological differences that might explain disagreements</li>
          <li>Look for areas where confidence scores are lower</li>
        </ul>
        
        <h4>Finding Research Gaps</h4>
        <ul>
          <li>Note questions that remain unanswered</li>
          <li>Identify populations or contexts that are understudied</li>
          <li>Look for methodological limitations that could be addressed</li>
        </ul>
        
        <h3>Writing and Citation</h3>
        
        <h4>Using AI Analysis in Your Work</h4>
        <ul>
          <li><strong>Transparency:</strong> Acknowledge the use of AI tools in your methodology</li>
          <li><strong>Verification:</strong> Always verify key claims against original sources</li>
          <li><strong>Integration:</strong> Use AI analysis as a starting point, not a replacement for critical thinking</li>
          <li><strong>Citation:</strong> Cite original sources, not the AI analysis</li>
        </ul>
        
        <h4>Sample Methodology Statement</h4>
        <div class="bg-gray-50 p-4 rounded-lg">
          <p><em>"To synthesize findings across multiple studies, we used Consensus.AI to analyze key papers and identify patterns in the literature. The AI analysis was used to guide our review process and identify potential themes, which were then verified through detailed examination of the original sources."</em></p>
        </div>
        
        <h3>Ethical Considerations</h3>
        <ul>
          <li><strong>Academic Integrity:</strong> Use AI as a tool to enhance, not replace, scholarly analysis</li>
          <li><strong>Source Attribution:</strong> Always cite original authors and research</li>
          <li><strong>Bias Awareness:</strong> Recognize that AI models may have biases that could affect analysis</li>
          <li><strong>Peer Review:</strong> Subject AI-assisted research to the same rigorous review standards</li>
        </ul>
      `,
      author: 'Dr. Michael Rodriguez, Research Methodology',
      views: 654
    },
    {
      id: 4,
      category: 'best-practices',
      title: 'Writing Effective Analysis Questions',
      description: 'Master the art of crafting questions that produce insightful consensus analysis',
      readTime: '5 min read',
      difficulty: 'Beginner',
      tags: ['questions', 'best-practices', 'tips'],
      lastUpdated: '2024-01-08',
      content: `
        <h2>Writing Effective Analysis Questions</h2>
        <p>The quality of your analysis depends heavily on how you frame your question. Well-crafted questions lead to more insightful, actionable results.</p>
        
        <h3>Question Structure Framework</h3>
        
        <h4>The CLEAR Method</h4>
        <ul>
          <li><strong>C</strong>ontext: Provide relevant background</li>
          <li><strong>L</strong>imit: Define scope and boundaries</li>
          <li><strong>E</strong>xplore: Ask for analysis, not just facts</li>
          <li><strong>A</strong>ction: Focus on actionable insights</li>
          <li><strong>R</strong>elevant: Ensure practical applicability</li>
        </ul>
        
        <h3>Question Types That Work Well</h3>
        
        <h4>Comparative Analysis</h4>
        <ul>
          <li>"How do X and Y compare in terms of [specific criteria]?"</li>
          <li>"What are the advantages and disadvantages of [approach A] versus [approach B]?"</li>
          <li>"Which strategy would be more effective for [specific context]: X or Y?"</li>
        </ul>
        
        <h4>Evaluative Questions</h4>
        <ul>
          <li>"What factors should be considered when [making a decision] about [topic]?"</li>
          <li>"How effective is [strategy/approach] for [specific goal]?"</li>
          <li>"What are the key risks and opportunities associated with [topic]?"</li>
        </ul>
        
        <h4>Strategic Planning</h4>
        <ul>
          <li>"What approach should [type of organization] take to [challenge/opportunity]?"</li>
          <li>"How can [industry/company] best prepare for [future trend/change]?"</li>
          <li>"What are the best practices for [activity] in [specific context]?"</li>
        </ul>
        
        <h3>Common Mistakes to Avoid</h3>
        
        <h4>❌ Too Vague</h4>
        <ul>
          <li>Bad: "Is AI good?"</li>
          <li>Better: "What are the benefits and risks of implementing AI automation in small manufacturing businesses?"</li>
        </ul>
        
        <h4>❌ Yes/No Questions</h4>
        <ul>
          <li>Bad: "Should I invest in cryptocurrency?"</li>
          <li>Better: "What factors should individual investors consider when evaluating cryptocurrency as part of their portfolio?"</li>
        </ul>
        
        <h4>❌ Too Personal</h4>
        <ul>
          <li>Bad: "What should I do about my career?"</li>
          <li>Better: "What factors should professionals consider when transitioning from technical roles to management positions?"</li>
        </ul>
        
        <h4>❌ Prediction Requests</h4>
        <ul>
          <li>Bad: "What will the stock market do next week?"</li>
          <li>Better: "What economic indicators and market factors typically influence short-term stock market volatility?"</li>
        </ul>
        
        <h3>Question Templates</h3>
        
        <div class="bg-blue-50 p-4 rounded-lg mb-4">
          <h4>Business Strategy</h4>
          <ul>
            <li>"What are the key considerations for [type of business] when [specific challenge/opportunity]?"</li>
            <li>"How should [industry] companies approach [trend/change] to remain competitive?"</li>
            <li>"What strategies have proven most effective for [business goal] in [market/context]?"</li>
          </ul>
        </div>
        
        <div class="bg-green-50 p-4 rounded-lg mb-4">
          <h4>Technology & Innovation</h4>
          <ul>
            <li>"What are the implications of [technology] for [industry/application]?"</li>
            <li>"How do different approaches to [technical challenge] compare in terms of [criteria]?"</li>
            <li>"What factors should organizations consider when implementing [technology solution]?"</li>
          </ul>
        </div>
        
        <div class="bg-purple-50 p-4 rounded-lg mb-4">
          <h4>Research & Analysis</h4>
          <ul>
            <li>"What does current research reveal about [topic] in [context]?"</li>
            <li>"How do different theoretical frameworks explain [phenomenon]?"</li>
            <li>"What are the methodological considerations for studying [research question]?"</li>
          </ul>
        </div>
        
        <h3>Enhancing Your Questions</h3>
        
        <h4>Add Context</h4>
        <ul>
          <li>Specify the industry, market, or domain</li>
          <li>Include relevant timeframes</li>
          <li>Mention key constraints or requirements</li>
          <li>Provide background on why this matters</li>
        </ul>
        
        <h4>Define Scope</h4>
        <ul>
          <li>Specify the target audience or organization type</li>
          <li>Limit geographic or demographic scope if relevant</li>
          <li>Focus on specific aspects rather than everything</li>
          <li>Set boundaries on what you want to explore</li>
        </ul>
        
        <h4>Request Analysis</h4>
        <ul>
          <li>Ask for evaluation, not just description</li>
          <li>Request comparison and contrast</li>
          <li>Seek insights into cause and effect</li>
          <li>Look for patterns and trends</li>
        </ul>
        
        <h3>Testing Your Questions</h3>
        
        <h4>Quality Checklist</h4>
        <ul>
          <li>☑️ Is the question specific and focused?</li>
          <li>☑️ Does it ask for analysis rather than just facts?</li>
          <li>☑️ Is the context clear and relevant?</li>
          <li>☑️ Will the answer be actionable?</li>
          <li>☑️ Is it appropriate for AI analysis?</li>
        </ul>
        
        <h4>Refinement Process</h4>
        <ol>
          <li><strong>Start broad:</strong> Write your initial question</li>
          <li><strong>Add context:</strong> Include relevant background</li>
          <li><strong>Narrow focus:</strong> Specify what you really want to know</li>
          <li><strong>Check scope:</strong> Ensure it's neither too broad nor too narrow</li>
          <li><strong>Test clarity:</strong> Would someone else understand what you're asking?</li>
        </ol>
      `,
      author: 'Consensus.AI Team',
      views: 1156
    }
  ];

  const filteredArticles = knowledgeArticles.filter(article => {
    const matchesCategory = selectedCategory === 'all' || article.category === selectedCategory;
    const matchesSearch = searchQuery === '' || 
      article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      article.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      article.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  if (selectedArticle) {
    const article = knowledgeArticles.find(a => a.id === selectedArticle);
    return React.createElement('div', { className: 'min-h-screen bg-gradient-to-br from-indigo-50 to-violet-50' },
      React.createElement('div', { className: 'max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12' },
        
        // Back Button
        React.createElement('button', {
          onClick: () => setSelectedArticle(null),
          className: 'flex items-center text-indigo-600 hover:text-indigo-800 mb-8 font-medium'
        },
          React.createElement('svg', { className: 'w-5 h-5 mr-2', fill: 'none', stroke: 'currentColor', viewBox: '0 0 24 24' },
            React.createElement('path', { strokeLinecap: 'round', strokeLinejoin: 'round', strokeWidth: 2, d: 'M15 19l-7-7 7-7' })
          ),
          'Back to Knowledge Base'
        ),

        // Article Header
        React.createElement('div', { className: 'bg-white rounded-2xl shadow-sm border border-slate-200 p-8 mb-8' },
          React.createElement('div', { className: 'flex flex-wrap items-center gap-2 mb-4' },
            ...article.tags.map(tag =>
              React.createElement('span', {
                key: tag,
                className: 'px-3 py-1 bg-indigo-100 text-indigo-700 text-sm rounded-full'
              }, tag)
            )
          ),
          React.createElement('h1', { className: 'text-3xl font-bold text-slate-900 mb-4' }, article.title),
          React.createElement('p', { className: 'text-xl text-slate-600 mb-6' }, article.description),
          React.createElement('div', { className: 'flex items-center justify-between text-sm text-slate-500' },
            React.createElement('div', { className: 'flex items-center space-x-6' },
              React.createElement('span', null, `By ${article.author}`),
              React.createElement('span', null, article.readTime),
              React.createElement('span', null, `${article.views} views`),
              React.createElement('span', null, `Updated ${new Date(article.lastUpdated).toLocaleDateString()}`)
            ),
            React.createElement('div', { className: 'flex items-center space-x-2' },
              React.createElement('span', { 
                className: `px-2 py-1 rounded text-xs ${
                  article.difficulty === 'Beginner' ? 'bg-green-100 text-green-800' :
                  article.difficulty === 'Intermediate' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-red-100 text-red-800'
                }`
              }, article.difficulty)
            )
          )
        ),

        // Article Content
        React.createElement('div', { className: 'bg-white rounded-2xl shadow-sm border border-slate-200 p-8' },
          React.createElement('div', { 
            className: 'prose prose-lg max-w-none',
            dangerouslySetInnerHTML: { __html: article.content }
          })
        )
      )
    );
  }

  return React.createElement('div', { className: 'min-h-screen bg-gradient-to-br from-indigo-50 to-violet-50' },
    React.createElement('div', { className: 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12' },
      
      // Header
      React.createElement('div', { className: 'text-center mb-12' },
        React.createElement('h1', { className: 'text-4xl font-bold text-slate-900 mb-4' },
          'Knowledge Base'
        ),
        React.createElement('p', { className: 'text-xl text-slate-600 max-w-2xl mx-auto mb-8' },
          'In-depth guides and tutorials to help you master Consensus.AI'
        ),
        
        // Search Bar
        React.createElement('div', { className: 'max-w-md mx-auto' },
          React.createElement('div', { className: 'relative' },
            React.createElement('input', {
              type: 'text',
              placeholder: 'Search knowledge base...',
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
                  React.createElement('div', { className: 'flex items-center justify-between' },
                    React.createElement('div', { className: 'flex items-center' },
                      React.createElement('span', { className: 'mr-2' }, category.icon),
                      category.name
                    ),
                    React.createElement('span', { className: 'text-xs text-slate-400' }, category.count)
                  )
                )
              )
            )
          )
        ),

        // Main Content - Articles
        React.createElement('div', { className: 'lg:col-span-3' },
          filteredArticles.length > 0 ? (
            React.createElement('div', { className: 'grid gap-6' },
              ...filteredArticles.map(article =>
                React.createElement('div', {
                  key: article.id,
                  className: 'bg-white rounded-xl border border-slate-200 p-6 hover:shadow-md transition-shadow cursor-pointer',
                  onClick: () => setSelectedArticle(article.id)
                },
                  React.createElement('div', { className: 'flex items-start justify-between mb-4' },
                    React.createElement('div', { className: 'flex-1' },
                      React.createElement('h3', { className: 'text-xl font-semibold text-slate-900 mb-2 hover:text-indigo-600 transition-colors' }, 
                        article.title
                      ),
                      React.createElement('p', { className: 'text-slate-600 mb-3' }, article.description)
                    ),
                    React.createElement('span', { 
                      className: `px-2 py-1 rounded text-xs ml-4 flex-shrink-0 ${
                        article.difficulty === 'Beginner' ? 'bg-green-100 text-green-800' :
                        article.difficulty === 'Intermediate' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`
                    }, article.difficulty)
                  ),
                  React.createElement('div', { className: 'flex items-center justify-between' },
                    React.createElement('div', { className: 'flex flex-wrap gap-2' },
                      ...article.tags.slice(0, 3).map(tag =>
                        React.createElement('span', {
                          key: tag,
                          className: 'px-2 py-1 bg-slate-100 text-slate-600 text-xs rounded'
                        }, tag)
                      )
                    ),
                    React.createElement('div', { className: 'flex items-center space-x-4 text-sm text-slate-500' },
                      React.createElement('span', null, article.readTime),
                      React.createElement('span', null, `${article.views} views`),
                      React.createElement('span', { className: 'text-indigo-600 font-medium' }, 'Read →')
                    )
                  )
                )
              )
            )
          ) : (
            React.createElement('div', { className: 'text-center py-12' },
              React.createElement('div', { className: 'w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4' },
                React.createElement('svg', { className: 'w-8 h-8 text-slate-400', fill: 'none', stroke: 'currentColor', viewBox: '0 0 24 24' },
                  React.createElement('path', { strokeLinecap: 'round', strokeLinejoin: 'round', strokeWidth: 2, d: 'M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z' })
                )
              ),
              React.createElement('h3', { className: 'text-lg font-semibold text-slate-900 mb-2' }, 'No articles found'),
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
        )
      )
    )
  );
}

export default KnowledgeBase;
