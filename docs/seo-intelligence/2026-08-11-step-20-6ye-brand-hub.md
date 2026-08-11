# 6YE Dolls Brand Hub Match And Exceed

Date: 2026-08-11

## Decision

- Keep `/brands/6ye-dolls` as the sole commercial owner for `6ye dolls`, `6ye doll`, and `6ye sex doll`.
- Keep `/learn/6ye-dolls-buying-guide` as the editorial owner for review and buying-guide intent.
- Do not create the old audit's suggested `/shop/6ye-dolls`, `/shop/6ye-doll`, `/shop/6ye-sex-doll`, or singular review URL. Those routes would duplicate the established owners.

## Data basis

- Reused five US desktop and mobile DataForSEO result sets purchased earlier on 2026-08-11 at depth 20. The commercial brand terms mix the official manufacturer, retailer collections, products, videos, marketplaces, and social results; the review terms favor videos, owner discussions, and guides.
- Ran focused Backlinks and OnPage calls for $0.0489. No new Content Analysis or AI Optimization calls were purchased because the immediately preceding Real Lady test returned polluted content results and zero measured AI mentions without changing the brand-hub decision.
- The official `6yedollglobal.com` domain returned 663 backlinks from 131 referring domains at collection time.
- Useful linked official formats included the home page, where-to-buy page, wigs, body and head directories, Amor products, a second-generation quick head connector, and individual TPE products. These informed compatibility and selection coverage without copying manufacturer text.
- DataForSEO OnPage confirmed the pre-upgrade DollWow URL returned HTTP 200 with one H1, a self-referencing canonical, 37 images, 765 words, 80 internal links, and relevant metadata.

## Claims gates

- 6YE is treated as an approved live DollWow brand, but no downloadable brand certificate exists in the repository. Customer copy must say approved seller rather than certified seller unless a certificate is added.
- 6YE Premium, Amor, gear skeletons, standing features, connectors, hands, feet, and newer head functions remain product-specific.
- The DollWow catalog currently supports TPE bodies with TPE or selected silicone heads. No universal full-silicone claim was added.
- No founding year, production time, included accessory, bestseller, review, lifespan, or universal quality claim was added.

## Implemented

- Replaced the generic profile with 6YE Premium and Amor context, product-form boundaries, TPE-body and head-material comparison, handling weight, body/head compatibility, and model-specific skeleton guidance.
- Added three buyer notes, three comparison rows, six FAQs with schema, internal links to the completed 6YE buying guide, and proactive missing-model sourcing through live chat and `hello@dollwow.com`.
- Corrected the reusable SERP mapper so all three commercial terms consolidate on the brand hub and both research terms consolidate on the buying guide.
- Added 6YE to the reusable focused brand-intelligence collector.

## Validation

- TypeScript, the customer-copy audit, and all 163 tests passed.
- Mobile QA at 390 x 844 showed the full 527-character introduction remains server rendered and expandable, the approval panel begins in the first viewport, six FAQs render, and there is no horizontal overflow.
- Desktop QA at 1440 x 900 showed the complete introduction, hidden disclosure control, 52 px H1, correct canonical, and no overflow.
- The inaccurate shared no-certificate label found during QA was handed to the frontend task for a separate component-level correction.
