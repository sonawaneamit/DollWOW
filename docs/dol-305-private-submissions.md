# DollVue private submissions

Martin authorized completion and release on 29 October 2026. This change records
eligible, rate-checked access requests before attempting delivery. Invalid input,
rate-limited requests and held products are not stored as legitimate submissions.

## Storage and access

`public.dollvue_submissions` stores email, product identity, request time, delivery,
verification and generation attribution. Row-level security is enabled with no
anonymous/authenticated access. Only the server service-role client can read/write.
The existing usage table is likewise server-only: repository callers already use
the service-role client, and anonymous usage writes must not forge attribution.
No identity, verification token, image bytes or customer files are exposed publicly.
No customer-photo upload currently exists. Marketing permission is not inferred.

The signed access token carries the private submission UUID; verification updates
the UUID and email hash together. Existing older links remain valid but cannot
invent missing historical submissions. Each successful usage event attaches only
to the latest ungenerated verified matching email/product request. This is
time-based attribution, not a historical proof of which browser tab was used.
Additional generations without a new access request remain in the usage table.

## Report

Native Sheet: https://docs.google.com/spreadsheets/d/1R4dXyamperwpgE7gt42YIQaVGlB81XHFSuOLO-3e5ic/edit

Filed in the existing DollWOW Internal folder, preserving its sharing. Header rows
and identifying columns are frozen; dates use Lisbon time, filter and wrapped
columns retained. Historical HMAC email hashes cannot be reversed or backfilled.

The authorized local heartbeat exports using `scripts/export-dollvue-submissions.mjs`
with the existing service-role environment, writes the Sheet's automated A5:L data
range through the connected Google Drive account and detects failed delivery rows.
Run every 30 minutes, not an instant per-request Google write. Keep exported JSON
private, outside version control. Read the existing Sheet bounds before updating;
do not overwrite unrelated tabs or columns. A missing connector or failed sync is
an operational failure to record, not proof that the Sheet is current.

## Sender constraints

No sender, SMTP credential, DNS or DMARC-policy change is included. Google SMTP
authentication was failing; Cloudflare fallback delivered with SPF/DKIM/DMARC PASS.
Martin's newer request requires reviewing sender isolation before switching routes.
A separate local-part on the same domain does not isolate domain reputation.

No image generation, branding integration, paid checkout or credit entitlement is
introduced by this reporting patch. Existing content and publication holds remain.
