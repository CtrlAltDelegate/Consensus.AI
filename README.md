# Consensus.AI

An AI-powered consensus generation platform that synthesizes insights from multiple Large Language Models into a single, authoritative report. Built for teams and researchers who need reliable, multi-perspective AI analysis.

## How It Works

Consensus.AI uses a **3-phase process** to generate high-quality reports:

1. **Independent Drafting** — Three LLMs (GPT-4o, Claude Sonnet, Gemini) each analyze your input independently
2. **Peer Review** — Each model critiques the others' drafts, surfacing agreements and conflicts
3. **Final Arbitration** — Cohere Command R+ synthesizes all findings into a single consensus report

Reports can be downloaded as PDFs and delivered via email.

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, Vite, Tailwind CSS |
| Backend | Node.js, Express 4.18 |
| Database | MongoDB 7.0 |
| Cache | Redis 7.2 |
| AI Providers | OpenAI, Anthropic, Google, Cohere |
| Payments | Stripe |
| Deployment | Docker, Railway, Netlify |

## Project Structure

```
consensus-ai/
├── backend/
│   └── src/
│       ├── routes/         # API endpoints (auth, consensus, billing, reports)
│       ├── services/       # Business logic (consensus engine, LLM orchestrator, billing)
│       ├── models/         # Mongoose schemas
│       ├── middleware/     # Auth, rate limiting, request tracking
│       ├── jobs/           # Cron jobs (token reset, data retention)
│       └── config/         # Database, Stripe, Sentry configuration
├── frontend/
│   └── src/
│       ├── components/     # React UI components
│       ├── contexts/       # UserContext (auth state)
│       └── utils/          # Export helpers
├── deployment/
│   ├── docker-compose.yml  # Full production stack
│   └── nginx.conf          # Reverse proxy with SSL
└── docs/                   # Additional documentation
```

## Getting Started

### Prerequisites

- Node.js 18+
- MongoDB 7.0
- Redis 7.2
- API keys for OpenAI, Anthropic, Google, and Cohere

### Local Development

```bash
# Install all dependencies
npm run install:all

# Copy and configure environment variables
cp backend/.env.example backend/.env

# Start frontend and backend concurrently
npm run dev
```

- Frontend: `http://localhost:5173`
- Backend API: `http://localhost:3001`

### Backend Only

```bash
cd backend
npm install
cp .env.example .env
npm run dev
```

### Frontend Only

```bash
cd frontend
npm install
npm run dev
```

## Environment Variables

Create `backend/.env` from `.env.example`:

```env
# Database
MONGODB_URI=mongodb://user:pass@host:27017/consensus-ai

# Cache
REDIS_PASSWORD=your-redis-password

# Server
NODE_ENV=development
PORT=3001
JWT_SECRET=your-jwt-secret

# LLM APIs
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
GOOGLE_API_KEY=AIzaSy...
COHERE_API_KEY=...

# Stripe
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
REACT_APP_STRIPE_PUBLISHABLE_KEY=pk_test_...

# Email
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
```

## Docker Deployment

The full stack (frontend, backend, MongoDB, Redis, Nginx) can be run with Docker Compose:

```bash
cp .env.production .env
docker-compose -f deployment/docker-compose.yml up -d
```

See [Deployment Guide](docs/deployment-guide.md) for Railway and Netlify instructions.

## Subscription Tiers

| Plan | Tokens/Month | Price |
|---|---|---|
| Basic | 10,000 | $19.99/mo |
| Pro | 50,000 | $99.99/mo |
| Enterprise | 200,000 | Custom |

Tokens are consumed per consensus generation. Overages are billed at $0.001/token. Usage resets on each billing cycle.

## API Reference

See [API Documentation](docs/api-docs.md) for full endpoint reference.

Key endpoints:

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/auth/register` | Create account |
| `POST` | `/api/auth/login` | Authenticate |
| `POST` | `/api/consensus/generate` | Run consensus analysis |
| `GET` | `/api/consensus/history` | List past reports |
| `GET` | `/api/billing/subscription` | Get subscription details |
| `POST` | `/api/webhooks/stripe` | Stripe event handler |

File uploads (TXT, PDF, CSV, JSON) are supported on the generate endpoint — up to 5 files at 10MB each.

## Additional Docs

- [Token System Setup](docs/token-system-setup.md)
- [Deployment Guide](docs/deployment-guide.md)
- [Railway Deployment](docs/RAILWAY_DEPLOYMENT.md)
- [Netlify Deployment](docs/NETLIFY_DEPLOYMENT.md)
