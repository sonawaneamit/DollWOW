# V2 Redesign Brief — Readable & Friendly

**Status:** approved direction, ready for implementation
**Audience for this document:** the coding agent (Codex) implementing the redesign
**Read first, then read:** `design-tokens.md` → `header-spec.md` → `pdp-customizer-spec.md`

---

## 1. Why we are doing this

The average DollWOW buyer is **55 years old or older**. The current design works against them:

- Base text is 13–14px with large passages of 10–12px ALL-CAPS micro-labels (`text-[0.68rem] uppercase tracking-[0.22em]` appears in almost every component).
- Everything is separated by near-invisible hairline borders (`border-[#d59a6f]/22`, `border-gold-500/16`) on a very dark background — low contrast, hard to parse.
- Decorative noise textures, stacked radial gradients, and floating animations add visual noise without adding information.
- The header crams 8 top-level destinations plus a mega-menu into 13px type.
- The PDP customizer is a dense three-pane cockpit (rail / stage / panel) that intimidates the exact buyer who needs reassurance.

**The new direction: modern, friendly, light, and readable.** Readability beats beauty in every trade-off. If a choice is between "looks elegant" and "is easier for a 60-year-old to read and tap," choose easier.

## 2. Design principles (apply everywhere)

1. **Readable first.** Body text ≥ 17px on desktop, ≥ 16px on mobile. Nothing below 14px anywhere except legal footers. No ALL-CAPS micro-labels: use sentence-case semibold labels instead.
2. **No super fine lines.** No 1px low-opacity borders, no hairline rules, no film grain, no noise overlays, no layered radial-gradient backgrounds. Separate areas with white space, soft shadows, and tinted surfaces (see tokens).
3. **Big, obvious touch targets.** Every interactive element ≥ 44px tall; primary buttons 52–56px. Buttons look like buttons: solid fill, clear label, no icon-only controls without a visible text label.
4. **Plain, friendly language.** Short sentences. No jargon, no marketing cleverness in UI copy. Say "Factory default — included" not "Default supplier selection."
5. **One accent color, used sparingly.** Terracotta for actions and selected states. Green only for stock/success. Red only for errors.
6. **Calm interface.** No floating elements, no parallax, no marquee animation. All animation respects `prefers-reduced-motion`.
7. **Mobile first, but desktop is the money.** Older buyers browse on desktop and tablet; both must be excellent.

## 3. Scope of this redesign

| Phase | Scope | Files primarily touched |
|---|---|---|
| **1** | Design tokens + global chrome (header + footer) | `tailwind.config.ts`, `app/globals.css`, `app/layout.tsx`, `components/Header.tsx`, `components/Footer.tsx`, `components/GoldButton.tsx` |
| **2** | PDP customizer + buy box | `components/ProductOptions.tsx`, `components/ProductBuyActions.tsx`, PDP section of `app/(store)/products/[handle]/page.tsx` |
| **3** | Homepage + catalog surfaces | `components/HomeAlive.tsx`, `components/ProductCard.tsx`, `components/ProductGrid.tsx`, `components/ProductFilters.tsx`, `components/ProductLowerAlive.tsx`, `components/CartPageClient.tsx` |

Implement **Phase 1 and Phase 2 in this effort** (one PR per phase is fine; Phase 1 first). Phase 3 is listed for context only — do not start it without explicit approval.

**Explicitly out of scope:** the AI concierge, generative previews, video PDP galleries, and any new routes. Those are future efforts.

## 4. Hard constraints — do not break these

These are load-bearing contracts. Changing them breaks checkout, SEO, or the data pipeline.

1. **No route changes.** All existing URLs (`/shop`, `/warehouse`, `/customize`, `/compare`, `/help-me-choose`, `/learn`, `/why-dollwow`, `/authorized-vendors`, `/support`, `/cart`, `/products/[handle]`, all policy pages) must keep working. Navigation labels may change; destinations may not be removed.
2. **No checkout/cart contract changes.** `POST /api/cart/create` payload shape, cart attribute keys (`DollWow Reference Name`, `DollWow Config ID`, `DollWow <GroupLabel>`, `DollWow Option Delta`, `Selected configuration`), `customizationCharge`, `writeBrowserCartState` shape, and `normalizeCheckoutUrl` stay exactly as they are.
3. **No customization logic changes.** `lib/customization/configs.ts` (`getCustomizationConfig`), `lib/customization/resolve.ts` (`getDefaultSelections`, `resolveCustomization`, `getOptionConflict`, `nextMultipleSelection`, `selectionIds`), and the per-brand config files stay semantically identical. This effort restyles the UI that renders them; it must not alter how options resolve, price, or conflict. Per-brand behavior matters: each brand defines its own option groups, imported product-specific groups take precedence, empty-group products must fall back to the `ProductOptionsOnRequest` path.
4. **Anchor contract:** the customizer section must keep `id="build-studio"` (or update `scrollToCustomizer` in `ProductBuyActions.tsx` to match).
5. **SEO/GEO assets stay:** metadata, JSON-LD, `app/sitemap.ts`, `app/robots.ts`, `app/llms.txt`, `app/product-feed.json`, `app/agent-index.json` untouched. All new UI must be server-renderable or progressively enhanced — no client-only rendering of product content.
6. **Brand guardrails (from AGENTS.md, non-negotiable):** never invent reviews, ratings, testimonials, viewer counts, "X sold" counters, delivery-date promises, or buyer-protection claims that are not already stated on existing policy pages. No countdown timers or fake urgency. Privacy/discretion copy stays factual. `NEXT_PUBLIC_SHOW_INSTALLMENTS` stays unset — do not add installment messaging.
7. **No new dependencies** unless strictly necessary. Current stack (Tailwind 3, lucide-react, clsx) is sufficient for everything in this brief.
8. **Search behavior stays:** `/api/search` integration, debounce, Cmd/Ctrl+K shortcut, and result linking in the header keep working; only the presentation changes.

## 5. Acceptance criteria

Phase 1 is done when:
- [ ] Site renders in the new light theme with no dark-theme remnants in header/footer.
- [ ] Header matches `header-spec.md` on desktop, tablet, and mobile; all previous destinations reachable (secondary links via footer).
- [ ] No text below 14px; nav items ≥ 16px; all tap targets ≥ 44px.
- [ ] `npm run build` and `npm test` pass; no new lint warnings.

Phase 2 is done when:
- [ ] Customizer matches `pdp-customizer-spec.md`: single-column step flow, readable tiles, visible running summary, plain-language copy.
- [ ] Conflict rules, price deltas, required-group validation, `ProductOptionsOnRequest` fallback, and checkout attributes all behave exactly as before (verify with existing tests plus a manual pass on one Zelex product — implanted hair vs. head function conflict — and one imported multi-group product).
- [ ] Contrast: body text ≥ 4.5:1, large text/UI ≥ 3:1 (WCAG AA).
- [ ] Keyboard-only flow: a user can tab through every option group, select options, reach review, and start checkout without a mouse. Focus ring always visible.
- [ ] `prefers-reduced-motion`: no animation plays.
- [ ] `npm run build` and `npm test` pass.

## 6. Working notes

- Existing tests live in `tests/`; extend them where behavior is touched (e.g., step navigation, conflict messaging), but do not weaken assertions to make things pass.
- Keep component and file names stable where possible (`Header`, `ProductOptions`, `ProductBuyActions`) so diffs stay reviewable.
- Prefer editing `app/globals.css` tokens over scattering new hardcoded hex values. New hex values belong in `tailwind.config.ts` and the token CSS only.
- When you are unsure between two visual options, pick the one that is bigger, higher-contrast, and simpler.