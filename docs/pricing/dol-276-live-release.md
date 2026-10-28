# DOL-276 Approved Price Release

Martin approved the exact Greenback v4 164 prices through Linear comment
fdee86eb-73e7-4258-8a2f-8ede12b49140 on 28 October. This is separate from
the read-only PR189 preview, which must not be merged as the live mechanism.

The public manifest contains only product/variant identities, reviewed prices
and exact runtime hashes. Private costs and margin evidence stay outside Git.
Fresh Admin readback matches all164 ACTIVE products/variants and null compare-at
values. Preserve the127 other FunWest-prefix products, MD and drafts.

153 products already have approved preset entries;11 torso products do not.
The transition does not add recipes to the latter, change menus, stamp new
registry approvals or ignore arbitrary runtime drift. Only a runtime matching
the exact approved after-price hash can reuse its exact original before-price
menu binding. Displayed totals and Shopify checkout retain actual prices.
MoneyV2 whole-dollar formatting is normalized only after exact numeric equality;
USD, identity, variants, menus, tags, defaults and stock remain hash-bound.

Deploy the tested transition first, verify the actual production commit, then
run the price script dry-run and approved execution. The script preflights all
164 before writing, rereads each product immediately before its write, and
updates only variant ID + price. Compare-at, inventory, options, tags, status,
publication, discounts and charges are not mutation inputs. Each acknowledgement
is journaled. Ambiguous/error states stop; never rerun blindly or create orders.
Independent readback and live PDP/card/configurator checks are required after.

Read-only integration checked all164 identities:153 original runtime matches,
153 three-tier recipes unchanged at new base prices;11 existing absences
preserved. Negative cases reject changed tag, price, currency, variant and menu.
Root local tsc sees retained ignored PR189 test artifacts whose imports are not
on this release branch; a scoped release tsc excludes only data/exports and
node_modules. Hosted clean build remains a separate required gate.

Private evidence: data/exports/dol-276-2026-10-28/. No test order, cart creation,
purchase replay, price write or live publication is implied by a dry run.
