const performanceMonitor = (options = {}) => {
  const {
    slowThreshold = 1000, // 1 second
    logSlowRequests = true,
    trackMemory = true,
    excludePaths = ['/health', '/test']
  } = options;

  // Store performance metrics
  const metrics = {
    requests: {
      total: 0,
      slow: 0,
      errors: 0
    },
    endpoints: new Map(),
    slowRequests: []
  };

  return (req, res, next) => {
    // Skip monitoring for excluded paths
    if (excludePaths.some(path => req.path.startsWith(path))) {
      return next();
    }

    const startTime = Date.now();
    const startMemory = trackMemory ? process.memoryUsage() : null;

    // Track request start
    metrics.requests.total++;

    // Override res.end to capture response time
    const originalEnd = res.end;
    res.end = function(...args) {
      const endTime = Date.now();
      const responseTime = endTime - startTime;
      const endMemory = trackMemory ? process.memoryUsage() : null;

      // Track endpoint metrics
      const endpoint = `${req.method} ${req.route?.path || req.path}`;
      if (!metrics.endpoints.has(endpoint)) {
        metrics.endpoints.set(endpoint, {
          count: 0,
          totalTime: 0,
          avgTime: 0,
          maxTime: 0,
          minTime: Infinity,
          errors: 0
        });
      }

      const endpointMetrics = metrics.endpoints.get(endpoint);
      endpointMetrics.count++;
      endpointMetrics.totalTime += responseTime;
      endpointMetrics.avgTime = Math.round(endpointMetrics.totalTime / endpointMetrics.count);
      endpointMetrics.maxTime = Math.max(endpointMetrics.maxTime, responseTime);
      endpointMetrics.minTime = Math.min(endpointMetrics.minTime, responseTime);

      // Track errors
      if (res.statusCode >= 400) {
        metrics.requests.errors++;
        endpointMetrics.errors++;
      }

      // Log slow requests
      if (responseTime > slowThreshold) {
        metrics.requests.slow++;
        
        const slowRequest = {
          timestamp: new Date().toISOString(),
          method: req.method,
          path: req.path,
          responseTime,
          statusCode: res.statusCode,
          userAgent: req.get('User-Agent'),
          ip: req.ip,
          memory: trackMemory ? {
            heapUsedDelta: Math.round((endMemory.heapUsed - startMemory.heapUsed) / 1024 / 1024),
            rssUsed: Math.round(endMemory.rss / 1024 / 1024)
          } : null
        };

        // Keep only last 100 slow requests
        metrics.slowRequests.push(slowRequest);
        if (metrics.slowRequests.length > 100) {
          metrics.slowRequests.shift();
        }

        if (logSlowRequests) {
          console.warn(`🐌 SLOW REQUEST: ${req.method} ${req.path} took ${responseTime}ms (${res.statusCode})`);
          if (trackMemory && slowRequest.memory.heapUsedDelta > 10) {
            console.warn(`   💾 High memory usage: +${slowRequest.memory.heapUsedDelta}MB heap`);
          }
        }
      }

      // Call original end
      originalEnd.apply(this, args);
    };

    next();
  };
};

// Get performance metrics
const getMetrics = () => {
  const endpointStats = Array.from(metrics.endpoints.entries()).map(([endpoint, stats]) => ({
    endpoint,
    ...stats,
    minTime: stats.minTime === Infinity ? 0 : stats.minTime
  }));

  return {
    summary: {
      totalRequests: metrics.requests.total,
      slowRequests: metrics.requests.slow,
      errorRequests: metrics.requests.errors,
      slowRequestPercentage: metrics.requests.total > 0 
        ? Math.round((metrics.requests.slow / metrics.requests.total) * 100) 
        : 0,
      errorPercentage: metrics.requests.total > 0 
        ? Math.round((metrics.requests.errors / metrics.requests.total) * 100) 
        : 0
    },
    endpoints: endpointStats.sort((a, b) => b.avgTime - a.avgTime), // Sort by slowest average
    recentSlowRequests: metrics.slowRequests.slice(-10), // Last 10 slow requests
    topSlowEndpoints: endpointStats
      .filter(ep => ep.count >= 5) // Only endpoints with 5+ requests
      .sort((a, b) => b.avgTime - a.avgTime)
      .slice(0, 5)
  };
};

// Reset metrics
const resetMetrics = () => {
  metrics.requests = { total: 0, slow: 0, errors: 0 };
  metrics.endpoints.clear();
  metrics.slowRequests = [];
};

module.exports = {
  performanceMonitor,
  getMetrics,
  resetMetrics
};
