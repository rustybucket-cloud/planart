# PlanArt Color Palette

## Philosophy
The PlanArt color palette is designed to evoke **warmth, craftsmanship, and creative focus**. We use a sophisticated terracotta-centered palette inspired by natural materials (clay, earth, warm metals) that creates a grounded, architect's studio aesthetic. The warm earthy tones inspire creativity while maintaining professional polish.

## Core Colors

### Primary: Terracotta Clay
- **Hex**: `#d4845e`
- **Usage**: Primary actions, key UI elements, hover states, borders, accents
- **Psychology**: Warm, creative, grounded, artisanal
- **Inspiration**: Clay pottery, architect's drafting tools, warm studio lighting
- **Contrast**: High contrast on dark backgrounds

### Accent: Warm Orange
- **Hex**: `#FB923C`
- **Usage**: Gradients, highlights, secondary accents
- **Psychology**: Energetic but not aggressive, adds vibrancy
- **Contrast**: Analogous to terracotta, creates smooth warm transitions

### Tertiary: Golden Earth
- **Hex**: `#FBBF24`
- **Usage**: Gradient endpoints, special highlights
- **Psychology**: Optimistic, valuable, illuminating
- **Use sparingly**: Adds brightness to warm gradients

## Neutral Scale

### Background Hierarchy
- **Deep Blue-Gray**: `#1a1d28` - Base background (primary canvas)
- **Darker Blue-Gray**: `#0f1117` - Elevated surfaces (panels, cards, toolbars)
- **Interactive Overlay**: `#0f1117` with 40-90% opacity - Context-dependent transparency

### Text Hierarchy
- **Primary Text**: `#FFFFFF` - Headings, important content
- **Secondary Text**: `#8b8d98` - Body text, descriptions, UI labels
- **Tertiary Text**: `#737373` - De-emphasized metadata (rarely used)

### Borders & Dividers
- **Subtle Border**: `rgba(212, 132, 94, 0.2)` - Card borders, panel edges
- **Medium Border**: `rgba(212, 132, 94, 0.5)` - Hover states
- **Strong Border**: `rgba(212, 132, 94, 1.0)` - Selected/active states

## Gradient System

### Primary Gradient (Terracotta to Warm Orange)
```css
background: linear-gradient(135deg, #d4845e 0%, #fb923c 100%);
```
Used for: Primary buttons, hero elements, key features

### Secondary Gradient (Warm Orange to Terracotta)
```css
background: linear-gradient(135deg, #fb923c 0%, #d4845e 100%);
```
Used for: Alternative project cards, secondary features

### Subtle Glow (for atmospheric effects)
```css
background: radial-gradient(circle, rgba(212, 132, 94, 0.1) 0%, transparent 70%);
```
Used for: Background ambiance, decorative blur elements

## Canvas Thumbnail Gradients

For visual variety in canvas previews, we use 6 curated gradients that stay within our warm, earthy palette:

1. **Terracotta Sunset**: `#d4845e → #fb923c → #fbbf24`
2. **Warm Clay**: `#fb923c → #d4845e → #c97a54`
3. **Soft Terracotta**: `#e89863 → #d4845e → #fb923c`
4. **Light Warmth**: `#d4845e → #e89863 → #f0ac7b`
5. **Classic Terracotta**: `#d4845e → #fb923c`
6. **Golden Earth**: `#fbbf24 → #fb923c → #d4845e`

## State Colors

### Success
- **Color**: `#10B981` (Emerald 500)
- **Usage**: Success messages, completed states

### Warning
- **Color**: `#FBBF24` (Amber 400)
- **Usage**: Warning messages, caution states

### Error
- **Color**: `#EF4444` (Red 500)
- **Usage**: Error messages, destructive actions

## Accessibility

- All text colors meet WCAG AA standards for contrast ratios
- Primary coral (#FF6B5A) provides 4.5:1 contrast on dark backgrounds
- Interactive elements have clear hover/focus states
- Color is never the only indicator of state (always paired with icons or text)

## Implementation Notes

- **Use CSS variables via Tailwind**: `bg-terracotta`, `text-text-secondary`, `bg-bg-panel/60`
- CSS variables are defined in `src/index.css` for consistency and maintainability
- Gradients should be subtle and purposeful, not decorative noise
- Maintain the 70-20-10 rule: 70% neutrals (dark backgrounds), 20% terracotta accents, 10% warm orange highlights
- Use backdrop-blur with semi-transparent backgrounds for glass-morphism effect: `bg-bg-panel/60 backdrop-blur-sm`
- Borders should almost always use terracotta with 20% opacity: `border-terracotta/20`
- Hover states increase opacity: 20% → 50% or add glow with shadows

### CSS Variable Usage Examples

```tsx
// Backgrounds
className="bg-bg-deep"           // Base background (#1a1d28)
className="bg-bg-panel/60"       // Glass panel with 60% opacity (#0f1117)

// Brand colors
className="bg-terracotta"        // Primary accent (#d4845e)
className="text-terracotta"      // Terracotta text
className="border-terracotta/20" // Terracotta border with 20% opacity

// Gradients
className="bg-gradient-to-r from-terracotta to-warm-orange"

// Text colors
className="text-text-secondary"  // Muted gray (#8b8d98)
className="text-white"           // Primary text
```

## Design Rationale

**Why Terracotta + Warm Earths?**
- **Natural materiality**: Terracotta evokes clay, craftsmanship, and tangible creative work
- **Architect's studio aesthetic**: Creates a professional yet warm environment for visual planning
- **Grounded creativity**: Warm without being aggressive, energetic without being chaotic
- **Timeless sophistication**: Earthy tones feel polished and premium, not trendy
- **Comfortable for extended use**: Warm tones are easier on the eyes than bright neons
- **Memorable**: Distinctive palette that stands out from typical coral/blue or purple UI trends

**Avoiding Common Pitfalls:**
- ❌ No random rainbow gradients competing for attention
- ❌ No harsh neon colors that strain the eyes
- ❌ No more than 3 colors in a single UI element
- ❌ No bright, cold blues that clash with the warm aesthetic
- ✅ Cohesive warm palette with intentional variation
- ✅ Clear visual hierarchy through opacity and borders
- ✅ Glass-morphism and depth instead of flat design
