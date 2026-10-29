# DOL-307: Temporary Automatic Prompt Suppression

Preview only. No production release is authorized by this document.

## Change

The root layout passes `autoPrompt={false}` to the existing first-party
`ConsentBanner`. This suppresses its scroll-triggered automatic appearance.
The footer's Manage privacy settings action still opens the same controls.
Remove that prop, or set it to true, to restore automatic prompting. No consent
records, Shopify settings, analytics defaults, or privacy code are deleted.

## Reported Accept Failure

The current component writes the local choice before forwarding it to Shopify.
It then keeps the dialog open until Shopify confirms registration. A timeout or
failed registration leaves the dialog open with a truthful failure message.
An existing granted choice with no matching Shopify-sync marker is eligible for
another automatic prompt on a subsequent visit. That is a concrete code path
for both reported symptoms; it is not proof of the historical network failure
or proof that the visitor's localStorage write failed. Storage exceptions and
separate www/apex origins also need focused investigation in the permanent fix.

This is the Next.js first-party component, not a Shopify theme banner. This
review does not establish that no additional Shopify/app banner can appear
inside checkout.

## Tracking Consequences

- Unknown and declined visitors remain denied. Hiding a box never grants consent.
- Existing valid accepted choices are preserved. The GA loader and page-view
  gates still require granted consent; advertising consent remains denied.
- New visitors have no automatic invitation to opt in. Unless they open the
  footer controls, GA collection can decrease. This is not a fix for DOL-212's
  Vercel/GA discrepancy.
- Vercel Analytics and Speed Insights integration is unchanged. Shopify's
  explicit handoff remains available when the visitor uses the controls.
- No first-party Meta implementation was found in the bounded source review.
  This does not audit Shopify-installed pixels or establish their behavior.
- Actual Shopify region/privacy settings and checkout-installed pixels have not
  been inspected here. Do not assert that all tracking or legal requirements
  are verified. Obtain that inventory before a permanent consent redesign.

Google distinguishes blocking tags until consent from advanced consent-mode
collection. This application's existing GA loader is gated by consent; removing
the automatic prompt does not change that gate.
[Google documentation](https://developers.google.com/tag-platform/security/concepts/consent-mode)

EU/UK consent requirements depend on technology, purpose and applicable local
exceptions, not whether the popup is visible. CNIL describes narrow audience
measurement exemptions; the ICO's statistical exception has specific purpose,
information and objection conditions. Neither is a blanket authorization for
advertising or individual tracking. This patch does not claim compliance by
itself and does not change regional settings.
[CNIL](https://www.cnil.fr/fr/node/677),
[ICO](https://cy.ico.org.uk/for-organisations/direct-marketing-and-privacy-and-electronic-communications/guidance-on-the-use-of-storage-and-access-technologies/what-are-the-exceptions/)

## Evidence And Remaining Gate

- Five focused suites: 30 passing tests, including unknown/granted/denied
  automatic-prompt suppression and existing Shopify/GA consent safeguards.
- TypeScript, scoped ESLint and Vercel production build pass.
- Hosted preview: desktop and 390px mobile, scroll beyond the old reveal
  threshold, no automatic dialog. Manual footer control opens Privacy
  preferences with Accept/Decline intact. Reload again has no automatic dialog.
- Mobile viewport and document width are both 390px.
- Screenshots are retained under `data/exports/dol-307-2026-10-29/`.
- These hosted checks used a new preview origin in a normal browser. Native
  fresh-private-window QA was interrupted by a browser focus change; it is NOT
  claimed complete. No browser security or extension settings were changed.
- The local Turbopack server could not resolve the shared node_modules symlink;
  the webpack development server starts. Hosted Vercel build is successful.

Preview: https://doll-dhdyt6oyb-sonawaneamits-projects.vercel.app/privacy-policy

Deployment: `dpl_C81oPvcpK8rHwW3TZ4VSbzr1aP4b` (READY).

Before release: finish the private-window proof and obtain Martin's explicit
approval of this preview and the reduced new-visitor opt-in opportunity.
