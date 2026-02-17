# Claude Code Marketing Site

## What This Is

A single-page marketing site that explains Claude Code to product managers and product marketing managers. The goal is to convert skeptical non-engineers into first-time Claude Code users.

## Target Audience

The primary buyer persona is defined in `persona.md`. It's a PMM at a Series B SaaS company who uses ChatGPT daily but assumes coding tools aren't for them.

**Always reference `persona.md` when writing or editing any copy on this site.** Every heading, subhead, and CTA should speak to this person's frustrations, language, and goals.

## Stack

- Plain HTML with inline CSS and vanilla JS
- No frameworks, no build step, no dependencies
- Single `index.html` file serves the entire site
- Deployed to Vercel via GitHub auto-deploy from `main`

## Key Files

- `index.html` — The entire site (copy, styles, calculator logic)
- `persona.md` — Target buyer persona, messaging principles, objection map
- `prd.md` — PRD for the ROI calculator feature

## Copy Guidelines

- Lead with outcomes, not features
- Use the buyer's language: "pipeline," "battlecards," "content velocity," "enablement"
- Acknowledge skepticism directly — never pretend the "I'm not an engineer" objection doesn't exist
- Avoid technical jargon: no "CLI," "terminal," or "deploy" in user-facing copy
- Second person ("you"), casual, direct tone
