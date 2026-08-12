# DollWOW shape language

DollWOW should use alignment, whitespace, dividers, and tonal contrast to
create hierarchy. Rounded rectangles are reserved for places where their
shape communicates a specific interaction.

## Radius hierarchy

- **Page sections and structural panels:** square to 2 px. Prefer an open
  layout or a single divider over another container.
- **Buttons, inputs, menus, and selectable cards:** 4-6 px. They may be soft,
  but should not look inflated.
- **Product photos and other media:** 6-8 px so imagery remains polished
  without reading as an app tile.
- **Pills:** status, filters, compact tags, and segmented selections only.
- **Circles:** avatars, icon controls, progress markers, and step numbers only.

## Composition rule

Do not place a rounded card inside another rounded card unless the inner card
is a genuinely separate interactive object. For lists and multi-step forms,
use shared edges and dividers; frame only the active or selected item.

## Review check

If removing a border and replacing it with spacing or a divider does not make
the interface less clear, the border and radius were unnecessary.
