# GSC P0 Title Refresh

Date: 2026-08-29

Status: content ready; release verification pending

## Scope And Canonical Action

- Refresh the title, description, and H1 on the existing canonical owners `/learn/sex-doll-guide` and `/learn/body-heating-sex-doll-guide`.
- Lock the visible H1 and regional shipping description for Erovenus Thia, Hailey, and Hazel custom listings and their US, Canada, European Union, and Australia ready-to-ship records while leaving their document titles unchanged.
- Keep all existing URLs, prices, product status, visible ready-to-ship titles, and page types. No thin URL or new canonical owner is justified.

## Evidence Record

| Evidence | Run date | Status | Cost | Artifact | Adopted finding |
| --- | --- | --- | --- | --- | --- |
| Google Search Console live week, 20–26 Aug | 2026-08-29 | supplied owner snapshot | n/a | `/Users/amitsonawane/codex-proof/gsc-p0-titles-prompt.txt` | The flagship guide and heating guide rank on page one but earned no clicks; desktop CTR trails mobile. Use specific intent-first titles and buyer-checklist language. |
| Erovenus query and conversion snapshot | 2026-08-29 | supplied owner snapshot | n/a | `/Users/amitsonawane/codex-proof/gsc-p0-titles-prompt.txt` | Thia, Hailey, and Hazel appear at positions 3–9 with no CTR; Marina converts. Mirror Marina's supported product identity pattern. |
| Body-heating organic SERP research | 2026-08-12 | success | recorded in source artifact | `docs/seo-intelligence/2026-08-12-step-40-body-heating-serp.md` | Preserve the existing heating guide as the single educational owner and lead with compatibility and safety checks. |
| First-time buyer AI benchmark | 2026-08-12 | success | recorded in source artifact | `docs/seo-intelligence/2026-08-12-step-50-first-time-buyer-ai.md` | Preserve the flagship guide as the canonical first-time-buyer owner; no new beginner URL. |
| Wave-four guide intelligence | 2026-08-12 | success | recorded in source artifact | `docs/seo-intelligence/2026-08-12-step-73-wave4-guides.md` | Keep material, handling, total price, stock versus custom, seller proof, and care as buyer decisions. |
| Live sitemap and storefront HTML verification | 2026-08-29 | success | $0 | production read before release | The three custom handles and all twelve requested AU/CA/EU/US ready-to-ship handles are live. Their H1s omit the model name before this release; the worktree override is limited to those exact handle families. |

## Adopted Copy Decisions

- `Sex Doll Buying Guide (2026): Size, Weight, TPE vs Silicone | DollWow` names the four principal comparison decisions in the locked ship copy.
- `Sex Doll Body Heating: Zones, Power, and Safety | DollWow` keeps the exact query entity and identifies the checks already supported by the guide.
- Descriptions name the requested country coverage and add no performance, temperature, delivery-time, or safety guarantee.
- The Erovenus H1 override adds the verified model name, height, cup, material, and product type to the three custom records and their twelve regional ready-to-ship records. Document titles, price, and publication state remain unchanged.

## Rejected Evidence And Changes

- No AI response was treated as factual authority.
- No new indexable URLs, claims, metrics, prices, availability promises, schemas, models, product handles, or product publication changes were adopted.
- The three legacy learning URLs consolidate into their live canonical owners with permanent redirects. Product-populated `/compare?product=` URLs are noindexed and keep `/compare` as canonical.
- Generic keyword variants that would weaken the exact buyer task or imply universal heating behavior were rejected.

## Monitoring

- Hard-refresh the two guide URLs and all fifteen product URLs after release.
- Recheck indexed title rendering and desktop/mobile GSC CTR after enough impressions accumulate; retain the existing canonicals during the test window.
