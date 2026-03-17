#!/usr/bin/env node
/**
 * Report Profitability Validation — run 20–30 real consensus generations across
 * varying input types (short queries, long documents, 5-file-style) and measure
 * actual API cost per report. Validates against $15 PAYG floor and $29/3-report
 * Starter tier (3 reports must not cost you more than $8–10 in API fees).
 *
 * Usage:
 *   node scripts/validateTokenCaps.js                      # Use existing Report data only (no API calls)
 *   node scripts/validateTokenCaps.js --live                # Run live tests (short, medium, long, 5-file)
 *   node scripts/validateTokenCaps.js --live --runs 30     # 30 runs (~8 per profile)
 *   node scripts/validateTokenCaps.js --live --runs 30 --save-reports  # Same + persist to DB (admin dashboard)
 *   node scripts/validateTokenCaps.js --db-only           # Same as default
 */

require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });

const BASIC_CAP_TOKENS = 10000;   // Basic tier cap (tokens/month)
const MAX_COST_PER_BASIC_USER = 8; // $8 — "Basic user must not cost you $8+ in API fees"
const PAYG_FLOOR_USD = 15;        // $15 PAYG floor — cost per report must stay below this
const STARTER_3_REPORT_MAX_USD = 10; // 3 reports (Starter) must not cost you more than $8–10 total
const DEFAULT_COST_PER_1M = Number(process.env.ADMIN_LLM_COST_PER_1M) || 6.5;

// Test profiles: short query, medium (paragraphs), long (document-style), 5-file (simulated uploads)
const TEST_PROFILES = {
  short: {
    label: 'Short query',
    topic: 'What are the main risks of AI in healthcare?',
    sources: [
      'WHO guidelines on AI in health (2024): focus on equity and safety.'
    ]
  },
  medium: {
    label: 'Medium (2–3 paragraphs)',
    topic: 'How should regulators approach large language models used in financial advice? Consider consumer protection, systemic risk, and innovation.',
    sources: [
      'SEC 2023 guidance on AI and investment advice: disclosure and oversight of algorithms.',
      'EU AI Act: high-risk uses of AI in credit scoring and eligibility.',
      'Industry view: need for sandboxes and proportionality to avoid stifling innovation.'
    ]
  },
  long: {
    label: 'Long / document-style',
    topic: 'Synthesize a consensus view on the role of nuclear energy in reaching net-zero, including safety, cost, waste, and timelines.',
    sources: [
      'IPCC AR6: nuclear can contribute to low-carbon baseload; costs and build times vary by region.',
      'IEA Net Zero by 2050: nuclear capacity must increase in most pathways; SMRs as option.',
      'Stanford/MIT studies: cost overruns and delays in recent builds; learning curves and standardization could improve.',
      'Environmental groups: concerns over waste and accidents; renewables plus storage as alternative.',
      'IAEA: safety record of modern plants; small modular reactors and advanced designs.',
      'National policies: France, China expanding; Germany phase-out; US incentives under IRA.'
    ]
  },
  fiveFile: {
    label: '5-file upload (simulated)',
    topic: 'Competitive analysis and consensus: Compare Product A vs Product B on pricing, features, support, and roadmap. Recommend which fits enterprise buyers.',
    sources: [
      '[File 1 - Product A datasheet] Product A: SaaS platform for workflow automation. Pricing: $99/user/month; enterprise custom. Features: 50+ integrations, RBAC, SSO, audit logs. Support: 24/7, SLA 99.9%. Roadmap: AI assistant Q3, mobile app Q4.',
      '[File 2 - Product B datasheet] Product B: No-code automation and integrations. Pricing: $79/user/month; volume discounts. Features: 200+ connectors, custom workflows, API. Support: business hours, community. Roadmap: governance module Q2, analytics Q4.',
      '[File 3 - Gartner excerpt] Gartner 2024: Workflow automation market growing 18% CAGR. Key differentiators: time-to-value, scalability, vendor lock-in. Enterprise buyers prioritize security and compliance over price.',
      '[File 4 - G2 reviews summary] G2: Product A rated 4.5 (ease of use, support). Product B rated 4.3 (value, integrations). Common complaints: A = cost; B = support response time.',
      '[File 5 - Internal memo] Internal memo: Our segment is mid-market (500–5K employees). Must have: SSO, audit trail, <3 month rollout. Nice to have: AI features. Budget: $80–120/user/month.'
    ]
  }
};

function percentile(sortedArr, p) {
  if (!sortedArr.length) return 0;
  const i = (p / 100) * (sortedArr.length - 1);
  const lo = Math.floor(i);
  const hi = Math.ceil(i);
  if (lo === hi) return sortedArr[lo];
  return sortedArr[lo] + (i - lo) * (sortedArr[hi] - sortedArr[lo]);
}

function stats(tokens) {
  if (!tokens.length) return { count: 0, min: 0, max: 0, mean: 0, p50: 0, p95: 0 };
  const sorted = [...tokens].sort((a, b) => a - b);
  const sum = tokens.reduce((a, b) => a + b, 0);
  return {
    count: tokens.length,
    min: sorted[0],
    max: sorted[sorted.length - 1],
    mean: Math.round(sum / tokens.length),
    p50: Math.round(percentile(sorted, 50)),
    p95: Math.round(percentile(sorted, 95))
  };
}

function runFromDb() {
  const mongoose = require('mongoose');
  const Report = require('../src/models/reportModel');
  const MONGODB_URI = process.env.MONGODB_URI || process.env.MONGO_URI;
  if (!MONGODB_URI) {
    console.error('Set MONGODB_URI (or MONGO_URI) to use --db-only.');
    process.exit(1);
  }

  return mongoose.connect(MONGODB_URI).then(async () => {
    const cursor = Report.find({ 'metadata.totalTokens': { $exists: true, $gte: 0 } })
      .select('metadata.totalTokens')
      .lean()
      .cursor();
    const tokens = [];
    for await (const doc of cursor) {
      const t = doc.metadata?.totalTokens;
      if (typeof t === 'number' && t > 0) tokens.push(t);
    }
    await mongoose.connection.close();
    return tokens;
  });
}

async function runLiveTests(runsPerProfile = 5, options = {}) {
  const consensusEngine = require('../src/services/consensusEngine');
  const { saveReports = false } = options;
  const tokens = [];
  const byProfile = { short: [], medium: [], long: [], fiveFile: [] };

  let Report;
  let mongoose;
  const estimatedCostUsdFromTokens = (t) => Math.round((t / 1e6) * DEFAULT_COST_PER_1M * 100) / 100;
  if (saveReports) {
    mongoose = require('mongoose');
    Report = require('../src/models/reportModel');
    const MONGODB_URI = process.env.MONGODB_URI || process.env.MONGO_URI;
    if (!MONGODB_URI) {
      console.warn('--save-reports ignored: MONGODB_URI not set.');
      options.saveReports = false;
    } else {
      await mongoose.connect(MONGODB_URI);
    }
  }

  const profileKeys = Object.keys(TEST_PROFILES);
  const runsEach = Math.max(1, Math.ceil(runsPerProfile / profileKeys.length));

  for (const key of profileKeys) {
    const profile = TEST_PROFILES[key];
    console.log(`\n📝 Running ${runsEach} × "${profile.label}"...`);
    for (let i = 0; i < runsEach; i++) {
      try {
        const result = await consensusEngine.generateConsensus(profile.topic, profile.sources, {});
        const total = result.totalTokens || 0;
        tokens.push(total);
        byProfile[key].push(total);
        const costUsd = estimatedCostUsdFromTokens(total);
        process.stdout.write(`   Run ${i + 1}: ${total.toLocaleString()} tokens ($${costUsd.toFixed(2)})\n`);

        if (saveReports && Report && mongoose.connection.readyState === 1) {
          const jobId = `validation_${Date.now()}_${key}_${i}`;
          const report = new Report({
            title: profile.topic.length > 100 ? profile.topic.substring(0, 97) + '...' : profile.topic,
            topic: profile.topic,
            userId: 'token-validation-script',
            jobId,
            consensus: result.consensus || '[validation run]',
            confidence: result.confidence ?? 0.8,
            metadata: {
              totalTokens: total,
              estimatedCostUsd: costUsd,
              llmsUsed: result.metadata?.llmsUsed || ['GPT-4o', 'Claude', 'Gemini', 'Command R+'],
              processingTime: 'script',
              priority: 'standard'
            },
            sources: profile.sources || []
          });
          await report.save();
        }
      } catch (err) {
        console.warn(`   Run ${i + 1} failed:`, err.message);
      }
    }
  }

  if (saveReports && mongoose && mongoose.connection.readyState === 1) {
    await mongoose.connection.close();
  }

  return { tokens, byProfile };
}

function printReport(tokens, costPer1M, options = {}) {
  const source = options.source || 'data';
  const s = stats(tokens);

  console.log('\n========== TOKEN CAP VALIDATION REPORT ==========\n');
  console.log(`Source: ${source}`);
  console.log(`Sample size: ${s.count} report(s)`);
  if (s.count === 0) {
    console.log('\nNo token data. Run with --live to generate test reports, or add reports to the DB.');
    return;
  }

  console.log('\n--- Actual token consumption (per report) ---');
  console.log(`  Min:    ${s.min.toLocaleString()} tokens`);
  console.log(`  Mean:   ${s.mean.toLocaleString()} tokens`);
  console.log(`  Median (p50): ${s.p50.toLocaleString()} tokens`);
  console.log(`  p95:    ${s.p95.toLocaleString()} tokens`);
  console.log(`  Max:    ${s.max.toLocaleString()} tokens`);

  const costPer10k = (10000 / 1e6) * costPer1M;
  const reportsAt10kCap = Math.floor(BASIC_CAP_TOKENS / s.mean);
  const costPerBasicUserAtCap = (BASIC_CAP_TOKENS / 1e6) * costPer1M;

  console.log('\n--- Pricing assumptions ---');
  console.log(`  Blended cost: $${costPer1M.toFixed(2)} per 1M tokens`);
  console.log(`  Cost per 10k tokens: $${costPer10k.toFixed(4)}`);

  console.log('\n--- Basic tier (10,000 tokens/month cap) ---');
  console.log(`  ~${reportsAt10kCap} reports/month at mean tokens/report`);
  console.log(`  API cost per Basic user (at full cap): $${costPerBasicUserAtCap.toFixed(2)}`);
  console.log(`  Target: cost < $${MAX_COST_PER_BASIC_USER} (profitability guardrail)`);

  const ok = costPerBasicUserAtCap <= MAX_COST_PER_BASIC_USER;
  const meanCostUsd = (s.mean / 1e6) * costPer1M;
  const threeReportCostUsd = meanCostUsd * 3;
  const withinPayg = meanCostUsd <= PAYG_FLOOR_USD;
  const withinStarter = threeReportCostUsd <= STARTER_3_REPORT_MAX_USD;

  console.log('\n--- Report profitability (per generation) ---');
  console.log(`  Mean cost per report: $${meanCostUsd.toFixed(2)}`);
  console.log(`  $${PAYG_FLOOR_USD} PAYG floor: ${withinPayg ? '✅ Within (mean < $15)' : '⚠️ Mean cost above PAYG floor'}`);
  console.log(`  Starter 3 reports ≤ $${STARTER_3_REPORT_MAX_USD}: $${threeReportCostUsd.toFixed(2)} total — ${withinStarter ? '✅ Within target' : '⚠️ Over $8–10 target'}`);

  console.log('\n--- Recommendation ---');
  if (ok) {
    console.log(`  ✅ At current cap (${BASIC_CAP_TOKENS.toLocaleString()} tokens/month), estimated API cost ($${costPerBasicUserAtCap.toFixed(2)}) is within $${MAX_COST_PER_BASIC_USER} target.`);
    console.log('  Validate with real subscriber mix; consider p95 for worst-case margin.');
  } else {
    console.log(`  ⚠️ At current cap, estimated cost ($${costPerBasicUserAtCap.toFixed(2)}) exceeds $${MAX_COST_PER_BASIC_USER} target.`);
    console.log('  Consider: lower token cap for Basic, or increase revenue (price), or reduce cost (model mix).');
    const suggestedCap = Math.floor((MAX_COST_PER_BASIC_USER / costPer1M) * 1e6);
    console.log(`  To stay under $${MAX_COST_PER_BASIC_USER}: cap Basic at ~${suggestedCap.toLocaleString()} tokens/month (or ~${Math.floor(suggestedCap / s.mean)} reports).`);
  }
  console.log('\n==================================================\n');
}

async function main() {
  const args = process.argv.slice(2);
  const live = args.includes('--live');
  const saveReports = args.includes('--save-reports');
  const dbOnly = args.includes('--db-only') || !live;
  const runsIdx = args.indexOf('--runs');
  const totalRuns = runsIdx >= 0 && args[runsIdx + 1]
    ? Math.max(20, parseInt(args[runsIdx + 1], 10))
    : 24;
  const profileCount = Object.keys(TEST_PROFILES).length;
  const runsPerProfile = Math.max(1, Math.ceil(totalRuns / profileCount));

  const costPer1M = DEFAULT_COST_PER_1M;

  let tokens = [];
  let source = 'DB (existing reports)';

  if (live) {
    console.log('Running live consensus tests (this will call LLM APIs and incur cost)...');
    if (saveReports) console.log('Reports will be saved to DB for admin dashboard.');
    const result = await runLiveTests(runsPerProfile, { saveReports });
    tokens = result.tokens;
    source = `Live tests (${tokens.length} runs)`;
    if (result.byProfile) {
      console.log('\nBy profile:');
      Object.entries(result.byProfile).forEach(([k, arr]) => {
        const st = stats(arr);
        if (st.count) console.log(`  ${TEST_PROFILES[k].label}: mean ${st.mean.toLocaleString()}, min ${st.min.toLocaleString()}, max ${st.max.toLocaleString()}`);
      });
    }
  }

  if (dbOnly || (live && tokens.length === 0)) {
    try {
      const dbTokens = await runFromDb();
      if (dbTokens.length) {
        if (tokens.length) tokens = [...tokens, ...dbTokens];
        else {
          tokens = dbTokens;
          source = 'DB (existing reports)';
        }
      }
    } catch (e) {
      console.error('DB read failed:', e.message);
      if (!tokens.length) process.exit(1);
    }
  }

  printReport(tokens, costPer1M, { source });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
