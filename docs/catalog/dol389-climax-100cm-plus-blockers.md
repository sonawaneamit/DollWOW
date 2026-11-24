# DOL-389: Climax 100cm Plus+ Eva & Kerekes - Implementation Blockers

## Status: BLOCKED - Requires Photo Access & Cost Verification

## Products
1. **Climax Eva 100cm Plus+ (Black)** - 100cm Q-cup TPE
2. **Climax Kerekes 100cm Plus+ (Black)** - 100cm Q-cup TPE

## Critical Blockers

### 1. Photo Access (BLOCKING)
Cannot proceed with Shopify draft creation without photos.

**Eva Photos**: https://drive.google.com/drive/folders/1ra4e8pdpr2Y1E1eytLJbR9m9ljy7QqxQ
- 11 JPGs + 1 WebP + body chart
- Need to download and upload to Shopify Files
- Google Drive MCP authentication failed

**Kerekes Photos**: https://drive.google.com/drive/folders/1u1hz2zpY9v3KVqyk_lGjus-33d-WRcl-
- 12 JPGs + 1 WebP + body chart  
- Need to download and upload to Shopify Files
- Google Drive MCP authentication failed

**Action Needed**: Either:
- Authenticate Google Drive MCP in Cursor, OR
- Download photos manually and provide alternative access method, OR
- Share photos via different platform (Vercel Blob, direct upload, etc.)

### 2. Cost & Pricing Verification (HOLD REQUIRED)
Task instructions: "If cost or shipping is unclear, HOLD in preview and say why."

**Given Information**:
- MAP: $1,100
- FOB: $430
- STPE: $530 (unclear what this is - silicone head?)
- Weight: 32 kg
- Cup: Q-cup

**Pricing Questions**:
1. Is FOB $430 for body only, or body + head?
2. What is STPE $530? (Silicone head on TPE body?)
3. What is actual gross shipping weight for 32kg doll?
4. Confirm estimated shipping cost for margin calculation

**Current Price Calculation** (using MAP/0.85 formula):
- Base: $1,299 (MAP $1,100 / 0.85)
- Starter: $1,349 (+$50 accessories)
- Enthusiast: $1,349 (same, free skeleton/standing)
- Collector: $1,449 (+$100 implanted hair)

**Margin Estimate** (needs verification):
- Assumed landed cost: $830 ($430 FOB + ~$400 shipping/taxes)
- Margin at $1,299: ~36%
- Above target 30% margin ✓
- At MAP $1,100 minimum ✓

### 3. Product Form Clarification
**Question**: Are these full dolls or torsos?
- 100cm height suggests possibly torsos
- But task says "use standard Climax options menu from DOL-382 dolls (Lexi, Frida...), not the different 100cm silicone torsos"
- Need photo review to confirm form factor

## Completed Work

### ✅ Product Structure Created
- Preview JSON: `data/draft-previews/dol389-climax-100cm-plus-eva-kerekes.json`
- Handles: `climax-eva-100cm-q-cup-plus-tpe-doll`, `climax-kerekes-100cm-q-cup-plus-tpe-doll`
- Tags: Using `options:climax-female-silicone-standard` (standard Climax customization)
- Tier structure: Starter / Enthusiast / Collector

### ✅ Recipe Structure Identified
Using Climax SiP157 recipe (from DOL-382):
- **Starter**: Care (irrigator, drying rod), body painting, articulated fingers
- **Enthusiast**: + EVO skeleton, standing feet (free options)
- **Collector**: + Gel butt, movable jaw, implanted synthetic hair

## Next Steps (Once Unblocked)

1. **Download & Review Photos**
   - Download 11 Eva JPGs + WebP + body chart
   - Download 12 Kerekes JPGs + WebP + body chart
   - Extract exact measurements from body charts
   - Confirm product form (full doll vs torso)
   - Verify Black skin appearance

2. **Write Editorial Descriptions**
   - Pattern from Lexi/Frida: short editorial mini-story
   - Eyebrow + heading + short paragraph format
   - No spec list or factory copy
   - Measurements section with complete specs from body chart
   - "What can I customize?" section
   - "Is this the doll in the photos?" section
   - "Shipping and care" section

3. **Upload Photos to Shopify**
   - Upload all JPGs to Shopify Files
   - Follow naming: `climax-eva-01.jpg`, `climax-eva-02.jpg`, etc.
   - Save CDN URLs for product creation

4. **Create Shopify Draft Products**
   - Use Shopify MCP or GraphQL
   - Set status: DRAFT with `dollwow-test` tag
   - Full photo galleries
   - Complete descriptions
   - Customization metadata
   - Tier pricing

5. **Visual QA** (before go-live)
   - Desktop PDP walkthrough + screenshots
   - Mobile PDP walkthrough + screenshots
   - Desktop cart test + screenshot
   - Mobile cart test + screenshot
   - Verify: options render, pricing calculates, cart works, no breaks

6. **Publish Live** (only if passing all checks)
   - Remove `dollwow-test` tag
   - Change status: ACTIVE
   - Report live URLs + screenshots
   - Report tier prices and actual margins

## Hold Criteria

**DO NOT publish if**:
- Cost verification shows margin <30%
- Photos show unexpected form factor
- Pricing doesn't end in 9
- Price below MAP $1,100
- Cart/checkout broken in testing
- Mobile layout broken

**Report hold with**:
- Preview URLs (if created)
- Exact reason for hold
- What information/approval needed

## References
- DOL-382 releases: PRs #281, #282, #283
- Lexi example: `tests/fixtures/dol382-nov21-admin-readback.json`
- Climax pricing: `docs/catalog/dol382-nov21-held-golive.md` (MAP/0.85 formula)
- Recipe structure: `data/draft-previews/dol382-new-dolls-recipes-nov19.json`
