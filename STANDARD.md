# DollWOW Listing Standard

**Reference**: Live Irontech Celine (https://dollwow.com/products/irontech-celine-164cm-d-cup-silicone-head-companion-doll-s38se)

**Applies to**: FunWest (181 listings, preview/funwest) and Top Fire (20 listings, preview/topfire)

**Rule**: All dolls of the same type get identical treatment (same build, sections and structure). The only allowed difference is RTS vs custom.

---

## 1. Product Title & Metadata

### Required Format
- **Title**: `[Brand] [Model Name] [Height]cm [Cup] [Material] Customizable Companion Doll`
- **NO SKU** in title or H1
- Example: "FunWest Dolls Lily 157cm G-Cup Silicone Customizable Companion Doll"

### Metadata Requirements
- Meta title: NO factory SKU codes
- Meta description: Descriptive, customer-facing copy
- All tags: dollwow-test (for preview)

---

## 2. Page Structure & Sections

### Required Sections (in order)
1. **Gallery** (8-12 images)
2. **DollVue block** (when brand supports it)
3. **Hero/Overview** (brand, model name, verified tick, price, intro)
4. **Editorial section** (custom.editorial_intro: eyebrow, heading, paragraph)
5. **Configurator/Options**
6. **Specifications table**
7. **"More from this brand"** section
8. **Certificate section** (brand authorization)

### Verified Tick
- Must appear beside the brand name in the hero section
- Component: `<DollVueBadge />` (when DollVue-eligible)

---

## 3. Gallery Requirements

### Size & Content
- **8-12 images** (typical live standard)
- **Lead image**: Real product photo of the correct doll, NEVER the brand poster/logo
- **NO spec sheets** in gallery
- **NO duplicate images** or near-duplicates
- **NO multi-doll group shots** where the specific doll isn't clear

### Image Quality
- Each image must be a real product photo
- Remove measurement charts from gallery (they belong in specs section)
- Verify each SKU's images actually belong to that SKU (check for shared photo sets)

---

## 4. Editorial Section ⚠️ CRITICAL REQUIREMENT

**EVERY LISTING MUST HAVE EDITORIAL STORY TEXT. NO EXCEPTIONS.**

This is the full editorial section like live Celine's "A Private Invitation / Celine Commands the Room": a heading, a story paragraph specific to that doll, and the right image.

### Required Fields (custom.editorial_intro)
- **eyebrow**: Short contextual phrase
- **heading**: Product-specific title  
- **paragraph**: 90-130 words, distinctive product-specific copy

**All three fields must be present and non-empty, or the listing FAILS.**

### Content Standards
- **Each story must be UNIQUE** to that doll
- **Use the doll's real name** (e.g., "Lily", "Celine") and actual specs
- **NO factory SKU codes** (e.g., "FSD052", "FWD041", "DOL-161")
- **NO head codes** (e.g., "Head #036SJ", "036SJ")
- **NO internal data** or production language
- **NO generic filler** or obviously mechanical prose
- **NO copying** from another listing
- Generated via scripts/generate-pdp-editorial-pilot.mjs

### Visual
- Editorial image: typically gallery index 3 (4th image)
- Must be a representative product portrait, not contact sheet or poster

### Owner Priority
This section is the key differentiator between DollWOW and competitor sites. Missing or generic editorial is a **critical failure** that blocks the listing from going live.

---

## 5. Product Introduction (Hero Paragraph)

### Format
- **Descriptive, customer-facing copy** (2-3 sentences)
- Describes the doll's appeal, key features, and configuration type
- Example from Celine: "Celine is a made-to-order Irontech female body with a 164 cm frame, a D-Cup profile, and a silicone head build. Review the included configuration, available options, timing, and measurements before checkout."

### Prohibited Content
- **NO** factory SKU (e.g., "factory SKU FSD052")
- **NO** head codes (e.g., "head 036SJ")
- **NO** "White skin" or internal color codes
- **NO** "supplier price not yet verified" messages

---

## 6. Customizer/Options

### Default Build Requirements
- **Default options total: $0**
- All FREE items must be the defaults:
  - Free soft head (NOT Movable Jaw +$60)
  - Standing (FREE)
  - EVO skeleton (FREE) or Regular (if EVO is paid)
  - Gel breasts (FREE)
- **NO "(FREE)" in option labels** – the "Included" badge already shows it
- NO paid options as defaults

### Option Display Standards
- **Eye colors**: Use color swatches, NOT face close-ups
- **Bloodshot eyes**: Separate from eye color options
- **Hair color**: Proper color swatches or hair samples
- **Every option**: Real thumbnail image
  - Letter tiles (N, X, etc.) allowed ONLY for "None" / "No add-on"
  - NO poster images as "As shown" thumbnails
- **Flight cases**: Distinct thumbnails for each option
- **Lingerie/nails**: Descriptive names instead of "No.1–No.16"
- **Accessories**: Proper casing (e.g., "Exquisite Gifts", not all caps)

### Option Groups
- NO "Premium Head & Body Options" that duplicate step 1 or presets
- Remove redundant groups
- Fix mismatches between thumbnail counts and option counts

### Option Labels
- NO "Supplier price not yet verified — unavailable for online checkout"
- Hide unverified options from shopper view
- Log them for owner review instead

### Head Model Display
- Remove "Head #" prefix from supplier codes
- Show descriptive name or leave blank if only factory code
- Example: "Head #036SJ" → either proper name or hidden from shopper view

---

## 7. Preset Tiers (When Applicable)

### Structure
- **Starter**: Sensible baseline with standard FREE features
- **Enthusiast**: Adds coherent upgrades with clear benefit
- **Collector**: Builds on Enthusiast with further improvements

### Requirements
- Starter tier: **$0 in option charges** (base price only)
- NO paid defaults silently included
- Tier descriptions must state that Starter items are included in higher tiers
- Card heights must be equal (fix overflow)
- Preset card text must not overflow

---

## 8. Specifications

### Precision
- **Half-cm precision** for measurements (e.g., "80.5 cm", not "80 cm")
- Consistent units: metric and imperial

### Content Consistency
- Intro paragraph and specs table must be consistent
- NO SKU in specs display
- NO internal factory codes visible to shoppers

### Required Fields
- Brand
- Head model (if descriptive name available)
- Material
- Availability (Factory order / Ready to ship)
- Delivery estimate
- Height, Weight, Cup size
- Bust, Waist, Hip, Legs
- Feet, Vagina depth, Anus depth

---

## 9. "More from this brand" Section

### Requirements
- NO duplicate products from the same SKU
- Each product appears once
- Products must be from the same brand
- Resolve duplicate Lily/Alice entries (FSD045/046 vs FSD052 issues)

---

## 10. Certificate Section

### Structure
- Brand authorization certificate block at bottom of page
- Component: `<BrandAuthorizationCard />`
- Same structure and layout as live Irontech example

### Content
- "DollWow is an approved seller for [Brand]."
- "View the authorization certificate shared by [Brand]."
- Link to certificate (if available)
- For FunWest: layout must be identical; certificate slot can be blank/pending

---

## 11. Error Handling

### Add to Cart
- Must work successfully
- NO internal error messages visible to shoppers
- NO "Custom option charges are not configured in Shopify yet. Add SHOPIFY_CUSTOM_OPTION_CHARGE_VARIANTS..." exposed to customers
- Errors must be logged server-side and shown generically: "Unable to add to cart. Please contact support."

### Configuration Errors
- NO generic "price-confirmation error" for valid configurations
- Unavailable choices must show accurate cause
- NO internal environment variable names in error messages

---

## 12. Brand Name Consistency

### Required Format
- **"FunWest Dolls"** consistently (NEVER "FunWest Doll")
- **"Top Fire Doll"** consistently
- Check all instances:
  - Page title
  - H1
  - Brand label
  - Editorial copy
  - Metadata
  - Certificate section

---

## 13. Automated Checks

### Render Check Script Requirements
Must verify for each product:

1. **Required sections present** (CRITICAL):
   - ⚠️ **Editorial section** (eyebrow, heading, paragraph all non-empty) - FAILS if missing
   - DollVue block (if brand-eligible)
   - Certificate section
   - Verified tick beside H1

2. **Default options total = $0**:
   - Calculate resolved customization with defaults
   - Verify options charge is $0

3. **No internal strings**:
   - NO factory SKU in title, H1, intro, OR editorial
   - NO head codes (e.g., "Head #036SJ") in visible labels OR editorial
   - NO "supplier price not verified" messages
   - NO environment variable names
   - NO "dollwow-test" visible to users (it's a tag, not display text)
   - Editorial must use doll's real name and specs, not SKU/factory codes

4. **Gallery rules**:
   - First image is NOT logo/poster
   - Image count between 8-12 (reasonable range)
   - NO measurement charts in gallery

5. **Every option has thumbnail**:
   - Check all option groups
   - Verify image URLs exist
   - Letter tiles only for "None" options

6. **Add to Cart works**:
   - Attempt to add default configuration
   - Verify no error thrown
   - Check cart API response

---

## 14. Preview vs Production

### Preview Requirements
- All products tagged: dollwow-test
- Not indexed by search engines
- Branch-specific deployment
- Preview URLs available for review

### Git Workflow
- FunWest: branch `preview/funwest`
- Top Fire: branch `preview/topfire`
- Push: `git push origin HEAD:refs/heads/<branch>`
- NO merge to main
- NO force push

---

## 15. Owner Decisions Required

### Document These for Owner
1. **Unverified supplier prices**:
   - List options with "Supplier price not yet verified"
   - Hide from checkout, report to owner

2. **Missing env vars**:
   - SHOPIFY_CUSTOM_OPTION_CHARGE_VARIANTS
   - Report exact requirements, don't change shared settings

3. **Shared photo sets**:
   - Report SKUs sharing images (e.g., FSD051/052/053)
   - Verify each has correct photos

4. **Missing content**:
   - FunWest certificate pending
   - Any missing editorial sections

5. **DollVue eligibility**:
   - Which products should have DollVue
   - Current readiness status

---

## Implementation Notes

This standard ensures:
- ✓ Consistent structure across all listings of the same type
- ✓ No internal data leaks to shoppers
- ✓ Professional, polished presentation
- ✓ Accurate pricing and configuration
- ✓ Proper error handling
- ✓ Live-equivalent quality

All changes must be verified with the automated render check script before considering the work complete.
