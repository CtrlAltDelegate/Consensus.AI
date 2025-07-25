# 🚂 Railway Backend Deployment Guide

This guide will help you deploy the Consensus.AI backend to Railway.

## Prerequisites

1. **Railway Account**: Sign up at [railway.app](https://railway.app)
2. **GitHub Repository**: Your code should be in a GitHub repository
3. **Database**: MongoDB Atlas account (free tier available)
4. **API Keys**: Stripe, OpenAI, and Anthropic API keys

## Step 1: Prepare Your Database

### MongoDB Atlas Setup
1. Go to [MongoDB Atlas](https://www.mongodb.com/atlas)
2. Create a free cluster
3. Create a database user
4. Whitelist all IP addresses (0.0.0.0/0) for Railway
5. Get your connection string

## Step 2: Deploy to Railway

### Quick Deploy
1. Go to [railway.app](https://railway.app)
2. Click "Start a New Project"
3. Select "Deploy from GitHub repo"
4. Choose your repository
5. Select the `backend` folder as root directory

### Environment Variables Setup

In your Railway project dashboard, add these environment variables:

```bash
# Required Variables
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/consensus-ai
JWT_SECRET=your-super-secret-jwt-key-minimum-32-characters
NODE_ENV=production
PORT=3000

# Stripe (Required for billing)
STRIPE_SECRET_KEY=sk_live_or_sk_test_your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_from_stripe_dashboard
STRIPE_PUBLISHABLE_KEY=pk_live_or_pk_test_your_stripe_publishable_key

# AI APIs (Required for consensus generation)
OPENAI_API_KEY=sk-your-openai-api-key
ANTHROPIC_API_KEY=sk-ant-your-anthropic-api-key

# Email (Optional - for notifications)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-specific-password

# Frontend URL (for CORS - add after Netlify deployment)
FRONTEND_URL=https://your-netlify-app.netlify.app
```

## Step 3: Configure Build Settings

Railway should automatically detect your Node.js app, but you can verify:

- **Build Command**: `npm install`
- **Start Command**: `npm start`
- **Root Directory**: `/backend`

## Step 4: Custom Domain (Optional)

1. In Railway dashboard, go to your service
2. Click "Settings" → "Domains"
3. Add your custom domain
4. Update DNS records as instructed

## Step 5: Verify Deployment

1. Check the Railway logs for any errors
2. Visit your app URL + `/health` to verify it's running
3. Test the API endpoints

### Health Check URL
```
https://your-app-name.up.railway.app/health
```

Expected response:
```json
{
  "status": "OK",
  "timestamp": "2024-01-10T10:30:00.000Z",
  "uptime": 123.45,
  "environment": "production",
  "version": "1.0.0"
}
```

## Step 6: Database Connection

Make sure your MongoDB Atlas cluster allows connections from Railway:
1. In MongoDB Atlas, go to "Network Access"
2. Add IP address: `0.0.0.0/0` (allows all IPs)
3. Or use Railway's static IP if available in your plan

## Step 7: Set Up Webhooks

### Stripe Webhooks
1. In Stripe Dashboard, go to "Webhooks"
2. Add endpoint: `https://your-app-name.up.railway.app/api/webhooks/stripe`
3. Select these events:
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
4. Copy the webhook secret to your Railway environment variables

## Troubleshooting

### Common Issues

1. **Database Connection Failed**
   - Check MongoDB URI format
   - Verify network access settings in Atlas
   - Ensure user has correct permissions

2. **Port Issues**
   - Railway automatically sets PORT environment variable
   - Make sure your app listens on `process.env.PORT`

3. **CORS Issues**
   - Update FRONTEND_URL environment variable
   - Check CORS configuration in app.js

4. **Memory Issues**
   - Railway free tier has memory limits
   - Optimize your code or upgrade plan

### Environment Variable Checklist

- [ ] MONGODB_URI (with username/password)
- [ ] JWT_SECRET (32+ characters)
- [ ] STRIPE_SECRET_KEY
- [ ] OPENAI_API_KEY
- [ ] ANTHROPIC_API_KEY
- [ ] NODE_ENV=production
- [ ] FRONTEND_URL (after Netlify setup)

## Next Steps

After successful Railway deployment:
1. Note your Railway app URL
2. Update CORS settings if needed
3. Proceed with Netlify frontend deployment
4. Update frontend API endpoints to point to Railway

## Railway CLI (Optional)

Install Railway CLI for easier management:
```bash
npm install -g @railway/cli
railway login
railway link
```

## Support

- Railway Documentation: [docs.railway.app](https://docs.railway.app)
- Railway Discord: [discord.gg/railway](https://discord.gg/railway) 