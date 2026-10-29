# DollVue Shared Image Branding

Preview-only follow-up to Martin's 29 October request, separate from PR214's
urgent email-verification release. Do not merge it under PR214's approval alone.

The non-explicit QA prototype appends a white footer with the existing DollWOW
logo, actual supplied option labels, Created with DollVue, Powered by DollWOW.com,
approximate-AI-preview disclosure and a QR back to the public product page. It
never includes an email, session, private access token or user identifier.
It is NOT automatically wired into the unrestricted generation route. The explicit
attachment Martin supplied was not edited or processed. Existing supplier assets
and historical downloaded/emailed files remain unchanged.

Email preserves already-optimized preview bytes. Tests caught and corrected a
QR-decoding failure caused by resizing a narrow attachment. Automatic branding
across the production generation/export paths is not delivered by this prototype.

120 focused tests pass, including existing generation-route guards with external
effects mocked. QR decoding passes portrait, landscape, square and narrow safe
fixtures in exported and attached images. No generation, customer outreach or
order was performed. One specifically authorized synthetic fixture result email
was accepted by Cloudflare at08:55UTC and received in approved Gmail, where both
embedded images decoded800x1510 and the white option/QR footer was visible.

The shared mail fix preserves attachment.cid as REST content_id and disposition
inline. The old Cloudflare mapping stripped it while HTML referenced cid images.
The Workers API's camelCase contentId was rejected by REST with400/10001; the
snake_case REST mapping was then verified by the actual safe inbox test. HTTP200
alone no longer counts as target acceptance: require success plus the actual
recipient in delivered/queued. A queued receipt is not inbox-arrival proof.
Missing attachments no longer produce broken cid images in HTML, and the email
uses a table rather than a flex layout for client compatibility.

Primary references checked29Oct2026:
- https://developers.cloudflare.com/email-service/api/send-emails/rest-api/
- https://developers.cloudflare.com/email-service/examples/email-sending/email-attachments/

Private review route: /review/dollvue-branding. It uses a clearly labelled safe
synthetic fixture, is noindex and returns404 in production. Confirm hosted build,
logo asset tracing, desktop/mobile rendering and release approval before live use.

The dependency install reported existing audit findings. No automatic audit fix
or unrelated dependency upgrade is part of this patch; do not describe the audit
as clean. The added QR encoder/decoder were not listed as vulnerable by that run.
