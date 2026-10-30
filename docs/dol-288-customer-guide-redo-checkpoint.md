# DOL-288: Fresh Customer Guide Redo

## State

In Progress. This is a new implementation, not a repair or merge of rejected
PR213. It is not a finished all-brand guide, not hosted for acceptance, and not
live. Do not move it to In Review until the remaining content and hosted checks
below are complete.

- Worktree: `/Volumes/Extreme Pro/Projects/DollWOW-dol288-guide`
- Branch: `codex/dol288-customer-guide-redo`
- Base: verified fetched `origin/main` at `7a2073aa`.
- Preserved old branch: `codex/dol288-guide-preview`, `b128ae1c`, PR213.
- New working route: `/review/oral-features`.
- Requires `DOL288_GUIDE_REDO=1`; explicitly rejects production even with flag.
- No production setting, publication, Shopify write, cart, order or email.

## Latest Supported Coverage Pass: 30 October

HOSTED QA CAUGHT A REAL SOURCE-PARITY BUG: first flagged d84 deployment
`dpl_HNUom2NBM65ucYHbh2H69E7bzZix` (`doll-179ezjxdq`) built successfully on
Node22 but rendered only FIVE cards. On preview deployments the shared product
getter prefers old Castle draft snapshots even with strict mode; those snapshots
correctly failed the guide's current-source guards. Do NOT claim this host as a
seven-card acceptance pass. The guide now explicitly requests `publishedOnly`,
skipping that draft preference for this caller only. Existing PDP/private-draft
consumers keep their default behavior. Three regression tests cover default
preservation, absent published product and strict fetch failure. Combined31tests,
TSC pass. Final rebuilt/redeployed exact source still requires fresh hosted QA.

Private WIP now has NINE source-supported brand sections and SEVEN real current
PDP cards. Added Dolls Castle/Galatea, SY and TOP-CYDOLL. Not an exhaustive market
or live-release claim. Same branch/PR231; no restart or patch to PR213.

- Lirael2250 is a manual movable-jaw example, guarded by exact ID/handle/brand
  and the current material field. No unverified SY60/120 oral deltas are quoted
  as free/verified, no universal M/S-head fit claim.
- Official `https://www.topcydoll.com/shop/elva/` separately lists Auto Blowjob,
  Auto Sucking and ROS. The guide uses that limited distinction, not foreign
  retail prices as DollWOW quotes or a universal body-compatibility list. The
  older FAQ/stock contradiction and product measurement contradiction were not
  adopted. No matching DollWOW SKU was invented.
- Jarliet's official root showed an age gate only; no attestation/bypass. Its
  generic165D menu does not establish the researched165Y/165M construction fit.
  Yeloly's three-opening description is not powered3-in-1 evidence; registered
  YL remains a different brand. Firefly's private drafts remain unpublished.
  These unsupported recommendations are omitted per Dolly's brief, not turned
  into empty customer-facing status rows or claims that the features do not exist.
- LOCAL1319/390/320: nine sections/seven exact live links and original photos
  decoded, itemized verified prices, no document/card overflow. New Lirael photo
  visually reviewed, no edits/generation. Local HTML verifies seven cards, five
  nonempty rows, video and visible FAQ/schema equality;28unit/media/Chiku tests,
  TSC and scoped lint pass. An initial wrong `tsx --test` runner invocation failed
  before tests; correct Vitest results are the verification, not that failed run.
- Exact previous6fd CI was independently all green by23:56; this does not imply
  checks for this newer source. Hosted acceptance still requires exact flagged
  deployment/browser proof. Provider/GSC/YourDoll gaps remain qualified.

## Previous Source And Media Pass: 29 October

Still In Progress and private-only. Current local guide has SIX brand sections
(Irontech/SE/TopFire/Angelkiss/WM/MD), SIX live-linked photo cards, FIVE useful
mechanism rows, one credited manufacturer video and visible-content-backed FAQ
schema. Wider all-brand coverage and hosted acceptance are unfinished.

- Refined only WM/MD non-warehouse queries, six each, saved in
  `custom-brand-samples-private.json`. The previous48record snapshot was not
  rerun or replaced. Male WM examples without oral functions were not promoted.
- Exact custom Karola170H:1777 base /250 robot option; exact custom Mary168/M44:
  2599 base /249 Auto Blowjob. Both require the reviewed verified zero-price ROS
  prerequisite to remain present. Missing, repriced, unavailable, conditional or
  conflicting prerequisite hides the card. No head or cart entitlement changed.
- Mary's general listing says oral depth N/A, so the guide does NOT represent its
  photographed/default hard head as oral-ready. It explicitly calls for the ROS
  movable-jaw selection. These are factory menu quotes, not installed warehouse
  equipment or proof of an actual server-cart/physical-function test.
- WM's exact owned99 `Blowjob Sucker` option reference was visually inspected: it
  depicts vaginal anatomy, not a mouth. The guide excludes that99 from oral
  pricing and explains the naming trap. The reference is NOT embedded/copied into
  this page. No explicit media editing/generation or model call.
- Reused existing `ros-comparison.mp4` and its poster via the existing
  `ManufacturerVideo` component (only added an export; other consumers unchanged).
  It is a manual S1/S31 head/jaw comparison, explicitly NOT a powered-motion demo.
  Video SHA25686387cad481e07db97d14056f101ee191e74c4e6f75e8eb29fba0e8728e54d98;
  poster SHA256f1298d1e07218743f8e28ae90bba7759643b544c77e090903231a5b8aef20888.
  Bytes unchanged. Poster/head frames visually checked; actual native playback
  decoded961x452, advanced beyond10s and naturally ended39.34s. ffprobe confirms
  video-only stream (silent). No gallery or invented demo.
- Source HTML check passed: all6cards/live URLs, five nonempty table rows, video
  source, noindex and exact visible FAQ/schema equality before JavaScript. FAQ
  markup does not invent publication dates, reviews, ratings or offers.
-27unit/regression tests (24oral/Chiku +3existing media) pass,4live tests skip
  normally; separate refined-source and source-HTML tests passed once each.
  TSC/scoped lint/configured local build/two4950asset gates pass. No remoteNode22
  or latest CI claim yet.
- Actual LOCAL1319/390/320 checks: all6original photos decoded, exact six links
  and prices, no document/card overflow, video widths924/350/280 with native
  controls and full caption. Karola/Mary original photos visually reviewed.
  Proof: `six-brand-local-proof.json`, `source-html-proof.json`,
  `manual-video-mobile320.png`. Viewport reset/local dev server stopped.
- Private305report23:41:53.976Z:2healthy rows match bounded cells through independent
  dual row fingerprints/length; approved named sharing/limited parent/date/top-wrap
  unchanged; no formulas/failed/pending, no Sheet write or PII output.

Next remaining work: supported SY/Jarliet/TopCY/Yeloly/Firefly coverage and exact
head/body evidence, no false brand/SKU mappings or private-brand publication.
The current six-brand foundation is not an exhaustive market claim. Finish the
actual scoped content and exact hosted private proof before requesting acceptance.
Any new draft PR is WIP only; PR213 remains superseded and unmerged.

## Previous Expansion: 29 October 23:38 UTC

Still In Progress, not a finished all-brand guide or a hosted acceptance preview.
Continue this same branch; do not restart, resample the same48 products or patch
PR213. Current local content has FOUR brand sections, FIVE useful mechanism rows,
and FOUR real live-linked photo cards.

- Added Top Fire and Angelkiss sections. Angelkiss's manufacturer-authored public
  TDF post explicitly names ROS S198/S266/S273/LS59/LS60 and oral heat/suction.
  Attachment access says permission required: only the visible post text was used;
  no attachment request, login, contact or bypass. No battery/runtime claim.
- Added exact current custom Wendy170H: base2063, oral suction99, three-in-one189,
  plug-in Auto Blowjob309 OR rechargeable389. The two robot prices and mouth
  bundle are alternatives, not a cumulative total or standard fitted equipment.
  Current public menu/source is the authority for these itemized prices, not a
  foreign-retailer quote or inaccessible TDF demo. No warehouse promise.
- Added powered tongue as a distinct table row, and clarified that three-in-one
  can mean three openings rather than three motors. Yeloly's current homepage
  describes Violet's three openings. Its large product page could not be fetched;
  no claim to have read it. No old3-in-1 powered package was inferred from that.
- One NEW bounded read sampled six current public products for each of eight
  exact registered brands: WM/SY/MD/Jarliet/Angelkiss/YL/TopFire/SE.48records are
  retained privately in `brand-samples-private.json`, not an exhaustive census.
  No reads are stock installation receipts and no record was changed.
- Important rejected evidence: registered YL is NOT Yeloly. WM's five warehouse
  examples inherit general250 robot menus; this is not proof of installed stock.
  MD's first six samples are warehouse torsos, not proof custom options are absent.
  SY's observed60/120 raw oral deltas lack `priceVerified`, so no price card is
  granted. SE's generic robot menu on newer Elves does not override the primary
  approved-body list. Jarliet generic165D/168 menus do not resolve the exact
  construction/fit question against historical model lists.
- New guide-only guards require exact canonical brand as well as ID+handle, reject
  review/source/safety/content holds/test records, and never quote factory add-ons
  as installed warehouse equipment. No shared catalog/cart behavior was changed.
-22focused unit/Chiku assertions pass; both live read suites skipped normally.
  Separate bounded48source read passed once. TSC/scoped lint pass. Configured
  build/two4950asset gates pass; no remoteNode22 or CI claim yet.
- Actual LOCAL1319/390/320 checks: four decoded original photos including Wendy,
  four exact live product links/prices, no document/card overflow and noindex.
  Wendy narrow-screen prices were visually reviewed; long labels wrap and all
  prices remain visible. Five table rows/four brand sections present. Proof:
  `expanded-local-browser-proof.json` and `expanded-local-mobile320.png`.
  Viewport reset/dev server stopped. No hosted preview or all-brand acceptance.
- Official MD homepage unavailable; its separate TDF announcement403. TopFire
  official demo inaccessible and direct Bid product timed out. No unchanged
  retry or bypass. WM's actual factory domain links to wmdollshop; its ROS text
  confirms manual structure only, not universal powered-head features. The
  self-labelled `wmdoll.org` search result was not treated as factory authority.
  No stale supplier prices, anecdotes or claimed no-feature universals adopted.
- Linear shared-notes endpoint advertised by tool metadata returned tool-not-found;
  current repository/Linear/source evidence remained controlling. No retry loop.
- Private305report23:25:45.131Z: two rows match bounded cells by independent dual
  row fingerprints/length, approved permissions unchanged, correct limited folder,
  effective date/top/wrap verified, no formulas/failed/pending; no Sheet write/PII.

Next: use the retained48source snapshot. Target custom/non-warehouse WM and MD
records when needed, exact head/body source evidence for SY/Jarliet, and remaining
primary TopCY/Yeloly/Firefly scope without inventing a matching live DollWOW SKU.
Do not import or promote private brands. Finish suitable approved media, FAQ/schema,
source HTML and a NEW exact flagged hosted preview only when actual coverage is
ready. No fourth active ticket or new approval question is needed for this work.

## Authority And Competitor Work

Read Dolly's 29 October22:38 queue2 brief `ebbf28b1` and Martin's rejection
`e16ddd9a`, plus current DOL287 research. DOL314 remains In Review on its exact
combined private preview; DOL313 remains externally Done. Martin already sent
the customer reply; no supplier/customer contact by Codex.

Public search discovery and primary-source reading occurred before drafting.
These are observed public search results, not a controlled US Google rank audit.

| Competitor / Page | Observed Strength | Adopted Improvement / Limit |
| --- | --- | --- |
| Rosemary help-center auto-BJ brand FAQ | Short names and compatible-model pointers | Keep explanations short, but separate head suction from neck movement and link actual DollWOW dolls with current itemized prices. FAQ is dated April2025, not current warehouse proof. |
| ULoversDoll Top Fire vendor post on TDF | Distinct suction, electric tongue and nodding demonstrations | Separate mechanisms rather than treating the three as one feature. Vendor report is not an independent owner review or manufacturer proof. No forum posting/contact. |
| YourDoll | Search attempted; direct official homepage returned403 | No access bypass or repeated URL guessing. Its current page has NOT been inspected; no claim to beat an unread page. Retained as an explicit competitor evidence gap. |
| Perfectdoll robot beginner guide | Plain explanations of powered features | Do not inherit its broad no-hip-motion claim: SE's own guide documents a separate waist-spin mechanism. |
| Joydoll SY guide | Separates ROS suction and rotating tongue; shows body-fit considerations | Treat as a lead, not blanket SY compatibility authority. Verify exact supplier/body evidence before adopting. |

Relevant source URLs and adoption decisions are in the private research evidence
artifact. No competitor copy, anecdotes, or foreign-retailer price was reused as
DollWOW fact.

DataForSEO's known40207/IP hold was not retried or bypassed. One Treg web search
attempt failed authentication; no retry/login/credential workaround. Built-in
public web research was used instead. A bounded oral-topic GSC query was attempted
but its output was not recovered in the tool response; no GSC metrics are adopted
or claimed. Full DataForSEO / AI / GEO coverage is still missing. The newer brief
permits this private redo to proceed without falsely calling SEO research done.

## First Foundation

- Fresh four-row mechanism table, with useful content in every cell: ROS/manual,
  oral suction, powered neck movement, heating.
- Two manufacturer-grounded brand sections, Irontech and SE. Current Irontech
  body-exclusion conflict is qualified, not silently resolved by a general menu.
  Molly is NOT advertised as a supported neck-movement build.
- Three real, absolute live-PDP cards: Molly, Emma and Chiku. Original catalog
  photos, protected image URLs, no gallery, no generation/image editing.
- Strict real Storefront reads; no sample product fallback. Price helper checks
  exact product ID+handle, explicit option allowlist, unique group/option, verified
  finite nonnegative prices, availability/display/factory flags, conditionality
  and compatibility rules. Missing evidence hides the card, not a free-price guess.
- Molly base3199/head suction89/heating89; Emma base1999/head suction60/heating60
  from the fresh exact menu. These are separate add-ons, not complete landed quotes.
- Chiku base1999 is a clearly labeled MANUAL oral-structure counterexample, not a
  powered-oral recommendation. Its75 vaginal suction is deliberately not used as
  oral suction. Current included fixed-teeth/tongue fact is required to show it.
- Four short FAQ disclosures. No current-stock or universal feature-fit promise.

## First Foundation Verification

Private artifacts: `data/exports/dol-288-redo-2026-10-29/`.

- One opt-in current-source read test passed for three exact public identities;
  source menus/configs/hashes saved privately. No carts or mutations.
-20 focused unit/regression assertions passed (oral helper + existing Chiku).
  Normal live-source test remains skipped unless explicitly opted in.
- Full TSC passed after removing one obsolete generated `.next/dev/types` file
  left by the rejected branch. Source files/old branch were not removed.
- Scoped lint passed after fixing two JSX apostrophes.
- Configured local build passed; both4950 owned-asset gates and public-promotion
  data gate passed. Existing broad localVisualIndex warning / dynamic rendering
  diagnostics are not new oral-guide failures.
- Actual native-browser local1319/390/320 checks: no document overflow, three
  original product photos decoded, real absolute PDP links, itemized prices,
  noindex/nofollow. Table contained1130/348/278px; mobile content640px; actual
  keyboard scrolling reached40px. FAQ expanded normally. Viewport reset, local
  dev server stopped. This is LOCAL QA, not hosted approval proof.
- Final card-drift guards were subsequently rebuilt successfully with the same
  two4950asset gates. Final built-preview runtime390 showed all three exact cards,
  prices, decoded images/no overflow/noindex. Local production runtime returned
  actual HTTP404 even with the private flag set. Both local servers stopped.
  Recheck final hosted rendering before presenting a preview; local QA is not
  final all-brand acceptance.

## Next Required Work

1. Expand the actual all-brand comparison from DOL287 research, verifying each
   feature against primary supplier/current exact product evidence. Add useful
   fit/use-case/cost distinctions, not empty research-status rows. Top Fire hold
   records remain untouched; a body-only listing does not prove installed head
   functions or current stock. SY stock source is stale and not retail authority.
2. Check appropriate current brand marketing media/provenance where available;
   no galleries, unsafe media, explicit generation or invented demos.
3. Finish FAQ/schema/source-HTML/internal-link checks for the actual final copy;
   qualify remaining provider/GSC/YourDoll evidence gaps honestly.
4. Complete final tests/build and a NEW exact flagged private hosted preview,
   source/deployment match, desktop/mobile images/links/tables/FAQ proof.
5. Post the short exact preview receipt, then In Review for Dolly/Martin. Nothing
   live/merged without Martin's exact yes. PR213 stays superseded and untouched.

Continue DOL288 before229 then232. Three active tickets are224+84+288; do not start
a fourth. DOL285 stays Blocked, paid306 paused. Private305report refreshed23:07,
two healthy rows match the existing sheet exactly; approved sharing unchanged,
no Sheet write or PII output.
