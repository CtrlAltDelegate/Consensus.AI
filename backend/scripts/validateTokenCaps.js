#!/usr/bin/env node
/**
 * Token Cap Validation — run real test generations and/or DB aggregation to validate
 * that token caps (e.g. Basic 10k/month) don't cost more than target (e.g. $8) in API fees.
 * Run before scaling to 200 subscribers to confirm profitability.
 *
 * Usage:
 *   node scripts/validateTokenCaps.js                    # Use existing Report data only (no API calls)
 *   node scripts/validateTokenCaps.js --live               # Run 15 live tests (5 short + 5 medium + 5 long)
 *   node scripts/validateTokenCaps.js --live --runs 30    # Run 30 live tests (10 per profile)
 *   node scripts/validateTokenCaps.js --db-only           # Same as default
 */

require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });

const BASIC_CAP_TOKENS = 10000;   // Basic tier cap (tokens/month)
const MAX_COST_PER_BASIC_USER = 8; // $8 — "Basic user must not cost you $8+ in API fees"
const DEFAULT_COST_PER_1M = Number(process.env.ADMIN_LLM_COST_PER_1M) || 6.5;

// Test profiles: short query, medium (paragraphs), long (document-style)
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

async function runLiveTests(runsPerProfile = 5) {
  const consensusEngine = require('../src/services/consensusEngine');
  const tokens = [];
  const byProfile = { short: [], medium: [], long: [] };

  for (const [key, profile] of Object.entries(TEST_PROFILES)) {
    console.log(`\n📝 Running ${runsPerProfile} × "${profile.label}"...`);
    for (let i = 0; i < runsPerProfile; i++) {
      try {
        const result = await consensusEngine.generateConsensus(profile.topic, profile.sources, {});
        const total = result.totalTokens || 0;
        tokens.push(total);
        byProfile[key].push(total);
        process.stdout.write(`   Run ${i + 1}: ${total.toLocaleString()} tokens\n`);
      } catch (err) {
        console.warn(`   Run ${i + 1} failed:`, err.message);
      }
    }
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
  const dbOnly = args.includes('--db-only') || !live;
  const runsIdx = args.indexOf('--runs');
  const runsPerProfile = runsIdx >= 0 && args[runsIdx + 1]
    ? Math.max(1, parseInt(args[runsIdx + 1], 10) / 3)
    : 5;

  const costPer1M = DEFAULT_COST_PER_1M;

  let tokens = [];
  let source = 'DB (existing reports)';

  if (live) {
    console.log('Running live consensus tests (this will call LLM APIs and incur cost)...');
    const result = await runLiveTests(Math.ceil(runsPerProfile));
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
