#!/usr/bin/env node
/**
 * E2E smoke test: health → (register or login) → one consensus job → poll → optional PDF download.
 * Set BASE_URL, and either TEST_EMAIL + TEST_PASSWORD (login) or leave unset (register with random user).
 *
 * Usage:
 *   BASE_URL=http://localhost:3000 node scripts/smoke-test-e2e.js
 *   BASE_URL=https://your-api.up.railway.app TEST_EMAIL=you@example.com TEST_PASSWORD=secret node scripts/smoke-test-e2e.js
 */

require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const axios = require('axios');

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const TEST_EMAIL = process.env.TEST_EMAIL;
const TEST_PASSWORD = process.env.TEST_PASSWORD;

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 60000,
  headers: { 'Content-Type': 'application/json' },
});

let authToken;

async function step(name, fn) {
  process.stdout.write(`  ${name}... `);
  try {
    const result = await fn();
    console.log('OK');
    return result;
  } catch (e) {
    console.log('FAIL');
    throw e.response?.data || e;
  }
}

async function main() {
  console.log('\nE2E smoke test');
  console.log(`Base URL: ${BASE_URL}\n`);

  await step('Health check', async () => {
    const { data } = await api.get('/health');
    if (data.status !== 'ok' && data.status !== 'degraded') throw new Error(data.status);
    return data;
  });

  if (TEST_EMAIL && TEST_PASSWORD) {
    await step('Login', async () => {
      const { data } = await api.post('/api/auth/login', {
        email: TEST_EMAIL,
        password: TEST_PASSWORD,
      });
      if (!data.token) throw new Error('No token');
      authToken = data.token;
      return data;
    });
  } else {
    await step('Register (random user)', async () => {
      const email = `smoke-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@example.com`;
      const password = 'SmokeTest1!';
      const { data } = await api.post('/api/auth/register', {
        email,
        password,
        profile: { firstName: 'Smoke', lastName: 'Test' },
      });
      if (!data.token) throw new Error('No token');
      authToken = data.token;
      return data;
    });
  }

  api.defaults.headers.Authorization = `Bearer ${authToken}`;

  const topic = 'What are two benefits of automated testing?';
  let jobId;

  await step('Start consensus job', async () => {
    const { data } = await api.post('/api/consensus/generate', {
      topic,
      sources: ['Brief context: software quality.'],
      options: { includeMetadata: true, generatePdf: true },
    });
    if (!data.jobId) throw new Error('No jobId');
    jobId = data.jobId;
    return data;
  });

  await step('Poll until completed', async () => {
    const maxWait = 600000; // 10 min
    const start = Date.now();
    while (Date.now() - start < maxWait) {
      const { data } = await api.get(`/api/consensus/status/${jobId}`);
      if (data.status === 'completed') return data;
      if (data.status === 'failed') throw new Error(data.error || 'Job failed');
      await new Promise((r) => setTimeout(r, 2000));
    }
    throw new Error('Timeout');
  });

  await step('Check result has consensus text', async () => {
    const { data } = await api.get(`/api/consensus/status/${jobId}`);
    if (!data.result?.consensus || typeof data.result.consensus !== 'string') {
      throw new Error('Missing consensus in result');
    }
    return data.result;
  });

  try {
    await step('Download PDF (if available)', async () => {
      const { data } = await api.get(`/api/consensus/status/${jobId}`);
      if (!data.result?.pdfAvailable) {
        console.log('  Download PDF... skipped (no PDF)');
        return;
      }
      const res = await api.get(`/api/consensus/report/${jobId}/pdf`, { responseType: 'arraybuffer' });
      if (res.data.byteLength < 100) throw new Error('PDF too small');
      return res.data;
    });
  } catch (e) {
    if (e?.error === 'PDF not found' || e?.message?.includes('PDF')) {
      console.log('  Download PDF... skipped (not found)');
    } else {
      throw e;
    }
  }

  console.log('\nSmoke test passed.\n');
}

main().catch((e) => {
  console.error('\nSmoke test failed:', e?.message || e);
  process.exit(1);
});
