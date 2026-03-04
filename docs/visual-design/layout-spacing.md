# Layout & Spacing System

## Philosophy
PlanArt uses a **consistent spacing system** based on Tailwind's 4px grid. Generous whitespace creates breathing room and hierarchy, while tight spacing groups related elements. The goal is **visual clarity without clutter**.

---

## Spacing Scale

### Base Unit: 4px
All spacing uses multiples of 4px for visual consistency.

| Class | Pixels | Usage |
|-------|--------|-------|
| `gap-1` / `p-1` | 4px | Minimal spacing (tight groups) |
| `gap-2` / `p-2` | 8px | Very compact (icon lists) |
| `gap-3` / `p-3` | 12px | Compact (toolbar items) |
| `gap-4` / `p-4` | 16px | Standard (card padding) |
| `gap-6` / `p-6` | 24px | Comfortable (section padding) |
| `gap-8` / `p-8` | 32px | Generous (modal content) |
| `gap-12` / `p-12` | 48px | Very generous (page sections) |
| `gap-16` / `p-16` | 64px | Extra generous (hero sections) |

---

## Component Spacing Guidelines

### Buttons

#### Icon Button Sizing
```tsx
// Small: 36×36px
<Button size="icon" className="w-9 h-9 p-2">
  <Icon className="w-5 h-5" />
</Button>

// Standard: 44×44px (recommended)
<Button size="icon" className="w-11 h-11 p-2.5">
  <Icon className="w-5 h-5" />
</Button>

// Large: 48×48px
<Button size="icon" className="w-12 h-12 p-3">
  <Icon className="w-6 h-6" />
</Button>
```

#### Button Groups
```tsx
// Horizontal: 12px gap
<div className="flex items-center gap-3">
  <Button />
  <Button />
</div>

// Vertical: 8px gap
<div className="space-y-2">
  <Button />
  <Button />
</div>
```

### Toolbars & Navigation

#### Horizontal Toolbar
```tsx
<div className="px-8 py-4 flex items-center justify-between">
  {/* 32px horizontal padding, 16px vertical */}
</div>
```

#### Floating Toolbar (Vertical)
```tsx
<div className="p-3 space-y-2">
  {/* 12px padding, 8px between buttons */}
  <Button />
  <Button />
  <div className="h-px bg-accent/20 my-2" /> {/* 8px margin divider */}
  <Button />
</div>
```

### Cards & Panels

#### Card Padding
```tsx
// Compact card
<div className="p-4">           // 16px all sides

// Standard card
<div className="p-6">           // 24px all sides

// Large card/modal
<div className="p-8">           // 32px all sides
```

#### Card Spacing in Grids
```tsx
// Grid gap: 24px
<div className="grid grid-cols-3 gap-6">
  <Card />
  <Card />
  <Card />
</div>

// Tight grid: 16px
<div className="grid grid-cols-4 gap-4">
```

### Content Sections

#### Section Vertical Spacing
```tsx
// Between major sections: 48-64px
<section className="mb-12">      // 48px
<section className="mb-16">      // 64px

// Between subsections: 32px
<div className="mb-8">

// Between related items: 16-24px
<div className="mb-4">           // 16px
<div className="mb-6">           // 24px
```

#### Content Width Containers
```tsx
// Standard page: 1800px max
<div className="max-w-[1800px] mx-auto px-8">

// Narrow content: 1200px max
<div className="max-w-6xl mx-auto px-8">

// Text content: 768px max
<div className="max-w-3xl mx-auto px-8">
```

---

## Page Layouts

### Full-Height Page
```tsx
<div className="min-h-screen">
  <header className="sticky top-0 z-50">
    {/* Header content */}
  </header>

  <main className="min-h-[calc(100vh-80px)]">
    {/* Main content */}
  </main>
</div>
```

### Centered Content
```tsx
<div className="flex items-center justify-center min-h-screen">
  <div className="text-center max-w-2xl px-8">
    {/* Centered content */}
  </div>
</div>
```

### Canvas Layout (Fixed Positioning)
```tsx
<div className="fixed inset-0 top-[73px]">
  {/* Canvas fills remaining height after header */}
</div>

{/* Floating UI */}
<div className="fixed left-8 top-1/2 -translate-y-1/2">
  {/* Left toolbar */}
</div>

<div className="fixed right-8 bottom-8">
  {/* Bottom-right controls */}
</div>
```

---

## Grid Systems

### Responsive Grid
```tsx
// Auto-fit cards
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
  <Card />
  <Card />
  <Card />
</div>
```

**Breakpoints:**
- `md`: 768px (2 columns)
- `lg`: 1024px (3 columns)
- `xl`: 1280px (4 columns)
- `2xl`: 1536px (4-5 columns, optional)

### Fixed Columns
```tsx
// Always 4 columns
<div className="grid grid-cols-4 gap-6">

// Asymmetric layout (sidebar + main)
<div className="grid grid-cols-12 gap-8">
  <aside className="col-span-3">    {/* 3/12 = 25% */}
  <main className="col-span-9">     {/* 9/12 = 75% */}
</div>
```

---

## Responsive Spacing

### Mobile (< 768px)
```tsx
// Reduce horizontal padding
px-8  →  px-4              // 32px → 16px

// Reduce section spacing
mb-16  →  mb-8             // 64px → 32px

// Reduce card padding
p-8  →  p-4                // 32px → 16px

// Reduce grid gaps
gap-6  →  gap-4            // 24px → 16px
```

### Implementation
```tsx
<div className="px-4 md:px-8 py-8 md:py-12">
  {/* Responsive padding */}
</div>

<div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
  {/* Responsive grid */}
</div>
```

---

## Z-Index Hierarchy

### Z-Index Scale
```css
/* Background elements */
-z-10              -10      (Behind normal flow)

/* Normal flow */
z-0                0        (Default)

/* Elevated */
z-10               10       (Cards, dropdowns)

/* Sticky elements */
z-30               30       (Help overlays, tooltips)

/* Floating UI */
z-40               40       (Toolbars, zoom controls)

/* Sticky header */
z-50               50       (Top navigation)

/* Modals */
z-[60]             60       (Dialog/modal backdrop)
z-[70]             70       (Dialog/modal content)
```

**Rules:**
- Never use arbitrary z-index values outside this scale
- Layer elements logically: header > floating UI > overlays > content
- Test stacking in complex views (canvas + modals + tooltips)

---

## Border Radius System

### Standard Scale
| Class | Radius | Usage |
|-------|--------|-------|
| `rounded` | 4px | Small elements, badges |
| `rounded-md` | 6px | Buttons, inputs |
| `rounded-lg` | 8px | Small cards, images |
| `rounded-xl` | 12px | Standard cards, panels |
| `rounded-2xl` | 16px | Large panels, toolbars |
| `rounded-3xl` | 24px | Hero sections, modals |

### Usage Guidelines
```tsx
// Buttons: rounded-lg (8px)
<Button className="rounded-lg">

// Cards: rounded-xl (12px)
<Card className="rounded-xl">

// Floating panels: rounded-2xl (16px)
<div className="rounded-2xl">

// Modals: rounded-3xl (24px)
<Dialog className="rounded-3xl">

// Icon containers: rounded-2xl (16px) - friendly, not too round
<div className="w-20 h-20 rounded-2xl">
```

**Consistency**: Keep border radius consistent within component families:
- All buttons: `rounded-lg`
- All floating panels: `rounded-2xl`
- All cards: `rounded-xl`

---

## Whitespace Philosophy

### Generous Whitespace
**Use generous spacing (32px+) for:**
- Between major page sections
- Around hero content
- Modal content areas
- Empty states

### Moderate Whitespace
**Use moderate spacing (16-24px) for:**
- Card content padding
- Between subsections
- Grid gaps
- List items

### Tight Spacing
**Use tight spacing (8-12px) for:**
- Button groups
- Toolbar items
- Inline tags/badges
- Icon lists

---

## Alignment & Positioning

### Horizontal Alignment
```tsx
// Left-aligned (default)
<div className="text-left">

// Center-aligned (headings, empty states)
<div className="text-center mx-auto">

// Right-aligned (actions, metadata)
<div className="text-right ml-auto">

// Justified (rare, for specific layouts)
<div className="text-justify">
```

### Vertical Alignment
```tsx
// Flex centering (most common)
<div className="flex items-center">       // Vertical center
<div className="flex justify-center">     // Horizontal center
<div className="flex items-center justify-center">  // Both

// Absolute centering
<div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
```

### Fixed Position Guidelines
```tsx
// Corners
fixed top-8 right-8        // Top-right
fixed bottom-8 right-8     // Bottom-right
fixed bottom-8 left-8      // Bottom-left
fixed top-8 left-8         // Top-left

// Edges
fixed left-8 top-1/2 -translate-y-1/2    // Left center
fixed right-8 top-1/2 -translate-y-1/2   // Right center

// Full-width fixed
fixed inset-x-0 top-0      // Top bar
fixed inset-x-0 bottom-0   // Bottom bar
```

---

## Common Layout Patterns

### Split Header
```tsx
<header className="px-8 py-4 flex items-center justify-between">
  <div className="flex items-center gap-4">
    {/* Left: Logo, title */}
  </div>
  <div className="flex items-center gap-3">
    {/* Right: Actions */}
  </div>
</header>
```

### Card Grid
```tsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-8">
  <Card />
  <Card />
  <Card />
</div>
```

### Sidebar + Main
```tsx
<div className="flex min-h-screen">
  <aside className="w-64 border-r border-white/10 p-6">
    {/* Sidebar */}
  </aside>
  <main className="flex-1 p-8">
    {/* Main content */}
  </main>
</div>
```

### Floating Overlay
```tsx
<div className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-30">
  <div className="bg-[#0f1117]/90 backdrop-blur-xl rounded-2xl p-8">
    {/* Centered content */}
  </div>
</div>
```

---

## Responsive Design Principles

### Mobile-First Approach
Start with mobile styles, add complexity at larger breakpoints:
```tsx
<div className="px-4 py-8 md:px-8 md:py-12 lg:px-12 lg:py-16">
  {/* Progressively enhanced spacing */}
</div>
```

### Breakpoint Strategy
- **Mobile** (default): Single column, reduced spacing
- **Tablet** (`md:`): 2 columns, moderate spacing
- **Desktop** (`lg:`): 3+ columns, full spacing
- **Wide** (`xl:`, `2xl:`): Max 4-5 columns, generous spacing

### Hide/Show at Breakpoints
```tsx
// Hide on mobile, show on desktop
<div className="hidden md:block">

// Show on mobile, hide on desktop
<div className="md:hidden">
```

---

## Accessibility Considerations

### Touch Target Sizes
- **Minimum**: 44×44px (WCAG AAA)
- **Recommended**: 48×48px for primary actions
- **Desktop-only**: Can go smaller (36×36px) if not touch-accessible

### Focus Indicators
- Never remove focus outlines
- Add visible focus rings: `focus:ring-2 focus:ring-[#d4845e]`
- Ensure focus rings have sufficient contrast

### Keyboard Navigation
- Logical tab order follows visual layout
- Skip links for long navigation sections
- Trap focus in modals

---

## Anti-Patterns to Avoid

❌ **Don't:**
- Use arbitrary spacing values (stick to the scale)
- Mix different spacing systems (4px grid vs 5px grid)
- Over-space elements (too much whitespace = disconnected)
- Under-space clickable elements (< 36×36px)
- Use inconsistent border radius (8px buttons + 24px cards = mismatched)
- Stack z-index layers randomly (creates overlap issues)

✅ **Do:**
- Use Tailwind's spacing scale consistently
- Test layouts at all breakpoints
- Maintain visual rhythm (consistent spacing patterns)
- Group related elements with tighter spacing
- Separate sections with generous spacing
- Keep container widths reasonable (< 1800px for readability)

---

## Quick Reference

### Common Spacing Values
- **Tight group**: `gap-2` (8px)
- **Normal group**: `gap-3` (12px)
- **Loose group**: `gap-4` (16px)
- **Card padding**: `p-6` (24px)
- **Section margin**: `mb-12` (48px)
- **Page padding**: `px-8 py-8` (32px)

### Common Sizes
- **Small icon button**: `w-9 h-9` (36×36px)
- **Standard button**: `w-11 h-11` (44×44px)
- **Large icon button**: `w-12 h-12` (48×48px)
- **Icon in button**: `w-5 h-5` (20×20px)
- **Hero icon**: `w-10 h-10` (40×40px)

### Container Widths
- **Full width**: No max-width
- **Wide**: `max-w-[1800px]`
- **Standard**: `max-w-6xl` (1152px)
- **Content**: `max-w-3xl` (768px)
