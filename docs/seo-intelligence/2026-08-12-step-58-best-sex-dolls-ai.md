# Recommendation Intelligence: best sex dolls

Generated: 2026-08-12T07:04:47.668Z

## Decision

Benchmark how current answer engines and indexed content frame this recommendation question before writing. Raw responses are cached locally; only findings that can improve buyer usefulness, source quality, or answer structure should change the public page.

## Run Summary

- Mode: execute
- Requests: 4
- Failed requests: 0
- Recorded cost: $0.1108

| API | Endpoint | Cost | Status |
| --- | --- | ---: | --- |
| AI Optimization | `/ai_optimization/chat_gpt/llm_responses/live` | $0.0240 | Ok. |
| AI Optimization | `/ai_optimization/claude/llm_responses/live` | $0.0259 | Ok. |
| AI Optimization | `/ai_optimization/gemini/llm_responses/live` | $0.0361 | Ok. |
| Content Analysis | `/content_analysis/search/live` | $0.0247 | Ok. |

## Prompt

I am a US first-time buyer comparing the best adult sex dolls available in 2026. Explain how to choose by material, handling weight, size, realism, budget, stock versus custom production, seller proof, arrival protection, care, and repair support. Name useful product or brand examples only when supportable and cite current web sources.

## Usage Rule

Treat model responses as competitive research, not factual authority. Verify material claims against DollWow policies, current catalog data, manufacturer documentation, and primary sources before publication.

## Findings Applied

- ChatGPT, Claude, and Gemini repeatedly organized the decision around material, handling weight, size, realism, budget, seller verification, arrival protection, care, and repair support. The existing DollWow guide already owned those buyer questions.
- The page was strengthened with a direct buyer-routing table and DollWow's dated analysis of 2,615 current full-size listings rather than adding unsupported subjective rankings.
- All six shortlisted DollWow product URLs returned successfully on August 12, 2026.
- Official Irontech, Starpery, and SE Doll pages were added as manufacturer context. Live DollWow listings remain the source of truth for current product details.
- Content Analysis was heavily polluted by unrelated pages and future-dated or low-quality material. It was rejected as a factual writing source.
- Model responses included inconsistent material generalizations and weak third-party citations. Those claims were not imported.
