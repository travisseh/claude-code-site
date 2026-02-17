#!/usr/bin/env node

// Gemini Image Generator
// Generates blog images, product screenshots, and marketing visuals
// Uses Gemini 2.0 Flash with native image generation
//
// Usage:
//   node generate-image.mjs "a hero banner showing a PMM building a dashboard"
//   node generate-image.mjs "redesign this hero section" --ref screenshot.png
//   node generate-image.mjs "abstract pattern" --style neutral --output bg.png
//   node generate-image.mjs "product comparison table" --size landscape

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { basename, extname, join, resolve } from 'path';

// ── Config ──────────────────────────────────────────────────────────────────

const GEMINI_API_KEY = 'AIzaSyDZwtgUXmu4Xka6gotqr-8YsYMDZjLySmw';
const MODEL = 'gemini-2.5-flash-image';
const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${GEMINI_API_KEY}`;
const OUTPUT_DIR = join(import.meta.dirname, 'images');

// ── Style Presets ───────────────────────────────────────────────────────────

const STYLES = {
  editorial: `You are generating images for a premium SaaS marketing website with an editorial, magazine-inspired aesthetic.

Visual direction:
- Color palette: warm cream (#faf6f0), burnt terra cotta (#c54b1a), warm near-black (#1a1614), soft gold accents
- Typography feel: serif-inspired, elegant, high-contrast
- Mood: confident, warm, professional but not corporate. Think Stripe blog meets First Round Review
- Lighting: soft, warm, natural. No harsh studio lighting. Golden hour tones
- Composition: clean negative space, editorial layouts, asymmetric balance
- Texture: subtle grain, paper-like quality, matte finishes over glossy
- People (if included): diverse, natural poses, candid over posed. Business casual, modern workspace settings

Avoid: neon colors, purple gradients, generic stock photo feel, overly polished 3D renders, dark mode aesthetics, clip art style, cheesy corporate imagery, blue-heavy tech palettes.

The target audience is product marketers at Series B SaaS companies — the imagery should feel aspirational but grounded, like something they'd see in a premium newsletter or design-forward product blog.`,

  neutral: 'Generate a high-quality, professional image based on the prompt. Use clean composition and modern aesthetics.',

  minimal: `Generate a minimalist image with maximum negative space. Limited color palette (2-3 colors max). Clean geometric forms. No clutter. The image should feel like a premium design artifact — something you'd see on a Dieter Rams mood board.`,

  dark: `Generate an image with a dark, sophisticated aesthetic. Deep blacks and charcoals as the base. Accent with warm highlights — amber, burnt orange, or gold. Moody lighting with dramatic contrast. Premium feel, like a luxury brand campaign. Subtle grain texture.`,
};

// ── Arg Parsing ─────────────────────────────────────────────────────────────

function parseArgs(argv) {
  const args = argv.slice(2);
  const opts = {
    prompt: null,
    ref: null,
    style: 'editorial',
    output: null,
    size: 'auto', // auto, landscape, portrait, square
    help: false,
  };

  const positional = [];

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === '--ref' || arg === '-r') {
      opts.ref = args[++i];
    } else if (arg === '--style' || arg === '-s') {
      opts.style = args[++i];
    } else if (arg === '--output' || arg === '-o') {
      opts.output = args[++i];
    } else if (arg === '--size') {
      opts.size = args[++i];
    } else if (arg === '--help' || arg === '-h') {
      opts.help = true;
    } else {
      positional.push(arg);
    }
  }

  opts.prompt = positional.join(' ');
  return opts;
}

function printHelp() {
  console.log(`
  Gemini Image Generator — generate marketing visuals from text prompts

  Usage:
    node generate-image.mjs "your prompt here" [options]

  Options:
    --ref, -r <file>     Reference image for context (png, jpg, webp)
    --style, -s <name>   Style preset: editorial (default), neutral, minimal, dark
    --output, -o <file>  Output filename (saved to ./images/)
    --size <type>        Hint: auto (default), landscape, portrait, square
    --help, -h           Show this help

  Examples:
    node generate-image.mjs "hero banner for AI tools blog post"
    node generate-image.mjs "redesign this card layout" --ref current.png
    node generate-image.mjs "abstract warm gradient" --style minimal -o bg.png
    node generate-image.mjs "product comparison infographic" --size landscape
  `);
}

// ── Image Helpers ───────────────────────────────────────────────────────────

function readImageAsBase64(filePath) {
  const resolved = resolve(filePath);
  if (!existsSync(resolved)) {
    throw new Error(`Reference image not found: ${resolved}`);
  }
  const buffer = readFileSync(resolved);
  const ext = extname(resolved).toLowerCase().replace('.', '');
  const mimeMap = { png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg', webp: 'image/webp', gif: 'image/gif' };
  const mime = mimeMap[ext] || 'image/png';
  return { base64: buffer.toString('base64'), mime };
}

function slugify(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 60);
}

function getSizeHint(size) {
  const hints = {
    landscape: 'Generate this as a wide landscape image (roughly 16:9 aspect ratio).',
    portrait: 'Generate this as a tall portrait image (roughly 9:16 aspect ratio).',
    square: 'Generate this as a square image (1:1 aspect ratio).',
  };
  return hints[size] || '';
}

// ── API Call ─────────────────────────────────────────────────────────────────

async function generateImage(prompt, opts) {
  // Build the full prompt with style prefix
  const stylePrefix = STYLES[opts.style] || STYLES.editorial;
  const sizeHint = getSizeHint(opts.size);
  const fullPrompt = [stylePrefix, sizeHint, prompt].filter(Boolean).join('\n\n');

  // Build request parts
  const parts = [];

  // Add reference image if provided
  if (opts.ref) {
    console.log(`  Loading reference image: ${opts.ref}`);
    const { base64, mime } = readImageAsBase64(opts.ref);
    parts.push({
      inlineData: { mimeType: mime, data: base64 },
    });
    parts.push({
      text: `Use the above image as visual context/reference. Now generate a new image based on this request:\n\n${fullPrompt}`,
    });
  } else {
    parts.push({ text: fullPrompt });
  }

  const body = {
    contents: [{ parts }],
    generationConfig: {
      responseModalities: ['TEXT', 'IMAGE'],
    },
  };

  console.log(`  Calling Gemini (${MODEL})...`);
  const res = await fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Gemini API error (${res.status}): ${errText}`);
  }

  const data = await res.json();

  // Extract image and text from response
  const candidates = data.candidates || [];
  if (candidates.length === 0) {
    throw new Error('No candidates returned from Gemini. Response: ' + JSON.stringify(data, null, 2));
  }

  const responseParts = candidates[0].content?.parts || [];
  let imageData = null;
  let imageMime = 'image/png';
  let responseText = '';

  for (const part of responseParts) {
    if (part.inlineData) {
      imageData = part.inlineData.data;
      imageMime = part.inlineData.mimeType || 'image/png';
    }
    if (part.text) {
      responseText += part.text;
    }
  }

  if (!imageData) {
    // Check for safety/block reasons
    const blockReason = candidates[0].finishReason;
    const safetyRatings = candidates[0].safetyRatings;
    let errorMsg = 'No image was generated.';
    if (blockReason) errorMsg += ` Finish reason: ${blockReason}.`;
    if (safetyRatings) errorMsg += ` Safety: ${JSON.stringify(safetyRatings)}`;
    if (responseText) errorMsg += `\nModel said: ${responseText}`;
    throw new Error(errorMsg);
  }

  return { imageData, imageMime, responseText };
}

// ── Main ────────────────────────────────────────────────────────────────────

async function main() {
  const opts = parseArgs(process.argv);

  if (opts.help || !opts.prompt) {
    printHelp();
    process.exit(opts.help ? 0 : 1);
  }

  console.log(`\n  Generating image...`);
  console.log(`  Prompt: "${opts.prompt}"`);
  console.log(`  Style: ${opts.style}`);
  if (opts.ref) console.log(`  Reference: ${opts.ref}`);
  if (opts.size !== 'auto') console.log(`  Size: ${opts.size}`);
  console.log('');

  // Ensure output dir exists
  if (!existsSync(OUTPUT_DIR)) mkdirSync(OUTPUT_DIR, { recursive: true });

  const { imageData, imageMime, responseText } = await generateImage(opts.prompt, opts);

  // Determine output filename
  const extMap = { 'image/png': '.png', 'image/jpeg': '.jpg', 'image/webp': '.webp' };
  const ext = extMap[imageMime] || '.png';
  const filename = opts.output
    ? (opts.output.includes('.') ? opts.output : opts.output + ext)
    : slugify(opts.prompt) + ext;

  const outputPath = join(OUTPUT_DIR, filename);
  const buffer = Buffer.from(imageData, 'base64');
  writeFileSync(outputPath, buffer);

  console.log(`  Saved: ${outputPath}`);
  console.log(`  Size: ${(buffer.length / 1024).toFixed(0)} KB`);
  if (responseText) console.log(`  Model note: ${responseText.slice(0, 200)}`);
  console.log('');
}

main().catch(err => {
  console.error(`\n  Error: ${err.message}\n`);
  process.exit(1);
});
