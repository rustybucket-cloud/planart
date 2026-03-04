# Animation & Motion Design

## Philosophy
PlanArt animations are **purposeful, subtle, and smooth**. Motion guides attention, provides feedback, and creates delight without becoming a distraction. We prioritize **performance** and **accessibility**, respecting user preferences for reduced motion.

---

## Motion Principles

### 1. **Purposeful, Not Decorative**
Every animation serves a function:
- **Feedback**: Confirming user actions (button press, toggle)
- **Attention**: Drawing focus to important elements
- **Orientation**: Helping users understand spatial relationships
- **Delight**: Adding polish to micro-interactions

### 2. **Fast & Smooth**
- Most transitions: **200-400ms**
- Never exceed **600ms** unless it's a hero transition
- Use easing curves that feel natural

### 3. **Subtle Over Flashy**
- Small scale changes (5-10% max)
- Gentle fades (opacity transitions)
- Smooth color shifts
- Users should feel it, not see it as "an animation"

### 4. **Performance First**
- Prefer CSS animations over JavaScript
- Animate `transform` and `opacity` only (GPU-accelerated)
- Avoid animating `width`, `height`, `top`, `left` (causes reflow)
- Use `will-change` sparingly

---

## Standard Transitions

### Duration Scale
```css
/* Quick feedback (hover, focus) */
duration-200        // 200ms

/* Standard transitions */
duration-300        // 300ms (default for most UI)

/* Smooth motion (slide, scale) */
duration-400        // 400ms

/* Emphasis (modal open, page transition) */
duration-500        // 500ms

/* Hero transitions only */
duration-600        // 600ms (rare)
```

### Easing Functions
```css
/* Default - smooth start and end */
ease-out            // Preferred for most UI

/* Quick start, slow end (exits) */
ease-in             // Element leaving

/* Slow start, quick end (entrances) */
ease-out            // Element entering

/* Smooth both ends (transforms) */
ease-in-out         // Scale, rotation
```

### Implementation
```tsx
// Single property
<div className="transition-colors duration-200">

// Multiple properties
<div className="transition-all duration-300">

// Specific properties (better performance)
<div className="transition-transform duration-400 ease-out">
```

---

## Common Animation Patterns

### 1. Hover Feedback

#### Button Hover
```tsx
<Button className="
  hover:bg-[#d4845e]/20
  hover:scale-105
  transition-all duration-300
">
  Action
</Button>
```
- **Background**: Color fade to accent/20
- **Scale**: 105% (subtle grow)
- **Duration**: 300ms
- **Easing**: Default (ease-out)

#### Icon Hover
```tsx
<Button className="group">
  <Icon className="
    group-hover:scale-110
    group-hover:rotate-12
    transition-transform duration-300
  " />
</Button>
```
- **Scale**: 110% (noticeable but not excessive)
- **Optional rotation**: 12° for playful effect
- **Group pattern**: Icon animates when button is hovered

### 2. Active/Pressed State
```tsx
<Button className="
  active:scale-95
  transition-transform duration-100
">
  Click Me
</Button>
```
- **Scale down**: 95% (tactile press feeling)
- **Fast**: 100ms for immediate feedback
- **Works with hover**: Combines with hover:scale-105

### 3. Focus States
```tsx
<Button className="
  focus:ring-2
  focus:ring-[#d4845e]
  focus:ring-offset-2
  transition-all duration-200
">
  Keyboard Accessible
</Button>
```
- **Ring**: 2px colored border
- **Offset**: 2px space from element
- **Quick**: 200ms for instant feedback

### 4. Selection Indicators
```tsx
<div className={`
  ring-2
  transition-all duration-300
  ${selected
    ? 'ring-[#d4845e] shadow-lg shadow-[#d4845e]/30'
    : 'ring-transparent hover:ring-[#d4845e]/50'}
`}>
  {/* Content */}
</div>
```
- **Selected**: Full color ring + glow shadow
- **Hover**: 50% opacity ring (preview)
- **Smooth transition**: 300ms

---

## Custom Animations

### Fade In (Entry)
```css
@keyframes fade-in {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.animate-fade-in {
  animation: fade-in 0.6s ease-out;
}
```

**Usage**: Empty states, help overlays, tooltips
```tsx
<div className="animate-fade-in">
  {/* Appears with gentle upward motion */}
</div>
```

### Fade Out (Exit)
```css
@keyframes fade-out {
  from {
    opacity: 1;
    transform: scale(1);
  }
  to {
    opacity: 0;
    transform: scale(0.95);
  }
}

.animate-fade-out {
  animation: fade-out 0.3s ease-in forwards;
}
```

**Usage**: Dismissing toasts, removing elements

### Slide In (Side Panel)
```css
@keyframes slide-in-right {
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

.animate-slide-in-right {
  animation: slide-in-right 0.4s ease-out;
}
```

**Usage**: Side panels, drawers, modal slides

### Pulse (Attention)
```css
@keyframes pulse-glow {
  0%, 100% {
    box-shadow: 0 0 0 0 rgba(212, 132, 94, 0.4);
  }
  50% {
    box-shadow: 0 0 0 8px rgba(212, 132, 94, 0);
  }
}

.animate-pulse-glow {
  animation: pulse-glow 2s ease-in-out infinite;
}
```

**Usage**: New feature indicators, important notifications

### Spin (Loading)
```tsx
<Icon className="animate-spin" />
```
- **Tailwind built-in**: Continuous 360° rotation
- **Usage**: Loading indicators, processing states
- **Duration**: ~1s per rotation

---

## Staggered Animations

### Sequential Entrance
When showing multiple items, stagger their entrance:

```tsx
{items.map((item, index) => (
  <Card
    key={item.id}
    className="animate-fade-in"
    style={{
      animationDelay: `${index * 100}ms`
    }}
  >
    {/* Content */}
  </Card>
))}
```

**Effect**: Cards appear one after another with 100ms delay
**Best for**: Lists, grids, galleries (first render only)

### Toolbar Expansion
```tsx
<div className="flex gap-2">
  {buttons.map((btn, i) => (
    <Button
      key={btn.id}
      className="opacity-0 animate-fade-in"
      style={{ animationDelay: `${i * 50}ms` }}
    >
      {btn.label}
    </Button>
  ))}
</div>
```

---

## Page Transitions

### Route Change (Optional)
For smoother page transitions, use React Router with Framer Motion:

```tsx
import { motion } from 'framer-motion';

<motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  exit={{ opacity: 0, y: -20 }}
  transition={{ duration: 0.3 }}
>
  {/* Page content */}
</motion.div>
```

**When to use**:
- Between major sections (Home → Canvas)
- Modal open/close
- Complex state changes

**When NOT to use**:
- Every tiny navigation change (annoying)
- Within same context (canvas → canvas)

---

## Canvas-Specific Animations

### Pan & Zoom
Canvas viewport changes should be smooth:
```css
/* Smooth viewport transform */
transform: translate(${x}px, ${y}px) scale(${zoom});
transition: transform 0.2s ease-out;
```

**Apply transition only when**:
- Zoom buttons clicked (discrete zoom steps)
- Reset zoom action

**No transition when**:
- User is actively panning (direct manipulation)
- Scrolling to zoom (follows input precisely)

### Element Drag
```tsx
// While dragging: no transition (direct manipulation)
style={{
  transform: `translate(${x}px, ${y}px)`,
  transition: 'none'
}}

// After drop: snap back if invalid
style={{
  transform: `translate(${x}px, ${y}px)`,
  transition: 'transform 0.3s ease-out'
}}
```

### Selection Ring
```tsx
className={`
  transition-all duration-300
  ${selected && 'ring-2 ring-[#d4845e] shadow-lg shadow-[#d4845e]/30'}
`}
```
- Smooth transition from no ring → ring
- Shadow fades in simultaneously

---

## Loading States

### Spinner
```tsx
<div className="flex items-center justify-center">
  <div className="w-8 h-8 border-4 border-[#d4845e]/20 border-t-[#d4845e] rounded-full animate-spin" />
</div>
```

### Skeleton Loader
```css
@keyframes skeleton-pulse {
  0%, 100% {
    opacity: 0.4;
  }
  50% {
    opacity: 0.6;
  }
}

.skeleton {
  background: rgba(212, 132, 94, 0.1);
  animation: skeleton-pulse 2s ease-in-out infinite;
  border-radius: 8px;
}
```

```tsx
<div className="skeleton h-20 w-full" />
```

### Progress Indicator
```tsx
<div className="h-1 bg-white/10 rounded-full overflow-hidden">
  <div
    className="h-full bg-gradient-to-r from-[#d4845e] to-[#fb923c] transition-all duration-300"
    style={{ width: `${progress}%` }}
  />
</div>
```

---

## Micro-Interactions

### Toggle Switch
Built into Shadcn, but ensure smooth transition:
```tsx
<Switch className="
  transition-all duration-200
  data-[state=checked]:bg-[#d4845e]
" />
```

### Checkbox/Radio
```tsx
<input className="
  transition-colors duration-200
  checked:bg-[#d4845e]
  checked:border-[#d4845e]
" />
```

### Tooltip Appearance
```tsx
<div className="
  opacity-0
  group-hover:opacity-100
  transition-opacity duration-200
  pointer-events-none
">
  Tooltip content
</div>
```

---

## Performance Optimization

### GPU-Accelerated Properties
✅ **Always animate these** (smooth 60fps):
```css
transform: translate(), scale(), rotate()
opacity: 0-1
filter: blur(), brightness()
```

❌ **Avoid animating these** (causes reflow):
```css
width, height
top, left, right, bottom
margin, padding
border-width
font-size
```

### Will-Change (Use Sparingly)
```css
.dragging {
  will-change: transform;
}

/* Remove after animation completes */
.dragging-done {
  will-change: auto;
}
```

**Rules**:
- Only add to elements actively animating
- Remove after animation completes
- Never add to many elements at once (hurts performance)

### Reduce Repaints
```tsx
// Bad: Changes layout every frame
<div style={{ width: `${progress}%` }}>

// Good: Uses transform
<div style={{ transform: `scaleX(${progress / 100})` }}>
```

---

## Accessibility: Reduced Motion

### Respect User Preferences
```css
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

### Implementation in Components
```tsx
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

<div className={prefersReducedMotion ? '' : 'animate-fade-in'}>
  {/* Conditionally apply animation */}
</div>
```

### What to Disable
- ✅ Disable: Decorative animations (pulse, bounce)
- ✅ Disable: Page transitions
- ⚠️ Keep minimal: Hover feedback (instant color change)
- ⚠️ Keep minimal: Focus rings (essential for a11y)

---

## Animation Checklist

Before deploying an animation, verify:

- [ ] **Purposeful**: Does it serve feedback/attention/orientation?
- [ ] **Duration**: Is it 200-400ms (600ms max)?
- [ ] **Performance**: Uses `transform`/`opacity` only?
- [ ] **Easing**: Appropriate curve (ease-out for most)?
- [ ] **Smooth**: Tested at 60fps?
- [ ] **Accessible**: Respects `prefers-reduced-motion`?
- [ ] **Subtle**: Doesn't distract from content?
- [ ] **Consistent**: Matches other similar animations?

---

## Common Animation Recipes

### Hover + Active Button
```tsx
<Button className="
  hover:bg-[#d4845e]/20
  hover:scale-105
  active:scale-95
  transition-all duration-300
">
  Click Me
</Button>
```

### Selected Card with Glow
```tsx
<Card className={`
  transition-all duration-300
  ${selected
    ? 'ring-2 ring-[#d4845e] shadow-lg shadow-[#d4845e]/30 scale-105'
    : 'hover:ring-2 hover:ring-[#d4845e]/50'}
`}>
  {/* Content */}
</Card>
```

### Modal Entrance
```tsx
<motion.div
  initial={{ opacity: 0, scale: 0.95, y: 20 }}
  animate={{ opacity: 1, scale: 1, y: 0 }}
  exit={{ opacity: 0, scale: 0.95, y: -20 }}
  transition={{ duration: 0.3, ease: 'easeOut' }}
>
  <Dialog>
    {/* Modal content */}
  </Dialog>
</motion.div>
```

### Icon Button with Spin on Click
```tsx
const [isSpinning, setIsSpinning] = useState(false);

<Button onClick={() => {
  setIsSpinning(true);
  setTimeout(() => setIsSpinning(false), 1000);
}}>
  <Icon className={`
    group-hover:scale-110
    transition-all duration-300
    ${isSpinning && 'animate-spin'}
  `} />
</Button>
```

---

## Anti-Patterns to Avoid

❌ **Don't:**
- Animate every tiny change (creates visual noise)
- Use long durations (> 600ms) for UI interactions
- Animate layout properties (width, height, top, left)
- Add motion without purpose ("looks cool" isn't enough)
- Ignore `prefers-reduced-motion` preference
- Use different animation styles for same interactions
- Make users wait for animations to complete tasks

✅ **Do:**
- Keep most animations under 400ms
- Animate transform and opacity only
- Use consistent timing and easing
- Test on slower devices
- Provide instant feedback for critical actions
- Respect accessibility preferences
- Use animation to guide attention purposefully

---

## Tools & Libraries

### Built-In (Preferred)
- **Tailwind transitions**: `transition-all duration-300`
- **CSS keyframes**: Custom animations in `index.css`
- **Tailwind animate**: `animate-spin`, `animate-pulse`

### Advanced (When Needed)
- **Framer Motion**: Complex orchestrations, page transitions
- **React Spring**: Physics-based animations
- **GSAP**: High-performance timelines (rarely needed)

**Principle**: Start with CSS, add libraries only when necessary.

---

## Testing Animations

### Visual Testing
1. Test at 60fps (Chrome DevTools Performance tab)
2. Test on slower devices (throttle CPU)
3. Test with `prefers-reduced-motion` enabled
4. Verify no layout shifts (CLS)

### Performance Metrics
- **Target**: 60fps (16.67ms per frame)
- **Acceptable**: Occasional drop to 30fps
- **Red flag**: Consistent < 30fps or janky motion

### Browser DevTools
```js
// Chrome DevTools Console
// Enable paint flashing to see repaints
document.body.style.outline = '1px solid red';
```

---

## Quick Reference

### Standard Durations
- Hover: `200ms`
- Transitions: `300ms`
- Entrances: `400ms`
- Exits: `300ms`
- Loading: `infinite` or until complete

### Standard Easing
- Most UI: `ease-out`
- Exits: `ease-in`
- Transforms: `ease-in-out`

### Performance-Safe Properties
- ✅ `transform` (translate, scale, rotate)
- ✅ `opacity`
- ✅ `filter` (with caution)
- ❌ `width`, `height`, `top`, `left`
