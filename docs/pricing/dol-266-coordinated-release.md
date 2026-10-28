# DOL-266 Approved Four-Price Release

Final live authorization: Dolly relayed Martin's exact yes on 28 October
18:06 UTC, Linear comment `1e6adec1-dece-4ea6-b89a-8d1651c86729`.
This supersedes the previous preview hold for exactly these four products.
Freya remains excluded until Dolly verifies genuine supply.

| Product | Base Variant ID | Before USD | Approved USD |
|---|---|---:|---:|
| Luoyi 178P | 53881274859704 | 2199 | 2499 |
| Lyla 178P | 53881277513912 | 2199 | 2499 |
| Kirishima Eira 178P | 53881277579448 | 2199 | 2499 |
| Jarliet Kate 148E | 53880072372408 | 1699 | 1799 |

The new release branch starts from current production98fa475c, not PR194's
older production candidate. Only four exact runtime hashes change in the
current preset registry; all 2,860 unrelated entries, recipes, bindings and
expected-product scope remain equal. Later FunWest/TopFire releases and S40
are preserved. No old preview application routes are merged.

Fresh Storefront preflight 28 October18:20 verified exact identities, base
prices, unchanged menu/runtime before-hashes, available recipes and unchanged
DollVue fingerprints. All76 unique named-charge variants read ACTIVE at
their exact amounts at18:21:18UTC. No real cart, checkout or order is used.

Expected totals: Castle2559/2768/2998; Kate1859/2157/2307 for
Starter/Enthusiast/Collector. Existing option deltas remain unchanged.
Shopify writes are price-only; compare-at, costs, tags, custom metadata,
options, inventory, availability and publication must remain unchanged.

Execution requires a fresh exact-scope Admin preflight and exclusive durable
no-repeat journal before the first mutation. An uncertain response stops the
batch for independent readback, never an automatic repeat. Deploy the
coordinated registry through the normal approved production path, verify
READY/current domain, apply the four prices once and verify independently.
Preset shortcuts fail closed during any short registry/price transition;
manual server repricing stays available. Do not bypass registry validation.

Private execution receipts/checkpoint live in
`data/exports/dol-266-2026-10-28/`. Their presence alone is not a live receipt.
The whole ticket stays open for Freya; finished four-product work goes to
Dolly review, never self-closed.
