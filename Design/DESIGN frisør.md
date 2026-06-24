---
name: Nordic Nocturne
colors:
  surface: '#131313'
  surface-dim: '#131313'
  surface-bright: '#393939'
  surface-container-lowest: '#0e0e0e'
  surface-container-low: '#1b1c1c'
  surface-container: '#1f2020'
  surface-container-high: '#2a2a2a'
  surface-container-highest: '#353535'
  on-surface: '#e4e2e1'
  on-surface-variant: '#c4c7c7'
  inverse-surface: '#e4e2e1'
  inverse-on-surface: '#303030'
  outline: '#8e9192'
  outline-variant: '#444748'
  surface-tint: '#c9c6c5'
  primary: '#c9c6c5'
  on-primary: '#313030'
  primary-container: '#0d0d0d'
  on-primary-container: '#7c7a7a'
  inverse-primary: '#5f5e5e'
  secondary: '#ebbf86'
  on-secondary: '#452b00'
  secondary-container: '#614316'
  on-secondary-container: '#dcb17a'
  tertiary: '#c6c6c7'
  on-tertiary: '#2f3131'
  tertiary-container: '#0b0d0e'
  on-tertiary-container: '#797b7b'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#e5e2e1'
  primary-fixed-dim: '#c9c6c5'
  on-primary-fixed: '#1c1b1b'
  on-primary-fixed-variant: '#474646'
  secondary-fixed: '#ffddb4'
  secondary-fixed-dim: '#ebbf86'
  on-secondary-fixed: '#291800'
  on-secondary-fixed-variant: '#5f4114'
  tertiary-fixed: '#e2e2e2'
  tertiary-fixed-dim: '#c6c6c7'
  on-tertiary-fixed: '#1a1c1c'
  on-tertiary-fixed-variant: '#454747'
  background: '#131313'
  on-background: '#e4e2e1'
  surface-variant: '#353535'
typography:
  headline-xl:
    fontFamily: Playfair Display
    fontSize: 64px
    fontWeight: '400'
    lineHeight: '1.1'
    letterSpacing: -0.02em
  headline-xl-mobile:
    fontFamily: Playfair Display
    fontSize: 40px
    fontWeight: '400'
    lineHeight: '1.2'
    letterSpacing: -0.01em
  headline-lg:
    fontFamily: Playfair Display
    fontSize: 48px
    fontWeight: '400'
    lineHeight: '1.2'
  headline-md:
    fontFamily: Playfair Display
    fontSize: 32px
    fontWeight: '400'
    lineHeight: '1.3'
  body-lg:
    fontFamily: Hanken Grotesk
    fontSize: 18px
    fontWeight: '300'
    lineHeight: '1.6'
    letterSpacing: 0.01em
  body-md:
    fontFamily: Hanken Grotesk
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.6'
  label-caps:
    fontFamily: Hanken Grotesk
    fontSize: 12px
    fontWeight: '600'
    lineHeight: '1'
    letterSpacing: 0.2em
spacing:
  unit: 8px
  container-max: 1440px
  gutter: 24px
  section-padding-desktop: 120px
  section-padding-mobile: 64px
---

## Brand & Style
The brand personality is rooted in "Quiet Luxury"—a philosophy of restraint, quality, and atmospheric depth. Targeting a discerning clientele in Oslo, the design evokes the serene, exclusive ambiance of a high-end boutique hotel or a private spa retreat. 

The style is a blend of **Sophisticated Minimalism** and **High-Contrast Noir**. It relies on the tension between deep, near-black voids and razor-sharp, gold-accented details. The emotional response should be one of immediate calm, prestige, and "hushed" exclusivity. Every element is intentional; there is no visual clutter, only essential information presented with architectural precision.

## Colors
The palette is strictly curated to maintain a high-end, nocturnal aesthetic.

- **Primary (#0d0d0d):** The "Nocturne" base. Used for all major backgrounds to create depth and a sense of infinite space.
- **Secondary (#c9a06a):** "Burnished Gold." Used sparingly for interactive accents, subtle dividers, and high-value callouts. It represents the warmth of the salon interior.
- **High-Contrast Text (#ffffff):** Pure white, used for primary headings and body copy to ensure absolute legibility against the dark void.
- **Muted Neutral (#262626):** Used for subtle UI containers, input fields, or secondary borders where pure black lacks sufficient definition.

## Typography
The typography contrasts the editorial elegance of **Playfair Display** with the modern, precise clarity of **Hanken Grotesk**.

- **Headlines:** Set in Playfair Display. Large scale headings should utilize slight negative letter-spacing to feel more "locked" and intentional.
- **Body:** Hanken Grotesk is used at a light weight (300) for large blocks of text to maintain a sophisticated, airy feel.
- **Navigation & Labels:** Always uppercase with generous letter-spacing (0.2em) to evoke luxury branding found in high-fashion houses.
- **Language:** All micro-copy and labels must be in Norwegian (e.g., "Bestill Time" instead of "Book Now").

## Layout & Spacing
The layout follows a **Fixed Grid** philosophy with extreme white (black) space. 

- **Desktop:** A 12-column grid with a maximum width of 1440px. Gutters are kept at 24px, but margins are expansive to center the content as a "gallery" piece.
- **Vertical Rhythm:** Sections are separated by massive vertical padding (120px+) to allow the eye to rest and to signify the slow, relaxed pace of a luxury service.
- **Asymmetry:** Use intentional offset placements for imagery and text blocks to create a contemporary, editorial feel. 
- **Mobile:** Transition to a 4-column grid with 16px gutters. Reduce section padding to 64px, ensuring that full-bleed imagery maintains the atmospheric impact.

## Elevation & Depth
In this design system, depth is not created through shadows, but through **Tonal Layering** and **Atmospheric Lighting**.

- **Surfaces:** Use `#0d0d0d` for the base level. Secondary surfaces (like cards or menu overlays) use `#1a1a1a` or a very subtle gold-tinted border (1px).
- **Outlines:** Use "Ghost Borders"—ultra-thin 1px lines in either `#262626` or `#c9a06a` at 30% opacity. 
- **Imagery:** High-end photography should be treated with a slight desaturation or a warm, dark overlay to blend seamlessly into the background.
- **Shadows:** No shadows are permitted. Objects are either flush with the surface or exist in a separate plane defined by hard edges.

## Shapes
The shape language is strictly **Sharp (0px)**. This reinforces the architectural, high-end nature of the brand.

- **Buttons & Inputs:** Hard 90-degree corners only.
- **Images:** Always rectangular or square with sharp edges. No circular avatars; use square crops for stylist profiles.
- **Dividers:** 1px solid lines. Horizontal dividers should often be full-bleed or extend to grid boundaries to emphasize the structure.

## Components
- **Buttons:** Primary buttons are transparent with a 1px Gold (#c9a06a) border and white uppercase text. On hover, the background fills with Gold and text changes to Primary Black.
- **Chips/Tags:** Used for hair services (e.g., "Klipp," "Farge"). These are small, uppercase Hanken Grotesk labels with a thin Gold left-border only.
- **Lists:** Service menus should be minimalist: Service Name (Left), Price (Right), with a very faint dotted line or empty space between them.
- **Input Fields:** Bottom-border only (1px white or gold). No box enclosure. Floating labels in Hanken Grotesk.
- **Cards:** Used for "Treatments" or "Gallery." Cards have no background or shadow; they are defined by the sharp-edged image they contain and the typography beneath them.
- **Booking Modal:** A full-screen overlay in Primary Black with Gold accents, ensuring the user feels they have entered a "private" space for their appointment.