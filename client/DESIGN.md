---
name: Precision Logic
colors:
  surface: '#f9f9ff'
  surface-dim: '#d8d9e3'
  surface-bright: '#f9f9ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f2f3fd'
  surface-container: '#ecedf7'
  surface-container-high: '#e6e7f2'
  surface-container-highest: '#e1e2ec'
  on-surface: '#191b23'
  on-surface-variant: '#424754'
  inverse-surface: '#2e3038'
  inverse-on-surface: '#eff0fa'
  outline: '#727785'
  outline-variant: '#c2c6d6'
  surface-tint: '#005ac2'
  primary: '#0058be'
  on-primary: '#ffffff'
  primary-container: '#2170e4'
  on-primary-container: '#fefcff'
  inverse-primary: '#adc6ff'
  secondary: '#006c49'
  on-secondary: '#ffffff'
  secondary-container: '#6cf8bb'
  on-secondary-container: '#00714d'
  tertiary: '#924700'
  on-tertiary: '#ffffff'
  tertiary-container: '#b75b00'
  on-tertiary-container: '#fffbff'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#d8e2ff'
  primary-fixed-dim: '#adc6ff'
  on-primary-fixed: '#001a42'
  on-primary-fixed-variant: '#004395'
  secondary-fixed: '#6ffbbe'
  secondary-fixed-dim: '#4edea3'
  on-secondary-fixed: '#002113'
  on-secondary-fixed-variant: '#005236'
  tertiary-fixed: '#ffdcc6'
  tertiary-fixed-dim: '#ffb786'
  on-tertiary-fixed: '#311400'
  on-tertiary-fixed-variant: '#723600'
  background: '#f9f9ff'
  on-background: '#191b23'
  surface-variant: '#e1e2ec'
typography:
  h1:
    fontFamily: Inter
    fontSize: 32px
    fontWeight: '600'
    lineHeight: 40px
    letterSpacing: -0.02em
  h2:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
    letterSpacing: -0.02em
  h3:
    fontFamily: Inter
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
    letterSpacing: -0.01em
  body-lg:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  body-sm:
    fontFamily: Inter
    fontSize: 13px
    fontWeight: '400'
    lineHeight: 18px
  label-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '500'
    lineHeight: 20px
  label-sm:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
    letterSpacing: 0.02em
  code:
    fontFamily: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace
    fontSize: 13px
    fontWeight: '400'
    lineHeight: 20px
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  base: 4px
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 32px
  2xl: 48px
  3xl: 64px
  gutter: 24px
  container-max: 1280px
---

## Brand & Style

The visual identity of this design system centers on "Visual Quiet"—a philosophy that prioritizes developer focus by removing unnecessary ornamentation. It draws inspiration from high-performance engineering tools, emphasizing clarity, speed, and functional density.

The style is rooted in **Minimalism** with a **Corporate Modern** execution. It utilizes a restrained color palette and generous whitespace to reduce cognitive load. The aesthetic is defined by sharp utility, where every border, margin, and color choice serves a specific communicative purpose, resulting in an interface that feels both professional and highly efficient.

## Colors

The palette is anchored in a clean, neutral foundation to ensure that content and data remain the primary focus.

- **Foundations:** The primary background uses a very light gray to reduce screen glare, while surfaces (cards, modals) are pure white to create a clear layering effect.
- **Typography:** Contrast is handled through charcoal tones rather than pure black to maintain a sophisticated, modern feel that is easier on the eyes during long sessions.
- **Accents:** Professional Blue is used for primary actions and navigational cues. Calm Emerald Green is reserved for success states, completed tasks, and positive growth indicators.
- **System Colors:** Subtle grays define the structural boundaries, ensuring that borders are perceptible but never distracting.

## Typography

This design system utilizes **Inter** for all UI elements to leverage its exceptional readability and systematic, utilitarian appearance. 

- **Headings:** Use tighter letter-spacing and semi-bold weights to create a strong visual anchor for page sections.
- **Body Text:** Optimized for long-form reading and data density. The 14px size is the workhorse for general interface text.
- **Labels:** Small caps or medium weights are used for metadata, table headers, and form labels to differentiate them from interactive content.
- **Monospace:** Integrated for developer-specific content such as commit IDs, code snippets, or terminal outputs to maintain a familiar environment.

## Layout & Spacing

The layout model follows a **Fixed Grid** approach for internal dashboard views, transitioning to a fluid model for mobile viewports. 

A strict 4px/8px incremental scale ensures vertical rhythm and consistent alignment across all components. 
- **Margins & Gutters:** Main content areas should utilize a 24px margin to provide breathing room.
- **Information Density:** For data-heavy views (like task boards or tables), use the "sm" and "md" spacing tokens to maintain high visibility without clutter.
- **Grouping:** Use the "lg" and "xl" tokens to clearly separate distinct logical sections of the application.

## Elevation & Depth

Hierarchy in this design system is achieved primarily through **Tonal Layers** and **Low-Contrast Outlines** rather than aggressive shadows.

1.  **Level 0 (Base):** The #F9FAFB background.
2.  **Level 1 (Surface):** Pure white cards and panels. These use a subtle 1px border (#E5E7EB) to define their edges.
3.  **Level 2 (Popovers/Modals):** Elements that sit above the primary surface use a soft, highly diffused shadow (0px 4px 12px rgba(0,0,0,0.05)) to indicate interactivity and focus.

Backdrop blurs (glassmorphism) may be used sparingly on sticky navigation bars to maintain context while scrolling, but should not interfere with text legibility.

## Shapes

The shape language is "Softly Geometric." The primary goal is to make the interface feel approachable and modern without losing the precision required for a professional tool.

- **Standard Elements:** Buttons, input fields, and small cards use a 0.5rem (8px) radius.
- **Containers:** Large page containers or main dashboard cards use a 1rem (16px) radius to frame the content.
- **Indicators:** Status badges and "pills" use a full-round radius to distinguish them from interactive buttons.

## Components

- **Buttons:** Primary buttons use solid Professional Blue with white text. Secondary buttons use a white background with a subtle border and charcoal text. Ghost buttons are reserved for tertiary actions to keep the UI clean.
- **Input Fields:** Minimalist design with a focus on the active state. Use a 1px border that transitions to a 2px blue ring on focus. Use placeholder text in Muted Gray.
- **Cards:** Soft surfaces with no heavy shadows. Use a subtle border and 16px padding. Titles should be H3 or Label-MD.
- **Status Badges:** Use low-saturation background tints with high-saturation text for readability (e.g., a very light green background with Emerald text).
- **Tables:** No vertical borders. Use thin horizontal dividers and subtle row highlights on hover to help track data across the screen.
- **Task Boards:** Use "Ghost Cards" (dotted borders) for empty states or drag-and-drop targets to maintain the minimalist vibe.
- **Progress Indicators:** Use thin, 4px-high bars in Emerald or Blue to show completion without overwhelming the layout.