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

- **Foundation**: Dark, sophisticated backgrounds (charcoal navy)
- **Accent**: Warm, grounded colors (terracotta, coral, sunset orange)
- **Typography**: Mix of elegant serif (Crimson Pro) and clean sans (Outfit)
- **Surfaces**: Glass-morphic floating panels with subtle depth
- **Motion**: Smooth, purposeful micro-interactions

---

## Design System Structure

### 1. [Color Palette](./color-palette.md)
**Core colors, gradients, and usage guidelines**

**Quick Reference:**
- **App Primary**: Coral `#FF6B5A`
- **Canvas Primary**: Terracotta `#d4845e`
- **Secondary**: Teal `#2DD4BF`
- **Backgrounds**: Deep Black `#0A0A0A` → Charcoal `#1A1A1A` → Soft Black `#2A2A2A`

**When to use:**
- Coral: Main app navigation, primary actions (Home, Projects)
- Terracotta: Canvas workspace, creative tools
- Teal: Secondary actions, informational elements

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
- Coral accent (`#FF6B5A`)
- Outfit typography
- Card grids with hover states
- Generous whitespace

**Pattern**:
```tsx
<Card className="
  hover:border-[#FF6B5A]/50
  hover:shadow-xl
  transition-all duration-300
">
```

### Canvas Pages
**Purpose**: Creative workspace and editing

**Design**:
- Terracotta accent (`#d4845e`)
- Crimson Pro for headers
- Floating toolbars
- Dot grid background

**Pattern**:
```tsx
<header style={{ fontFamily: "'Crimson Pro', serif" }}>
  Canvas 1
</header>

<Button className="hover:bg-[#d4845e]/20">
```

**Why different accents?**
- Creates visual distinction between navigation (coral) and workspace (terracotta)
- Terracotta feels more grounded and material (architect's clay)
- Helps users mentally separate "browsing" from "creating"

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
Core design values are defined in `src/index.css`:

```css
:root {
  /* Brand Colors */
  --coral: #FF6B5A;
  --teal: #2DD4BF;
  --sunset-orange: #FB923C;
  --terracotta: #d4845e;

  /* Backgrounds */
  --deep-black: #0A0A0A;
  --charcoal: #1A1A1A;
  --soft-black: #2A2A2A;

  /* Text */
  --text-primary: #FFFFFF;
  --text-secondary: #A3A3A3;
  --text-tertiary: #737373;

  /* Spacing */
  --radius: 0.625rem; /* 10px base radius */
}
```

### Tailwind Configuration
Custom colors and utilities in `tailwind.config.js`:
```js
theme: {
  extend: {
    colors: {
      coral: '#FF6B5A',
      terracotta: '#d4845e',
      // ...
    }
  }
}
```

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

### Colors
```
Coral:       #FF6B5A  (App primary)
Terracotta:  #d4845e  (Canvas primary)
Teal:        #2DD4BF  (Secondary)
Deep Black:  #0A0A0A  (Background)
```

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
Glass panel:  bg-[#0f1117]/90 backdrop-blur-xl
Icon button:  w-11 h-11 (44×44px)
Border:       border-[#d4845e]/20
Shadow:       shadow-2xl shadow-black/40
```

---

## Version History

### v1.0 - Canvas Launch (Current)
- Initial design system documentation
- Canvas page aesthetic (terracotta accent)
- Typography guidelines (Crimson Pro integration)
- Component patterns (glass-morphic UI)
- Animation standards
- Spacing system codification

### Future
- Light mode support _(if needed)_
- Additional component patterns
- Expanded color palette for features
- Advanced animation recipes

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
