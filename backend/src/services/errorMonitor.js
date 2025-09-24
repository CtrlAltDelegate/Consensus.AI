class ErrorMonitor {
  constructor() {
    this.errors = [];
    this.errorCounts = new Map();
    this.maxStoredErrors = 1000;
    
    // Setup global error handlers
    this.setupGlobalHandlers();
  }

  setupGlobalHandlers() {
    // Handle uncaught exceptions
    process.on('uncaughtException', (error) => {
      console.error('🚨 UNCAUGHT EXCEPTION:', error);
      this.logError(error, {
        type: 'uncaught_exception',
        severity: 'critical',
        timestamp: new Date().toISOString()
      });
      
      // Don't exit in production, but log it
      if (process.env.NODE_ENV !== 'production') {
        process.exit(1);
      }
    });

    // Handle unhandled promise rejections
    process.on('unhandledRejection', (reason, promise) => {
      console.error('🚨 UNHANDLED REJECTION at:', promise, 'reason:', reason);
      this.logError(new Error(reason), {
        type: 'unhandled_rejection',
        severity: 'high',
        timestamp: new Date().toISOString(),
        promise: promise.toString()
      });
    });

    // Handle warnings
    process.on('warning', (warning) => {
      console.warn('⚠️ NODE WARNING:', warning);
      this.logError(warning, {
        type: 'node_warning',
        severity: 'low',
        timestamp: new Date().toISOString()
      });
    });
  }

  logError(error, context = {}) {
    const errorEntry = {
      id: Date.now() + Math.random(),
      timestamp: new Date().toISOString(),
      message: error.message || error.toString(),
      stack: error.stack,
      name: error.name,
      type: context.type || 'application_error',
      severity: context.severity || 'medium',
      context: {
        ...context,
        environment: process.env.NODE_ENV,
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        pid: process.pid
      }
    };

    // Store error
    this.errors.unshift(errorEntry);
    
    // Keep only recent errors
    if (this.errors.length > this.maxStoredErrors) {
      this.errors = this.errors.slice(0, this.maxStoredErrors);
    }

    // Count error types
    const errorKey = `${error.name}:${error.message}`;
    this.errorCounts.set(errorKey, (this.errorCounts.get(errorKey) || 0) + 1);

    // Log to console with appropriate level
    switch (context.severity) {
      case 'critical':
        console.error('🔥 CRITICAL ERROR:', error.message);
        break;
      case 'high':
        console.error('❌ HIGH SEVERITY ERROR:', error.message);
        break;
      case 'medium':
        console.warn('⚠️ ERROR:', error.message);
        break;
      case 'low':
        console.log('ℹ️ LOW SEVERITY ERROR:', error.message);
        break;
      default:
        console.error('❌ ERROR:', error.message);
    }

    return errorEntry.id;
  }

  getErrors(options = {}) {
    const {
      limit = 50,
      severity = null,
      type = null,
      since = null
    } = options;

    let filteredErrors = [...this.errors];

    // Filter by severity
    if (severity) {
      filteredErrors = filteredErrors.filter(error => error.severity === severity);
    }

    // Filter by type
    if (type) {
      filteredErrors = filteredErrors.filter(error => error.type === type);
    }

    // Filter by time
    if (since) {
      const sinceDate = new Date(since);
      filteredErrors = filteredErrors.filter(error => new Date(error.timestamp) >= sinceDate);
    }

    return filteredErrors.slice(0, limit);
  }

  getErrorStats() {
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    const recentErrors = this.errors.filter(error => new Date(error.timestamp) >= oneHourAgo);
    const dailyErrors = this.errors.filter(error => new Date(error.timestamp) >= oneDayAgo);

    // Group by severity
    const severityStats = {
      critical: 0,
      high: 0,
      medium: 0,
      low: 0
    };

    this.errors.forEach(error => {
      if (severityStats.hasOwnProperty(error.severity)) {
        severityStats[error.severity]++;
      }
    });

    // Top error types
    const topErrors = Array.from(this.errorCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([error, count]) => ({ error, count }));

    return {
      total: this.errors.length,
      recentHour: recentErrors.length,
      recentDay: dailyErrors.length,
      bySeverity: severityStats,
      topErrors,
      oldestError: this.errors.length > 0 ? this.errors[this.errors.length - 1].timestamp : null,
      newestError: this.errors.length > 0 ? this.errors[0].timestamp : null
    };
  }

  clearErrors() {
    this.errors = [];
    this.errorCounts.clear();
  }

  // Express middleware for error monitoring
  middleware() {
    return (error, req, res, next) => {
      // Log the error with request context
      this.logError(error, {
        type: 'http_error',
        severity: error.status >= 500 ? 'high' : 'medium',
        request: {
          method: req.method,
          url: req.url,
          headers: req.headers,
          body: req.body,
          params: req.params,
          query: req.query,
          ip: req.ip,
          userAgent: req.get('User-Agent')
        },
        response: {
          statusCode: error.status || 500
        }
      });

      // Continue with normal error handling
      next(error);
    };
  }
}

// Create singleton instance
const errorMonitor = new ErrorMonitor();

module.exports = errorMonitor;
