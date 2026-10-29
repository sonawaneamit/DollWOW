# DollVue sender hardening review

Prepared 29 October 2026. No DNS, credential, sender or transport-priority changes
have been made. Martin requested review before switching the primary sender.

## Verified today

- Google Workspace receives the root domain's mail (`smtp.google.com` MX).
- Cloudflare sends with an envelope address under `cf-bounce.dollwow.com`.
- Its SPF is `v=spf1 include:_spf.mx.cloudflare.net ~all` and its sending DKIM
  selector is `cf-bounce._domainkey.dollwow.com`.
- The received Grace result mail passed SPF, aligned DKIM and DMARC. Gmail reported
  two seconds delivery and TLS 1.3. Missing inline images were a MIME/CID defect,
  not a failure of those authentication checks.
- `_dmarc.dollwow.com` is `v=DMARC1; p=none;`. No aggregate-report destination is
  configured. Root-domain SPF is absent. Google's DKIM public key is published.
- The last observed Google SMTP attempt returned EAUTH; Cloudflare fallback works.

## Support-mail protection

Changing only `hello@dollwow.com` to `dollvue@dollwow.com` separates the visible
address but does not isolate domain reputation. Neither this nor a subdomain can
guarantee that shared sending IPs or domain reputation will never affect support.
Do not claim complete reputation isolation or inbox delivery at every provider.

Preferred review option: a dedicated transactional sender subdomain such as
`dollvue@notifications.dollwow.com`, with Reply-To `hello@dollwow.com`, separately
verified with the selected provider. Keep support MX, Google login, support sender,
root DMARC policy and other applications' mail routes unchanged. Before activation,
verify subdomain DKIM/SPF alignment, provider limits, bounces/suppression handling,
actual volume, and inbox placement at Gmail plus another approved provider.
An address at the second provider has not been supplied; never email a guessed one.

Cloudflare-first should be scoped to DollVue messages, not silently change the
shared `sendEmail` transport order for all support/application messages. Keep an
auditable retry/failure record and prevent repeated retries from sending duplicate
verification mail. Existing access failures are visible to the customer and are
stored in the private ledger/report; the 30-minute check reports new failures.

## DNS changes prepared, not approved for publication

1. Inventory all legitimate root-envelope senders, including normal Workspace and
   any Shopify/marketing/application services. Do not infer this from MX alone.
2. If that inventory confirms Workspace is the only root-envelope sender, the
   proposed single root TXT SPF is `v=spf1 include:_spf.google.com ~all`.
   If others use the root envelope, combine verified includes into ONE record and
   validate the SPF DNS-lookup limit. Do not publish this incomplete-inventory
   proposal or add Cloudflare's root Email Routing record to a Workspace domain.
3. Retain `p=none`. Provision or approve a dedicated restricted reporting mailbox
   or DMARC analyzer first. Then review a record of the form
   `v=DMARC1; p=none; rua=mailto:<approved-report-address>;`.
   The placeholder is NOT a deployable DNS record. Do not send reports to the
   support inbox without approval; report volume could burden support.
4. Any new sender subdomain needs its own provider-verified records. No switch to
   quarantine/reject until all legitimate services and alignment are verified.

Sources:
- https://developers.cloudflare.com/email-service/configuration/domains/
- https://developers.cloudflare.com/email-service/concepts/email-authentication/
- https://support.google.com/mail/answer/14229414

## Required decision

Approve a dedicated transactional sender subdomain with Reply-To hello, keeping
Workspace support routing and DMARC `p=none` unchanged, before implementation?
