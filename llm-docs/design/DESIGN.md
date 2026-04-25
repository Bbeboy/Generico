# AI System Prompt: UI / UX Design Guidelines

This document provides the foundational context and rules for generating, modifying, and styling the UI of this project. **Any AI agent reading this must adhere strictly to these principles** to ensure brand consistency and layout harmony.

## Brand Identity: Luminous Commerce

- **Aesthetic**: "Soft Minimalism"
- **Vibe**: Serene, high-end, approachable, luxury lifestyle boutique.
- **Core Execution**: Use expansive whitespace. UI elements should feel fluid and weightless. Avoid heavy borders in favor of subtle tonal shifts and soft ambient depth.

---

## ☀️ LIGHT THEME (Default & Primary Brand Expression)

_The light theme avoids pure stark whites and stark blacks, relying instead on off-whites, deep grays, and soft pastels to create a clean, approachable, and non-clinical canvas._

### 1. Colors

- **Canvas (Main Background)**: `#f9fafb` (Reduces eye strain, softer than pure white).
- **Surface (Cards/Containers)**: `#ffffff` (Creates a subtle tonal separation against the canvas).
- **Text (Body)**: `#374151` (Deep gray is preferred over pure black for elegance).
- **Text (High Contrast / Headings)**: `#111827` (Deep charcoal).
- **Pastel Accents**: Soft Pink (`#fce7f3`) and Mint (`#ecfdf5`). Use sparingly for category highlights, badges ("New", "Sale"), or hover states.

### 2. Typography

- **Headings (H1, H2, H3)**: `Plus Jakarta Sans`
  - _Traits_: Friendly, slightly rounded, geometric. Use bold weights (600+) and tight letter spacing (`-0.01em` to `-0.02em`).
- **Body & Labels**: `Inter`
  - _Traits_: High legibility for e-commerce. Maintain generous line height (`1.6`) to maintain an "airy" feel.

### 3. Layout & Spacing

- **Container**: Max width `1280px`.
- **Grid Strategy**: Fixed 12-column grid on desktop, fluid on mobile.
- **Spacing Scale**: Follow a `4px`/`8px` baseline grid.
- **Vertical Rhythm**: Use large gaps (e.g., `48px` or `80px`) between distinct sections to allow the content to breathe. Do not clutter the layout.

### 4. Elevation & Depth

- **No harsh borders**: Separate elements with ambient shadows or surface color shifts (`#ffffff` vs `#f9fafb`).
- **Level 1 (Cards/Inputs)**: `box-shadow: 0px 4px 20px rgba(0, 0, 0, 0.03)`
- **Level 2 (Hover/Dropdowns)**: `box-shadow: 0px 10px 30px rgba(0, 0, 0, 0.06)`

### 5. Shapes & Border Radius

- **Cards, Images, Buttons**: `12px` to `16px` radius. (CTAs can occasionally be fully rounded/pill-shaped: `9999px`).
- **Small UI (Tags, Checkboxes)**: `4px` to `8px` radius.

### 6. Component Rules

- **Announcement Bar**: High contrast. Background `#111827`, text `#ffffff`. Uppercase small text. Slim height (~`40px`).
- **Buttons**: Heavy contrast dark fill (`#111827`) with white text, or pastel fill with dark text. No borders.
- **Product Cards**: `#ffffff` background, `12px` image radius, Level 1 ambient shadow, no visible borders.
- **Inputs**: Soft gray background (`#f3f4f6`). On focus, shifts to a soft mint border (`#ecfdf5`).
- **Badges**: Pastel background (Pink/Mint) with darker text in the same hue.
- **Navigation**: Transparent or soft-white, large horizontal padding between links. No dividers.

---

## 🌙 DARK THEME (Obsidian)

_Developer-grade dark UI. Used strictly when explicitly building a dark mode experience or a dev-focused tool section._

### 1. Concept: "Precision in Darkness"

Near-black surfaces with high-contrast text and precise accent colors. Contrast the airy Light Theme by making this theme flat, fast-feeling, and highly functional.

### 2. Colors

- **Background**: `#09090b` (True near-black).
- **Surfaces**: Zinc grays (`#0c0c0f` to `#27272a`).
- **Primary Accent**: Soft violet (`#a78bfa`) for interactive elements, links, focus rings.
- **Tertiary Accent**: Emerald green (`#34d399`) for success/code highlights.
- **Text**: `#fafafa` (Primary) and `#a1a1aa` (Secondary/Body).
- _Rule_: No decorative color use. Red (`#ef4444`) for errors only.

### 3. Typography

- **Font**: `Geist` (modern, developer-friendly) for all headings and body.
- **Headings**: Tight letter-spacing (`-0.02em`).

### 4. Elevation & Shapes

- **No Shadows**: Keep the interface flat. Use border-based separation (`1px solid #27272a`).
- **Cards/Containers**: Thin `outline-variant` border, `8px` radius.
- **Focus Rings**: `2px solid #a78bfa` with `2px` offset.

### 5. Component Rules

- **Buttons**: Primary is solid violet fill. Secondary is transparent with a border. Ghost is text only.
- **Inputs**: Surface background (`#0c0c0f` equivalent), thin border, violet focus ring.
- **Code Blocks**: Darkest background, monospace font.
