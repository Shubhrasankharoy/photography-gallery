# CaptureSpace Design System (design.md)

# Vision

CaptureSpace should feel like a premium photography platform, not a typical SaaS dashboard.

The overall feeling should be:

- Premium
- Elegant
- Luxury
- Minimal
- Editorial
- Timeless
- Photography First
- Apple level polish
- Linear level consistency
- Framer level animations
- Nothing should feel "template based"

Every component should breathe with generous whitespace.

The photographs should always be the hero.

---

# Design Philosophy

CaptureSpace is designed for professional photographers.

The UI should disappear.

The photographs should speak.

Every screen should feel like opening a premium wedding album.

Avoid unnecessary decorations.

Avoid gradients everywhere.

Avoid colorful UI.

Use color only for emphasis.

---

# Color Palette

## Primary

Gold

HEX

#D4AF37

Purpose

- Primary Buttons
- Active Navigation
- Links on Hover
- Focus Ring
- Progress Bars
- Selected Cards
- Important Badges
- Premium Indicators

Never overuse gold.

Gold is an accent.

Not the background.

---

## Secondary

Dark

HEX

#2F2F2F

Purpose

- Dark surfaces
- Cards
- Navigation
- Inputs
- Secondary Buttons
- Dark Mode Background

---

## Tertiary

Light

HEX

#F5F5F5

Purpose

- Light backgrounds
- Section backgrounds
- Inputs
- Cards
- Skeleton loaders

---

## Neutral

HEX

#8E8E8E

Purpose

- Secondary text
- Disabled Buttons
- Placeholders
- Borders
- Icons

---

# Backgrounds

## Dark Mode

Primary Background

#181818

Secondary Background

#202020

Card Background

#262626

Hover

#2D2D2D

Border

rgba(255,255,255,0.06)

---

## Light Mode

Primary Background

#FFFFFF

Secondary Background

#F7F7F7

Card Background

#FFFFFF

Hover

#FAFAFA

Border

rgba(0,0,0,0.06)

---

# Typography

## Headlines

Font

Playfair Display

Usage

- Hero Title
- Landing Pages
- Gallery Title
- Photographer Name
- Wedding Name
- Section Headers

Weight

600-700

Never use Playfair for paragraphs.

---

## Body

Font

Inter

Weights

400

500

600

700

Use Inter everywhere else.

Examples

Navigation

Buttons

Forms

Tables

Cards

Dashboard

Settings

Inputs

Notifications

---

# Border Radius

Buttons

12px

Cards

20px

Dialogs

24px

Inputs

12px

Images

18px

Gallery Cards

20px

Floating Panels

24px

---

# Shadows

Use very soft shadows.

Never heavy shadows.

Dark Mode

0 8px 30px rgba(0,0,0,.25)

Light Mode

0 8px 24px rgba(0,0,0,.08)

---

# Spacing

Use an 8-point spacing system.

4

8

12

16

20

24

32

40

48

64

96

Never use random spacing.

---

# Buttons

Primary

Gold background

Dark text

Rounded

Medium weight

Hover

Slightly brighter

Scale 1.02

150ms transition

---

Secondary

Dark surface

Light text

Border

Subtle hover

---

Outlined

Transparent

1px border

Hover fills softly

---

Danger

Soft red

Never pure red.

---

# Inputs

Rounded

Large padding

Soft border

Focus

Gold outline

2px ring

Placeholder

Neutral Grey

---

# Cards

Rounded

Large padding

Soft shadow

No visible border unless needed.

Cards should feel like floating paper.

---

# Icons

Use Lucide Icons only.

Stroke Width

1.8

Never mix icon packs.

---

# Animations

Everything should animate.

Hover

150ms

Page Transition

300ms

Modal

200ms

Dropdown

150ms

Sidebar

250ms

Photo Hover

Scale

1.03

Never use flashy animations.

Everything should feel smooth.

---

# Glass Effects

Use sparingly.

Only on

Navbar

Floating controls

Context menus

Dialogs

Use

backdrop-blur

Low opacity

---

# Navigation

Minimal

Centered

Premium

Sticky

Transparent until scrolling.

No oversized headers.

---

# Gallery

Photos must dominate.

Large masonry layout.

Rounded corners.

Hover reveals controls.

Metadata should remain minimal.

Lightbox should feel cinematic.

Dark background.

---

# Dashboard

Clean.

Minimal.

No enterprise look.

Large cards.

Good whitespace.

Rounded panels.

Consistent spacing.

---

# Forms

Simple.

Single-column where possible.

Comfortable spacing.

Large clickable areas.

Clear validation.

---

# Tables

Avoid traditional tables when possible.

Prefer cards.

If tables are required

Rounded

Soft hover

Minimal borders

---

# Dialogs

Centered

Rounded

Large padding

Subtle animation

Blurred background

---

# Empty States

Elegant illustrations

Helpful message

Primary CTA

No unnecessary decoration

---

# Loading

Skeleton loaders

Soft shimmer

Never use spinners unless necessary.

---

# Notifications

Rounded Toasts

Minimal

Small icons

No giant banners.

---

# Photography Rules

Photography always comes before UI.

Never crop faces awkwardly.

Maintain aspect ratio.

Support lazy loading.

Smooth image loading.

Beautiful transitions.

---

# Accessibility

Minimum contrast ratio

Keyboard navigation

Visible focus states

ARIA labels

Screen reader support

Large touch targets

---

# Responsive Design

Desktop First

Then

Laptop

Tablet

Mobile

No horizontal scrolling.

Every page should feel intentionally designed on every screen size.

---

# Components

Every new component must follow this design system.

Never invent new colors.

Never invent new fonts.

Never invent new shadows.

Never invent new border radius.

Always reuse design tokens.

---

# Theme Rules

Support both

Light Mode

Dark Mode

Both themes must feel equally premium.

Do not simply invert colors.

Adjust surfaces individually.

---

# Performance

Animations should use GPU transforms.

Images should be optimized.

Avoid layout shifts.

Lazy load wherever possible.

---

# Consistency Rules

Before creating any new page or component, verify:

- Uses Playfair Display only for headings.
- Uses Inter everywhere else.
- Uses only the approved color palette.
- Uses the approved spacing scale.
- Uses consistent border radius.
- Uses approved shadows.
- Uses approved animation timings.
- Supports both Light and Dark mode.
- Matches the existing CaptureSpace design language.

---

# Golden Rule

Whenever implementing any UI or UX change:

Do not build a page.

Design an experience.

Every screen should look like software made specifically for luxury wedding photographers, where elegance, simplicity, and the photography itself are always the primary focus.