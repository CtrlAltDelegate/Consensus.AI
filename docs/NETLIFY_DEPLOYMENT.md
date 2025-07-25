# 🌐 Netlify Frontend Deployment Guide

This guide will help you deploy the Consensus.AI React frontend to Netlify.

## Prerequisites

1. **Netlify Account**: Sign up at [netlify.com](https://netlify.com)
2. **GitHub Repository**: Your code should be in a GitHub repository
3. **Railway Backend**: Backend should be deployed and running
4. **Stripe Keys**: For payment processing

## Step 1: Prepare Your Repository

Make sure your repository is pushed to GitHub with all the latest changes:

```bash
git add .
git commit -m "Prepare for Netlify deployment"
git push origin main
```

## Step 2: Deploy to Netlify

### Quick Deploy Method

1. Go to [netlify.com](https://netlify.com) and log in
2. Click "Add new site" → "Import an existing project"
3. Choose "Deploy with GitHub"
4. Select your repository
5. Configure build settings:
   - **Base directory**: `frontend`
   - **Build command**: `npm run build`
   - **Publish directory**: `frontend/dist`
   - **Node version**: 18

### Manual Configuration

If you need to set up manually:

```bash
Base directory: frontend
Build command: npm run build
Publish directory: frontend/dist
```

## Step 3: Environment Variables

In your Netlify site dashboard, go to **Site settings** → **Environment variables** and add:

### Required Variables

```bash
# Railway Backend URL (replace with your Railway app URL)
REACT_APP_API_URL=https://your-railway-app.railway.app

# Stripe Configuration
REACT_APP_STRIPE_PUBLISHABLE_KEY=pk_test_or_pk_live_your_stripe_publishable_key

# App Configuration
REACT_APP_APP_NAME=Consensus.AI
REACT_APP_VERSION=1.0.0

# Optional: Analytics/Monitoring
REACT_APP_GA_TRACKING_ID=GA_MEASUREMENT_ID
REACT_APP_SENTRY_DSN=https://your-sentry-dsn
```

### Environment Variable Setup Steps

1. In Netlify dashboard, go to your site
2. Click "Site settings"
3. Click "Environment variables" in the sidebar
4. Click "Add a variable" for each environment variable above
5. Make sure to use your actual Railway app URL

## Step 4: Build Configuration

Your `netlify.toml` file is already configured with:

- ✅ React Router redirects
- ✅ Security headers
- ✅ Static asset caching
- ✅ CORS headers
- ✅ Build settings

## Step 5: Custom Domain (Optional)

### Add Custom Domain
1. Go to "Domain management" in your site settings
2. Click "Add custom domain"
3. Enter your domain name
4. Follow DNS configuration instructions

### SSL Certificate
Netlify automatically provides SSL certificates for all domains.

## Step 6: Deploy and Test

### Trigger Deployment
1. Your site should automatically deploy after setup
2. Check the "Deploys" tab for build status
3. View build logs if there are any errors

### Test Your Deployment
Visit your Netlify app URL and verify:

- [ ] Site loads correctly
- [ ] Navigation works (React Router)
- [ ] API calls reach your Railway backend
- [ ] Stripe integration works
- [ ] All components render properly

## Step 7: Connect to Railway Backend

Update your Railway backend environment variables:

```bash
# In Railway dashboard, add:
FRONTEND_URL=https://your-netlify-app.netlify.app
```

This enables proper CORS configuration.

## Environment-Specific Configuration

### Development
```bash
REACT_APP_API_URL=http://localhost:3001
```

### Production (Netlify)
```bash
REACT_APP_API_URL=https://your-railway-app.railway.app
```

## Troubleshooting

### Common Issues

#### 1. Build Failures
```bash
# Check Node version in build logs
# Ensure all dependencies are in package.json
# Verify build command is correct
```

#### 2. API Connection Issues
- Verify `REACT_APP_API_URL` is correct
- Check Railway backend is running
- Verify CORS settings in backend

#### 3. Routing Issues (404 on refresh)
- Ensure `netlify.toml` has the redirect rule
- Check React Router configuration

#### 4. Environment Variables Not Working
- Variables must start with `REACT_APP_`
- Redeploy after adding new variables
- Check variable names are exact

#### 5. Stripe Integration Issues
- Verify `REACT_APP_STRIPE_PUBLISHABLE_KEY` is correct
- Check Stripe test/live mode matches your backend

### Build Log Analysis

Common build errors and solutions:

```bash
# Memory issues
"JavaScript heap out of memory"
→ Add NODE_OPTIONS=--max_old_space_size=4096

# Missing dependencies
"Module not found"
→ Add missing package to package.json

# API URL issues
"Network Error"
→ Check REACT_APP_API_URL environment variable
```

## Deployment Checklist

Before going live:

- [ ] Railway backend is deployed and running
- [ ] All environment variables are set correctly
- [ ] CORS is configured for your Netlify domain
- [ ] Stripe webhook endpoints are updated
- [ ] Custom domain is configured (if applicable)
- [ ] SSL certificate is active
- [ ] All API endpoints are working
- [ ] Error handling is working properly

## Advanced Configuration

### Branch Deploys
Set up automatic deployments for different branches:
- `main` → Production
- `staging` → Staging environment
- `develop` → Development preview

### Deploy Previews
Netlify automatically creates deploy previews for pull requests.

### Functions (Optional)
If you need serverless functions:
```bash
# Create netlify/functions directory
# Add function files
# Configure in netlify.toml
```

## Performance Optimization

### Build Optimization
```bash
# In package.json, add:
"build": "vite build --mode production"
```

### Bundle Analysis
```bash
npm install --save-dev vite-bundle-analyzer
npm run build -- --analyze
```

## Monitoring and Analytics

### Build Notifications
Set up Slack/Discord notifications for deploy status.

### Performance Monitoring
- Lighthouse CI integration
- Core Web Vitals tracking
- Error monitoring with Sentry

## Security Considerations

✅ **Already Configured:**
- Security headers in `netlify.toml`
- Environment variables properly scoped
- HTTPS enforced
- CORS properly configured

## CLI Deployment (Alternative)

Install Netlify CLI for command-line deployment:

```bash
# Install CLI
npm install -g netlify-cli

# Login to Netlify
netlify login

# Deploy from frontend directory
cd frontend
netlify deploy --prod --dir=dist
```

## Support Resources

- [Netlify Documentation](https://docs.netlify.com/)
- [Netlify Community](https://community.netlify.com/)
- [Netlify Status](https://www.netlifystatus.com/)

## Next Steps

After successful deployment:
1. Update Railway CORS settings with your Netlify URL
2. Configure Stripe webhooks with your new domain
3. Set up monitoring and analytics
4. Test all functionality end-to-end 