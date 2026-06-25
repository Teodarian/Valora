---
name: Lumina Salon Identity
colors:
  surface: '#fff8f2'
  surface-dim: '#dfd9d3'
  surface-bright: '#fff8f2'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f9f2ec'
  surface-container: '#f3ede7'
  surface-container-high: '#eee7e1'
  surface-container-highest: '#e8e1dc'
  on-surface: '#1e1b18'
  on-surface-variant: '#504444'
  inverse-surface: '#33302c'
  inverse-on-surface: '#f6f0ea'
  outline: '#827474'
  outline-variant: '#d4c2c3'
  surface-tint: '#7c5357'
  primary: '#7c5357'
  on-primary: '#ffffff'
  primary-container: '#e8b4b8'
  on-primary-container: '#6b4448'
  inverse-primary: '#eeb9bd'
  secondary: '#4a645a'
  on-secondary: '#ffffff'
  secondary-container: '#cce9dc'
  on-secondary-container: '#506a60'
  tertiary: '#675971'
  on-tertiary: '#ffffff'
  tertiary-container: '#ccbbd7'
  on-tertiary-container: '#574a61'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#ffdadc'
  primary-fixed-dim: '#eeb9bd'
  on-primary-fixed: '#301216'
  on-primary-fixed-variant: '#623c40'
  secondary-fixed: '#cce9dc'
  secondary-fixed-dim: '#b1cdc1'
  on-secondary-fixed: '#062018'
  on-secondary-fixed-variant: '#334c43'
  tertiary-fixed: '#eedcf9'
  tertiary-fixed-dim: '#d2c0dd'
  on-tertiary-fixed: '#22172c'
  on-tertiary-fixed-variant: '#4e4259'
  background: '#fff8f2'
  on-background: '#1e1b18'
  surface-variant: '#e8e1dc'
typography:
  display-lg:
    fontFamily: DM Serif Display
    fontSize: 48px
    fontWeight: '400'
    lineHeight: '1.1'
  display-lg-mobile:
    fontFamily: DM Serif Display
    fontSize: 36px
    fontWeight: '400'
    lineHeight: '1.2'
  headline-md:
    fontFamily: DM Serif Display
    fontSize: 32px
    fontWeight: '400'
    lineHeight: '1.2'
  body-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 18px
    fontWeight: '300'
    lineHeight: '1.6'
  body-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.5'
  label-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 14px
    fontWeight: '500'
    lineHeight: '1.4'
    letterSpacing: 0.02em
rounded:
  sm: 0.5rem
  DEFAULT: 1rem
  md: 1.5rem
  lg: 2rem
  xl: 3rem
  full: 9999px
spacing:
  base: 8px
  section-gap-desktop: 120px
  section-gap-mobile: 64px
  container-max-width: 1200px
  gutter: 24px
---

## Brand & Style
The brand personality is rooted in serenity, warmth, and self-care. It targets an audience seeking a sanctuary from the daily hustle, emphasizing a soft-focus feminine aesthetic that feels premium yet approachable. 

The design style is a refined blend of **Minimalism** and **Tactile Softness**. It utilizes generous whitespace to allow the photography of hair textures and salon interiors to breathe. The interface mimics physical objects with gentle depth, using "pill" shapes and substantial corner radii to remove all visual tension, creating an environment that feels as restorative as the salon experience itself.

## Colors
The palette is inspired by natural clay, dried florals, and botanical mint. 
- **Background (#FDF6F0):** A warm cream that serves as the canvas, preventing the clinical feel of pure white.
- **Primary (#E8B4B8):** A dusty rose used for call-to-action elements and key brand highlights.
- **Secondary & Tertiary:** Sage mint and soft lavender are reserved for categorizing services (e.g., coloring vs. styling) and decorative gradients.
- **Text:** High-contrast warm brown ensures legibility while maintaining the organic, earthy tone of the system.

## Typography
The typographic system relies on the contrast between the authoritative, literary elegance of **DM Serif Display** and the clean, modern friendliness of **Plus Jakarta Sans**. 

All headlines must be set in *italics* to emphasize the fluid, "hair-like" curves and feminine grace of the brand. Body text utilizes lighter weights (300-400) to maintain an airy feel, ensuring that large blocks of information, such as service descriptions, do not feel heavy or cluttered.

## Layout & Spacing
This design system employs a **fluid grid** with intentional "breathing zones." 
- **Desktop:** A 12-column grid with wide 24px gutters. Margins are dynamic but should never drop below 40px to maintain the luxury boutique feel.
- **Mobile:** A 4-column grid with 16px gutters and 20px side margins.
- **Vertical Rhythm:** Use large, consistent vertical spacing between sections (80px to 120px) to signify a relaxed, unhurried pace. Elements within cards or components should follow an 8px baseline grid.

## Elevation & Depth
Depth is created through **Ambient Shadows** rather than structural lines. 
- **Floating Cards:** Use a very soft, diffused shadow: `0 8px 32px rgba(61, 46, 46, 0.06)`. Note the use of the warm brown text color in the shadow's tint to maintain color harmony.
- **Transitions:** Surfaces should appear to "lift" slightly on hover by increasing the shadow's spread and decreasing its opacity.
- **Glassmorphism:** Use subtle backdrop blurs (12px to 20px) for navigation bars or overlay modals to keep the warm background visible while maintaining focus.

## Shapes
The shape language is defined by the **Pill** and the **Ultra-Rounded Rectangle**. 
- **Interactive Elements:** Buttons, tags, and input fields should always be fully rounded (pill-shaped).
- **Containers:** Image frames and content cards use a consistent 32px radius on desktop, scaling down to 24px on mobile devices.
- **Decorative Elements:** Use organic, "blob" shapes with soft gradients between the primary and tertiary colors as background accents behind photography.

## Components
- **Buttons:** Primary buttons are pill-shaped with the dusty rose background and warm brown text. Use a subtle scale-up transition on hover.
- **Service Cards:** Use the floating card style with the 32px radius. Feature an image with a rounded top and text content below with generous padding (min 32px).
- **Input Fields:** Rounded pills with a thin 1px border in the muted text color (#9B8080) at 30% opacity. On focus, the border shifts to the primary rose color.
- **Chips/Tags:** Used for hair service categories (e.g., "Balayage", "Cut"). Pill-shaped with the secondary sage mint background at 20% opacity.
- **Booking Calendar:** A clean, minimalist layout with high whitespace. Selected dates are indicated by a soft, primary-colored circle.
- **Image Frames:** Hair gallery photos should always feature the 32px corner radius to maintain the "soft" visual language. Avoid sharp corners in all instances.