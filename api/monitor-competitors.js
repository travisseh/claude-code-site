// Competitor Monitor — Vercel Edge Function
// Runs daily via Vercel Cron. Fetches competitor pages, sends to Claude for
// intelligent analysis, posts a brief to Slack.
//
// Environment variables required:
//   ANTHROPIC_API_KEY        — Claude API key
//   COMPETITOR_SLACK_WEBHOOK — Slack incoming webhook URL
//   CRON_SECRET              — Vercel cron secret for auth

export const config = { runtime: 'edge' };

// ── Competitor Config ───────────────────────────────────────────────────────

const COMPETITORS = [
  {
    name: 'Cursor',
    slug: 'cursor',
    pages: [
      { label: 'Pricing', url: 'https://www.cursor.com/pricing' },
      { label: 'Changelog', url: 'https://www.cursor.com/changelog' },
    ],
  },
  {
    name: 'GitHub Copilot',
    slug: 'github-copilot',
    pages: [
      { label: 'Product Page', url: 'https://github.com/features/copilot' },
      { label: 'Blog', url: 'https://github.blog/tag/github-copilot/' },
    ],
  },
  {
    name: 'Windsurf',
    slug: 'windsurf',
    pages: [
      { label: 'Pricing', url: 'https://windsurf.com/pricing' },
      { label: 'Blog', url: 'https://windsurf.com/blog' },
    ],
  },
  {
    name: 'Cline',
    slug: 'cline',
    pages: [
      { label: 'Homepage', url: 'https://cline.bot' },
      { label: 'GitHub Releases', url: 'https://github.com/cline/cline/releases' },
    ],
  },
  {
    name: 'Replit',
    slug: 'replit',
    pages: [
      { label: 'Pricing', url: 'https://replit.com/pricing' },
      { label: 'Blog', url: 'https://blog.replit.com' },
    ],
  },
];

// Known baseline from our competitive analysis (Feb 2026)
// Claude compares current pages against this to detect changes
const BASELINE = `
KNOWN COMPETITIVE BASELINE (from our analysis, Feb 16 2026):

CURSOR — cursor.com
- Pricing: Hobby Free, Pro $20/mo, Pro+ $60/mo, Ultra $200/mo, Teams $40/user/mo, Enterprise custom
- Positioning: "Built to make you extraordinarily productive, Cursor is the best way to code with AI."
- Key features: VS Code fork IDE, autocomplete, chat, multi-file Composer, agent mode, multi-model (OpenAI, Claude, Gemini, xAI)

GITHUB COPILOT — github.com/features/copilot
- Pricing: Free $0 (2,000 completions, 50 chat/mo), Pro $10/mo, Business custom, Enterprise $39/user/mo
- Positioning: "Command your craft. Your AI accelerator for every workflow."
- Key features: inline completions, chat, Copilot Spaces, PR reviews, agent mode, multi-model

WINDSURF — windsurf.com
- Pricing: Free (25 credits/mo), Pro $15/mo (500 credits), Teams $30/user/mo, Enterprise custom
- Positioning: "Where developers are doing their best work."
- Key features: IDE, Cascade memory, Turbo Mode, drag-and-drop design-to-code. Acquired by OpenAI in 2025

CLINE — cline.bot
- Pricing: Free and open source (BYO API keys)
- Positioning: "The Open Coding Agent. AI Coding, Open Source and Uncompromised."
- Key features: VS Code extension, Plan/Act modes, MCP support, 58k+ GitHub stars, model-agnostic

REPLIT — replit.com
- Pricing: Starter Free, Core ~$20/mo, Pro $100/mo, Enterprise custom
- Positioning: "Build apps with AI. The fastest way to go from idea to live app."
- Key features: Browser-based, Agent 3 (200 min autonomous), built-in hosting, zero-setup
`;

// ── HTML Stripping ──────────────────────────────────────────────────────────

function stripHtml(html) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, '')
    .replace(/<nav[\s\S]*?<\/nav>/gi, '')
    .replace(/<footer[\s\S]*?<\/footer>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

// ── Page Fetching ───────────────────────────────────────────────────────────

async function fetchPage(url, label) {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);

    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
        'Accept': 'text/html,application/xhtml+xml',
      },
      redirect: 'follow',
    });
    clearTimeout(timeout);

    if (!res.ok) return { label, url, error: `HTTP ${res.status}`, text: null };

    const html = await res.text();
    const text = stripHtml(html);
    // Truncate to keep token count reasonable
    return { label, url, error: null, text: text.slice(0, 4000) };
  } catch (err) {
    return { label, url, error: err.name === 'AbortError' ? 'Timeout' : err.message, text: null };
  }
}

async function fetchAllPages() {
  const fetches = [];
  for (const comp of COMPETITORS) {
    for (const page of comp.pages) {
      fetches.push(
        fetchPage(page.url, `${comp.name} — ${page.label}`)
          .then(result => ({ competitor: comp.name, ...result }))
      );
    }
  }
  return Promise.all(fetches);
}

// ── Claude Analysis ─────────────────────────────────────────────────────────

async function analyzeWithClaude(pageResults) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error('ANTHROPIC_API_KEY not set');

  // Build the content section
  let pagesContent = '';
  for (const result of pageResults) {
    if (result.error) {
      pagesContent += `\n[${result.label}] (${result.url})\nERROR: ${result.error}\n`;
    } else {
      pagesContent += `\n[${result.label}] (${result.url})\n${result.text}\n`;
    }
  }

  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });

  const prompt = `You are a competitive intelligence analyst for Claude Code (Anthropic's AI coding tool). Your audience is a product marketer at a Series B SaaS company.

${BASELINE}

Below are the CURRENT pages from each competitor, fetched today (${today}). Compare each competitor's current pages against the baseline above and identify:

1. **Pricing changes** — any new tiers, price increases/decreases, packaging changes, new free tier offerings
2. **New features/products** — anything launched, announced, or in beta
3. **Positioning shifts** — new taglines, messaging changes, new target audiences
4. **Notable announcements** — acquisitions, partnerships, funding, major blog posts

Be specific. Quote exact prices and feature names. If a page returned an error, note it. If nothing meaningful changed from our baseline, say "No changes detected" for that competitor.

Respond with valid JSON only (no markdown code fences), in this exact format:
{
  "summary": "One-sentence summary of the most important finding today",
  "has_changes": true/false,
  "competitors": [
    {
      "name": "Competitor Name",
      "status": "changes_detected" or "no_changes" or "fetch_error",
      "findings": [
        {
          "category": "pricing" or "feature" or "positioning" or "announcement",
          "title": "Short title",
          "detail": "What specifically changed and why it matters for Claude Code",
          "severity": "high" or "medium" or "low"
        }
      ]
    }
  ]
}

If no meaningful changes are detected across all competitors, set has_changes to false and leave findings arrays empty. Don't report minor wording tweaks or boilerplate content changes — only flag things a PMM would actually care about.

CURRENT COMPETITOR PAGES:
${pagesContent}`;

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 2000,
      messages: [{ role: 'user', content: prompt }],
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Claude API error (${res.status}): ${errText}`);
  }

  const data = await res.json();
  const text = data.content?.[0]?.text;
  if (!text) throw new Error('Empty response from Claude');

  // Parse JSON (handle potential markdown fences)
  const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
  return JSON.parse(cleaned);
}

// ── Slack Formatting ────────────────────────────────────────────────────────

function buildSlackBlocks(analysis, date) {
  const severityIcon = { high: '🔴', medium: '🟡', low: '🔵' };

  const blocks = [
    {
      type: 'header',
      text: { type: 'plain_text', text: `Competitor Brief — ${date}` },
    },
    {
      type: 'context',
      elements: [{
        type: 'mrkdwn',
        text: analysis.has_changes
          ? `*${analysis.summary}*`
          : '✅ No meaningful changes detected across competitors today.',
      }],
    },
    { type: 'divider' },
  ];

  for (const comp of analysis.competitors) {
    const icon = comp.status === 'changes_detected' ? '🔴'
      : comp.status === 'fetch_error' ? '⚠️' : '⚪';

    let text = '';

    if (comp.findings && comp.findings.length > 0) {
      for (const f of comp.findings) {
        const sev = severityIcon[f.severity] || '🔵';
        text += `${sev} *${f.title}* _[${f.category}]_\n${f.detail}\n\n`;
      }
    } else if (comp.status === 'fetch_error') {
      text = '_Some pages could not be fetched_';
    } else {
      text = '_No changes from baseline_';
    }

    blocks.push({
      type: 'section',
      text: { type: 'mrkdwn', text: `*${icon} ${comp.name}*\n\n${text.trim()}` },
    });
  }

  blocks.push(
    { type: 'divider' },
    {
      type: 'context',
      elements: [{
        type: 'mrkdwn',
        text: `_Automated scan • Claude Haiku analysis • <https://github.com/travisseh/claude-code-site|Source>_`,
      }],
    },
  );

  return blocks;
}

async function sendToSlack(blocks) {
  const webhookUrl = process.env.COMPETITOR_SLACK_WEBHOOK;
  if (!webhookUrl) throw new Error('COMPETITOR_SLACK_WEBHOOK not set');

  const res = await fetch(webhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ blocks }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Slack error (${res.status}): ${errText}`);
  }
}

// ── Handler ─────────────────────────────────────────────────────────────────

export default async function handler(req) {
  // Verify cron secret (skip in development)
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret) {
    const authHeader = req.headers.get('authorization');
    if (authHeader !== `Bearer ${cronSecret}`) {
      return new Response('Unauthorized', { status: 401 });
    }
  }

  try {
    // 1. Fetch all competitor pages in parallel
    const pageResults = await fetchAllPages();

    const successCount = pageResults.filter(p => !p.error).length;
    const errorCount = pageResults.filter(p => p.error).length;

    if (successCount === 0) {
      return new Response(JSON.stringify({
        ok: false,
        error: 'All page fetches failed',
        errors: pageResults.map(p => `${p.label}: ${p.error}`),
      }), { status: 502, headers: { 'Content-Type': 'application/json' } });
    }

    // 2. Send to Claude for analysis
    const analysis = await analyzeWithClaude(pageResults);

    // 3. Format and send to Slack
    const date = new Date().toLocaleDateString('en-US', {
      weekday: 'short', month: 'short', day: 'numeric', year: 'numeric',
    });

    const blocks = buildSlackBlocks(analysis, date);
    await sendToSlack(blocks);

    return new Response(JSON.stringify({
      ok: true,
      has_changes: analysis.has_changes,
      summary: analysis.summary,
      pages_fetched: successCount,
      pages_errored: errorCount,
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(JSON.stringify({
      ok: false,
      error: err.message,
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
