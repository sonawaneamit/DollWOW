# Zelex Guide Release Gate

Date: 2026-08-13
Market: United States
Status: Blocked pending validated live inventory

## Decision

Do not publish `/learn/zelex-dolls-buying-guide` yet.

The latest first-party check returned HTTP 404 for `https://dollwow.com/brands/zelex-dolls`. The current repository evidence still records Zelex as `blocked-no-authorized-inventory`, and the existing guide draft links repeatedly to that missing commercial owner. Publishing the draft would create broken customer journeys and imply a current DollWOW range that is not publicly validated.

## Evidence Reused

- Prior DataForSEO work estimated meaningful United States demand for `zelex doll`, but classified the query as brand-navigation and commercial consideration intent.
- Prior URL mapping and manual validation explicitly required authorized inventory before creating a commercial Zelex owner.
- The draft is only a short preliminary manuscript and has not completed the current full AI/GEO, primary-source, visual, customer-copy, and release protocol.

## Reopen Conditions

Reopen the guide only after all of the following are true:

1. Authorized Zelex products are live in Shopify and visible on a stable DollWOW brand hub.
2. The brand hub returns HTTP 200 and exposes accurate current product, material, measurement, option, and availability facts.
3. Manufacturer authorization and image provenance are recorded.
4. The full DataForSEO research-once matrix is refreshed because the prior demand and SERP evidence will be stale relative to launch.
5. The manuscript is rebuilt around the live range, current manufacturer sources, real Zelex products, and an approved Zelex-specific visual package.

No redirect or substitute page should be created while these conditions remain unresolved.
