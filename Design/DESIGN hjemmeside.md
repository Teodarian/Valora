---
name: Bit-Minimalism
colors:
  surface: '#131313'
  surface-dim: '#131313'
  surface-bright: '#393939'
  surface-container-lowest: '#0e0e0e'
  surface-container-low: '#1b1b1b'
  surface-container: '#1f1f1f'
  surface-container-high: '#2a2a2a'
  surface-container-highest: '#353535'
  on-surface: '#e2e2e2'
  on-surface-variant: '#e4beb1'
  inverse-surface: '#e2e2e2'
  inverse-on-surface: '#303030'
  outline: '#ab897d'
  outline-variant: '#5b4137'
  surface-tint: '#ffb59a'
  primary: '#ffb59a'
  on-primary: '#5a1b00'
  primary-container: '#ff5c00'
  on-primary-container: '#521800'
  inverse-primary: '#a73a00'
  secondary: '#c6c6c7'
  on-secondary: '#2f3131'
  secondary-container: '#454747'
  on-secondary-container: '#b4b5b5'
  tertiary: '#c8c6c5'
  on-tertiary: '#313030'
  tertiary-container: '#949292'
  on-tertiary-container: '#2c2b2b'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#ffdbce'
  primary-fixed-dim: '#ffb59a'
  on-primary-fixed: '#370e00'
  on-primary-fixed-variant: '#802a00'
  secondary-fixed: '#e2e2e2'
  secondary-fixed-dim: '#c6c6c7'
  on-secondary-fixed: '#1a1c1c'
  on-secondary-fixed-variant: '#454747'
  tertiary-fixed: '#e5e2e1'
  tertiary-fixed-dim: '#c8c6c5'
  on-tertiary-fixed: '#1c1b1b'
  on-tertiary-fixed-variant: '#474746'
  background: '#131313'
  on-background: '#e2e2e2'
  surface-variant: '#353535'
typography:
  display-lg:
    fontFamily: Space Mono
    fontSize: 48px
    fontWeight: '700'
    lineHeight: '1.1'
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Space Mono
    fontSize: 32px
    fontWeight: '700'
    lineHeight: '1.2'
  headline-lg-mobile:
    fontFamily: Space Mono
    fontSize: 24px
    fontWeight: '700'
    lineHeight: '1.2'
  body-lg:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '400'
    lineHeight: '1.6'
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.6'
  label-caps:
    fontFamily: Space Mono
    fontSize: 12px
    fontWeight: '700'
    lineHeight: '1.0'
    letterSpacing: 0.1em
  code-ui:
    fontFamily: Space Mono
    fontSize: 14px
    fontWeight: '400'
    lineHeight: '1.4'
spacing:
  unit: 4px
  gutter: 24px
  margin-sm: 16px
  margin-md: 40px
  margin-lg: 80px
  container-max: 1200px
---

## Brand & Style

This design system merges the high-fidelity clarity of modern minimalism with the nostalgic grit of early computing. It targets a tech-literate audience that values precision and character. The emotional response is one of "Digital Craft"—feeling both premium like a high-end physical product and playful like a retro workstation.

The style is a hybrid of **Minimalism** and **Retrofuturism**. It utilizes the expansive whitespace and intentional layout of contemporary Swiss design but punctuates it with 8-bit visual cues. Key characteristics include:
- **High-Fidelity Pixelation:** Pixel motifs are used as structural accents (borders, icons, small headings) rather than low-resolution textures.
- **Controlled Brutalism:** Sharp corners and visible strokes (1px or 2px) replace soft shadows to define boundaries.
- **Luminous Accents:** Use of vibrant orange against deep black creates a high-contrast, "OLED-first" experience.

## Colors

The palette is strictly limited to maintain a premium feel. 
- **Primary (#FF5C00):** Reserved for primary calls-to-action, active states, and critical information. 
- **Neutral/Background (#000000):** The foundation. All interfaces should leverage true black to allow glassmorphic elements and orange accents to pop.
- **Surface (#1A1A1A):** Used for card backgrounds or secondary containers to provide subtle depth against the pure black background.
- **Typography:** Use pure white (#FFFFFF) for primary headings and a muted gray (#A1A1A1) for secondary body text to reduce visual fatigue.

## Typography

Typography is the primary driver of the "Retro-Modern" tension. 
- **Headlines & UI Labels:** Use **Space Mono**. Its geometric, monospaced nature mimics pixel fonts while remaining perfectly legible at all sizes. All caps should be used for small labels and category headers to reinforce the "terminal" aesthetic.
- **Body Content:** Use **Inter**. This provides the "Apple-style" clean readability required for long-form text, ensuring the design doesn't feel overly experimental or difficult to scan.
- **Scale:** Maintain large margins between headers and body text to emphasize the minimalist layout.

## Layout & Spacing

The layout follows a **Fixed-Fluid Hybrid Grid**. Content is housed in a centered container (1200px max) but utilizes a strict 4px baseline grid for all internal spacing.

- **Desktop:** 12-column grid with 24px gutters. Use generous outer margins (80px+) to create the "Apple-esque" sense of air and importance.
- **Mobile:** 4-column grid with 16px margins.
- **The "Step" Rule:** Elements should be separated by increments of 8px or 16px. Never use odd spacing values, as this breaks the pixel-perfect alignment essential to the theme.

## Elevation & Depth

Depth is achieved through **Glassmorphism and Tonal Layering** rather than traditional drop shadows.

- **The Glass Layer:** Use semi-transparent backgrounds (White or Orange at 5-10% opacity) with a heavy background blur (20px-40px). 
- **Pixel Borders:** Every elevated element (modals, cards, dropdowns) must have a 1px solid border. For an extra "retro" feel, use a dashed border-style for secondary containers to simulate a pixelated line.
- **Active Elevation:** When an item is active or hovered, increase the border weight to 2px or change the border color to the primary orange. Do not use Z-axis shadows; keep the interface feeling like a flat, illuminated panel.

## Shapes

The shape language is strictly **Sharp (0px)**. 
- All buttons, input fields, and card containers must have 90-degree corners. 
- To create a "pixel-corner" effect on larger containers, you may use a "clipped corner" (dog-ear) look using CSS clip-path, but traditional border-radius is prohibited.
- Icons should be strictly linear or pixel-based, avoiding organic curves.

## Components

- **Pixel Buttons:** Rectangular with a 1px white border. On hover, the button fills with Primary Orange, and the text switches to Black. Include a "stepped" animation for hovers (no easing) to mimic retro hardware response.
- **Input Fields:** Minimalist underlines or 1px ghost boxes. Use the `label-caps` typography style for floating labels.
- **Glass Cards:** Background-blur containers with 1px semi-transparent borders. Used for grouping content without breaking the pure black background flow.
- **Status Indicators:** Small square "pixels" instead of round dots to indicate online/offline or active states.
- **Data Tables:** Use 1px vertical and horizontal grid lines to create a "spreadsheet" or "blueprint" look, keeping the monospaced font for all numeric data.