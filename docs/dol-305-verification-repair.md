# DOL-305 Verification Repair

## Incident Findings

The access route previously returned HTTP 200 and `ok: true` for invalid input,
throttling, failed eligibility and mail rejection. The client ignored the response
and always displayed "Check your email". Generation quota is not consulted by
this route and is not established as the cause of the missing verification mail.

A read-only exact Grace probe reproduced a cold current-hold timeout: the
three-second check returned unavailable, while a warmed fresh check cleared the
same product. Historical production logs do not identify the branch that stopped
each request. Retained hello and approved Gmail request counters were below their
limits. These findings must not be generalized to every historical send.

## Repair Scope

- Return actionable 400/429/503 failures and show success only after mail acceptance.
- Recheck current product eligibility at point of use with an eight-second maximum
  auth-flow deadline; never allow a product on timeout or bypass private holds.
- Require SMTP acceptance of the actual recipient; bound transport waits and log
  fixed error codes only, without recipient addresses or private links.
- Keep preview verification links on their exact deployment, not production.
- Give only approved hello test identity unlimited generation allowance; verified
  sessions, current safety checks, usage recording and burst protection remain.
- Show ordinary customers a clear exhausted-allowance message. Paid packs remain
  a separate DOL-306 commercial scope, not fake purchase links.

## Evidence And Limits

Preview deployment: `dpl_6e1DqneoJ6vo8n9SjQe9FRZMC5Yz`.
Exact Grace gate loads. Approved external Gmail request at 2026-10-29 08:33 UTC
arrived in Gmail at 08:33 UTC; opening its emailed link returned to verified
Grace with five previews. No generation or order was performed.

Preview logs show SMTP `EAUTH` and Cloudflare fallback acceptance. That is preview
evidence, not proof that production has identical credentials. Hello test email
arrived in the actual hello mailbox at 08:34 UTC. Its real link returned to exact
Grace and displayed Unlimited test previews. Both approved inbox round-trips are
directly observed. The connected mail API is sales, not hello; earlier empty API
searches must not be treated as evidence of hello non-delivery.

88 focused route, session, hold and mail tests plus four account-usage tests pass.
Scoped lint, TypeScript and hosted build/4950-asset checks pass. Existing broad
visual-index and static-render warnings remain unrelated.

## Current Storage

Verification identity exists in a signed, not encrypted, short-lived access token
and signed HttpOnly session cookie. Rate-limit rows retain hashed identifiers.
Successful generation usage rows retain an email HMAC and product/selection-count
metadata, not a complete raw-email submission ledger. Past email addresses cannot
be recovered from those hashes. There is no customer-photo upload in this flow.

The requested private durable submission ledger and automatically updated Google
Sheet are not implemented by this urgent patch. Do not fabricate historical rows,
infer verification from a send receipt, or treat customer images as marketing
permission. Keep the original ticket open for its remaining acceptance criteria.

## Release Gate

Preview only until Martin approves this exact scoped release through Linear.
After release, repeat approved inbox verification using production links and
record actual delivery and round-trip evidence without exposing access tokens.
Do not rotate credentials, change DNS, disable verification or add other unlimited
identities under this patch's authority.
