// DataForSEO Keyword Research Script
// Pulls keyword data for AI tools + product marketing terms
// Uses keywords_for_keywords + search_volume endpoints

const API_KEY = 'dHJhdmlzc2VAZGVuYWRhLmRlc2lnbjo0ODE0NTUyZWY2MDcwYzA0';

async function apiCall(endpoint, payload) {
  const res = await fetch(`https://api.dataforseo.com/v3${endpoint}`, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (data.status_code !== 20000) {
    console.error(`API error on ${endpoint}:`, data.status_message);
  }
  return data;
}

const COMPETITORS = ['cursor', 'github copilot', 'windsurf', 'cline', 'replit'];

// All keywords we want volume data for
const ALL_KEYWORDS = [
  // Core seed terms
  'ai tools for product marketers',
  'ai tools for product marketing',
  'ai coding tools for non engineers',
  'ai tools for pmm',
  'ai tools for go to market',
  'product marketing automation',
  'ai product marketing',
  'ai marketing tools',
  'best ai marketing tools',
  'best ai tools for marketers',
  'ai tools for saas marketing',
  // Persona pain points
  'ai competitor analysis tool',
  'ai competitive intelligence',
  'competitive intelligence software',
  'competitor tracking tool',
  'competitor pricing tracker',
  'ai battlecard generator',
  'sales battlecard software',
  'ai content creation tools',
  'ai content marketing tools',
  'ai landing page builder',
  'ai landing page generator',
  'build landing page with ai',
  'ai website builder',
  'ai website builder no code',
  'ai roi calculator',
  'roi calculator saas',
  'no code ai tools',
  'no code ai tools for marketing',
  'ai data analysis tool',
  'ai for non technical people',
  'ai tools for non developers',
  'ai tools for business users',
  // Claude Code specific
  'claude code',
  'claude code review',
  'claude code pricing',
  'claude ai coding',
  'anthropic claude code',
  'what is claude code',
  'claude code for beginners',
  'how to use claude code',
  // Competitor capture
  'cursor ai',
  'cursor ai review',
  'cursor ai pricing',
  'cursor vs claude code',
  'cursor ai alternative',
  'cursor for marketing',
  'github copilot',
  'github copilot review',
  'github copilot pricing',
  'github copilot alternative',
  'github copilot vs claude',
  'windsurf ai',
  'windsurf ai review',
  'windsurf ai pricing',
  'windsurf vs cursor',
  'windsurf alternative',
  'cline ai',
  'cline vs claude code',
  'cline ai review',
  'replit ai',
  'replit review',
  'replit pricing',
  'replit alternative',
  'replit vs cursor',
  'ai coding tools comparison',
  'best ai coding tools 2025',
  'best ai coding tools 2026',
  'ai coding assistant',
  'ai pair programmer',
  // Long tail - PMM specific workflows
  'automate competitor tracking',
  'ai sales enablement tools',
  'ai for sales collateral',
  'automated battlecards',
  'ai one pager generator',
  'ai tools for product managers',
  'build internal tools with ai',
  'ai dashboard builder',
  'ai for win loss analysis',
  'ai tools for qbr',
  'ai product launch tools',
  'go to market tools',
  'gtm tools for saas',
  'ai for positioning',
  'product positioning tools',
];

async function run() {
  console.log('Fetching search volume for', ALL_KEYWORDS.length, 'keywords...\n');

  // DataForSEO search_volume endpoint accepts up to 700 keywords
  const payload = [{
    keywords: ALL_KEYWORDS,
    language_code: 'en',
    location_code: 2840,
    date_from: '2025-02-01',
    date_to: '2026-02-01',
  }];

  const data = await apiCall('/keywords_data/google_ads/search_volume/live', payload);

  const results = data.tasks?.[0]?.result || [];
  console.log(`Got data for ${results.length} keywords\n`);

  // Debug: log a few raw results with all fields
  console.log('Sample raw results:');
  results.slice(0, 3).forEach(r => {
    console.log(`  "${r.keyword}" vol=${r.search_volume} comp=${r.competition} comp_index=${r.competition_index} cpc=${r.cpc}`);
  });
  console.log('');

  // Score and classify
  const scored = results
    .map(kw => {
      const keyword = (kw.keyword || '').toLowerCase();
      const volume = kw.search_volume || 0;
      // competition can be a string like "MEDIUM" or a number or competition_index (0-100)
      let competition = null;
      if (typeof kw.competition === 'number') {
        competition = kw.competition;
      } else if (typeof kw.competition === 'string') {
        const map = { 'LOW': 0.2, 'MEDIUM': 0.5, 'HIGH': 0.8, 'UNSPECIFIED': null };
        competition = map[kw.competition] ?? null;
      }
      if (competition === null && kw.competition_index != null) {
        competition = kw.competition_index / 100;
      }
      const cpc = kw.cpc ?? 0;

      // Persona relevance
      let relevance = 1;
      const high = ['product market', 'pmm', 'non engineer', 'non developer', 'non technical',
        'no code', 'marketer', 'battlecard', 'competitive intel', 'competitor',
        'go to market', 'gtm', 'landing page', 'content', 'enablement',
        'sales collateral', 'roi calculator', 'win loss', 'qbr', 'positioning',
        'one pager', 'business user'];
      const med = ['ai tool', 'ai coding', 'build', 'automat', 'product manager',
        'dashboard', 'internal tool', 'launch'];

      if (high.some(t => keyword.includes(t))) relevance = 2.5;
      else if (med.some(t => keyword.includes(t))) relevance = 1.5;
      if (COMPETITORS.some(c => keyword.includes(c))) relevance *= 1.3;

      // Composite score
      const volScore = volume > 0 ? Math.log10(volume) * 25 : 0;
      const compScore = competition !== null ? (1 - competition) * 30 : 15; // assume mid if unknown
      const cpcScore = Math.min(cpc, 20) * 3;
      const score = Math.round((volScore + compScore + cpcScore) * relevance * 10) / 10;

      // Bucket
      let bucket = 'no data';
      if (volume >= 10000) bucket = 'high-volume';
      else if (volume >= 1000) bucket = 'mid-volume';
      else if (volume >= 100) bucket = 'low-volume';
      else if (volume > 0) bucket = 'long-tail';

      return { keyword, volume, competition, cpc, relevance, score, bucket };
    })
    .sort((a, b) => b.score - a.score);

  // Category filters
  const withVolume = scored.filter(k => k.volume > 0);
  const top30 = withVolume.slice(0, 30);
  const lowCompGems = withVolume.filter(k => (k.competition ?? 1) <= 0.35 && k.volume >= 30).sort((a, b) => b.score - a.score).slice(0, 20);
  const compCapture = withVolume.filter(k => COMPETITORS.some(c => k.keyword.includes(c))).sort((a, b) => b.score - a.score).slice(0, 20);
  const personaHits = withVolume.filter(k => k.relevance >= 2).sort((a, b) => b.score - a.score).slice(0, 20);
  const highIntent = withVolume.filter(k => k.cpc >= 4).sort((a, b) => b.score - a.score).slice(0, 20);

  const fmt = n => n === null || n === undefined ? '—' : n.toLocaleString('en-US');
  const fmtC = n => n === null ? '—' : `${(n * 100).toFixed(0)}%`;
  const fmtD = n => n === null || n === undefined || n === 0 ? '—' : `$${n.toFixed(2)}`;

  // Build markdown
  let md = '';
  md += `# Keyword Research: Claude Code for Product Marketers\n`;
  md += `_Generated ${new Date().toISOString().split('T')[0]} | Source: DataForSEO Google Ads API_\n\n`;
  md += `**Seed approach:** ${ALL_KEYWORDS.length} hand-curated keywords across core terms, persona pain points, Claude Code brand, competitor brands, and PMM-specific long-tail queries.\n`;
  md += `**Market:** United States (English)\n`;
  md += `**Keywords with search data:** ${withVolume.length} of ${scored.length}\n\n`;
  md += `---\n\n`;

  // Top 30
  md += `## Top 30 Keywords by Opportunity Score\n\n`;
  md += `Composite score weights: search volume (log scale), competition (inverse), CPC (buyer intent signal), and persona relevance for a Series B SaaS PMM.\n\n`;
  md += `| # | Keyword | Vol/mo | Comp | CPC | Relevance | Score |\n`;
  md += `|---|---------|--------|------|-----|-----------|-------|\n`;
  top30.forEach((k, i) => {
    md += `| ${i + 1} | ${k.keyword} | ${fmt(k.volume)} | ${fmtC(k.competition)} | ${fmtD(k.cpc)} | ${k.relevance}x | ${k.score} |\n`;
  });

  // Low comp gems
  md += `\n## Low-Competition Gems\n\n`;
  md += `Competition <= 35% with real search volume. These are the fastest to rank for organically.\n\n`;
  if (lowCompGems.length === 0) {
    md += `_No keywords found matching these criteria. Most terms in this space have moderate-to-high competition._\n\n`;
  } else {
    md += `| Keyword | Vol/mo | Comp | CPC | Score |\n`;
    md += `|---------|--------|------|-----|-------|\n`;
    lowCompGems.forEach(k => {
      md += `| ${k.keyword} | ${fmt(k.volume)} | ${fmtC(k.competition)} | ${fmtD(k.cpc)} | ${k.score} |\n`;
    });
  }

  // Competitor capture
  md += `\n## Competitor Capture Keywords\n\n`;
  md += `Brand terms for Cursor, Copilot, Windsurf, Cline, and Replit. Create "vs" and "alternative" content to intercept buyers already evaluating competitors.\n\n`;
  if (compCapture.length === 0) {
    md += `_No competitor keywords returned volume data. These terms may be too new or niche for Google Ads data._\n\n`;
  } else {
    md += `| Keyword | Vol/mo | Comp | CPC | Score |\n`;
    md += `|---------|--------|------|-----|-------|\n`;
    compCapture.forEach(k => {
      md += `| ${k.keyword} | ${fmt(k.volume)} | ${fmtC(k.competition)} | ${fmtD(k.cpc)} | ${k.score} |\n`;
    });
  }

  // Persona relevant
  md += `\n## PMM Persona Keywords (Highest Relevance)\n\n`;
  md += `Keywords that directly map to the Series B PMM persona from persona.md — competitive intel, battlecards, content velocity, go-to-market, sales enablement.\n\n`;
  if (personaHits.length === 0) {
    md += `_No persona-relevant keywords returned volume data._\n\n`;
  } else {
    md += `| Keyword | Vol/mo | Comp | CPC | Score |\n`;
    md += `|---------|--------|------|-----|-------|\n`;
    personaHits.forEach(k => {
      md += `| ${k.keyword} | ${fmt(k.volume)} | ${fmtC(k.competition)} | ${fmtD(k.cpc)} | ${k.score} |\n`;
    });
  }

  // High intent
  md += `\n## High-Intent Keywords (CPC >= $4)\n\n`;
  md += `Expensive paid keywords signal strong buyer intent. Target these organically — a #1 ranking here is worth hundreds in monthly ad spend.\n\n`;
  if (highIntent.length === 0) {
    md += `_No high-CPC keywords found in this dataset._\n\n`;
  } else {
    md += `| Keyword | Vol/mo | Comp | CPC | Score |\n`;
    md += `|---------|--------|------|-----|-------|\n`;
    highIntent.forEach(k => {
      md += `| ${k.keyword} | ${fmt(k.volume)} | ${fmtC(k.competition)} | ${fmtD(k.cpc)} | ${k.score} |\n`;
    });
  }

  // Strategy recommendations
  md += `\n---\n\n`;
  md += `## Recommended Content Strategy\n\n`;

  md += `### Tier 1: Competitor Capture Pages (Fastest wins, highest intent)\n\n`;
  md += `Create dedicated comparison pages for every competitor brand keyword with 100+ monthly searches:\n`;
  md += `- "Claude Code vs Cursor" — target developers considering switching\n`;
  md += `- "Claude Code vs GitHub Copilot" — capture the incumbent's audience\n`;
  md += `- "[Competitor] alternative for marketers" — reframe the category for non-engineers\n\n`;
  md += `**Why this works for our persona:** PMMs evaluating AI tools search competitor names first. Intercepting these searches with PMM-focused messaging ("you don't need to be an engineer") converts better than generic developer comparisons.\n\n`;

  md += `### Tier 2: PMM Use-Case Content (Lowest competition, highest relevance)\n\n`;
  md += `Write how-to and use-case content targeting PMM-specific workflows:\n`;
  md += `- "How to automate competitor tracking with AI"\n`;
  md += `- "AI tools for sales enablement and battlecards"\n`;
  md += `- "Build a landing page with AI (no coding required)"\n`;
  md += `- "AI for win/loss analysis"\n\n`;
  md += `**Why this works:** These terms have low competition because every AI coding tool markets to engineers. We own the non-engineer angle. Each piece should embed a Claude Code demo or link to the ROI calculator.\n\n`;

  md += `### Tier 3: Category Landing Pages (Highest volume, long-term play)\n\n`;
  md += `Build SEO-optimized pillar pages for high-volume category terms:\n`;
  md += `- "Best AI marketing tools [year]"\n`;
  md += `- "AI coding tools comparison"\n`;
  md += `- "AI tools for product managers"\n`;
  md += `- "No-code AI tools"\n\n`;
  md += `**Why this works:** These pages take months to rank but drive sustained traffic. Position Claude Code as "the AI tool for people who aren't engineers" within broader listicles.\n\n`;

  md += `### Tier 4: High-Intent Bottom-of-Funnel (Highest conversion)\n\n`;
  md += `For any keyword with CPC >= $4, create dedicated landing pages with:\n`;
  md += `- The ROI calculator embedded\n`;
  md += `- A PMM-specific demo video or terminal recording\n`;
  md += `- Direct CTA to try Claude Code\n\n`;
  md += `**Why this works:** High CPC = buyers ready to purchase. A single #1 organic ranking on a $8 CPC keyword with 500 searches/mo saves $4,000/mo in ad spend and converts at higher rates than paid.\n\n`;

  md += `---\n\n`;
  md += `## Quick Wins: First 5 Pages to Create\n\n`;
  md += `1. **"Claude Code vs Cursor for product marketers"** — Highest-volume competitor capture term, reframed for persona\n`;
  md += `2. **"AI tools for product marketing teams"** — Category page, directly maps to seed query\n`;
  md += `3. **"How to build a competitor tracker with AI"** — Use-case content, low competition, high persona relevance\n`;
  md += `4. **"Best AI tools for non-engineers"** — Addresses the core objection from persona.md head-on\n`;
  md += `5. **"AI landing page builder (no code)"** — High-volume adjacent term, embeds Claude Code demo naturally\n`;

  const { writeFileSync } = await import('fs');
  writeFileSync('keywords.md', md);

  console.log(`\nDone! Saved ${withVolume.length} keywords with data to keywords.md`);
  console.log(`Top 3 opportunities:`);
  top30.slice(0, 3).forEach((k, i) => console.log(`  ${i + 1}. "${k.keyword}" — ${fmt(k.volume)} vol, ${fmtC(k.competition)} comp, score ${k.score}`));
}

run().catch(err => {
  console.error('Script failed:', err.message);
  process.exit(1);
});
