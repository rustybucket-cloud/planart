# Typography System

## Philosophy
PlanArt's typography creates a balance between **creative elegance** and **technical precision**. We use distinctive serif fonts for creative content and monospace for data/UI labels, avoiding overused system fonts to create memorable, polished interfaces.

## Font Families

### Primary: Outfit (Sans-Serif)
- **Usage**: Body text, UI labels, general interface text
- **Weights**: 400 (Regular), 500 (Medium), 600 (Semi-Bold), 700 (Bold), 900 (Black)
- **Characteristics**: Geometric, clean, highly legible
- **Implementation**: Already loaded via Tailwind's system font stack

```css
font-family: 'Outfit', system-ui, -apple-system, sans-serif;
```

### Secondary: Crimson Pro (Serif)
- **Usage**: Canvas headers, creative element titles, emphasis
- **Weights**: 400 (Regular), 600 (Semi-Bold), 700 (Bold), 900 (Black)
- **Characteristics**: Elegant, distinctive, sophisticated
- **Psychology**: Adds warmth and craft to technical interfaces
- **Where to use**: Canvas page titles, text elements on canvas, creative section headers

```css
font-family: 'Crimson Pro', serif;
```

### Tertiary: System Monospace
- **Usage**: Technical data, coordinates, object counts, timestamps, code
- **Characteristics**: Fixed-width, precise, developer-friendly
- **Where to use**: Status bars, coordinate displays, file names, version numbers

```css
font-family: ui-monospace, 'Cascadia Code', 'Fira Code', 'Monaco', monospace;
```

## Type Scale

### Headings
```css
h1 (Page Title):     text-3xl (30px) - font-bold - tracking-tight
h2 (Section):        text-2xl (24px) - font-bold - tracking-tight
h3 (Subsection):     text-xl (20px) - font-semibold
h4 (Card Header):    text-lg (18px) - font-semibold
```

### Body Text
```css
Base:                text-base (16px) - font-normal
Small:               text-sm (14px) - font-normal
Extra Small:         text-xs (12px) - font-normal
Tiny (Metadata):     text-[10px] - font-normal
```

### Canvas Text Elements
```css
Default Canvas Text: text-lg (18px) - Crimson Pro - font-normal
```

## Font Weight Guidelines

| Weight | Value | Usage |
|--------|-------|-------|
| Regular | 400 | Body text, descriptions |
| Medium | 500 | Subtle emphasis, secondary buttons |
| Semi-Bold | 600 | Card headers, labels |
| Bold | 700 | Section headers, primary headings |
| Black | 900 | Hero text, major statements |

## Context-Specific Usage

### Home Page / Project Lists
- **Primary font**: Outfit
- **Headers**: Bold weight for project titles
- **Body**: Regular weight for descriptions
- **Metadata**: Monospace for dates/counts

### Canvas Page
- **Headers**: Crimson Pro for elegance ("Canvas 1", creative titles)
- **UI Labels**: Outfit for buttons and controls
- **Status Data**: Monospace for coordinates, zoom level
- **Canvas Text Elements**: Crimson Pro for user-added text

### Modals & Dialogs
- **Titles**: Outfit Bold
- **Body**: Outfit Regular
- **Actions**: Outfit Medium

## Letter Spacing (Tracking)

```css
tracking-tight:    -0.025em   (Headings, tight compositions)
tracking-normal:   0em         (Body text, default)
tracking-wide:     0.025em     (Uppercase labels, breathing room)
tracking-wider:    0.05em      (Small caps, all-caps labels)
```

### Guidelines:
- Use `tracking-tight` on large headings to create cohesion
- Use `tracking-wide` on small ALL CAPS labels for legibility
- Never use tight tracking on body text (hurts readability)

## Line Height

```css
leading-none:      1.0    (Display text, single-line headers)
leading-tight:     1.25   (Multi-line headings)
leading-normal:    1.5    (Body text - WCAG recommended)
leading-relaxed:   1.625  (Long-form content)
```

## Color & Contrast

### Text Colors
```css
/* Primary text (headers, emphasis) */
text-white           #FFFFFF

/* Secondary text (body, descriptions) */
text-[#8b8d98]       Muted gray for canvas UI
text-gray-500        Standard secondary text
text-[#A3A3A3]       Secondary text on dark backgrounds

/* Tertiary text (metadata, timestamps) */
text-gray-600        Subtle information
text-[#737373]       De-emphasized data

/* Accent text */
text-[#d4845e]       Canvas terracotta accent
text-[#FF6B5A]       App coral accent
```

### Contrast Requirements
- **All text meets WCAG AA** standards (4.5:1 for normal, 3:1 for large)
- White text on dark backgrounds: ✅ High contrast
- Colored text on dark: Tested for minimum 4.5:1 ratio
- Never use pure black text on dark gray (low contrast)

## Responsive Typography

### Mobile (< 768px)
- Reduce heading sizes by 1 step: `text-3xl` → `text-2xl`
- Maintain body text at `text-base` for readability
- Increase line-height slightly for better mobile reading

### Tablet (768px - 1024px)
- Use standard scale
- May reduce canvas text slightly if needed

### Desktop (> 1024px)
- Full scale as designed
- Canvas text elements can be larger

## Anti-Patterns to Avoid

❌ **Don't:**
- Use more than 3 font families (creates visual chaos)
- Use system fonts (Inter, Roboto, Arial) for distinctive interfaces
- Set text smaller than 12px for body content
- Use pure black (#000000) on dark backgrounds
- Mix too many font weights in one component
- Use decorative fonts for body text

✅ **Do:**
- Stick to the established hierarchy
- Use Crimson Pro sparingly for impact
- Maintain consistent weights across similar elements
- Test text contrast for accessibility
- Use monospace for technical/numerical data

## Implementation in Code

### Tailwind Classes
```tsx
// Outfit (default, no class needed)
<h1 className="text-3xl font-bold">Project Title</h1>

// Crimson Pro
<h1 style={{ fontFamily: "'Crimson Pro', serif" }} className="text-2xl font-bold">
  Canvas 1
</h1>

// Monospace
<span className="font-mono text-xs text-gray-500">X: 123</span>
```

### Direct CSS (when needed)
```css
.canvas-header {
  font-family: 'Crimson Pro', serif;
  font-size: 24px;
  font-weight: 700;
}

.status-data {
  font-family: ui-monospace, monospace;
  font-size: 12px;
  color: #8b8d98;
}
```

## Accessibility Notes

- All font sizes meet minimum WCAG guidelines
- Line heights provide adequate spacing for dyslexic users
- Letter spacing on small text improves readability
- Font colors maintain 4.5:1+ contrast ratios
- Monospace fonts help users with dyscalculia distinguish numbers

## Future Considerations

- Variable font support for smoother weight transitions
- Localization font stacks for non-Latin scripts
- System font override for accessibility preferences
- Dark mode optimizations (already implemented)
