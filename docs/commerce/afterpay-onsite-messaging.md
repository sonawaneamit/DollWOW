# Afterpay on-site messaging

## September 17 release review

Owner authorized release after successful review. Brave hosted-preview checks verified active Business Hub product/cart placements and matching public identifiers; $2,550 base and cart messaging, $2,715 configured messaging, the $5,100 eligibility-limit message, mobile layout at 390px, and the provider disclosure dialog. Standard Shopify checkout lists Afterpay after selecting the US market. No payment/order submitted; customer eligibility is still determined by Afterpay.

Fixed After Dark logo contrast using the existing storefront theme event and remounting the provider element when appearance changes. Browser screenshots verified white branding in dark mode and black branding after switching to light. Earlier in-app-browser provider timeouts were not reproduced on the hosted Brave preview; they are not evidence of a merchant configuration failure. TypeScript and targeted lint passed. This PR contains no preset rollout or pricing/discount/payment-settings changes.

Prepared 2026-09-16. Prepared for team PR review; production requires owner approval.

## Integration

DollWow is a headless Next.js storefront. Shopify theme app blocks do not render here. The existing Shopify payment integration remains responsible for checkout. The reusable AfterpayMessaging component loads the official square-marketplace.js SDK once via Next Script and renders the production product/cart placements retrieved from the signed-in US Business Hub. These are public storefront identifiers, not API credentials.

Placements: base product price, configured build totals, full-cart subtotal, cart-drawer subtotal. Afterpay supplies installment calculations, limits messaging, and the disclosure modal. No hard-coded installment promises or manually divided prices. Empty/nonpositive/invalid amounts, unavailable base products, and non-USD source currencies are hidden. Indicative converted base prices hide the widget; configuration/cart prices remain USD. en-US reflects the approved US account, not browser-language geolocation.

## Evidence and provenance

- Shopify setup showed the payment-method step completed; both Business Hub placements were active.
- Business Hub implementation guide: https://hub.us.afterpay.com/onsite-messaging/implementation-guide
- Official integration guidance: https://developers.afterpay.com/afterpay-online-developer/guides/afterpay-messaging/implementation
- SDK: https://js.squarecdn.com/square-marketplace.js
- Official footer badge, stored without modification at public/images/payments/afterpay.svg: https://static.afterpaycdn.com/en-US/integration/logo/icon/color.svg
- Badge reference: https://developers.cash.app/afterpay/guides/marketing/brand-assets
- Account limits preview showed $1–$4,000 on the verification date. The SDK remains authoritative if those settings change.

This is a payment UI addition, not a new indexable page or a material editorial/SEO refresh. No canonical, metadata, schema, or editorial changes were made; no DataForSEO requests were warranted for this UI integration.

## Verification

Initial TypeScript check passed. After compiling the preview, regenerated Next route validation exposed a pre-existing invalid `productWatermarkWidth` export in app/product-media/[handle]/[position]/route.ts; the final project-wide typecheck is blocked by that unrelated route. Targeted lint passed for the new components and other integration files; ProductOptions has two pre-existing react-hooks/set-state-in-effect errors outside the changed lines. The development server's generated change to next-env.d.ts was restored.

Brave local preview verified: $2,550 product shows $114.16/mo; $2,715 configuration shows $121.55/mo; official monthly-payment modal opens with provider disclosures; cart drawer shows $114.16/mo at $2,550; increasing quantity to $5,100 replaces installments with the $1–$4,000 limits message. Full cart also shows $114.16/mo at $2,550. Footer badge visually verified. No checkout payment was attempted. Mobile layout and live Shopify checkout still need pre-release verification.

Development preview uses `npm run dev -- --webpack --hostname 127.0.0.1 --port 3000`; the initial Turbopack preview stalled.

## Preview styling revision

At owner request, the messaging uses the SDK's `data-size="xs"`, a transparent wrapper, inherited muted text, and a smaller top gap. Removed the white background, rounded panel, and wrapper padding across product, configuration, cart, and drawer placements. Verified the product preview visually in Brave after reload; no production or Business Hub settings were changed.

## PR validation against current main

The PR is based on origin/main at e2a2438 and preserves the newer storefront payment-logo row. `next typegen` and `npm run typecheck` both pass in the isolated PR worktree; the route-export issue above occurred in the older local preview checkout. Targeted ESLint passes for AfterpayMessaging, AfterpayFooterBadge, Footer, CartPageClient, CartDrawer, and the product page. The reviewed local preview used the older checkout; reviewers should verify the merged layout, mobile and After Dark appearance, and Shopify checkout eligibility before release.
