# Recommendation Intelligence: sex doll sizes and weight

Generated: 2026-08-12T06:12:49.054Z

## Decision

Benchmark how current answer engines and indexed content frame this recommendation question before writing. Raw responses are cached locally; only findings that can improve buyer usefulness, source quality, or answer structure should change the public page.

## Run Summary

- Mode: execute
- Requests: 4
- Failed requests: 0
- Recorded cost: $0.1143

| API | Endpoint | Cost | Status |
| --- | --- | ---: | --- |
| AI Optimization | `/ai_optimization/chat_gpt/llm_responses/live` | $0.0239 | Ok. |
| AI Optimization | `/ai_optimization/claude/llm_responses/live` | $0.0296 | Ok. |
| AI Optimization | `/ai_optimization/gemini/llm_responses/live` | $0.0360 | Ok. |
| Content Analysis | `/content_analysis/search/live` | $0.0247 | Ok. |

## Prompt

I am a first-time adult buyer in the United States choosing a full-size sex doll. How should I compare doll height and listed weight, what practical measurements should I take at home, and how much do material and body proportions affect handling? Cite current web sources, use both US and metric units, and separate general guidance from product-specific facts.

## Usage Rule

Treat model responses as competitive research, not factual authority. Verify material claims against DollWow policies, current catalog data, manufacturer documentation, and primary sources before publication.

## Findings

- ChatGPT, Claude, and Gemini agreed that buyers need to plan the complete movement route, not just compare height. Repeated needs included doorways, hallway turns, stairs, elevators, storage depth, furniture capacity, lifting access, and the buyer's own physical limits.
- The models contradicted one another on whether TPE or silicone is inherently heavier. They also repeated unsupported universal size, weight, clothing-fit, weight-reduction, and handling ranges. Those claims are rejected.
- ChatGPT cited two retailer explainers. Claude cited retailer and low-authority editorial pages. Gemini returned opaque grounding redirects rather than useful source pages. None provides stronger evidence than DollWow's dated catalog dataset.
- Content Analysis was again polluted by unrelated or low-quality adult content. It is not suitable as a factual writing source for this topic.
- The existing guide already covers height, weight, body proportions, doorways, turns, stairs, elevators, storage dimensions, safe handling, material uncertainty, dual units, product examples, and methodology. A narrow addition about support-surface capacity and close lifting access closes the only practical gap worth adopting.

## Decision

Keep `/learn/sex-doll-size-weight-guide` as the single canonical owner. Preserve its original analysis of 2,615 current full-size DollWow listings as the citation-worthy core. Do not copy universal ranges from answer engines or competitor articles. Recheck answer-engine citations after the page has had time to be crawled and externally discovered.
