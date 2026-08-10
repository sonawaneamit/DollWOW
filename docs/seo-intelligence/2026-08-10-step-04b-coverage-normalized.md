# Step 4: Normalized Keyword Universe

Generated: 2026-08-10T18:12:24.795Z

## Completion Gate

Status: Passed

Every raw candidate is retained under one canonical variant key or rejected with an explicit reason.

## Totals

- Raw candidates: 4771
- Retained variants: 570
- Canonical keywords: 518
- Rejected keywords: 4201
- Accounted candidates: 4771
- Retained variants with fresh metrics: 338
- Retained variants with live SERPs: 139
- API cost: $0.0000

## Rejection Reasons

| Reason | Rows |
| --- | ---: |
| no_adult_doll_or_competitor_relevance | 2765 |
| catalog_pdp_entity_not_content_keyword | 1987 |
| unrelated_toy_collectible_or_accessory | 262 |
| unrelated_robot_query | 83 |
| media_seeking_not_commerce_content | 10 |
| generated_route_label_not_search_query | 8 |
| stale_year_modifier | 2 |

## Highest-Evidence Canonical Keywords

| Keyword | Variants | Volume | Competitors | Existing target | Catalog evidence | Live SERPs |
| --- | ---: | ---: | ---: | --- | --- | --- |
| sex dolls | 7 | 301000 | 11 | yes | no | desktop|mobile |
| best sex dolls | 2 | 9900 | 11 | yes | no | desktop|mobile |
| silicone sex dolls | 1 | 33100 | 10 | yes | yes | desktop|mobile |
| robotic sex dolls | 1 | 9900 | 10 | no | no | desktop|mobile |
| most realistic sex dolls | 1 | 4400 | 10 | yes | no | desktop|mobile |
| sex dolls brands | 1 | 170 | 10 | no | no | desktop|mobile |
| new sex doll | 1 | 1300 | 9 | no | no | desktop|mobile |
| gay love doll | 1 | 40 | 9 | no | no | desktop|mobile |
| real doll | 2 | 14800 | 8 | no | no | desktop|mobile |
| asian sex dolls | 1 | 2900 | 8 | no | no | desktop|mobile |
| sex doll for male | 1 | 2900 | 8 | yes | no | desktop|mobile |
| sexbots price | 1 | 260 | 8 | no | no | desktop|mobile |
| human silicone doll | 1 | 50 | 8 | no | no | desktop|mobile |
| male sex doll | 2 | 18100 | 7 | yes | no | desktop|mobile |
| how much do sexbots cost | 1 | 110 | 7 | no | no | desktop|mobile |
| plump sex doll | 2 | 50 | 7 | no | no | desktop|mobile |
| futa sex doll | 1 | 5400 | 6 | no | no | desktop|mobile |
| ai sexbot | 1 | 3600 | 6 | no | no | desktop|mobile |
| zelex doll | 2 | 2900 | 6 | yes | no | desktop|mobile |
| wm dolls | 2 | 1300 | 6 | yes | no | desktop|mobile |
| tpe doll | 2 | 1000 | 6 | no | no | desktop|mobile |
| love dolls for sale | 1 | 210 | 6 | no | no | desktop|mobile |
| how much is a silicone doll | 1 | 50 | 6 | no | no | desktop|mobile |
| tpe doll glue | 1 | 40 | 6 | no | no | desktop|mobile |
| sex doll cheap | 1 | 12100 | 5 | yes | no | desktop|mobile |
| torso sex dolls | 1 | 5400 | 5 | yes | no | desktop|mobile |
| adult dolls | 2 | 3600 | 5 | no | no | desktop|mobile |
| artificial intelligence sexbot | 1 | 3600 | 5 | no | no | desktop|mobile |
| anime love doll | 1 | 390 | 5 | no | no | desktop|mobile |
| silicone doll woman | 1 | 260 | 5 | no | no | desktop|mobile |
| full size silicone doll | 1 | 90 | 5 | no | no | desktop|mobile |
| what is a love doll | 1 | 90 | 5 | no | no | desktop|mobile |
| slim sex doll | 1 | 50 | 5 | no | no | desktop|mobile |
| silicone doll repair | 1 | 30 | 5 | no | no | desktop|mobile |
| black sex dolls | 1 | 2900 | 4 | no | no | desktop|mobile |
| petite sex doll | 1 | 2900 | 4 | yes | no | desktop|mobile |
| tpe love doll | 1 | 320 | 4 | no | no | desktop|mobile |
| real doll artificial intelligence | 1 | 260 | 4 | no | no | desktop|mobile |
| life size silicone doll | 1 | 170 | 4 | no | no | desktop|mobile |
| full silicone dolls for sale | 1 | 50 | 4 | no | no | desktop|mobile |

## Handoff To Step 5

- Use `canonical-keywords.json` as the candidate node table.
- Use `keyword-variant-map.json` for source lineage and phrase variants.
- Use Step 3 desktop/mobile organic results to calculate weighted SERP overlap.
- Keep `rejected-keywords.json` as the audit trail and inspect high-volume rejections before final tier-one approval.
