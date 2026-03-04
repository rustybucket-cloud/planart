# PlanArt Visual Design System

## Overview
PlanArt's design system creates a **distinctive, professional, and warm** creative tool that balances technical precision with approachability. This documentation ensures visual consistency across the entire application.

---

## Design Philosophy

### Core Values
1. **Technical Yet Warm**: Professional tools with human touch
2. **Distinctive Identity**: Memorable aesthetics that avoid generic AI patterns
3. **Creative Empowerment**: Design that gets out of the way while inspiring
4. **Accessible Excellence**: Beautiful AND usable by everyone

### Aesthetic Direction
**"Architect's Studio Meets Creative Workshop"**

- **Foundation**: Dark, sophisticated blue-gray backgrounds (`#1a1d28`, `#0f1117`)
- **Accent**: Warm, earthy terracotta palette (`#d4845e`, `#fb923c`)
- **Typography**: Mix of elegant serif (Crimson Pro) and clean sans (Outfit)
- **Surfaces**: Glass-morphic floating panels with subtle depth and backdrop blur
- **Motion**: Smooth, purposeful micro-interactions (200-400ms)

---

## Design System Structure

### 1. [Color Palette](./color-palette.md)
**Core colors, gradients, and usage guidelines**

**Quick Reference:**
- **Primary**: Terracotta `#d4845e` (all pages, primary accent)
- **Secondary**: Warm Orange `#fb923c` (gradients, highlights)
- **Tertiary**: Golden Earth `#fbbf24` (gradient endpoints, special highlights)
- **Backgrounds**: Deep Blue-Gray `#1a1d28` → Darker Blue-Gray `#0f1117` (panels/cards)
- **Text**: White `#FFFFFF` → Muted Gray `#8b8d98` → Dark Gray `#737373`

**When to use:**
- Terracotta: Primary buttons, borders, hover states, selection rings
- Warm Orange: Gradients (paired with terracotta), secondary accents
- Golden Earth: Sparingly for gradient endpoints

### 2. [Typography](./typography.md)
**Font families, scales, and text styling**

**Quick Reference:**
- **Primary**: Outfit (sans-serif) - UI, body text
- **Secondary**: Crimson Pro (serif) - Canvas headers, creative emphasis
- **Tertiary**: Monospace - Technical data, coordinates

**Type Scale:**
```
text-3xl (30px)  - Page titles
text-2xl (24px)  - Section headers
text-xl (20px)   - Subsection headers
text-base (16px) - Body text
text-sm (14px)   - Secondary text
text-xs (12px)   - Metadata
```

### 3. [UI Patterns](./ui-patterns.md)
**Component designs and interaction patterns**

**Key Components:**
- **Buttons**: Primary (gradient), Ghost (transparent hover), Icon (44×44px)
- **Floating Panels**: Glass-morphic with `backdrop-blur-xl`
- **Headers**: Sticky with blur, max-width 1800px
- **Selection Rings**: 2px colored ring with glow shadow
- **Status Badges**: Accent/10 background, monospace text

**Glass-Morphic Pattern:**
```tsx
className="
  bg-[#0f1117]/90
  backdrop-blur-xl
  border border-[#d4845e]/20
  rounded-2xl
  shadow-2xl shadow-black/40
"
```

### 4. [Layout & Spacing](./layout-spacing.md)
**Spacing system, grids, and responsive design**

**Spacing Scale (4px grid):**
- `gap-2` (8px) - Tight groups
- `gap-3` (12px) - Normal groups
- `gap-4` (16px) - Comfortable spacing
- `gap-6` (24px) - Section spacing
- `gap-8` (32px) - Generous spacing
- `gap-12` (48px) - Major sections

**Common Patterns:**
- Card padding: `p-6` (24px)
- Page padding: `px-8 py-8` (32px)
- Icon button: `w-11 h-11` (44×44px)
- Container max: `max-w-[1800px]`

### 5. [Animation & Motion](./animation-motion.md)
**Transition timing, easing, and motion patterns**

**Duration Standards:**
- Hover: `200ms`
- Transitions: `300ms`
- Entrances: `400ms`
- Max duration: `600ms`

**Performance:**
- ✅ Animate: `transform`, `opacity`
- ❌ Avoid: `width`, `height`, `top`, `left`

**Accessibility:**
- Respect `prefers-reduced-motion`
- Keep animations subtle and fast

---

## Context-Specific Design

### Home Page / Project Lists
**Purpose**: Navigation and project management

**Design**:
- Terracotta accent (`#d4845e`) for all interactive elements
- Outfit typography for body text
- Card grids with glass-morphic styling
- Warm, cohesive aesthetic

**Pattern**:
```tsx
<Card className="
  bg-[#0f1117]/60
  backdrop-blur-sm
  border border-[#d4845e]/20
  hover:border-[#d4845e]/50
  hover:shadow-[0_0_40px_rgba(212,132,94,0.15)]
  transition-all duration-300
">
```

### Canvas Pages
**Purpose**: Creative workspace and editing

**Design**:
- Same terracotta accent (`#d4845e`) for consistency
- Crimson Pro for canvas headers and creative text elements
- Floating toolbars with glass-morphism
- Dot grid background for spatial awareness

**Pattern**:
```tsx
<header style={{ fontFamily: "'Crimson Pro', serif" }} className="text-xl font-bold">
  Canvas 1
</header>

<Button className="hover:bg-[#d4845e]/20 transition-all duration-300">
```

**Why unified palette?**
- Consistent brand identity across all pages
- Simpler development and maintenance
- Warm, architect's studio aesthetic applies everywhere
- Terracotta evokes craftsmanship and materiality throughout the app

---

## Component Library

### Shadcn UI
PlanArt uses [Shadcn UI](https://ui.shadcn.com/) as the base component library.

**Installation:**
```bash
npx shadcn@latest add [component]
```

**Installed Components:**
- `button` - All button variants
- `toggle` - Binary switches
- `switch` - Toggle switches
- _(Add more as needed)_

**Customization:**
Always apply brand styling on top of Shadcn defaults:
```tsx
import { Button } from "@/components/ui/button";

<Button className="bg-gradient-to-br from-[#FF6B5A] to-[#FB923C]">
  Custom Style
</Button>
```

---

## Design Tokens

### CSS Variables
Core design values (can be added to `src/index.css` if needed):

```css
:root {
  /* Brand Colors */
  --terracotta: #d4845e;
  --warm-orange: #fb923c;
  --golden-earth: #fbbf24;

  /* Backgrounds */
  --bg-deep: #1a1d28;
  --bg-panel: #0f1117;

  /* Text */
  --text-primary: #FFFFFF;
  --text-secondary: #8b8d98;
  --text-tertiary: #737373;

  /* Spacing */
  --radius: 0.75rem; /* 12px base radius */
}
```

### Using CSS Variables with Tailwind

All brand colors are available as CSS variables through Tailwind:

```tsx
// Brand colors
className="bg-terracotta"              // #d4845e
className="bg-warm-orange"             // #fb923c
className="bg-golden-earth"            // #fbbf24

// With opacity
className="bg-terracotta/20"           // 20% opacity
className="border-terracotta/50"       // 50% opacity

// Backgrounds
className="bg-bg-deep"                 // #1a1d28
className="bg-bg-panel/60"             // #0f1117 at 60% opacity

// Text
className="text-text-secondary"        // #8b8d98
className="text-text-tertiary"         // #737373

// Gradients
className="bg-gradient-to-r from-terracotta to-warm-orange"
```

This approach is **preferred** because:
- Easy to update colors globally by changing CSS variables
- Consistent naming across the codebase
- Better maintainability than hardcoded hex values
- Auto-completion in IDEs that support Tailwind

---

## Responsive Design

### Breakpoints
```
sm:  640px   - Small tablets (rarely used)
md:  768px   - Tablets
lg:  1024px  - Small desktops
xl:  1280px  - Large desktops
2xl: 1536px  - Ultra-wide screens
```

### Mobile-First Strategy
Start with mobile styles, enhance for larger screens:
```tsx
<div className="px-4 md:px-8 lg:px-12">
  {/* Progressive spacing */}
</div>

<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
  {/* Responsive grid */}
</div>
```

### Touch Targets
- **Mobile**: Minimum 44×44px (WCAG AAA)
- **Desktop**: Can go smaller (36×36px) for mouse-only interactions

---

## Accessibility Standards

### WCAG Compliance
PlanArt targets **WCAG 2.1 AA** compliance:

- ✅ Color contrast ratios: 4.5:1 (text), 3:1 (large text)
- ✅ Keyboard navigation support
- ✅ Focus indicators (visible rings)
- ✅ Touch targets (44×44px minimum)
- ✅ Semantic HTML
- ✅ ARIA labels for icon-only buttons
- ✅ Respect `prefers-reduced-motion`

### Testing Checklist
- [ ] All text meets contrast requirements
- [ ] All interactive elements have visible focus states
- [ ] Keyboard navigation works throughout
- [ ] Screen reader announces elements correctly
- [ ] Animations respect reduced motion preference
- [ ] Touch targets meet size requirements

---

## Design Anti-Patterns

### ❌ Avoid These Mistakes

**Visual:**
- Generic AI aesthetics (Inter font, purple gradients on white)
- Overused color schemes (tech startup blue)
- Flat interfaces without depth or hierarchy
- Inconsistent border radius across components

**Layout:**
- Arbitrary spacing values (stick to 4px grid)
- Cramped touch targets (< 36×36px)
- Ultra-wide content (> 1800px) without max-width
- Misaligned elements (use flex/grid properly)

**Animation:**
- Long animations (> 600ms) for UI interactions
- Animating layout properties (width, height, top, left)
- Motion without purpose ("looks cool" isn't enough)
- Ignoring accessibility preferences

**Typography:**
- More than 3 font families
- Text smaller than 12px for body content
- Pure black (#000) on dark backgrounds
- Inconsistent font weights

---

## Workflow Guidelines

### Starting a New Component

1. **Check existing patterns** in this documentation
2. **Use Shadcn** for base components when available
3. **Apply brand styling** with Tailwind classes
4. **Test responsiveness** at all breakpoints
5. **Verify accessibility** with keyboard and screen reader
6. **Document** any new patterns for future reference

### Making Design Changes

1. **Propose changes** that improve consistency
2. **Update documentation** if patterns change
3. **Test across pages** to ensure consistency
4. **Get feedback** before large visual overhauls

### Adding New Colors

1. **Avoid** adding colors outside the established palette
2. **If necessary**, document usage guidelines
3. **Test contrast** for accessibility
4. **Update** color-palette.md documentation

---

## Tools & Resources

### Design Tools
- **Figma**: For mockups and prototyping _(optional)_
- **Chrome DevTools**: For inspecting colors, spacing, animations
- **WebAIM Contrast Checker**: For color accessibility

### Code Tools
- **Tailwind CSS**: Utility-first styling
- **Shadcn UI**: Pre-built accessible components
- **Lucide React**: Icon library (consistent style)
- **Framer Motion**: Advanced animations _(when needed)_

### Testing Tools
- **Lighthouse**: Performance and accessibility audits
- **WAVE**: Web accessibility evaluation
- **Keyboard navigation**: Manual testing (Tab, Enter, Space, Esc)

---

## Quick Reference Card

### Colors (CSS Variables)
```
terracotta        → #d4845e  (Primary accent - all pages)
warm-orange       → #fb923c  (Secondary accent, gradients)
golden-earth      → #fbbf24  (Gradient highlights)
bg-deep           → #1a1d28  (Base background)
bg-panel          → #0f1117  (Elevated surfaces)
text-secondary    → #8b8d98  (Muted text)
text-tertiary     → #737373  (De-emphasized text)
```

Usage: `bg-terracotta`, `text-text-secondary`, `border-terracotta/20`

### Typography
```
Outfit      - UI, body
Crimson Pro - Headers, creative
Monospace   - Technical data
```

### Spacing
```
p-3   (12px)  - Compact padding
p-6   (24px)  - Standard padding
gap-3 (12px)  - Normal gap
gap-6 (24px)  - Section gap
```

### Animations
```
duration-200  - Hover feedback
duration-300  - Standard transitions
duration-400  - Smooth entrances
```

### Components
```
Glass panel:  bg-[#0f1117]/60 backdrop-blur-sm border border-[#d4845e]/20
Icon button:  w-12 h-12 (48×48px) hover:bg-[#d4845e]/20
Border:       border-[#d4845e]/20 (default), border-[#d4845e]/50 (hover)
Shadow:       shadow-2xl shadow-black/40
Ring:         ring-2 ring-[#d4845e] (selected)
```

---

## Version History

### v1.1 - Unified Palette (Current)
- **Unified color palette**: Terracotta accent across all pages (Home, Projects, Canvas)
- **Updated Home.tsx**: Matches Canvas.tsx aesthetics with glass-morphism and warm terracotta
- **Simplified color system**: Single primary accent instead of context-specific colors
- **Updated documentation**: Color palette, UI patterns, and README reflect unified approach
- **Warmer gradients**: All thumbnail and project gradients use earthy terracotta tones

### v1.0 - Canvas Launch
- Initial design system documentation
- Canvas page aesthetic (terracotta accent)
- Typography guidelines (Crimson Pro integration)
- Component patterns (glass-morphic UI)
- Animation standards
- Spacing system codification

### Future
- Light mode support _(if needed)_
- Additional component patterns
- Advanced animation recipes
- User customizable accent colors

---

## Contributing to Design

When adding new visual patterns:

1. **Check existing docs** - Does a pattern already exist?
2. **Maintain consistency** - Follow established principles
3. **Document decisions** - Update relevant .md files
4. **Test thoroughly** - Responsive, accessible, performant
5. **Iterate based on usage** - Refine patterns over time

**Questions or suggestions?**
Design decisions should balance aesthetics, usability, accessibility, and performance. When in doubt, prioritize consistency and clarity.

---

## Further Reading

- [Color Palette](./color-palette.md) - Complete color system
- [Typography](./typography.md) - Font choices and text styling
- [UI Patterns](./ui-patterns.md) - Component designs
- [Layout & Spacing](./layout-spacing.md) - Spacing and responsive design
- [Animation & Motion](./animation-motion.md) - Transitions and micro-interactions

---

**PlanArt Design System** - Last updated: Canvas Launch (v1.0)
