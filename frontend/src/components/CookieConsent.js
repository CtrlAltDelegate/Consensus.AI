import React, { useState, useEffect } from 'react';

function CookieConsent() {
  const [isVisible, setIsVisible] = useState(false);
  const [preferences, setPreferences] = useState({
    essential: true, // Always required
    analytics: false,
    marketing: false
  });
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    // Check if user has already made a choice
    const cookieConsent = localStorage.getItem('cookieConsent');
    if (!cookieConsent) {
      // Show banner after a short delay
      const timer = setTimeout(() => {
        setIsVisible(true);
      }, 1000);
      return () => clearTimeout(timer);
    } else {
      // Load saved preferences
      try {
        const savedPreferences = JSON.parse(cookieConsent);
        setPreferences(savedPreferences);
        applyCookieSettings(savedPreferences);
      } catch (error) {
        console.error('Error parsing cookie consent:', error);
      }
    }
  }, []);

  const applyCookieSettings = (settings) => {
    // Apply analytics cookies
    if (settings.analytics) {
      // Enable Google Analytics or other analytics
      console.log('Analytics cookies enabled');
      // Example: gtag('config', 'GA_MEASUREMENT_ID');
    } else {
      // Disable analytics
      console.log('Analytics cookies disabled');
    }

    // Apply marketing cookies
    if (settings.marketing) {
      // Enable marketing/advertising cookies
      console.log('Marketing cookies enabled');
    } else {
      // Disable marketing cookies
      console.log('Marketing cookies disabled');
    }

    // Essential cookies are always enabled
    console.log('Essential cookies enabled (required for functionality)');
  };

  const handleAcceptAll = () => {
    const allAccepted = {
      essential: true,
      analytics: true,
      marketing: true
    };
    setPreferences(allAccepted);
    localStorage.setItem('cookieConsent', JSON.stringify(allAccepted));
    applyCookieSettings(allAccepted);
    setIsVisible(false);
  };

  const handleAcceptSelected = () => {
    localStorage.setItem('cookieConsent', JSON.stringify(preferences));
    applyCookieSettings(preferences);
    setIsVisible(false);
  };

  const handleRejectAll = () => {
    const essentialOnly = {
      essential: true,
      analytics: false,
      marketing: false
    };
    setPreferences(essentialOnly);
    localStorage.setItem('cookieConsent', JSON.stringify(essentialOnly));
    applyCookieSettings(essentialOnly);
    setIsVisible(false);
  };

  const handlePreferenceChange = (type) => {
    if (type === 'essential') return; // Essential cookies cannot be disabled
    
    setPreferences(prev => ({
      ...prev,
      [type]: !prev[type]
    }));
  };

  const resetConsent = () => {
    localStorage.removeItem('cookieConsent');
    setIsVisible(true);
    setShowDetails(false);
    setPreferences({
      essential: true,
      analytics: false,
      marketing: false
    });
  };

  // Expose reset function globally for settings page
  useEffect(() => {
    window.resetCookieConsent = resetConsent;
    return () => {
      delete window.resetCookieConsent;
    };
  }, []);

  if (!isVisible) return null;

  return React.createElement('div', {
    className: 'fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 shadow-lg'
  },
    React.createElement('div', { className: 'max-w-7xl mx-auto p-4' },
      React.createElement('div', { className: 'flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4' },
        
        // Cookie notice content
        React.createElement('div', { className: 'flex-1' },
          React.createElement('div', { className: 'flex items-start space-x-3' },
            React.createElement('div', { className: 'flex-shrink-0 mt-1' },
              React.createElement('svg', {
                className: 'w-5 h-5 text-blue-600',
                fill: 'none',
                stroke: 'currentColor',
                viewBox: '0 0 24 24'
              },
                React.createElement('path', {
                  strokeLinecap: 'round',
                  strokeLinejoin: 'round',
                  strokeWidth: 2,
                  d: 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z'
                })
              )
            ),
            React.createElement('div', { className: 'flex-1' },
              React.createElement('h3', { className: 'text-sm font-medium text-gray-900 mb-1' },
                'We use cookies to enhance your experience'
              ),
              React.createElement('p', { className: 'text-sm text-gray-600' },
                'We use essential cookies for authentication and functionality. We also use analytics cookies to understand how you use our platform. ',
                React.createElement('button', {
                  onClick: () => setShowDetails(!showDetails),
                  className: 'text-blue-600 hover:text-blue-800 underline'
                }, showDetails ? 'Hide details' : 'View details'),
                ' or read our ',
                React.createElement('a', {
                  href: '/privacy-policy.html',
                  target: '_blank',
                  className: 'text-blue-600 hover:text-blue-800 underline'
                }, 'Privacy Policy'),
                '.'
              )
            )
          )
        ),

        // Action buttons
        React.createElement('div', { className: 'flex flex-col sm:flex-row gap-2 lg:flex-shrink-0' },
          React.createElement('button', {
            onClick: handleRejectAll,
            className: 'px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors duration-200'
          }, 'Reject All'),
          React.createElement('button', {
            onClick: () => setShowDetails(!showDetails),
            className: 'px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 rounded-lg transition-colors duration-200'
          }, 'Customize'),
          React.createElement('button', {
            onClick: handleAcceptAll,
            className: 'px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors duration-200'
          }, 'Accept All')
        )
      ),

      // Detailed preferences (shown when "Customize" is clicked)
      showDetails && React.createElement('div', { className: 'mt-4 pt-4 border-t border-gray-200' },
        React.createElement('h4', { className: 'text-sm font-medium text-gray-900 mb-3' }, 'Cookie Preferences'),
        React.createElement('div', { className: 'space-y-3' },
          
          // Essential cookies
          React.createElement('div', { className: 'flex items-center justify-between' },
            React.createElement('div', { className: 'flex-1' },
              React.createElement('h5', { className: 'text-sm font-medium text-gray-900' }, 'Essential Cookies'),
              React.createElement('p', { className: 'text-xs text-gray-600' }, 
                'Required for authentication, security, and basic functionality. Cannot be disabled.'
              )
            ),
            React.createElement('div', { className: 'flex items-center' },
              React.createElement('input', {
                type: 'checkbox',
                checked: true,
                disabled: true,
                className: 'w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 opacity-50 cursor-not-allowed'
              }),
              React.createElement('span', { className: 'ml-2 text-xs text-gray-500' }, 'Always On')
            )
          ),

          // Analytics cookies
          React.createElement('div', { className: 'flex items-center justify-between' },
            React.createElement('div', { className: 'flex-1' },
              React.createElement('h5', { className: 'text-sm font-medium text-gray-900' }, 'Analytics Cookies'),
              React.createElement('p', { className: 'text-xs text-gray-600' }, 
                'Help us understand how you use our platform to improve your experience.'
              )
            ),
            React.createElement('div', { className: 'flex items-center' },
              React.createElement('input', {
                type: 'checkbox',
                checked: preferences.analytics,
                onChange: () => handlePreferenceChange('analytics'),
                className: 'w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500'
              })
            )
          ),

          // Marketing cookies
          React.createElement('div', { className: 'flex items-center justify-between' },
            React.createElement('div', { className: 'flex-1' },
              React.createElement('h5', { className: 'text-sm font-medium text-gray-900' }, 'Marketing Cookies'),
              React.createElement('p', { className: 'text-xs text-gray-600' }, 
                'Used to show you relevant advertisements and measure campaign effectiveness.'
              )
            ),
            React.createElement('div', { className: 'flex items-center' },
              React.createElement('input', {
                type: 'checkbox',
                checked: preferences.marketing,
                onChange: () => handlePreferenceChange('marketing'),
                className: 'w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500'
              })
            )
          )
        ),

        // Save preferences button
        React.createElement('div', { className: 'mt-4 flex justify-end' },
          React.createElement('button', {
            onClick: handleAcceptSelected,
            className: 'px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors duration-200'
          }, 'Save Preferences')
        )
      )
    )
  );
}

// Cookie management utilities
export const getCookieConsent = () => {
  try {
    const consent = localStorage.getItem('cookieConsent');
    return consent ? JSON.parse(consent) : null;
  } catch (error) {
    console.error('Error reading cookie consent:', error);
    return null;
  }
};

export const hasAnalyticsConsent = () => {
  const consent = getCookieConsent();
  return consent?.analytics === true;
};

export const hasMarketingConsent = () => {
  const consent = getCookieConsent();
  return consent?.marketing === true;
};

// Google Analytics integration helper
export const initializeAnalytics = () => {
  if (hasAnalyticsConsent() && window.gtag) {
    console.log('Initializing Google Analytics with user consent');
    window.gtag('consent', 'update', {
      analytics_storage: 'granted'
    });
  }
};

export default CookieConsent;
