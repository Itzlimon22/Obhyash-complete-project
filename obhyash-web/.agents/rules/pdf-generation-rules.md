# PDF Generation Engine & Formatting Rules

> **Standard Operating Procedure (SOP) for Obhyash Solve PDF Generation**  
> *Target Paths: `lib/pdf-generator/template.ts`, `scripts/generate_*.ts`*  
> *Reference Files: `lib/pdf-generator/reference/demo_reference.html`, `demo_reference.pdf`*

---

## 1. Architecture Overview

Obhyash uses a headless Chromium (Puppeteer) workflow to render dynamic HTML/CSS templates into high-fidelity A4 printable PDF documents with dual-column layouts, KaTeX mathematical typesetting, and custom typography.

```
Supabase DB (Exams & Questions)
             │
             ▼
   scripts/generate_[category]_pdf.ts
             │
             ▼
   lib/pdf-generator/template.ts (HTML Builder + Layout Engine + KaTeX)
             │
             ▼
   Puppeteer (Chrome Headless) ──> lib/pdf-generator/reference/ (or output directory)
```

---

## 2. Dynamic 100+ Curated Theme Library

To keep solve sheets visually engaging and never monotonous, Obhyash includes a library of **100+ meticulously tuned, academic-grade palettes** located in `lib/pdf-generator/themes.ts`:

- **Navy & Oceanic Family (15 themes):** `royal_navy_amber`, `midnight_sapphire_gold`, `deep_ocean_cyan`, etc.
- **Teal, Emerald & Botanical (15 themes):** `medical_emerald_teal`, `nordic_pine_mint`, `deep_jade_coral`, etc.
- **Maroon, Crimson & Wine (15 themes):** `varsity_oxford_maroon`, `burgundy_antique_gold`, `crimson_velvet_navy`, etc.
- **Violet, Amethyst & Plum (15 themes):** `regal_indigo_purple`, `byzantine_purple_gold`, etc.
- **Slate, Cyber & Obsidian (15 themes):** `cyber_slate_blue`, `obsidian_aerospace_crimson`, etc.
- **Earthy, Bronze & Espresso (15 themes):** `espresso_burnished_gold`, `tuscan_terracotta_teal`, etc.
- **Nordic & Arctic Specialty (10 themes):** `nordic_twilight`, `sage_shadow_amber`, etc.

### Theme Selection Strategy:
- **`random`**: Randomly picks across the 100+ palettes so every new test or download gets an exciting, fresh visual palette.
- **Deterministic Seed**: When given an exam title or ID as a seed, it maps deterministically to a palette so the same exam maintains its unique signature branding.
- **Specific Theme Key**: Any palette can be manually forced by specifying its key (e.g. `varsity_oxford_maroon` or `midnight_sapphire_gold`).

---

## 3. Layout & Page Budget Rules (Preventing Gaps)

### The Problem
When the question stem, options, and explanation are enclosed inside a single parent container with `break-inside: avoid`, Puppeteer pushes the entire container to the next page whenever the remaining page height is insufficient. This creates huge, awkward empty spaces at the bottom of pages.

### The Solution: Separated Card Structure
1. **`.question-card`**
   - Contains: Question number badge, question text, and the 4 options grid.
   - CSS: `break-inside: avoid; page-break-inside: avoid;`
   - **Rule**: Never split options away from their question stem.
2. **`.explanation-card`**
   - Kept as an independent sibling element immediately below `.question-card`.
   - CSS: `break-inside: auto; page-break-inside: auto; orphans: 3; widows: 3;`
   - **Rule**: Explanations can flex across page boundaries naturally without leaving 200px+ gaps at the bottom.
3. **Margins & Spacing**:
   - Margin between `.question-card` and `.explanation-card`: `2px` (keeps them visually clustered).
   - Margin below `.explanation-card` before the next question: `8px - 10px`.

---

## 4. KaTeX & LaTeX Rendering Guardrails

### 4.1 Bengali Dari (`।`) Sentence Splitting Guard
- **Issue**: Splitting text into sentences on Bengali Dari (`।`) can split inside math blocks (e.g. `$$\text{বেগ}=৫\text{ m/s।}$$` or inline formulas).
- **Rule**: Sentence splitters in `template.ts` must use lookaheads/lookbehinds or state-machine checks to ensure `।` is **outside** of `$...$`, `$$...$$`, and `{...}` blocks.

### 4.2 Math Wrapping (`breakLongMath`)
- Long equations are wrapped at operators (`=`, `+`, `-`, `\approx`, `\times`).
- **Critical Guard**: Never insert `\newline` or line breaks inside `\text{...}` or `\mathrm{...}` blocks. Doing so breaks KaTeX parsing.

### 4.3 Bengali Digits in Math
- `sanitizeBengaliInMath`: Numbers like `১, ২, ৩` inside LaTeX equations must be converted to standard Arabic digits or wrapped cleanly without breaking LaTeX macros (e.g. `\times`, `\frac`, `\sqrt`).

### 4.4 Automated Database Cleanup Script
- When bulk KaTeX errors are discovered, run `scripts/fix_katex_bulk.py` to fix:
  - Unclosed dollar signs (`$`)
  - Bengali numbers directly concatenated with LaTeX commands
  - Unescaped `%` or `&` characters

---

## 5. Header & Footer Layout Rules

1. **Footer Alignment**:
   - Page number, exam title, and branding must fit on a **single horizontal line** with `display: flex; justify-content: space-between; align-items: center;`.
   - Left: `পৃষ্ঠা ৩ / ১২`
   - Center: Exam Title / Category
   - Right: `অভ্যাস — obhyash.com`
2. **Top / Bottom Margins in Puppeteer**:
   - `margin: { top: '16mm', bottom: '16mm', left: '12mm', right: '12mm' }`
   - `printBackground: true`
   - `preferCSSPageSize: true`

---

## 6. CLI Commands for Regeneration

```bash
# Generate single Engineering exam by slug
npx tsx scripts/generate_engineering_pdf.ts --slug=engineering-live-01

# Generate all Engineering exams
npx tsx scripts/generate_engineering_pdf.ts --all

# Generate single Varsity exam
npx tsx scripts/generate_varsity_pdf.ts --slug=varsity-live-01

# Generate all Varsity exams
npx tsx scripts/generate_varsity_pdf.ts --all

# Generate all Medical exams
npx tsx scripts/generate_medical_pdf.ts --all
```

---

## 7. Storage & Deployment SOP

1. **Intermediate Files**: Temporary HTML/PDF files generated in `public/downloads/` should not be committed to Git.
2. **Permanent Storage**: Finished solve PDFs are synced to `/Volumes/LimonSSD/obhyash materials/`:
   - Medical: `/Volumes/LimonSSD/obhyash materials/medi/`
   - Engineering: `/Volumes/LimonSSD/obhyash materials/engg/`
   - Varsity: `/Volumes/LimonSSD/obhyash materials/varsi/`
3. **Reference Golden Master**:
   - HTML: `lib/pdf-generator/reference/demo_reference.html`
   - PDF: `lib/pdf-generator/reference/demo_reference.pdf`
