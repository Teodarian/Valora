---
name: Nordic Hearth
colors:
  surface: '#1a1208'
  surface-dim: '#1a1208'
  surface-bright: '#42372b'
  surface-container-lowest: '#140d04'
  surface-container-low: '#231a0f'
  surface-container: '#271e13'
  surface-container-high: '#32281d'
  surface-container-highest: '#3d3327'
  on-surface: '#f1e0ce'
  on-surface-variant: '#dbc1b8'
  inverse-surface: '#f1e0ce'
  inverse-on-surface: '#392f23'
  outline: '#a38c84'
  outline-variant: '#55433c'
  surface-tint: '#ffb59a'
  primary: '#ffb59a'
  on-primary: '#5b1b00'
  primary-container: '#b85c38'
  on-primary-container: '#ffffff'
  inverse-primary: '#9a4523'
  secondary: '#cfc6b1'
  on-secondary: '#353021'
  secondary-container: '#4c4636'
  on-secondary-container: '#bdb4a0'
  tertiary: '#d8c3b3'
  on-tertiary: '#3b2e23'
  tertiary-container: '#847365'
  on-tertiary-container: '#ffffff'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#ffdbcf'
  primary-fixed-dim: '#ffb59a'
  on-primary-fixed: '#380d00'
  on-primary-fixed-variant: '#7b2f0e'
  secondary-fixed: '#ece2cc'
  secondary-fixed-dim: '#cfc6b1'
  on-secondary-fixed: '#201b0e'
  on-secondary-fixed-variant: '#4c4636'
  tertiary-fixed: '#f5dfce'
  tertiary-fixed-dim: '#d8c3b3'
  on-tertiary-fixed: '#24190f'
  on-tertiary-fixed-variant: '#524438'
  background: '#1a1208'
  on-background: '#f1e0ce'
  surface-variant: '#3d3327'
typography:
  display-lg:
    fontFamily: EB Garamond
    fontSize: 64px
    fontWeight: '400'
    lineHeight: 72px
    letterSpacing: -0.02em
  display-lg-mobile:
    fontFamily: EB Garamond
    fontSize: 40px
    fontWeight: '400'
    lineHeight: 48px
    letterSpacing: -0.01em
  headline-md:
    fontFamily: EB Garamond
    fontSize: 32px
    fontWeight: '400'
    lineHeight: 40px
  headline-sm:
    fontFamily: EB Garamond
    fontSize: 24px
    fontWeight: '500'
    lineHeight: 32px
  body-lg:
    fontFamily: Manrope
    fontSize: 18px
    fontWeight: '300'
    lineHeight: 28px
    letterSpacing: 0.01em
  body-md:
    fontFamily: Manrope
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  label-caps:
    fontFamily: Manrope
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.1em
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  unit: 8px
  container-max: 1280px
  gutter: 32px
  section-padding: 120px
  margin-mobile: 20px
---

## Brand & Style
The design system is built to evoke the quiet, sophisticated warmth of an upscale Oslo bistro. The brand personality is grounded, intellectual, and intimate, capturing the "hygge" of a candlelit evening against the stark Norwegian winter. 

The aesthetic leans into **Minimalism** with a **Tactile** edge. It prioritizes expansive whitespace—used here as "dark space"—to allow high-resolution food photography to act as the primary visual anchor. The interface should feel unhurried, favoring graceful transitions over snappy animations, ensuring the digital experience mirrors the pace of a multi-course fine dining engagement.

## Colors
The palette is rooted in an organic, earth-bound spectrum. The primary background is a deep, warm charcoal-brown (#1a1208) that provides more depth and warmth than a standard black. 

- **Primary (Deep Terracotta):** Used sparingly for interactive accents, calls to action, and subtle decorative elements like dividers.
- **Secondary (Cream):** The main typographic color. It reduces eye strain against the dark background compared to pure white and adds a paper-like, editorial quality.
- **Tertiary (Smoked Umber):** A mid-tone used for secondary containers, subtle borders, and hover states to maintain low-contrast sophistication.
- **Neutral:** The foundational dark canvas that allows photography colors to pop.

## Typography
The typographic hierarchy relies on the tension between the classical, literary weight of **EB Garamond** and the clean, functional precision of **Manrope**. 

Headlines should be set with generous leading to feel airy. Use `display-lg` for hero sections and menu categories. `body-lg` is preferred for storytelling segments and descriptions to enhance readability and premium feel. `label-caps` should be used for navigation, small headings, and price indicators to provide a modern, structured counterpoint to the flowing serif headers.

## Layout & Spacing
The layout follows a **Fixed Grid** philosophy on desktop to maintain an editorial, magazine-like composition. On mobile, it transitions to a fluid single-column flow with substantial vertical breathing room.

- **Desktop:** 12-column grid with wide 32px gutters. Content is often offset (e.g., text occupying columns 2-6, imagery 7-12) to create visual interest.
- **Section Padding:** A minimum of 120px vertical spacing between major sections to prevent the dark UI from feeling cramped.
- **Rhythm:** Use an 8px base unit. Component spacing should favor "loose" arrangements—elements like menu items should have ample padding to feel distinct and significant.

## Elevation & Depth
In this dark, warm environment, depth is created through **Tonal Layers** rather than heavy shadows. 

- **Surface Tiers:** The base level is #1a1208. Overlays (like reservation modals or dropdowns) use #3d3025 with a very subtle, soft-edged shadow (20% opacity black) to suggest a slight lift.
- **Outlines:** Use low-contrast "Ghost Borders" (#f0e6d0 at 10% opacity) to define cards or input fields without breaking the visual flow.
- **Glassmorphism:** Navigation bars may use a subtle backdrop blur (12px) with a semi-transparent dark tint to allow the rich food photography to bleed through as the user scrolls.

## Shapes
The design system utilizes **Soft** (Level 1) roundedness. 

While the brand is upscale, sharp 90-degree corners can feel too clinical or aggressive. A subtle 0.25rem (4px) radius on buttons, images, and cards softens the geometric structure, making the interface feel more organic and inviting, akin to the rounded edges of handcrafted Nordic furniture.

## Components
- **Buttons:** Primary buttons use the Deep Terracotta (#b85c38) background with Cream text. Secondary buttons are "Ghost" style with a Cream border and no fill. Use `label-caps` for all button text.
- **Input Fields:** Minimalist design with only a bottom border (1px, Cream at 30% opacity). On focus, the border becomes 1px solid Terracotta.
- **Menu Lists:** Item names in `headline-sm`, descriptions in `body-md` (muted opacity), and prices in `label-caps` aligned to the right. Use a thin, dotted divider between items.
- **Cards:** Used for "Chef's Specials" or "Events." Cards should have no background fill or a very subtle dark tint, relying on typography and imagery for structure.
- **Reservation Widget:** A persistent, floating element or a clear header action. It should be high-contrast (Terracotta) to ensure the primary business goal is always accessible but visually integrated.
- **Image Containers:** Always utilize `rounded-lg` (8px) for food photography to maintain a consistent soft-edged aesthetic.