# Consensus.AI API Documentation

## Overview

The Consensus.AI API provides endpoints for generating AI-powered consensus reports, managing token usage, and handling subscriptions. All API requests should be made to `https://your-domain.com/api/`.

## Authentication

All authenticated endpoints require a Bearer token in the Authorization header:

```
Authorization: Bearer YOUR_JWT_TOKEN
```

## Rate Limiting

- General API: 100 requests per 15 minutes
- Authentication: 5 requests per 15 minutes  
- Consensus generation: 5 requests per 10 minutes

## Consensus Endpoints

### Generate Consensus

```http
POST /api/consensus/generate
```

Generate a consensus analysis from multiple sources.

**Headers:**
- `Authorization: Bearer {token}`
- `Content-Type: application/json`

**Request Body:**
```json
{
  "topic": "The impact of AI on healthcare",
  "sources": [
    "AI has revolutionized medical diagnosis...",
    "Healthcare professionals are adopting AI tools...",
    "Recent studies show AI can reduce diagnostic errors..."
  ],
  "options": {
    "generatePdf": true,
    "emailReport": false,
    "confidenceThreshold": 0.7,
    "maxResponseLength": 2000
  }
}
```

**Response:**
```json
{
  "success": true,
  "consensus": "Based on the analysis...",
  "confidence": 0.87,
  "sources": [
    {
      "provider": "OpenAI",
      "model": "GPT-4",
      "tokenUsage": 1250
    }
  ],
  "totalTokens": 2430,
  "tokensRemaining": 15570,
  "pdfGenerated": true
}
```

### Estimate Token Usage

```http
POST /api/consensus/estimate
```

Estimate token usage for a consensus request.

**Request Body:**
```json
{
  "topic": "Your topic here",
  "sources": ["source1", "source2"]
}
```

**Response:**
```json
{
  "success": true,
  "estimatedTokens": 1500,
  "available": 18000,
  "sufficient": true,
  "overage": 0,
  "overageCharge": 0
}
```

### Get Consensus History

```http
GET /api/consensus/history?page=1&limit=10
```

Retrieve past consensus analyses.

**Response:**
```json
{
  "success": true,
  "analyses": [
    {
      "id": "analysis_123",
      "topic": "AI in healthcare",
      "createdAt": "2024-01-15T10:30:00Z",
      "confidence": 0.87,
      "tokenUsage": 2430
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 25,
    "pages": 3
  }
}
```

## Token Management Endpoints

### Get Token Usage

```http
GET /api/tokens/usage
```

Get current token usage statistics.

**Response:**
```json
{
  "success": true,
  "tier": "pro",
  "limit": 50000,
  "used": 32450,
  "remaining": 17550,
  "usagePercentage": 64.9,
  "totalLifetime": 124530,
  "lastReset": "2024-01-01T00:00:00Z",
  "status": "moderate"
}
```

### Check Token Availability

```http
POST /api/tokens/check
```

Check if sufficient tokens are available for an operation.

**Request Body:**
```json
{
  "tokens": 1500
}
```

**Response:**
```json
{
  "success": true,
  "available": 17550,
  "requested": 1500,
  "sufficient": true,
  "overage": 0,
  "currentUsage": 32450,
  "limit": 50000,
  "tier": "pro"
}
```

### Get Usage History

```http
GET /api/tokens/usage/history?period=monthly&page=1&limit=20
```

Get detailed token usage history.

**Response:**
```json
{
  "success": true,
  "history": [
    {
      "date": "2024-01-15",
      "operation": "consensus",
      "tokens": 2430,
      "description": "AI in healthcare analysis"
    }
  ],
  "summary": {
    "totalRequests": 15,
    "totalTokens": 32450,
    "averageTokensPerRequest": 2163,
    "period": "monthly"
  }
}
```

## Billing Endpoints

### Get Subscription Status

```http
GET /api/billing/subscription
```

Get current subscription information.

**Response:**
```json
{
  "success": true,
  "subscription": {
    "tier": "pro",
    "status": "active",
    "currentPeriodStart": "2024-01-01T00:00:00Z",
    "currentPeriodEnd": "2024-02-01T00:00:00Z",
    "cancelAtPeriodEnd": false
  }
}
```

### Update Subscription

```http
PUT /api/billing/subscription
```

Upgrade or downgrade subscription plan.

**Request Body:**
```json
{
  "tier": "enterprise",
  "billingPeriod": "yearly"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Subscription updated successfully",
  "subscription": {
    "tier": "enterprise",
    "status": "active"
  }
}
```

### Get Billing History

```http
GET /api/billing/history?limit=10
```

Get past invoices and billing history.

**Response:**
```json
{
  "success": true,
  "invoices": [
    {
      "id": "inv_123",
      "amount": 49.99,
      "currency": "usd",
      "status": "paid",
      "date": "2024-01-01T00:00:00Z",
      "description": "Pro Plan - Monthly",
      "hostedInvoiceUrl": "https://invoice.stripe.com/..."
    }
  ]
}
```

## Webhook Endpoints

### Stripe Webhook

```http
POST /api/webhooks/stripe
```

Handles Stripe webhook events for billing automation.

**Headers:**
- `Stripe-Signature: {signature}`

This endpoint processes subscription updates, payment confirmations, and billing events automatically.

## Error Responses

All endpoints may return these error responses:

### 400 Bad Request
```json
{
  "error": "Validation error message"
}
```

### 401 Unauthorized
```json
{
  "error": "Access denied. No token provided."
}
```

### 402 Payment Required
```json
{
  "error": "Insufficient tokens for this operation",
  "required": 1500,
  "available": 200,
  "overage": 1300
}
```

### 429 Too Many Requests
```json
{
  "error": "Too many requests from this IP, please try again later.",
  "retryAfter": "Check the Retry-After header"
}
```

### 500 Internal Server Error
```json
{
  "error": "Something went wrong!"
}
```

## SDKs and Examples

### JavaScript/Node.js

```javascript
const axios = require('axios');

const api = axios.create({
  baseURL: 'https://your-domain.com/api',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
});

// Generate consensus
const generateConsensus = async (topic, sources) => {
  const response = await api.post('/consensus/generate', {
    topic,
    sources,
    options: { generatePdf: true }
  });
  return response.data;
};

// Check token usage
const getTokenUsage = async () => {
  const response = await api.get('/tokens/usage');
  return response.data;
};
```

### cURL Examples

```bash
# Generate consensus
curl -X POST https://your-domain.com/api/consensus/generate \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "topic": "AI in healthcare",
    "sources": ["source1", "source2"],
    "options": {"generatePdf": true}
  }'

# Get token usage
curl -X GET https://your-domain.com/api/tokens/usage \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## Support

For API support and questions:
- Email: api-support@consensus-ai.com
- Documentation: https://docs.consensus-ai.com
- Status: https://status.consensus-ai.com 