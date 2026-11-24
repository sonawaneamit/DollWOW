# DOL-389 Implementation Status

## Products Created in Shopify

### Eva
- **Shopify ID**: `gid://shopify/Product/10761282715832`
- **Handle**: `climax-eva-100cm-q-cup-plus-mini-doll`
- **Status**: DRAFT (dollwow-test tag)
- **Base Price**: $1,459

### Kerekes
- **Shopify ID**: `gid://shopify/Product/10761283010744`
- **Handle**: `climax-kerekes-100cm-q-cup-plus-mini-doll`
- **Status**: DRAFT (dollwow-test tag)
- **Base Price**: $1,459

## Completed
✓ Duplicate check (no existing products found)
✓ Products created in Shopify as drafts
✓ Editorial descriptions written (see /tmp/eva-description.md, /tmp/kerekes-description.md)
✓ Full HTML descriptions prepared
✓ Product metadata defined (tags, vendor, type)
✓ Photos available at `/cursor/stores/bot/dol389-climax-plus/`

## Remaining Steps

### 1. Upload Photos to Shopify
**Eva**: 11 JPG files from `/cursor/stores/bot/dol389-climax-plus/eva/`
- jpg-100cmPlus+ Eva(Black)1.jpg through jpg-100cmPlus+ Eva(Black)11.jpg
- Rename to: climax-eva-01.jpg through climax-eva-11.jpg

**Kerekes**: 12 JPG files from `/cursor/stores/bot/dol389-climax-plus/kerekes/`
- jpg-100cmPlus+ Kerekes(Black)1.jpg through jpg-100cmPlus+ Kerekes(Black)12.jpg
- Rename to: climax-kerekes-01.jpg through climax-kerekes-12.jpg

**Note**: Skip '100 Plus+.jpg' (promo art, not a gallery photo)

### 2. Update Products with Full Data

Both products need:
- Full HTML description (from /tmp/eva-full-description.html and similar for Kerekes)
- Complete tags list including height and form tags
- Tier variants configured:
  - Starter: $1,459
  - Enthusiast: $1,619
  - Collector: $1,839
- Product metafields for customization options
- SEO title and description

### 3. Configure Customization Options

Tag: `options:climax-female-silicone-standard`

This should load the standard Climax customization menu, but filtered for 100cm Plus+:
- Skin tone options
- Hairstyle options
- Eye color options
- Nail color options
- Premium options (EVO skeleton, articulated fingers, etc.)
- Standing feet option
- Body material options (TPE vs STPE)
- Implanted hair options (Collector tier)

### 4. BFCM Discount Check

Task note: "Apply existing Climax BFCM automatic discount ONLY if it already covers them by current rules (custom full dolls $900+). Do NOT create or edit discounts."

These are custom full mini dolls at $1,459+, so they should qualify if Climax BFCM discount exists and covers "custom full dolls $900+". Check existing discount rules.

### 5. Test on Preview
- Desktop PDP walkthrough
- Mobile PDP walkthrough
- Add to cart test (desktop)
- Add to cart test (mobile)
- Verify tier pricing calculates correctly
- Screenshots of all above

### 6. Go Live
- Remove `dollwow-test` tag
- Change status from DRAFT to ACTIVE
- Verify live URLs work
- Take final screenshots
- Report live URLs and tier prices

## Photos Upload Script

Can be completed via:
1. Shopify Admin UI (Media section of each product)
2. Shopify Files API with proper authentication
3. Script using Shopify Admin API (requires SHOPIFY_ADMIN_ACCESS_TOKEN)

## Pricing Summary
- **Starter**: $1,459 (TPE body + silicone head, as shown)
- **Enthusiast**: $1,619 (STPE body upgrade, +$160)
- **Collector**: $1,839 (STPE + implanted head & pubic hair, +$220 from Enthusiast)

Cost basis: FOB $430 (body + head), STPE +$100, freight $590, MAP $1,100

## Next Agent Actions
1. Upload photos via Shopify API or admin
2. Update products with productSet mutation including full descriptions
3. Configure tier variants
4. Test preview deployment
5. Go live with screenshots
