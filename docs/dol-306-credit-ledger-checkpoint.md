# DOL-306: Credit Fulfilment Preparation

Not ready for paid activation or Martin's end-to-end checkout test yet.

## Current Authority

Dolly relayed Martin's 29 October 10:50 instruction in DOL-305 comment
2372dd64-094f-455c-a741-d0e22b81fbd4: prepare non-explicit packs, keep them
unpublished, and leave final checkout testing to Martin. This updates the earlier
conditional-scope blocker for supported non-explicit preparation. It does not
authorize an explicit-image generation switch or publication of these products.

The existing three drafts remain the only approved products: 5/$5, 12/$10,
30/$25. No additional draft, discount code, order, mail or paid credit was created.

## Staged And Tested

- Migration 0008 adds private order grants, reservations, refund/cancellation
  review holds and receipt outbox tables. RLS is enabled; anonymous and signed-in
  customer roles cannot read, write or invoke the service-only functions.
- Grant and pending receipt are one database transaction. A repeated order does
  not grant twice; conflicting grant facts are rejected instead of overwritten.
- Atomic reservations count existing successful previews, five complimentary
  previews and granted paid credits. Expired/failed reservations are released.
  Successful completion writes usage once inside the same transaction. The
  ordinary generation route is NOT wired to these functions yet.
- A repeated still-pending reservation returns `busy`, not a second permission
  to invoke the model. Completed-result recovery still needs the private artifact
  policy and request-fingerprint integration before public activation.
- Reservation and completion now require the same request fingerprint. Reusing
  an ID with different inputs fails for reserved, released and completed rows.
  The server-only fingerprint helper requires a matching non-explicit content
  review and binds pinned inputs, product/menu revision, source position, chosen
  options, actual prompt digest, aspect ratio, filter version and render version.
  This remains staged, not authenticated public orchestration or result storage.
- Refund/cancellation holds persist even when callbacks arrive before payment.
  Existing credited accounts cannot spend during review. This does not issue a
  refund, choose a refund entitlement, or silently deduct a guessed amount.
- The new dedicated webhook verifies HMAC, canonical shop, allowed topic,
  exact approved product/variant, USD price and paid status. Body size is bounded.
  Invalid grants never fall back to browser properties. Storage failures return
  retryable errors; no raw body, recipient or credentials are logged.
- Fulfilment is OFF unless explicitly enabled in production. It is always OFF
  on preview. The original order analytics endpoint remains untouched.
- The confirmation worker is now staged and unit-tested, not enabled or
  scheduled. It leases one pending receipt with a private claim token; other
  workers cannot claim it again. Provider rejection, exception, expired sending
  lease or lost persistence moves the item to manual review rather than blindly
  duplicating a message. Provider acceptance is not inbox-delivery proof.
- Its private POST route requires both production activation and a configured
  32+ character bearer secret. No worker credential was generated/provisioned,
  no scheduler registered, no actual mail sent, and no sender settings changed.
  Activation still depends on the approved sender-isolation plan on DOL-305.

Run `npm run test:dollvue-ledger` after installing the pinned PGlite dev dependency.
The local proof used the same version already installed in an isolated QA folder
via `PGLITE_TEST_MODULE`. It applied migrations only to in-memory PGlite, never
to Supabase. Parallel client calls are serialized by that engine; a deployed
multi-connection PostgreSQL concurrency test is still required before activation.

## Remaining Before Ready

1. Verify the deployed confirmation worker with the approved sender configuration,
   scheduler and private failure monitoring. Ambiguous/stale sends require an
   operator to check provider/inbox evidence before requeuing; do not automatically
   retry them. No manual requeue or schema application has been performed.
2. Implement a verified non-explicit generation path and connect reservations to
   it, including failures and retries. Current live generation source still sends
   `safe_mode:false` and contains an uncensored fallback. No claim that a new
   non-explicit filter is live has been made; do not connect paid credits to that
   route unchanged. Do not use explicit customer attachments as QA fixtures.
3. Finish the friendly out-of-free allowance state and authenticated checkout
   path, recipient binding, supported $0 owner-test isolation and refund policy
   review. A zero-dollar test cannot prove paid settlement. No test order needed
   from Codex; Martin does the final checkout test.
4. Verify product-specific channel exclusions, not merely zero current draft
   publications. Preserve Copilot/Meta and normal catalog/search exclusions.
5. Review/apply migration and register the authenticated callbacks only with the
   exact release scope. Do not enable the environment flag or publish drafts as
   an incidental part of a preview deployment.
6. Re-test deployed Postgres concurrency, generation accounting, actual checkout
   and confirmation. Only then provide the final ready=yes receipt and 3-line
   Martin test script. Existing image footer and sender-isolation work on DOL-305
   remain separate unfinished acceptance items.

## Commercial And Cost Boundaries

The retained 29 October primary model catalog quote was $0.11 for a 2K output,
plus $0.00345 for each extra input: up to $0.1169 for three inputs on that model.
That is not the full cost of retries/fallbacks, payment fees or tax, and must not
be presented as guaranteed pack margin. Recalculate against the final supported
non-explicit model path before activation. Refund/revocation policy is not
invented by the review-hold mechanism.

## Next Integration: Verified Provider Behavior

Read the current official multi-edit documentation on 29 October:
https://docs.venice.ai/api-reference/endpoint/image/multi-edit

Its documented `safe_mode:true` blurs images classified as adult content; the
`x-venice-is-blurred` response header reports that result. It is not documented
as an input-review policy or a guarantee of non-explicit generation. Therefore
do not simply flip the existing flag and claim the whole path verified. The
supported paid path must retain safety-reviewed non-explicit source/reference
inputs, request the filter, reject blurred/unknown outcomes before delivery or
credit completion, exclude the uncensored fallback, and isolate its cache from
the old route. Test with non-explicit fixtures only, including missing/unknown
filter headers and refusal paths. This is an implementation checkpoint, not a
claim that these guards are already live or that safety holds can be removed.

The filtered provider adapter and distinct input-review validator are now staged
and tested in `nonExplicitProvider.ts` and `nonExplicitReview.ts`. They are NOT
wired to the public generation route or populated with product content approvals.
The adapter has one fixed model, filtered requests only, no URL inputs/fallback,
bounded output, and rejects adult/unknown classification before reading images.
The review validator binds product/menu fingerprint, source position and every
owned input digest. Appearance-ready alone does not pass. No real image API call
or explicit-attachment processing was used in these tests.

## Pending Private Recovery Policy

On DOL-306, comment c299ffc5-ad21-4afc-84a2-2acabce443c0 asks Martin to approve
private seven-day retention of completed non-explicit preview images, verified
buyer access only, followed by deletion. No retention period/storage/deletion job
has been enabled. This is separate from submission-report metadata. Without
durable result recovery, a credit commit followed by lost response/email can
strand a paid preview; do not hide that failure or claim ready for checkout.

## 29 October 12:56 Checkpoint

DOL-305's narrow canonical entry repair is live via PR220. Its requested steps
1/2/4 have receipts; unrestricted explicit-image branding remains unsupported,
and sender review still waits on Martin. Supported non-explicit DOL-306
preparation has resumed; the old conditional-scope blocker is not reinstated.

Latest local proof: 70 focused unit tests and 54 isolated PGlite assertions,
TypeScript and scoped lint pass. The default local ledger command initially
could not find the declared PGlite dependency; the existing pinned isolated
module at `/tmp/dol305-dbqa/node_modules/@electric-sql/pglite/dist/index.js`
was used via `PGLITE_TEST_MODULE`. CI installs declared dependencies normally.
This remains serialized local proof, not deployed multi-connection concurrency.
Migration0008 has NEVER been applied. Its reservation/completion SQL signatures
changed in preparation; do not deploy callers against an older staged schema.
No public generation route, model invocation, retention or paid activation was
introduced. Next is authenticated reviewed-input orchestration and recovery,
not more draft creation or a claim that end-to-end checkout is ready.
