---
name: Kinetic Intensity
colors:
  surface: '#131313'
  surface-dim: '#131313'
  surface-bright: '#262626'
  surface-container-lowest: '#0e0e0e'
  surface-container-low: '#1c1b1b'
  surface-container: '#201f1f'
  surface-container-high: '#2a2a2a'
  surface-container-highest: '#353534'
  on-surface: '#e5e2e1'
  on-surface-variant: '#cfc6ab'
  inverse-surface: '#e5e2e1'
  inverse-on-surface: '#313030'
  outline: '#989178'
  outline-variant: '#4c4732'
  surface-tint: '#e4c500'
  primary: '#fff1bf'
  on-primary: '#393000'
  primary-container: '#f5d400'
  on-primary-container: '#6b5b00'
  inverse-primary: '#6d5e00'
  secondary: '#c6c6c7'
  on-secondary: '#2f3131'
  secondary-container: '#454747'
  on-secondary-container: '#b4b5b5'
  tertiary: '#d5f8ff'
  on-tertiary: '#00363d'
  tertiary-container: '#51e8ff'
  on-tertiary-container: '#006672'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#ffe253'
  primary-fixed-dim: '#e4c500'
  on-primary-fixed: '#211b00'
  on-primary-fixed-variant: '#534600'
  secondary-fixed: '#e2e2e2'
  secondary-fixed-dim: '#c6c6c7'
  on-secondary-fixed: '#1a1c1c'
  on-secondary-fixed-variant: '#454747'
  tertiary-fixed: '#9bf0ff'
  tertiary-fixed-dim: '#3ad9ef'
  on-tertiary-fixed: '#001f24'
  on-tertiary-fixed-variant: '#004f58'
  background: '#131313'
  on-background: '#e5e2e1'
  surface-variant: '#353534'
  surface-muted: '#1a1a1a'
  energy-yellow-dim: '#c2a900'
  alert-red: '#ff4444'
typography:
  display-xl:
    fontFamily: Bebas Neue
    fontSize: 120px
    fontWeight: '400'
    lineHeight: 110px
    letterSpacing: -0.02em
  display-lg:
    fontFamily: Bebas Neue
    fontSize: 80px
    fontWeight: '400'
    lineHeight: 80px
    letterSpacing: 0em
  display-lg-mobile:
    fontFamily: Bebas Neue
    fontSize: 56px
    fontWeight: '400'
    lineHeight: 56px
    letterSpacing: 0em
  headline-lg:
    fontFamily: Bebas Neue
    fontSize: 48px
    fontWeight: '400'
    lineHeight: 48px
    letterSpacing: 0.02em
  headline-md:
    fontFamily: Bebas Neue
    fontSize: 32px
    fontWeight: '400'
    lineHeight: 32px
    letterSpacing: 0.02em
  body-lg:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 28px
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  label-bold:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '700'
    lineHeight: 16px
    letterSpacing: 0.05em
  label-sm:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
spacing:
  unit: 8px
  container-max: 1440px
  gutter: 24px
  margin-desktop: 64px
  margin-mobile: 20px
  section-gap: 120px
---

## Brand & Style
This design system is built for high-performance fitness environments, characterized by a "High-Intensity Industrial" aesthetic. It moves away from the softer tones of the reference to embrace a raw, high-contrast palette that signals urgency and athletic power.

The style is a fusion of **Modern Brutalism** and **High-Contrast Boldness**. It utilizes massive, condensed typography and a dark, light-absorbing canvas to make the electric yellow accents vibrate with energy. The interface is unapologetically direct, stripping away decorative fluff in favor of structural clarity, large-scale imagery, and aggressive visual hierarchy.

## Colors
The palette is dominated by an "Inky Black" (#0a0a0a) background to create maximum depth. The "Electric Yellow" (#f5d400) serves as the primary action color, used sparingly but impactfully for CTAs, highlights, and critical data points. 

Secondary elements and primary text utilize pure White (#ffffff) to ensure readability against the dark void. Avoid using grays with blue or brown undertones; stick to neutral, monochromatic shades for surfaces to maintain the "industrial" feel. Interactive states for the yellow should shift toward a more saturated, slightly darker "Energy Yellow" rather than becoming lighter.

## Typography
The typographic strategy relies on the tension between the towering, condensed forms of Bebas Neue and the technical precision of Inter. 

Headlines should almost always be uppercase to reinforce the "athletic" tone. For massive display sizes, use negative letter spacing to create a dense block of text that feels architectural. Inter is used for all functional and long-form copy to ensure accessibility. All labels, buttons, and navigation items should use Inter in bold, uppercase formats with slight tracking (letter spacing) to mimic technical equipment labeling.

## Layout & Spacing
This design system uses a strict 12-column grid for desktop. To emphasize the "Bold" brand personality, we utilize oversized section gaps (120px+) to allow the big typography room to breathe. 

Content should be contained within a 1440px max-width, but background elements and imagery should bleed edge-to-edge to create an immersive, cinematic experience. On mobile, the margins tighten significantly to maximize the impact of the large headline sizes. Spacing follows an 8px linear scale, ensuring all elements align to a consistent vertical rhythm.

## Elevation & Depth
Depth is created through **Tonal Layers** rather than shadows. In this dark environment, traditional shadows are invisible. Instead:
- **Level 0 (Base):** #0a0a0a (The Canvas)
- **Level 1 (Cards/Sections):** #1a1a1a (Subtle separation)
- **Level 2 (Modals/Overlays):** #262626 (Strongest lift)

Use 1px solid borders (#ffffff at 10% opacity) to define boundaries between dark surfaces. For high-energy elements, use a "Hard Glow" effect—a primary-colored drop shadow with 0 blur and 4px offset—to mimic retro-athletic posters.

## Shapes
The shape language is strictly **Sharp (0px)**. No rounded corners are permitted. This reinforces the "no-nonsense," aggressive athletic aesthetic. All buttons, input fields, cards, and image containers must have 90-degree angles. 

To create visual interest, use diagonal clips (angled cuts) on the corners of buttons or section dividers at 45-degree angles, suggesting movement and speed.

## Components
- **Buttons:** Rectangular with no radius. Primary buttons are #f5d400 with black text. Secondary buttons use a 2px white outline. Hover states should involve a solid color fill (Yellow to White) rather than opacity changes.
- **Input Fields:** Bottom-border only or a 1px solid white border. Background should be slightly lighter than the base canvas (#1a1a1a).
- **Cards:** No background by default; defined by a 1px border or a subtle tonal shift to #1a1a1a. Header text within cards must be uppercase Bebas Neue.
- **Chips/Badges:** Small, rectangular blocks of Electric Yellow with black Inter Bold text. Used for "New," "Full," or "Elite" class statuses.
- **Progress Bars:** Thick, 8px bars. The "track" is dark gray, and the "fill" is the primary Electric Yellow. No rounded caps.
- **Data Tables:** High contrast, using the #1a1a1a surface for alternating rows. Vertical lines are discouraged; use horizontal lines only to emphasize the "speed" of the layout.