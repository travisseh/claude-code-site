# PRD: Claude Code Time Savings Calculator

## Overview

An interactive calculator embedded on the Claude Code site that lets PMs and PMMs estimate how many hours per week they'd save by using Claude Code. The output frames savings in terms they care about: more content shipped, more competitive intel delivered, more pipeline influenced &mdash; not "lines of code written."

## Problem

Our target buyer (Series B PMM, 3-5 years experience) doesn't believe a "coding tool" is relevant to them. Abstract claims like "10x productivity" don't land. They need a personalized, concrete answer to: **"What would this actually change about my week?"**

They're spending 30%+ of their time on manual work that Claude Code eliminates: updating competitor spreadsheets, waiting on eng for simple tools, wrangling data for QBRs, and producing landing page variants. But they don't connect those tasks to what a tool like Claude Code solves.

## Goal

Convert skeptical PMMs from "this isn't for me" to "I should try this" by showing them a dollar-and-hours estimate grounded in their actual workflow.

## Success Metrics

- Calculator completion rate > 60% of visitors who start it
- CTA click-through from results screen > 15%
- Avg time on page increases by 30s+ vs. pages without calculator

## User Flow

1. User lands on calculator (embedded section on site or standalone page)
2. Sees 5 slider inputs pre-filled with reasonable defaults
3. Adjusts sliders to match their week
4. Results update in real-time (no submit button)
5. Results show time saved, dollar value, and a qualitative "what you'd get back"
6. CTA button below results: "Try Claude Code"

## Inputs

Five sliders. Each represents hours per week spent on a specific task. Default values reflect the persona's typical week.

**1. Competitor research & tracking**
- Label: "Hours spent tracking competitors (pricing pages, G2, changelogs)"
- Range: 0-10 hrs/week
- Default: 4
- Savings multiplier: 75% (Claude Code automates scraping and comparison)

**2. Content & collateral creation**
- Label: "Hours spent creating battlecards, one-pagers, and sales enablement"
- Range: 0-15 hrs/week
- Default: 6
- Savings multiplier: 50% (Claude Code accelerates creation, human still refines messaging)

**3. Data analysis & reporting**
- Label: "Hours spent pulling data, building reports, or waiting on analysts"
- Range: 0-10 hrs/week
- Default: 3
- Savings multiplier: 70% (Claude Code handles CSV parsing, SQL queries, formatting)

**4. Internal tool requests**
- Label: "Hours spent filing tickets or waiting on eng for simple tools (calculators, landing pages, dashboards)"
- Range: 0-8 hrs/week
- Default: 3
- Savings multiplier: 85% (Claude Code builds these directly)

**5. Landing pages & campaign assets**
- Label: "Hours spent creating or coordinating landing page builds"
- Range: 0-10 hrs/week
- Default: 4
- Savings multiplier: 80% (Claude Code generates production-ready pages)

## Output / Results

Results update live as sliders move. Three tiers of output:

### Primary: Hours saved per week
- Formula: Sum of (each input * its savings multiplier)
- Display: Large number, e.g. "~14.5 hours/week"
- Subtext: "That's almost 2 full days back."

### Secondary: Annual dollar value
- Formula: Hours saved/week * 50 weeks * hourly rate
- Hourly rate: Fixed at $75/hr (reasonable Series B PMM fully-loaded estimate). Not user-adjustable &mdash; keeps it simple and avoids the "but I make more/less" distraction
- Display: e.g. "$54,375/year in recovered productivity"

### Tertiary: Qualitative impact (what you'd do with the time)
Dynamic text block that changes based on which categories have the highest savings. Examples:

- If competitor research is highest: "You'd have an always-current competitive intel hub instead of a stale spreadsheet. Sales stops asking you 'is this still accurate?'"
- If content creation is highest: "You'd ship 2-3x more enablement assets per quarter. The content calendar stops being aspirational."
- If internal tools is highest: "You'd stop being blocked by eng backlogs. Need an ROI calculator on the website? Build it before lunch."
- If data analysis is highest: "You'd walk into every QBR with fresh data you pulled yourself instead of week-old analyst reports."
- If landing pages is highest: "You'd launch campaign variants in hours instead of sprints. Test 4 messages where you used to test 1."

## Design Specs

- Lives as a section on the main site (between "What PMMs Are Building" and CTA) or as a standalone /calculator page. Decide based on page length after implementation.
- Sliders use the existing amber/navy color palette
- Results area has a subtle background change (light amber) to draw the eye
- Mobile: sliders stack vertically, results stick to bottom of viewport as user scrolls inputs
- No animations beyond smooth slider movement and number transitions
- Total implementation: single HTML section with inline CSS and vanilla JS. No frameworks.

## Copy & Tone

- Casual, direct, second-person ("You spend..." not "Users spend...")
- Slider labels describe the pain, not the task ("Hours spent tracking competitors" not "Competitive analysis hours")
- Results are confident but not hyperbolic. Use "~" before numbers to signal estimates
- Avoid technical jargon. Never say "CLI," "terminal," or "deploy" in the calculator itself

## Edge Cases

- All sliders at 0: Show "Looks like you've already optimized your week. But if you're curious..." with CTA
- Very high total (20+ hrs): Cap qualitative messaging. Don't claim Claude Code saves their entire job. Say something like "That's significant. Even if Claude Code handles half of this, you'd reclaim [X] hours."
- Single category dominates: Lean into that category's qualitative message, don't try to address all five

## Out of Scope (v1)

- Custom hourly rate input
- Team-size multiplier (e.g. "For a team of 4 PMMs...")
- Email capture / gated results
- Comparison to specific competing tools
- Backend/analytics integration (add in v2 after validating engagement)

## Open Questions

- Should results include a "share your results" link that generates a URL with pre-filled slider values? Could be good for viral loops among PMM teams
- Should we A/B test placing the calculator above vs. below the use cases section?
- Is $75/hr the right assumed rate? Could survey 10 PMMs to validate

## Implementation Notes

- Vanilla JS for slider logic and real-time calculation
- All inline (consistent with current site architecture)
- Slider values stored in simple JS object, results computed on input event
- Qualitative text swaps via finding the category with the max savings contribution
- Should be < 200 lines of JS
