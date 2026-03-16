# Production Hardening Checklist

Use this checklist before and after going live to ensure the consensus pipeline, monitoring, and payments behave under load and failure.

---

## 1. Load test the consensus pipeline

**Goal:** Find bottlenecks before real traffic. Run concurrent requests against the consensus flow.

### Option A: Use the load-test script (recommended)

From the repo root (or `backend/`), with backend env (e.g. `.env`) and a valid `AUTH_TOKEN`:

```bash
cd backend
node scripts/load-test-consensus.js
# Or against a deployed URL:
BASE_URL=https://your-backend.up.railway.app AUTH_TOKEN=your_jwt node scripts/load-test-consensus.js
```

Optional env:

- `CONCURRENCY` – number of concurrent jobs (default: 5)
- `BASE_URL` – API base URL (default: http://localhost:3000)
- `AUTH_TOKEN` – JWT for /api/consensus (required for generate + job status)

**What to watch:** Response times, 5xx/429s, time to first byte for `/consensus/generate`, and job completion rate. Tune concurrency and timeouts based on results.

### Option B: Manual / k6

- Start N consensus jobs in parallel (e.g. 5–10) from the UI or via `POST /api/consensus/generate` with a valid auth header.
- Poll `GET /api/consensus/status/:jobId` until completed or failed.
- Record: p50/p95 latency, errors, and any degradation when N increases.

---

## 2. Sentry alerting

**Goal:** Confirm errors and performance data reach Sentry and that alerts fire.

### Configuration

- Set `SENTRY_DSN` in production (Railway env or similar).
- Sentry is configured in `backend/src/config/sentry.js`. To enable it, call `initSentry(app)` and use `sentryMiddleware()` and `sentryErrorHandler()` in your app entry (e.g. `backend/src/app.js`). Health and metrics are filtered from error tracking.

### Verify alerting

1. **Trigger a test error** (only in staging or production with Sentry enabled):
   ```bash
   curl "https://your-api.up.railway.app/api/test/sentry?secret=YOUR_SENTRY_TEST_SECRET"
   ```
   Set `SENTRY_TEST_SECRET` in the backend env (e.g. a random string). If the secret matches, the route throws a test error that should appear in Sentry within minutes.

2. **In Sentry:**
   - Create an **Alert Rule** (e.g. when event count > 0 in 5m, or when a new issue is created).
   - Add **Notifications** (email, Slack, PagerDuty, etc.).
   - Optionally enable **Performance** and set alerts on degraded transactions.

3. **Optional:** In Sentry project settings, add a **Release** (e.g. from `package.json` version or git SHA) so you can correlate errors with deploys.

---

## 3. Railway auto-restart and health

**Goal:** Ensure the app restarts on failure and that the platform uses your health check.

### Current config (`railway.toml`)

- `healthcheckPath = "/health"` – Railway pings this to decide if the deployment is healthy.
- `restartPolicyType = "on_failure"` – Process is restarted when it exits with a non-zero code or crashes.

### Verify

1. **Health:**  
   `curl https://your-backend.up.railway.app/health`  
   Expect 200 and a JSON body with `status: "ok"` (or "degraded" if e.g. one dependency is down).

2. **Restart on failure:**  
   - In a staging deploy, trigger a fatal error (e.g. throw in a route after a delay) or kill the process.  
   - Confirm in Railway dashboard that the service restarts and becomes healthy again after the next health check.

3. **Timeouts:**  
   Backend sets ~3-minute server timeout for long-running LLM requests. Ensure Railway/proxy timeouts are not shorter than that (e.g. 60s) or consensus jobs may be cut off.

---

## 4. Stripe webhook handling

**Goal:** Subscription cancellations and failed payments are processed correctly.

### Events to test

- **Subscription cancelled:** `customer.subscription.deleted` (and `customer.subscription.updated` with `cancel_at_period_end`).
- **Failed payment:** `invoice.payment_failed`.

### How to test (Stripe CLI)

1. Install [Stripe CLI](https://stripe.com/docs/stripe-cli).
2. Login: `stripe login`.
3. Forward webhooks to your **deployed** backend (use your real webhook URL and secret in production):
   ```bash
   stripe listen --forward-to https://your-backend.up.railway.app/api/webhooks/stripe
   ```
   Stripe will print a temporary signing secret (e.g. `wh_sec_...`). Use it as `STRIPE_WEBHOOK_SECRET` for that run, or add a separate “test” webhook endpoint in Stripe Dashboard that uses this forwarding.

4. In another terminal, trigger test events:
   ```bash
   stripe trigger customer.subscription.deleted
   stripe trigger invoice.payment_failed
   ```
5. Check backend logs and DB: user subscription status and any notification flows (e.g. billing failure email) should run as expected. No 500s from `POST /api/webhooks/stripe`.

### Production webhook secret

- In Stripe Dashboard → Developers → Webhooks, add endpoint `https://your-backend.up.railway.app/api/webhooks/stripe`.
- Subscribe to at least: `customer.subscription.created`, `customer.subscription.updated`, `customer.subscription.deleted`, `invoice.payment_succeeded`, `invoice.payment_failed`.
- Set the endpoint’s signing secret as `STRIPE_WEBHOOK_SECRET` in Railway (or your backend env). Never use the CLI’s temporary secret in production.

---

## 5. End-to-end smoke test

**Goal:** One full path from registration → report generation → download → cancellation (or account closure).

### Manual checklist

1. **Registration**
   - Open app → Sign up with a new email.
   - Confirm you can log in and see dashboard.

2. **Report generation**
   - Start a new consensus report (short topic + optional source).
   - Confirm progress (e.g. phase 1 → 2 → 3) and that the job completes.
   - Open the report in the UI; confirm content and confidence look correct.

3. **Download**
   - Use “Download PDF” for the same report.
   - Confirm the PDF downloads and content matches the report.

4. **Billing / cancellation**
   - If on a paid plan: open Billing and cancel subscription (cancel at period end).
   - Optionally trigger a failed payment (e.g. Stripe test card that declines) and confirm handling (e.g. email or in-app notice).
   - If you have “delete account”: run through account deletion and confirm data is removed (and webhook/subscription state updated if applicable).

### Automated smoke script (optional)

From `backend/` directory:

```bash
cd backend
BASE_URL=https://your-api.up.railway.app npm run smoke-test
# Or with existing user:
TEST_EMAIL=you@example.com TEST_PASSWORD=yourpass BASE_URL=https://... npm run smoke-test
```

Requires:

- `BASE_URL` – backend URL (default: http://localhost:3000).
- Optional: `TEST_EMAIL` and `TEST_PASSWORD` – use existing user and login; otherwise the script registers a random user.

The script performs: health check → register or login → start one consensus job → poll until done → download PDF (if available). It does not replace the full manual checklist (billing/cancellation, account deletion).

---

## Quick reference

| Item                    | Command / URL |
|-------------------------|----------------|
| Health                  | `GET /health` |
| Sentry test (staging)   | `GET /api/test/sentry?secret=SENTRY_TEST_SECRET` |
| Stripe webhook (CLI)    | `stripe listen --forward-to https://.../api/webhooks/stripe` |
| Load test               | `node backend/scripts/load-test-consensus.js` |
| Smoke test              | `node backend/scripts/smoke-test-e2e.js` |

After hardening, re-run the load test and smoke test after major changes or before each release.
