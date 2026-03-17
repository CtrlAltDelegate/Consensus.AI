/**
 * Shared LLM cost and profitability targets for margin monitoring.
 * Used when saving reports (cost per report) and in admin dashboard validation.
 *
 * Report profitability validation: run 20–30 real consensus generations
 * (e.g. node backend/scripts/validateTokenCaps.js --live --runs 30) across
 * short queries, long documents, and multi-file uploads, then check Admin →
 * Cost & Usage for "Report profitability (cost per report)" and targets.
 */
const ESTIMATED_COST_PER_1M_TOKENS = Number(process.env.ADMIN_LLM_COST_PER_1M) || 6.5;

/** PAYG floor: minimum charge per report (USD). Cost per report must stay below this for margin. */
const PAYG_FLOOR_USD = 15;

/** Starter tier: 3 reports included at $29. Total API cost for 3 reports should not exceed this (USD). */
const STARTER_3_REPORT_MAX_COST_USD = 10;

function estimatedCostUsdFromTokens(tokens) {
  if (tokens == null || tokens <= 0) return 0;
  return Math.round((tokens / 1e6) * ESTIMATED_COST_PER_1M_TOKENS * 100) / 100;
}

module.exports = {
  ESTIMATED_COST_PER_1M_TOKENS,
  PAYG_FLOOR_USD,
  STARTER_3_REPORT_MAX_COST_USD,
  estimatedCostUsdFromTokens
};
