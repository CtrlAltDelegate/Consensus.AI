# 🚀 Complete Deployment Guide: Railway + Netlify

This guide will walk you through deploying your **Consensus.AI** project with the backend on Railway and frontend on Netlify.

## 📋 Prerequisites Checklist

Before starting, make sure you have:

- [ ] GitHub repository with your code
- [ ] Railway account ([railway.app](https://railway.app))
- [ ] Netlify account ([netlify.com](https://netlify.com))
- [ ] MongoDB Atlas account ([mongodb.com/atlas](https://mongodb.com/atlas))
- [ ] Stripe account with API keys
- [ ] OpenAI API key
- [ ] Anthropic API key (optional)

## 🗂️ Project Structure Verification

Ensure your repository has this structure:
```
Consensus.AI/
├── backend/
│   ├── src/
│   ├── package.json
│   ├── railway.json
│   └── Dockerfile
├── frontend/
│   ├── src/
│   ├── package.json
│   ├── netlify.toml
│   └── vite.config.js
└── docs/
```

---

## 🎯 Phase 1: Database Setup (MongoDB Atlas)

### Step 1: Create MongoDB Cluster

1. Go to [MongoDB Atlas](https://mongodb.com/atlas)
2. Create a new project: "Consensus-AI"
3. Build a database (choose FREE M0)
4. Select your cloud provider and region
5. Create cluster

### Step 2: Configure Database Access

1. **Database Access**:
   - Click "Database Access" in sidebar
   - Add new database user
   - Username: `consensus-admin`
   - Password: Generate secure password
   - Database User Privileges: Atlas admin

2. **Network Access**:
   - Click "Network Access" in sidebar
   - Add IP Address: `0.0.0.0/0` (allow access from anywhere)
   - Comment: "Railway deployment"

### Step 3: Get Connection String

1. Click "Connect" on your cluster
2. Choose "Connect your application"
3. Copy the connection string
4. Replace `<password>` with your database password
5. Save this for Railway environment variables

**Example**: `mongodb+srv://consensus-admin:your-password@cluster0.abcde.mongodb.net/consensus-ai?retryWrites=true&w=majority`

---

## 🚂 Phase 2: Railway Backend Deployment

### Step 1: Deploy to Railway

1. Go to [railway.app](https://railway.app)
2. Click "Start a New Project"
3. Select "Deploy from GitHub repo"
4. Choose your `Consensus.AI` repository
5. Railway will auto-detect your backend

### Step 2: Configure Railway Settings

1. In Railway dashboard, click on your service
2. Go to "Settings" tab
3. Set these build settings:
   - **Root Directory**: `/backend`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`

### Step 3: Add Environment Variables

In Railway dashboard, go to "Variables" tab and add:

```bash
# Database
MONGODB_URI=mongodb+srv://consensus-admin:your-password@cluster0.abcde.mongodb.net/consensus-ai?retryWrites=true&w=majority

# Security
JWT_SECRET=your-super-secret-jwt-key-minimum-32-characters-long
NODE_ENV=production

# Stripe
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret
STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key

# AI APIs
OPENAI_API_KEY=sk-your-openai-api-key
ANTHROPIC_API_KEY=sk-ant-your-anthropic-api-key

# Email (Optional)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
```

### Step 4: Deploy and Verify

1. Click "Deploy" to trigger deployment
2. Check "Deployments" tab for build logs
3. Once deployed, note your Railway app URL: `https://your-app-name.up.railway.app`
4. Test health endpoint: `https://your-app-name.up.railway.app/health`

---

## 🌐 Phase 3: Netlify Frontend Deployment

### Step 1: Deploy to Netlify

1. Go to [netlify.com](https://netlify.com)
2. Click "Add new site" → "Import an existing project"
3. Choose "Deploy with GitHub"
4. Select your repository
5. Configure build settings:
   - **Base directory**: `frontend`
   - **Build command**: `npm run build`
   - **Publish directory**: `frontend/dist`

### Step 2: Add Environment Variables

In Netlify dashboard, go to "Site settings" → "Environment variables":

```bash
# Railway Backend URL (use your actual Railway URL)
REACT_APP_API_URL=https://your-app-name.up.railway.app

# Stripe
REACT_APP_STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key

# App Config
REACT_APP_APP_NAME=Consensus.AI
REACT_APP_VERSION=1.0.0
```

### Step 3: Deploy and Verify

1. Trigger deployment from Netlify dashboard
2. Check "Deploys" tab for build status
3. Once deployed, note your Netlify URL: `https://your-app-name.netlify.app`
4. Test your frontend loads correctly

---

## 🔗 Phase 4: Connect Services

### Step 1: Update Railway CORS

In your Railway environment variables, add:

```bash
FRONTEND_URL=https://your-app-name.netlify.app
```

### Step 2: Test API Connection

1. Open browser dev tools on your Netlify site
2. Check console for any CORS errors
3. Test API endpoints are working

---

## 🎪 Phase 5: Stripe Configuration

### Step 1: Update Stripe Webhooks

1. Go to Stripe Dashboard → Webhooks
2. Add endpoint: `https://your-app-name.up.railway.app/api/webhooks/stripe`
3. Select events:
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
4. Copy webhook secret and update Railway environment variables

---

## ✅ Phase 6: Final Testing

### Backend Health Check
```bash
curl https://your-app-name.up.railway.app/health
```

Expected response:
```json
{
  "status": "OK",
  "timestamp": "2024-01-30T10:30:00.000Z",
  "uptime": 123.45,
  "environment": "production",
  "version": "1.0.0"
}
```

### Frontend Functionality Test

Visit your Netlify site and verify:
- [ ] Site loads without errors
- [ ] Navigation works
- [ ] Dashboard shows token usage
- [ ] Consensus form loads
- [ ] Subscription management loads
- [ ] No console errors

---

## 🚨 Troubleshooting

### Common Issues

#### 1. Railway Build Fails
- Check build logs in Railway dashboard
- Verify all dependencies are in `package.json`
- Ensure environment variables are set

#### 2. Database Connection Error
- Verify MongoDB connection string
- Check network access settings in Atlas
- Ensure database user has correct permissions

#### 3. CORS Errors
- Verify `FRONTEND_URL` is set in Railway
- Check frontend `REACT_APP_API_URL` is correct
- Ensure CORS configuration in backend

#### 4. Netlify Build Fails
- Check build logs in Netlify dashboard
- Verify Node version compatibility
- Ensure all environment variables start with `REACT_APP_`

---

## 📞 Getting Help

### Deployment URLs to Save
- **Railway Backend**: `https://your-app-name.up.railway.app`
- **Netlify Frontend**: `https://your-app-name.netlify.app`
- **MongoDB Atlas**: Your cluster dashboard
- **Stripe Dashboard**: Webhooks and API keys

### Support Resources
- [Railway Docs](https://docs.railway.app/)
- [Netlify Docs](https://docs.netlify.com/)
- [MongoDB Atlas Docs](https://docs.atlas.mongodb.com/)

---

## 🎉 Congratulations!

If all tests pass, your **Consensus.AI** application is now live:
- ✅ Backend API on Railway
- ✅ Frontend app on Netlify
- ✅ Database on MongoDB Atlas
- ✅ Stripe integration working
- ✅ CORS properly configured

Your app is ready for users! 🚀 