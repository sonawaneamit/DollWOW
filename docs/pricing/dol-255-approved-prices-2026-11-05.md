# DOL-255 approved non-Top-Fire price batch

Martin's 2 Nov 12:12 approval b0e196b3-7cb7-496f-adb3-be8fb3ef79ce is the authority
for the exact proposal sheet. Later DOL-257 holds all71 Top Fire rows. This
batch covers53 WM,10 Tantaly and1 Lusandy. Twenty-nine WM163/174/SS174 rows
stay1777 under Martin's exception; two Tantaly already match299. Actual33
price changes:24 WM (seven173 at1999, seventeen175 at1799),8 Tantaly,1 Lusandy.
Mark Pro569 is the exact sheet value, not the older prose summary's579.

Fresh Admin and US Storefront reads matched64 exact active records and one
variant each, with no unexpected current price. Scope dry-run additionally
verified SKU, current non-price fingerprint and compare-at compatibility.
Only variant ID and retail price enter mutations. No COGS, option, stock,
compare-at, tag, discount, publish or settings write. A single exclusive journal
records each acknowledged update and stops on ambiguous/drift results; never
blindly replay a partial or completed journal.

Twenty-one changing records already have valid released bundle runtime
bindings. Preserve those bindings only across the exact before/after retail
price change. Prices shown and charged remain Shopify's actual prices. The
bridge refuses any unreviewed identity/menu drift and adds no new approvals.
Fresh source data proves21 bridges/63 preset applications and21 rejected
non-price drift checks. The12 changing records without recipes stay unbound.

Private overlay for the33 proposed PDP prices requires preview environment
and NEXT_PUBLIC_DOL255_PREVIEW=1. Preview is noindex, suppresses offer/tracking,
and disables checkout. Production ignores this flag. Deploy/verify the price
bridge in production before running the approved Shopify writes so there is
no period where updated products lose their bundles. Independently verify all
64 Shopify/Storefront rows and representative live PDPs after writes.

Private source and checks in data/exports/dol-255-2026-11-05/. No completed
production price release is claimed in this checkpoint.
