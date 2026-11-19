# DOL-381: Irontech Scarlett S60 ROS MAX Registry - Notes

## Status: Registered in PR #276

**Product:** Irontech Scarlett Natural 171cm S60 ROS MAX  
**Shopify ID:** gid://shopify/Product/10742348513464  
**Handle:** irontech-scarlett-natural-171cm-s60-ros-max

## Changes Made

- ✅ Created custom binding: `irontech-scarlett-s60-cbeb2e1ccbea`
- ✅ Added Scarlett-specific tier recipe to `payload.bindings`
- ✅ Registered Scarlett entry in `payload.entries`
- ✅ Added product ID to `payload.expectedProductIds`
- ✅ Registration script: `scripts/register-scarlett.mjs`

## Custom Binding Required

Scarlett needed a **custom binding** (not the standard Irontech binding) because:

1. **S60 ROS MAX-specific tiers** - different from standard Irontech dolls
2. **Unique tier descriptions:**
   - Starter: "Care, S+ finish, and ball-jointed hands." ($2,679)
   - Enthusiast: "Implanted brows, toe joints, and an ultra-soft butt." ($2,779)
   - Collector: "Body heating with body moaning." ($2,979)
3. **Recipe from PR #272:** `data/draft-previews/scarlett-nov18-recipe.json`

## Critical: irontech-ros-max-included Tag

**Tag:** `irontech-ros-max-included`

**Purpose:** Prevents double-charging $180 for ROS MAX head construction.

**How It Works:**
- Scarlett's **base price $2,619 already includes S60 ROS MAX head**
- Without this tag, configurator would add $180 upgrade charge
- Tag signals: "ROS MAX is included at $0, not an upgrade"
- Other Irontech products without this tag correctly charge $180 for ROS MAX upgrade

**Verification Needed:**
1. Deploy to preview environment
2. Load Scarlett PDP
3. Verify ROS MAX head shows as "included" or $0
4. Verify Starter tier total = $2,679 (base $2,619 + $60 accessories, NO +$180)
5. Test configurator doesn't add ROS MAX charge

**Reference:** From dol381-scarlett-nov18-review.md:
> "All three tiers retain the included ROS MAX head: Starter $2,679, Enthusiast $2,779, Collector $2,979. The explicit irontech-ros-max-included tag prevents charging another $180 for the quoted base head construction."

## Runtime Hash Relink Required

⚠️ **Runtime hash is a PLACEHOLDER** from minimal product data.

**Why Different from Clara/Tessa:**
- No full Shopify product JSON available in PR #272
- Constructed minimal product representation from review doc
- Tags include critical `irontech-ros-max-included`

**Before Merge:**
Same relink requirement as Clara/Tessa:
```bash
NODE_OPTIONS=--conditions=react-server npx tsx scripts/relink-irontech-production.mjs
```

Or add Scarlett handle to existing relink script:
```javascript
const entries = registry.payload.entries.filter(e => 
  /^(irontech-scarlett-natural|existing-patterns)/.test(e.handle)
);
```

## Product Remains Draft

Scarlett stays DRAFT with tags:
- `dollwow-test`
- `catalog-review-hold`
- `dol381-nov18`
- `irontech-ros-max-included` ⚠️ CRITICAL
- Zero publication channels

## Pricing Structure

**Base:** $2,619 (includes S60 ROS MAX head + $590 US freight)

**Tier Totals:**
- Starter: $2,679 (+$60 for care accessories)
- Enthusiast: $2,779 (+$100 more for implanted brows, toe joints, soft butt)
- Collector: $2,979 (+$200 more for body heating + moaning)

**Source:** DOL-341, DOL-381 freight estimates

## Testing Checklist

Before production go-live:

1. **Runtime Hash Relink**
   - [ ] Run relink script with production Shopify API
   - [ ] Verify hash matches production product data
   
2. **Preview Deployment**
   - [ ] Deploy with `DOLLWOW_TEMPLATE_RELEASE=1`
   - [ ] PDP loads without errors
   - [ ] Three tiers appear correctly
   
3. **ROS MAX Pricing Verification** ⚠️ CRITICAL
   - [ ] ROS MAX head shows as included/$0
   - [ ] Starter tier = $2,679 (NOT $2,859 if wrongly charged)
   - [ ] Enthusiast tier = $2,779
   - [ ] Collector tier = $2,979
   - [ ] Configurator doesn't add $180 ROS MAX upgrade
   
4. **Menu Verification**
   - [ ] Irontech female silicone standard menu loads
   - [ ] All customization groups present
   - [ ] Preset generation works
   - [ ] No conflicts or errors

5. **Review Approval**
   - [ ] Martin approves exact preview
   - [ ] Body weight correct: 37.5kg body only (not including head)
   - [ ] All 68 images + 2 videos display correctly

## Recipe Source

Recipe extracted from PR #272 branch:
```bash
git show origin/codex/dol381-scarlett:data/draft-previews/scarlett-nov18-recipe.json
```

Signature matches Irontech female silicone standard menu.

## Related

- PR #276 (includes both Clara/Tessa and Scarlett)
- PR #272 (Scarlett preview branch, draft)
- PR #274 (Evelyn, stacked on Scarlett)
- DOL-166 (previous Irontech go-live example)
