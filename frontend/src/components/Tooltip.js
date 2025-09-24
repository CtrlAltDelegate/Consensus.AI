import React, { useState, useRef, useEffect } from 'react';

function Tooltip({ children, content, position = 'top', delay = 300, className = '' }) {
  const [isVisible, setIsVisible] = useState(false);
  const [actualPosition, setActualPosition] = useState(position);
  const timeoutRef = useRef(null);
  const tooltipRef = useRef(null);
  const triggerRef = useRef(null);

  const showTooltip = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    timeoutRef.current = setTimeout(() => {
      setIsVisible(true);
      // Calculate position after showing
      setTimeout(() => calculatePosition(), 10);
    }, delay);
  };

  const hideTooltip = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setIsVisible(false);
  };

  const calculatePosition = () => {
    if (!tooltipRef.current || !triggerRef.current) return;

    const tooltip = tooltipRef.current;
    const trigger = triggerRef.current;
    const triggerRect = trigger.getBoundingClientRect();
    const tooltipRect = tooltip.getBoundingClientRect();
    const viewportHeight = window.innerHeight;
    const viewportWidth = window.innerWidth;

    let newPosition = position;

    // Check if tooltip goes off screen and adjust position
    if (position === 'top' && triggerRect.top - tooltipRect.height < 10) {
      newPosition = 'bottom';
    } else if (position === 'bottom' && triggerRect.bottom + tooltipRect.height > viewportHeight - 10) {
      newPosition = 'top';
    } else if (position === 'left' && triggerRect.left - tooltipRect.width < 10) {
      newPosition = 'right';
    } else if (position === 'right' && triggerRect.right + tooltipRect.width > viewportWidth - 10) {
      newPosition = 'left';
    }

    setActualPosition(newPosition);
  };

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const getTooltipClasses = () => {
    const baseClasses = 'absolute z-50 px-3 py-2 text-sm text-white bg-slate-800 rounded-lg shadow-lg max-w-xs pointer-events-none transition-opacity duration-200';
    
    const positionClasses = {
      top: 'bottom-full left-1/2 transform -translate-x-1/2 mb-2',
      bottom: 'top-full left-1/2 transform -translate-x-1/2 mt-2',
      left: 'right-full top-1/2 transform -translate-y-1/2 mr-2',
      right: 'left-full top-1/2 transform -translate-y-1/2 ml-2'
    };

    return `${baseClasses} ${positionClasses[actualPosition]} ${isVisible ? 'opacity-100' : 'opacity-0'}`;
  };

  const getArrowClasses = () => {
    const baseClasses = 'absolute w-2 h-2 bg-slate-800 transform rotate-45';
    
    const arrowPositions = {
      top: 'top-full left-1/2 transform -translate-x-1/2 -translate-y-1/2',
      bottom: 'bottom-full left-1/2 transform -translate-x-1/2 translate-y-1/2',
      left: 'left-full top-1/2 transform -translate-y-1/2 -translate-x-1/2',
      right: 'right-full top-1/2 transform -translate-y-1/2 translate-x-1/2'
    };

    return `${baseClasses} ${arrowPositions[actualPosition]}`;
  };

  return React.createElement('div', { 
    className: `relative inline-block ${className}`,
    ref: triggerRef,
    onMouseEnter: showTooltip,
    onMouseLeave: hideTooltip,
    onFocus: showTooltip,
    onBlur: hideTooltip
  },
    children,
    React.createElement('div', {
      ref: tooltipRef,
      className: getTooltipClasses(),
      role: 'tooltip'
    },
      content,
      React.createElement('div', { className: getArrowClasses() })
    )
  );
}

// Help Icon component with tooltip
export function HelpIcon({ tooltip, size = 'sm', className = '' }) {
  const sizeClasses = {
    xs: 'w-3 h-3',
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6'
  };

  return React.createElement(Tooltip, {
    content: tooltip,
    position: 'top',
    className: className
  },
    React.createElement('button', {
      type: 'button',
      className: 'inline-flex items-center justify-center text-slate-400 hover:text-slate-600 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 rounded-full',
      'aria-label': 'Help'
    },
      React.createElement('svg', {
        className: `${sizeClasses[size]} fill-current`,
        viewBox: '0 0 20 20'
      },
        React.createElement('path', {
          fillRule: 'evenodd',
          d: 'M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z',
          clipRule: 'evenodd'
        })
      )
    )
  );
}

// Info Icon component with tooltip
export function InfoIcon({ tooltip, size = 'sm', className = '' }) {
  const sizeClasses = {
    xs: 'w-3 h-3',
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6'
  };

  return React.createElement(Tooltip, {
    content: tooltip,
    position: 'top',
    className: className
  },
    React.createElement('button', {
      type: 'button',
      className: 'inline-flex items-center justify-center text-slate-400 hover:text-slate-600 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 rounded-full',
      'aria-label': 'Information'
    },
      React.createElement('svg', {
        className: `${sizeClasses[size]} fill-current`,
        viewBox: '0 0 20 20'
      },
        React.createElement('path', {
          fillRule: 'evenodd',
          d: 'M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z',
          clipRule: 'evenodd'
        })
      )
    )
  );
}

export default Tooltip;
