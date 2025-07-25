# Token System Setup Guide

## Overview

The Consensus.AI token system manages user consumption of AI services through a subscription-based model with overage billing. This guide covers configuration, monitoring, and optimization of the token management system.

## Architecture

### Token Flow
1. **User Action** → Triggers token estimation
2. **Estimation** → Calculates required tokens
3. **Validation** → Checks available balance
4. **Consumption** → Deducts tokens after operation
5. **Billing** → Handles overages and resets

### Components
- **Token Manager**: Core logic for token operations
- **Token Calculator**: Estimates token usage
- **Billing Service**: Handles overage charges
- **Cleanup Jobs**: Automated maintenance tasks

## Configuration

### 1. Subscription Tiers

Edit `backend/src/config/stripe.js`:

```javascript
const subscriptionTiers = {
  basic: {
    monthlyPriceId: 'price_basic_monthly',
    yearlyPriceId: 'price_basic_yearly',
    tokenLimit: 10000,
    overageRate: 0.001, // $0.001 per token
    features: ['Basic consensus analysis', 'PDF reports']
  },
  pro: {
    monthlyPriceId: 'price_pro_monthly', 
    yearlyPriceId: 'price_pro_yearly',
    tokenLimit: 50000,
    overageRate: 0.001,
    features: ['Advanced analysis', 'Priority processing', 'Email reports']
  },
  enterprise: {
    monthlyPriceId: 'price_enterprise_monthly',
    yearlyPriceId: 'price_enterprise_yearly', 
    tokenLimit: 200000,
    overageRate: 0.0008, // Lower overage rate
    features: ['Premium analysis', 'Custom integrations', 'SLA']
  }
};
```

### 2. Token Calculation Rules

Edit `backend/src/utils/tokenCalculator.js`:

```javascript
// Base costs for different operations
const OPERATION_BASE_COSTS = {
  consensus: 500,      // Base tokens for consensus
  analysis: 200,       // Base tokens for analysis  
  summary: 100,        // Base tokens for summary
  comparison: 300,     // Base tokens for comparison
};

// Provider-specific ratios
const TOKEN_RATIOS = {
  openai: {
    charactersPerToken: 4,
    wordsPerToken: 0.75
  },
  anthropic: {
    charactersPerToken: 3.5, 
    wordsPerToken: 0.7
  }
};
```

### 3. Rate Limiting

Configure rate limits in `backend/src/middleware/rateLimiting.js`:

```javascript
// User-specific limits based on tier
const createUserBasedLimiter = (getUserTier) => {
  return rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: (req) => {
      const tier = getUserTier(req);
      switch (tier) {
        case 'enterprise': return 1000; // 1000 requests/hour
        case 'pro': return 500;         // 500 requests/hour  
        case 'basic': return 100;       // 100 requests/hour
      }
    }
  });
};
```

## Stripe Integration

### 1. Setup Stripe Products

Run the setup script to create products and prices:

```bash
cd backend
npm run setup-stripe
```

This creates:
- Subscription products for each tier
- Monthly and yearly pricing
- Webhook endpoints for billing events

### 2. Configure Webhooks

Add webhook endpoint in Stripe dashboard:
- URL: `https://your-domain.com/api/webhooks/stripe`
- Events:
  - `customer.subscription.created`
  - `customer.subscription.updated` 
  - `customer.subscription.deleted`
  - `invoice.payment_succeeded`
  - `invoice.payment_failed`
  - `invoice.upcoming`

### 3. Test Stripe Integration

```bash
# Use Stripe CLI for local testing
stripe listen --forward-to localhost:3001/api/webhooks/stripe

# Test subscription creation
stripe trigger customer.subscription.created
```

## Token Usage Monitoring

### 1. Real-time Monitoring

Monitor token usage through the dashboard:

```javascript
// Get current usage
GET /api/tokens/usage

// Response
{
  "tier": "pro",
  "limit": 50000,
  "used": 32450, 
  "remaining": 17550,
  "usagePercentage": 64.9,
  "status": "moderate"
}
```

### 2. Usage Alerts

Configure email alerts in `backend/src/jobs/tokenCleanup.js`:

```javascript
// Alert thresholds
const ALERT_THRESHOLDS = {
  warning: 75,   // 75% usage
  critical: 90,  // 90% usage
  exceeded: 100  // 100%+ usage
};

// Send alerts based on usage percentage
if (usageStats.usagePercentage >= ALERT_THRESHOLDS.critical) {
  await emailService.sendTokenUsageAlert(user.email, usageStats);
}
```

### 3. Usage Analytics

Track usage patterns:

```javascript
// Daily usage aggregation
const dailyUsage = await TokenUsage.aggregate([
  {
    $match: {
      userId: ObjectId(userId),
      date: { $gte: startDate, $lte: endDate }
    }
  },
  {
    $group: {
      _id: { $dateToString: { format: "%Y-%m-%d", date: "$date" } },
      totalTokens: { $sum: "$tokens" },
      requestCount: { $sum: 1 }
    }
  }
]);
```

## Overage Management

### 1. Overage Detection

Automatically detect when users exceed limits:

```javascript
// In tokenManager.js
const availability = await this.checkTokenAvailability(userId, requestedTokens);

if (!availability.sufficient) {
  const overageTokens = availability.overage;
  const overageCharge = overageTokens * stripeConfig.overageTokenPrice;
  
  // Record overage for billing
  await this.recordOverage(userId, overageTokens, overageCharge);
  
  // Send notification
  await emailService.sendOverageNotification(user.email, {
    overageTokens,
    charge: overageCharge
  });
}
```

### 2. Overage Billing

Process overage charges through Stripe:

```javascript
// Create invoice item for overage
const invoiceItem = await stripe.invoiceItems.create({
  customer: customerId,
  amount: Math.round(overageTokens * unitPrice * 100), // Convert to cents
  currency: 'usd',
  description: `Token overage: ${overageTokens.toLocaleString()} tokens`
});

// Create and send invoice
const invoice = await stripe.invoices.create({
  customer: customerId,
  auto_advance: true
});
```

### 3. Overage Policies

Configure overage handling policies:

```javascript
const OVERAGE_POLICIES = {
  basic: {
    allowOverage: true,
    maxOveragePercentage: 50,    // Allow 50% overage
    hardLimit: false
  },
  pro: {
    allowOverage: true, 
    maxOveragePercentage: 100,   // Allow 100% overage
    hardLimit: false
  },
  enterprise: {
    allowOverage: true,
    maxOveragePercentage: 200,   // Allow 200% overage
    hardLimit: false
  }
};
```

## Automated Tasks

### 1. Token Cleanup Job

Configure scheduled tasks in `backend/src/jobs/tokenCleanup.js`:

```javascript
// Schedule jobs using node-cron
cron.schedule('0 2 * * *', () => {
  this.runCleanup(); // Daily at 2 AM
});

cron.schedule('0 3 1 * *', () => {
  this.runMonthlyReset(); // Monthly reset at 3 AM on 1st
});

cron.schedule('0 10 * * 0', () => {
  this.runUsageAlerts(); // Weekly alerts on Sunday at 10 AM  
});
```

### 2. Monthly Token Reset

Automatically reset token usage each billing cycle:

```javascript
async runMonthlyReset() {
  const users = await User.find({
    'subscription.status': 'active',
    'subscription.currentPeriodEnd': { $lte: new Date() }
  });

  for (const user of users) {
    await tokenManager.resetMonthlyUsage(user._id);
    
    // Send monthly summary
    const usageStats = await tokenManager.getUsageStats(user._id);
    await this.sendMonthlySummary(user, usageStats);
  }
}
```

### 3. Usage Reporting

Generate automated usage reports:

```javascript
// Generate monthly reports
async generateMonthlyReport(userId) {
  const usage = await TokenUsage.aggregate([
    {
      $match: {
        userId: ObjectId(userId),
        date: { 
          $gte: startOfMonth,
          $lte: endOfMonth 
        }
      }
    },
    {
      $group: {
        _id: null,
        totalTokens: { $sum: "$tokens" },
        totalRequests: { $sum: 1 },
        avgTokensPerRequest: { $avg: "$tokens" },
        operations: {
          $push: {
            type: "$operationType",
            tokens: "$tokens",
            date: "$date"
          }
        }
      }
    }
  ]);
  
  return usage[0];
}
```

## Performance Optimization

### 1. Token Estimation Optimization

Cache token estimates for similar requests:

```javascript
// Redis caching for estimates
const cacheKey = `estimate:${hashContent(topic + sources.join(''))}`;
const cachedEstimate = await redis.get(cacheKey);

if (cachedEstimate) {
  return JSON.parse(cachedEstimate);
}

const estimate = await calculateTokens(topic, sources);
await redis.setex(cacheKey, 3600, JSON.stringify(estimate)); // Cache 1 hour
```

### 2. Batch Operations

Process multiple token operations efficiently:

```javascript
// Batch token consumption
async consumeTokensBatch(operations) {
  const session = await mongoose.startSession();
  
  try {
    await session.withTransaction(async () => {
      for (const op of operations) {
        await this.consumeTokens(op.userId, op.tokens, op.operationId);
      }
    });
  } finally {
    await session.endSession();
  }
}
```

### 3. Database Indexing

Optimize database queries with proper indexing:

```javascript
// Create indexes for token operations
db.users.createIndex({ 
  "subscription.tier": 1,
  "subscription.status": 1 
});

db.tokenUsage.createIndex({ 
  userId: 1, 
  date: -1 
});

db.tokenUsage.createIndex({ 
  userId: 1,
  operationType: 1,
  date: -1 
});
```

## Security Considerations

### 1. Token Validation

Validate all token operations:

```javascript
// Validate token requests
const validateTokenRequest = (userId, tokens, operationType) => {
  if (!userId || !mongoose.isValidObjectId(userId)) {
    throw new Error('Invalid user ID');
  }
  
  if (!tokens || tokens <= 0 || tokens > MAX_TOKENS_PER_REQUEST) {
    throw new Error('Invalid token amount');
  }
  
  if (!VALID_OPERATION_TYPES.includes(operationType)) {
    throw new Error('Invalid operation type');
  }
};
```

### 2. Fraud Prevention

Implement fraud detection:

```javascript
// Detect suspicious usage patterns
const detectAnomalousUsage = async (userId) => {
  const recentUsage = await TokenUsage.find({
    userId,
    date: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
  });
  
  const hourlyUsage = groupBy(recentUsage, 'hour');
  const avgHourlyUsage = mean(Object.values(hourlyUsage));
  
  // Flag if usage is 5x above average
  const currentHourUsage = hourlyUsage[new Date().getHours()] || 0;
  if (currentHourUsage > avgHourlyUsage * 5) {
    await flagSuspiciousActivity(userId, 'High token usage');
  }
};
```

### 3. Audit Logging

Log all token operations:

```javascript
// Audit log for token operations
const auditLog = {
  userId,
  action: 'token_consumption',
  tokens: tokensConsumed,
  operationType,
  timestamp: new Date(),
  ipAddress: req.ip,
  userAgent: req.get('User-Agent'),
  result: 'success'
};

await AuditLog.create(auditLog);
```

## Testing

### 1. Unit Tests

Test token calculation logic:

```javascript
// Test token estimation
describe('Token Calculator', () => {
  test('should estimate tokens correctly', () => {
    const tokens = calculateTokensFromText('Hello world', 'openai');
    expect(tokens).toBeGreaterThan(0);
  });
  
  test('should handle overage calculation', () => {
    const availability = checkTokenAvailability(userId, 1000);
    expect(availability.overage).toBe(500); // If limit exceeded
  });
});
```

### 2. Integration Tests

Test token flow end-to-end:

```javascript
// Test consensus generation with token consumption
describe('Consensus Generation', () => {
  test('should consume tokens correctly', async () => {
    const initialUsage = await tokenManager.getUsageStats(userId);
    
    await request(app)
      .post('/api/consensus/generate')
      .send({ topic: 'test', sources: ['source1', 'source2'] })
      .expect(200);
    
    const finalUsage = await tokenManager.getUsageStats(userId);
    expect(finalUsage.used).toBeGreaterThan(initialUsage.used);
  });
});
```

### 3. Load Testing

Test token system under load:

```javascript
// Load test token operations
const loadTest = async () => {
  const promises = Array.from({ length: 100 }, () =>
    request(app)
      .post('/api/tokens/check')
      .send({ tokens: 100 })
  );
  
  const results = await Promise.all(promises);
  const successCount = results.filter(r => r.status === 200).length;
  
  console.log(`Success rate: ${successCount}/100`);
};
```

## Troubleshooting

### Common Issues

#### Token Calculation Errors
```bash
# Check token calculator logic
docker-compose exec backend node -e "
const calc = require('./src/utils/tokenCalculator');
console.log(calc.calculateTokensFromText('test', 'openai'));
"
```

#### Billing Integration Issues
```bash
# Test Stripe connection
docker-compose exec backend node -e "
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
stripe.plans.list().then(console.log);
"
```

#### Performance Issues
```bash
# Monitor token operations
docker-compose exec backend npm run monitor:tokens

# Check database performance
docker-compose exec mongodb mongo --eval "
db.tokenUsage.find().limit(5).explain('executionStats')
"
```

## Support

For token system support:
- Technical Issues: tech-support@consensus-ai.com
- Billing Questions: billing@consensus-ai.com  
- Documentation: https://docs.consensus-ai.com/tokens 