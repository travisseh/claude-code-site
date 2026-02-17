---
name: competitor-analysis
description: Run a competitive analysis on any company. Takes a company URL, identifies top 5 competitors, fetches key info from their sites, and outputs a structured brief covering positioning, pricing, strengths, weaknesses, and messaging gaps. Use when the user says "analyze competitors", "competitive analysis", "comp analysis", "who competes with", or provides a URL asking to understand the competitive landscape.
---

This skill performs a structured competitive analysis for a given company. The user provides a company URL (or name). You research the company, identify its top competitors, and produce a comprehensive competitive brief.

## Inputs

The user provides:
- **Company URL** (required): The website of the company to analyze (e.g., `https://gong.io`)
- **Focus area** (optional): A specific angle like "enterprise pricing," "SMB positioning," or "AI features." If not provided, do a general analysis.

## Process

### Step 1: Understand the Target Company

Use WebFetch on the provided URL to extract:
- What the company does (product/service)
- Who they serve (target audience, segments)
- How they position themselves (headline, tagline, value props)
- Pricing model if publicly available (fetch the /pricing page)

If the homepage is insufficient, also fetch:
- `/about` or `/company` for mission/positioning
- `/pricing` for pricing model and tiers
- `/customers` or `/case-studies` for target segment signals

Summarize your understanding of the company before proceeding. This becomes the **baseline** everything else is measured against.

### Step 2: Identify Top 5 Competitors

Use WebSearch to find the top 5 direct competitors. Search queries to try:
- `"[company name]" competitors`
- `"[company name]" vs`
- `"[company name]" alternatives`
- `best [product category] software 2025` (use the current year)

Select 5 competitors based on:
- Direct product overlap (same core problem solved)
- Similar target market (same company size, vertical, or buyer persona)
- Market relevance (well-known or frequently compared)

Avoid listing parent companies, tangential tools, or companies in adjacent but different categories. Prioritize competitors the target company's buyers would actually evaluate.

### Step 3: Research Each Competitor

For each of the 5 competitors, use WebFetch on their homepage and pricing page to extract:
- **Positioning**: Headline, tagline, core value proposition
- **Pricing**: Model (per seat, usage-based, flat rate), tier names, public prices if available
- **Target audience**: Who they sell to (SMB, mid-market, enterprise, specific verticals)
- **Key differentiators**: What they emphasize as unique

If a competitor's site blocks fetching or returns minimal info, use WebSearch to find review sites (G2, Capterra, TrustRadius) or comparison articles that describe them.

### Step 4: Analyze and Compare

With all data collected, analyze across these dimensions:
- **Positioning gaps**: Where does the target company's messaging leave room for competitors? Where do competitors claim territory the target company doesn't address?
- **Pricing dynamics**: Is the target company priced above, below, or in line with competitors? Are there packaging differences that create advantages?
- **Strengths**: What does each competitor do better or emphasize more effectively?
- **Weaknesses**: Where does each competitor fall short or leave openings?
- **Messaging gaps**: What claims could the target company make that no competitor currently owns?

## Output Format

Produce the brief in this exact structure:

```
# Competitive Analysis: [Company Name]
_Generated [date] | Source: [company URL]_

## Company Overview
[2-3 sentences on what the company does, who they serve, and how they position themselves]

**Core positioning:** [Their headline/tagline]
**Target market:** [Primary segments]
**Pricing model:** [Summary of pricing approach]

---

## Competitive Landscape

### 1. [Competitor Name] — [competitor URL]

**Positioning:** [How they describe themselves — use their actual headline or tagline]

**Pricing:** [Model, tiers, and public prices if available. "Not publicly listed" if gated.]

**Strengths relative to [Company Name]:**
- [Strength 1]
- [Strength 2]

**Weaknesses relative to [Company Name]:**
- [Weakness 1]
- [Weakness 2]

**Key takeaway:** [One sentence on the biggest threat or opportunity this competitor represents]

---

[Repeat for competitors 2-5]

---

## Messaging Gaps & Opportunities

**Claims no competitor currently owns:**
- [Gap 1 — what the target company could say that nobody else is saying]
- [Gap 2]
- [Gap 3]

**Positioning risks:**
- [Risk 1 — where the target company is vulnerable based on competitor messaging]
- [Risk 2]

## Summary Matrix

| Dimension | [Company] | [Comp 1] | [Comp 2] | [Comp 3] | [Comp 4] | [Comp 5] |
|-----------|-----------|----------|----------|----------|----------|----------|
| Target market | | | | | | |
| Price point | | | | | | |
| Key differentiator | | | | | | |
| Biggest weakness | | | | | | |
```

## Important Guidelines

- **Be opinionated.** Don't hedge with "it depends." State what the data shows. The user wants sharp analysis, not a balanced report.
- **Use their actual words.** Quote real headlines, taglines, and pricing copy. Don't paraphrase into generic business-speak.
- **Focus on what's actionable.** Every insight should connect to something the user could do: adjust positioning, change pricing, create content, target a segment.
- **Acknowledge gaps.** If pricing is gated or a site blocks fetching, say so explicitly. Don't guess at numbers you couldn't verify.
- **Write for a PMM.** The audience for this brief is a product marketer who will use it to inform battlecards, positioning docs, and sales enablement. Use their language: pipeline, win rate, objection handling, competitive positioning.

## Saving the Output

After generating the brief, save it as a markdown file:
- Filename: `competitive-analysis-[company-name].md` (lowercase, hyphenated)
- Location: Current working directory
- Tell the user where the file was saved so they can reference it later
