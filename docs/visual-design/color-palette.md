# PlanArt Color Palette

## Philosophy
The PlanArt color palette is designed to be **energetic yet harmonious** - inspiring creativity without overwhelming the user. We use a warm, coral-centered palette with cool teal accents, creating visual interest through complementary contrast while maintaining cohesion.

## Core Colors

### Primary: Coral Flame
- **Hex**: `#FF6B5A`
- **Usage**: Primary actions, key UI elements, hover states
- **Psychology**: Energetic, creative, warm but not aggressive
- **Contrast**: High contrast on dark backgrounds

### Secondary: Deep Teal
- **Hex**: `#2DD4BF` (Teal 400)
- **Usage**: Secondary actions, informational elements, accents
- **Psychology**: Calming, professional, balances the warm coral
- **Contrast**: Creates complementary harmony with coral

### Accent: Sunset Orange
- **Hex**: `#FB923C`
- **Usage**: Highlights, notifications, special callouts
- **Psychology**: Playful, attention-grabbing
- **Contrast**: Analogous to coral, creates smooth transitions

## Neutral Scale

### Background Hierarchy
- **Deep Black**: `#0A0A0A` - Base background
- **Charcoal**: `#1A1A1A` - Elevated surfaces (cards, modals)
- **Soft Black**: `#2A2A2A` - Interactive surfaces

### Text Hierarchy
- **Primary Text**: `#FFFFFF` - Headings, important content
- **Secondary Text**: `#A3A3A3` - Body text, descriptions
- **Tertiary Text**: `#737373` - Metadata, timestamps

### Borders & Dividers
- **Subtle Border**: `rgba(255, 255, 255, 0.1)` - Card borders
- **Medium Border**: `rgba(255, 255, 255, 0.2)` - Active states
- **Strong Border**: `rgba(255, 255, 255, 0.3)` - Focus states

## Gradient System

### Primary Gradient (Coral to Orange)
```css
background: linear-gradient(135deg, #FF6B5A 0%, #FB923C 100%);
```
Used for: Primary buttons, hero elements, key features

### Secondary Gradient (Teal to Blue)
```css
background: linear-gradient(135deg, #2DD4BF 0%, #06B6D4 100%);
```
Used for: Secondary features, informational cards

### Subtle Glow (for atmospheric effects)
```css
background: linear-gradient(135deg, rgba(255, 107, 90, 0.1) 0%, rgba(45, 212, 191, 0.1) 100%);
```
Used for: Background ambiance, decorative elements

## Canvas Thumbnail Gradients

For visual variety in canvas previews, we use 6 curated gradients that stay within our cohesive palette:

1. **Coral Sunset**: `#FF6B5A → #FB923C → #FBBF24`
2. **Teal Ocean**: `#2DD4BF → #06B6D4 → #0284C7`
3. **Warm Blend**: `#FB923C → #FF6B5A → #EC4899`
4. **Cool Mint**: `#10B981 → #2DD4BF → #06B6D4`
5. **Coral Teal**: `#FF6B5A → #2DD4BF`
6. **Sunset Sky**: `#FBBF24 → #FB923C → #FF6B5A`

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

- Use CSS variables in `index.css` for easy theme management
- Gradients should be subtle and purposeful, not decorative noise
- Maintain the 70-20-10 rule: 70% neutrals, 20% coral/orange, 10% teal accent
- Avoid color clashing by limiting simultaneous use of gradients

## Design Rationale

**Why Coral + Teal?**
- **Complementary harmony**: Coral (warm) and teal (cool) sit opposite on the color wheel, creating natural balance
- **Creative energy**: Coral evokes creativity and passion without the aggression of pure red
- **Professional polish**: Teal adds sophistication and trust
- **Memorable**: This combination is distinctive without being chaotic
- **Versatile**: Works for both playful and professional contexts

**Avoiding Common Pitfalls:**
- ❌ No random rainbow gradients competing for attention
- ❌ No harsh neon colors that strain the eyes
- ❌ No more than 3 colors in a single UI element
- ✅ Cohesive, intentional color choices
- ✅ Clear visual hierarchy
- ✅ Comfortable for extended use
