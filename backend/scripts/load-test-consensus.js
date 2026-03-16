#!/usr/bin/env node
/**
 * Load test: run concurrent consensus jobs to find bottlenecks.
 * Requires: BASE_URL, AUTH_TOKEN (JWT). Optional: CONCURRENCY (default 5).
 *
 * Usage:
 *   AUTH_TOKEN=eyJ... node scripts/load-test-consensus.js
 *   BASE_URL=https://your-api.up.railway.app AUTH_TOKEN=... CONCURRENCY=10 node scripts/load-test-consensus.js
 */

require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const axios = require('axios');

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const AUTH_TOKEN = process.env.AUTH_TOKEN;
const CONCURRENCY = Math.min(parseInt(process.env.CONCURRENCY, 10) || 5, 20);

const topic = 'What are the main risks and benefits of remote work for knowledge workers?';
const sources = ['Brief context: hybrid and remote work post-2020.'];

if (!AUTH_TOKEN) {
  console.error('Set AUTH_TOKEN (JWT) to run the load test.');
  process.exit(1);
}

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 20000,
  headers: {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${AUTH_TOKEN}`,
  },
});

async function startJob() {
  const start = Date.now();
  const { data } = await api.post('/api/consensus/generate', {
    topic,
    sources,
    options: { includeMetadata: true, generatePdf: false },
  });
  const elapsed = Date.now() - start;
  return { jobId: data.jobId, startTime: Date.now(), firstByteMs: elapsed };
}

async function pollUntilDone(jobId, maxWaitMs = 600000) {
  const start = Date.now();
  while (Date.now() - start < maxWaitMs) {
    try {
      const { data } = await api.get(`/api/consensus/status/${jobId}`);
      if (data.status === 'completed') return { ok: true, result: data.result, duration: Date.now() - start };
      if (data.status === 'failed') return { ok: false, error: data.error, duration: Date.now() - start };
    } catch (e) {
      if (e.response?.status === 404) return { ok: false, error: 'Job not found', duration: Date.now() - start };
    }
    await new Promise((r) => setTimeout(r, 1500));
  }
  return { ok: false, error: 'Timeout', duration: maxWaitMs };
}

async function runOne(index) {
  const runStart = Date.now();
  try {
    const { jobId, firstByteMs } = await startJob();
    const poll = await pollUntilDone(jobId);
    const totalMs = Date.now() - runStart;
    return {
      index,
      jobId,
      firstByteMs,
      totalMs,
      ok: poll.ok,
      error: poll.error,
    };
  } catch (e) {
    return {
      index,
      ok: false,
      error: e.response?.data?.error || e.message,
      totalMs: Date.now() - runStart,
    };
  }
}

async function main() {
  console.log(`\nLoad test: ${CONCURRENCY} concurrent consensus jobs`);
  console.log(`Base URL: ${BASE_URL}\n`);

  const startAll = Date.now();
  const promises = Array.from({ length: CONCURRENCY }, (_, i) => runOne(i + 1));
  const results = await Promise.all(promises);
  const totalElapsed = Date.now() - startAll;

  const ok = results.filter((r) => r.ok);
  const failed = results.filter((r) => !r.ok);
  const firstByteMs = results.map((r) => r.firstByteMs).filter(Boolean);
  const totalMs = results.map((r) => r.totalMs).filter(Boolean);

  console.log('--- Results ---');
  console.log(`Completed: ${ok.length}/${CONCURRENCY} successful`);
  console.log(`Failed: ${failed.length}`);
  if (firstByteMs.length) {
    firstByteMs.sort((a, b) => a - b);
    const sum = firstByteMs.reduce((a, b) => a + b, 0);
    console.log(`First-byte (start job) ms: min=${firstByteMs[0]}, max=${firstByteMs[firstByteMs.length - 1]}, avg=${Math.round(sum / firstByteMs.length)}`);
  }
  if (totalMs.length) {
    totalMs.sort((a, b) => a - b);
    const sum = totalMs.reduce((a, b) => a + b, 0);
    console.log(`Total job ms: min=${totalMs[0]}, max=${totalMs[totalMs.length - 1]}, avg=${Math.round(sum / totalMs.length)}`);
  }
  console.log(`Wall clock: ${(totalElapsed / 1000).toFixed(1)}s`);

  if (failed.length) {
    console.log('\nFailed runs:');
    failed.forEach((r) => console.log(`  #${r.index}: ${r.error}`));
  }
  console.log('');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
