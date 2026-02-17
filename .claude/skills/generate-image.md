---
name: generate-image
description: Generate images for the marketing site using Gemini. Takes a text prompt and optional reference image. Use when the user says "generate image", "create image", "make a visual", "blog image", "hero image", "screenshot", or asks for any marketing visual.
---

This skill generates images using the Gemini 2.0 Flash image generation model. It wraps the `generate-image.mjs` CLI script.

## Inputs

The user provides:
- **Prompt** (required): A description of the image to generate
- **Reference image** (optional): A path to an existing image to use as visual context
- **Style** (optional): One of `editorial` (default), `neutral`, `minimal`, `dark`
- **Size** (optional): One of `auto` (default), `landscape`, `portrait`, `square`
- **Output filename** (optional): Custom filename for the output

## Process

### Step 1: Parse the Request

Extract from the user's message:
- The image description/prompt
- Any referenced image file (look for file paths or @mentions)
- Style preference (if not specified, use `editorial` — it matches the site's warm cream/terra cotta aesthetic)
- Size hint (if not specified, use `auto`)
- Desired filename (if not specified, the script will auto-generate one from the prompt)

### Step 2: Build the Command

Construct the CLI command:

```
node /Users/travisse/Programming/claude_site/generate-image.mjs "prompt here" [options]
```

Available flags:
- `--ref <file>` or `-r <file>` — Reference image path
- `--style <name>` or `-s <name>` — Style preset
- `--output <name>` or `-o <name>` — Output filename (saved to ./images/)
- `--size <type>` — Size hint: landscape, portrait, square

### Step 3: Run the Script

Execute the command using Bash. The script will:
1. Call the Gemini API with the styled prompt
2. Save the generated image to `./images/`
3. Print the output path and file size

### Step 4: Show Results

After the script completes:
1. Tell the user the file was saved and where
2. Read the image file to display it to the user
3. If the model included a text note, share it
4. Ask if they want adjustments (different style, size, or prompt refinement)

## Style Presets

- **editorial** (default): Warm cream/terra cotta palette, serif-inspired, golden hour tones, subtle grain. Matches the marketing site aesthetic.
- **neutral**: Clean, professional, modern. Good for generic business visuals.
- **minimal**: Maximum negative space, 2-3 colors, geometric. Dieter Rams mood board.
- **dark**: Deep blacks, amber/gold accents, moody lighting, luxury brand feel.

## Examples

User: "Generate a hero image for a blog post about competitive analysis"
→ `node generate-image.mjs "hero banner for a blog post about competitive analysis, showing a product marketer reviewing competitor data on a warm, editorial dashboard" --size landscape`

User: "Create a dark background pattern for the pricing section"
→ `node generate-image.mjs "abstract geometric pattern with warm accents" --style dark --size landscape -o pricing-bg`

User: "Make a screenshot-style image based on this mockup" (with attached file)
→ `node generate-image.mjs "polished product screenshot showing a SaaS dashboard" --ref mockup.png --size landscape`

## Important Guidelines

- Always default to the `editorial` style unless the user specifies otherwise — it matches the site's design system
- For blog images, suggest `--size landscape` since most blog layouts use wide images
- For social media, suggest `--size square`
- The script saves to `./images/` — remind users this directory is in the project root
- If generation fails due to safety filters, try rephrasing the prompt to be less specific about people or branded content
