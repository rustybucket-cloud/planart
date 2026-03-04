# UI Patterns & Components

## Philosophy
PlanArt's UI components blend **technical precision** with **warm approachability**. We use glass-morphic surfaces, subtle shadows, and responsive micro-interactions to create interfaces that feel polished and professional without being sterile.

## Design System Principles

1. **Floating & Elevated**: UI elements float above the canvas/background with depth
2. **Glass-Morphism**: Subtle backdrop blur creates hierarchy without heaviness
3. **Purposeful Animation**: Smooth transitions that enhance (never distract)
4. **Warm Accents**: Coral/terracotta highlights guide attention
5. **Generous Touch Targets**: Minimum 44×44px for all interactive elements

---

## Core Components

### Buttons

#### Primary Button
**Usage**: Main actions, critical CTAs
```tsx
<Button className="bg-gradient-to-br from-[#FF6B5A] to-[#FB923C] hover:shadow-lg hover:shadow-[#FF6B5A]/30 transition-all duration-300">
  Create Project
</Button>
```
- Coral-to-orange gradient
- Glow on hover (shadow with color)
- Scale slightly on hover: `hover:scale-105`

#### Ghost Button (Icon)
**Usage**: Toolbar actions, secondary controls
```tsx
<Button
  variant="ghost"
  size="icon"
  className="hover:bg-[#d4845e]/20 transition-all duration-300"
>
  <Icon className="w-5 h-5" strokeWidth={2} />
</Button>
```
- Transparent by default
- Colored background on hover (accent/20 opacity)
- 12×12 size for comfortable clicking
- 2-2.5 strokeWidth for icons

#### Destructive Button
**Usage**: Delete, remove, cancel actions
```tsx
<Button
  variant="ghost"
  className="hover:bg-red-500/20 text-red-400"
>
  <Trash2 />
</Button>
```
- Red accent color
- Red/20 background on hover
- Always pair with icon for clarity

### Floating Panels

#### Glass-Morphic Panel
**Usage**: Toolbars, controls, floating UI
```tsx
<div className="bg-[#0f1117]/90 backdrop-blur-xl border border-[#d4845e]/20 rounded-2xl shadow-2xl shadow-black/40 p-3">
  {/* Content */}
</div>
```

**Anatomy**:
- **Background**: Dark with 90% opacity (`#0f1117/90`)
- **Backdrop blur**: `backdrop-blur-xl` for glass effect
- **Border**: Accent color at 20% opacity
- **Border radius**: `rounded-2xl` (16px) for friendly curves
- **Shadow**: Deep shadow with black/40 for depth
- **Padding**: `p-3` (12px) for compact toolbars

**Variants**:
```css
/* Compact (toolbar) */
p-3, rounded-2xl

/* Standard (card) */
p-6, rounded-2xl

/* Large (modal) */
p-8, rounded-3xl
```

### Headers

#### Sticky Header
**Usage**: Page navigation, context bar
```tsx
<header className="border-b border-[#d4845e]/20 bg-[#0f1117]/80 backdrop-blur-xl sticky top-0 z-50 shadow-lg shadow-black/20">
  <div className="max-w-[1800px] mx-auto px-8 py-4 flex items-center justify-between">
    {/* Navigation & Actions */}
  </div>
</header>
```

**Features**:
- Sticky positioning (stays visible on scroll)
- Glass-morphic background (80% opacity)
- Bottom border in accent color
- Max-width container for ultra-wide screens
- Flexible horizontal layout (justify-between)

### Interactive Elements

#### Selection Ring
**Usage**: Selected canvas elements, active states
```css
.selected {
  ring-2 ring-[#d4845e] shadow-lg shadow-[#d4845e]/30
}

.hoverable:hover {
  ring-2 ring-[#d4845e]/50
}
```
- 2px ring in accent color
- Matching colored shadow for glow effect
- 50% opacity on hover (subtle)
- Full opacity when selected (clear)

#### Toggle Switch
**Usage**: Binary options (tiling mode, settings)
```tsx
<Switch
  checked={tilingMode}
  onCheckedChange={setTilingMode}
  className="data-[state=checked]:bg-[#d4845e]"
/>
```
- Accent color when enabled
- Smooth toggle animation (built into Shadcn)
- Label below for vertical layouts

### Status Indicators

#### Badge
**Usage**: Counts, status labels
```tsx
<span className="px-2 py-1 bg-[#d4845e]/10 rounded text-[#d4845e] text-xs font-mono">
  12 objects
</span>
```
- Accent background at 10% opacity
- Accent text color
- Small monospace font
- Minimal padding for compactness

#### Keyboard Shortcut Display
```tsx
<kbd className="px-2 py-1 bg-[#d4845e]/10 rounded text-[#d4845e] font-mono">
  Ctrl+V
</kbd>
```
- Same styling as badge
- Use `<kbd>` semantic element
- Monospace font for technical accuracy

### Help Overlays

#### Empty State Guide
**Usage**: Instructional overlays when no content
```tsx
<div className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-30 pointer-events-none">
  <div className="bg-[#0f1117]/90 backdrop-blur-xl border border-[#d4845e]/20 rounded-2xl shadow-2xl shadow-black/40 p-8 text-center animate-fade-in">
    {/* Icon */}
    <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-[#d4845e] to-[#fb923c] flex items-center justify-center">
      <Icon className="w-10 h-10 text-white" />
    </div>

    {/* Title */}
    <h2 className="text-2xl font-bold mb-3" style={{ fontFamily: "'Crimson Pro', serif" }}>
      Start Creating
    </h2>

    {/* Instructions */}
    <div className="text-sm text-[#8b8d98] space-y-2">
      <p>Instructions here</p>
    </div>
  </div>
</div>
```

**Features**:
- Centered on screen
- Pointer-events-none (doesn't block interaction)
- Fade-in animation
- Gradient icon box
- Keyboard shortcuts with `<kbd>` elements

---

## Layout Patterns

### Horizontal Toolbar
```tsx
<div className="flex items-center gap-3">
  <Button /> <Button /> <Button />
</div>
```
- Flexbox horizontal layout
- 3-4 units gap (12-16px)
- Items centered vertically

### Vertical Toolbar
```tsx
<div className="space-y-2">
  <Button /> <Button />
  <div className="h-px bg-[#d4845e]/20 my-2" /> {/* Divider */}
  <Button />
</div>
```
- Stack spacing utility (`space-y-2`)
- Dividers for grouping (1px height, accent/20 color)
- Consistent spacing between sections

### Split Header Layout
```tsx
<div className="flex items-center justify-between">
  <div>{/* Left: Back button + Title */}</div>
  <div className="flex items-center gap-3">
    {/* Right: Actions */}
  </div>
</div>
```
- Primary content left
- Actions right
- Flexible width distribution

---

## Interaction Patterns

### Hover States
**All interactive elements should respond to hover:**

```css
/* Buttons */
.hover:bg-accent/20              /* Background color */
.hover:scale-105                 /* Subtle scale up */
.group-hover:scale-110           /* For icons inside buttons */

/* Links */
.hover:text-[#d4845e]           /* Color change */
.hover:underline                 /* Underline for text links */

/* Cards */
.hover:border-[#d4845e]/50      /* Border color change */
.hover:shadow-xl                 /* Elevation increase */
```

**Transition requirements:**
```css
transition-all duration-300      /* Smooth 300ms transitions */
```

### Active/Pressed States
```css
.active:scale-95                 /* Scale down when clicked */
.active:bg-accent/30             /* Slightly darker background */
```

### Focus States
```css
.focus:ring-2 .focus:ring-[#d4845e] .focus:ring-offset-2
```
- Visible ring for keyboard navigation
- Meets WCAG accessibility guidelines

### Disabled States
```css
.disabled:opacity-30             /* 30% opacity */
.disabled:cursor-not-allowed     /* System cursor feedback */
```

---

## Icon Guidelines

### Size Standards
| Context | Size | Tailwind Class |
|---------|------|----------------|
| Small button | 16px | `w-4 h-4` |
| Standard button | 20px | `w-5 h-5` |
| Large button | 24px | `w-6 h-6` |
| Hero icon | 40px+ | `w-10 h-10` |

### Stroke Weight
- **UI icons**: `strokeWidth={2}` (standard)
- **Emphasis icons**: `strokeWidth={2.5}` (bolder)
- **Subtle icons**: `strokeWidth={1.5}` (lighter)

### Icon Library
- **Primary**: Lucide React (consistent style)
- Always import from `lucide-react`
- Maintain consistent stroke weights within a view

---

## Responsive Behavior

### Mobile (< 768px)
- Reduce button padding: `p-2.5` → `p-2`
- Stack toolbars vertically if needed
- Hide non-essential actions (show in menu)
- Increase touch target sizes to 44×44px minimum

### Tablet (768px - 1024px)
- Standard sizing works well
- May reduce some padding slightly

### Desktop (> 1024px)
- Full feature visibility
- Hover states fully utilized
- Keyboard shortcuts prominent

---

## Color Context: App vs Canvas

### Main App (Home, Projects)
**Primary accent**: Coral `#FF6B5A`
```tsx
className="bg-[#FF6B5A] border-[#FF6B5A]/20 hover:shadow-[#FF6B5A]/30"
```

### Canvas Pages
**Primary accent**: Terracotta `#d4845e`
```tsx
className="bg-[#d4845e] border-[#d4845e]/20 hover:shadow-[#d4845e]/30"
```

**Why different?**
- Canvas needs a warmer, more grounded feel (architect's studio)
- Terracotta relates to creative materials (clay, earth)
- Differentiation between "navigation" (coral) and "workspace" (terracotta)

---

## Animation Timing

### Standard Transitions
```css
transition-all duration-300      /* Default: 300ms */
transition-colors duration-200   /* Quick: Color-only */
transition-transform duration-400 /* Smooth: Position/scale */
```

### Custom Animations
```css
@keyframes fade-in {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

.animate-fade-in {
  animation: fade-in 0.6s ease-out;
}
```

### Motion Guidelines
- **Subtle is better**: Users notice smooth, not flashy
- **Purposeful**: Animation should guide attention or provide feedback
- **Fast enough**: Nothing over 500ms unless it's a hero transition
- **Respect reduced-motion**: Add `@media (prefers-reduced-motion: reduce)` overrides

---

## Anti-Patterns to Avoid

❌ **Don't:**
- Use flat buttons without hover states
- Create panels without backdrop blur (loses glass effect)
- Use harsh shadows (max: `shadow-2xl` with low opacity)
- Make interactive elements smaller than 36×36px (40×40px ideal)
- Use multiple conflicting accent colors in one view
- Animate every tiny thing (creates visual noise)

✅ **Do:**
- Add subtle hover feedback to all interactive elements
- Use consistent border radius across a component family
- Maintain z-index hierarchy: overlays > panels > content
- Test keyboard navigation and focus states
- Group related actions visually (with spacing/dividers)
- Prefer simple, smooth transitions over complex animations

---

## Accessibility Checklist

- [ ] All interactive elements have visible focus states
- [ ] Touch targets are minimum 44×44px
- [ ] Color is never the only indicator (use icons/text)
- [ ] Animations respect `prefers-reduced-motion`
- [ ] Semantic HTML (button, nav, header, kbd, etc.)
- [ ] Proper ARIA labels for icon-only buttons
- [ ] Keyboard shortcuts documented and functional
- [ ] Sufficient color contrast (4.5:1 minimum)

---

## Component Library (Shadcn)

We use Shadcn UI for base components. Install as needed:

```bash
npx shadcn@latest add button
npx shadcn@latest add switch
npx shadcn@latest add dialog
# etc.
```

**Customization**: Always apply brand colors and styling on top of Shadcn defaults:
```tsx
<Button className="bg-gradient-to-br from-[#FF6B5A] to-[#FB923C]">
  {/* Override default styles with brand colors */}
</Button>
```
