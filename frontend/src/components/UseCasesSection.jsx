import React from 'react';

export default function UseCasesSection() {
  return (
    <section className="mb-20">
      <div className="text-center mb-12">
        <h2 className="text-4xl font-bold text-slate-900 mb-4">Concrete use cases</h2>
        <p className="text-xl text-slate-600 max-w-2xl mx-auto">
          See what multi-model consensus delivers for competitive analysis, legal research, and strategy.
        </p>
      </div>
      <div className="space-y-10">
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center gap-3">
            <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <div>
              <h3 className="font-semibold text-slate-900">Competitive analysis</h3>
              <p className="text-sm text-slate-600">Compare positioning, pricing, and go-to-market of key competitors with one report.</p>
            </div>
          </div>
          <div className="px-6 py-4">
            <p className="text-sm font-medium text-slate-500 mb-2">Example prompt</p>
            <p className="text-slate-700 mb-4 italic">Compare the go-to-market strategies and positioning of Notion, Coda, and Airtable for team productivity. Include strengths, gaps, and where each is likely to invest next.</p>
            <p className="text-sm font-medium text-slate-500 mb-2">Sample output preview</p>
            <div className="bg-slate-50 rounded-lg p-4 text-sm text-slate-700 border border-slate-200 font-serif">
              All three models agree that Notion leads on flexibility and community; Coda on spreadsheets and automation; Airtable on non-technical users. Consensus: the main gap for all is deep enterprise governance. Likely next moves include more templates (Notion), API monetization (Coda), and vertical solutions (Airtable).
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
              </svg>
            </div>
            <div>
              <h3 className="font-semibold text-slate-900">Legal research</h3>
              <p className="text-sm text-slate-600">Synthesize liability, jurisdiction, and precedent across sources for memos and case prep.</p>
            </div>
          </div>
          <div className="px-6 py-4">
            <p className="text-sm font-medium text-slate-500 mb-2">Example prompt</p>
            <p className="text-slate-700 mb-4 italic">Summarize liability exposure for a SaaS vendor under GDPR and CCPA if user data is processed in the EU and California. Include consensus on high-risk areas and mitigation steps.</p>
            <p className="text-sm font-medium text-slate-500 mb-2">Sample output preview</p>
            <div className="bg-slate-50 rounded-lg p-4 text-sm text-slate-700 border border-slate-200 font-serif">
              Consensus: both regimes create material exposure for dual-jurisdiction processing. Highest agreement on consent and data minimization; more divergence on legitimate interest and cross-border transfers. Recommended mitigations: documented LIA, DPA templates, and clear retention schedules.
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
              </svg>
            </div>
            <div>
              <h3 className="font-semibold text-slate-900">Strategic planning</h3>
              <p className="text-sm text-slate-600">Weigh options, risks, and timing for entry into new markets or major initiatives.</p>
            </div>
          </div>
          <div className="px-6 py-4">
            <p className="text-sm font-medium text-slate-500 mb-2">Example prompt</p>
            <p className="text-slate-700 mb-4 italic">What are the pros, cons, and key risks of entering the European market in the next 18 months for a US-based B2B software company? Include consensus on sequencing (e.g. UK first vs. DACH) and resource requirements.</p>
            <p className="text-sm font-medium text-slate-500 mb-2">Sample output preview</p>
            <div className="bg-slate-50 rounded-lg p-4 text-sm text-slate-700 border border-slate-200 font-serif">
              Strong agreement on upside: talent, TAM, and regulatory clarity in key markets. Risks: compliance cost and local competition. Consensus favors a beachhead in one region (UK or DACH) before scaling; divergence on whether to partner or build in-country sales first.
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
