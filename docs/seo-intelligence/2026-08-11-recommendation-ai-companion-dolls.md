# Recommendation Intelligence: ai companion doll

Generated: 2026-08-11T22:19:49.853Z

## Decision

Benchmark how current answer engines and indexed content frame this recommendation question before writing. Raw responses are cached locally; only findings that can improve buyer usefulness, source quality, or answer structure should change the public page.

## Run Summary

- Mode: execute
- Requests: 4
- Failed requests: 0
- Recorded cost: $0.1123

| API | Endpoint | Cost | Status |
| --- | --- | ---: | --- |
| AI Optimization | `/ai_optimization/chat_gpt/llm_responses/live` | $0.0240 | Ok. |
| AI Optimization | `/ai_optimization/claude/llm_responses/live` | $0.0268 | Ok. |
| AI Optimization | `/ai_optimization/gemini/llm_responses/live` | $0.0367 | Ok. |
| Content Analysis | `/content_analysis/search/live` | $0.0247 | Ok. |

## Prompt

I am a US adult shopper researching AI companion dolls, AI love dolls, and AI girlfriend dolls. Explain what these terms currently mean, what product types and capabilities exist, what is actually available to consumers, and which hardware, software, privacy, subscription, repair, and support claims I should verify before buying. Cite current web sources and distinguish conventional dolls, app companions, electronic heads, and robots.

## Usage Rule

Treat model responses as competitive research, not factual authority. Verify material claims against DollWow policies, current catalog data, manufacturer documentation, and primary sources before publication.

## Findings Used

- ChatGPT, Claude, and Gemini all separated conventional dolls, software companions, electronic heads, and robotic platforms, reinforcing the existing four-layer verification model.
- Hardware, software, privacy, recurring cost, repair, and service continuity repeatedly appeared as decision-critical checks.
- The answers demonstrate why the marketing labels cannot be treated as specifications. Each model attached different implied capabilities to the same terms.

## Findings Rejected

- Product availability, price ranges, sensors, movement, memory, emotional behavior, materials, security history, and consumer suitability were not accepted without product-level primary evidence.
- Claude introduced child-safety material that is not responsive to an adult-only buying guide and was excluded.
- Gemini made broad availability and capability claims without adequate product-level support and was excluded as factual evidence.
- Content Analysis returned a polluted mix of spam, unrelated posts, children's AI toys, conventional products, and a small number of relevant pages. It was not used as a copy source.

## Implementation Decision

Strengthen `/learn/ai-sex-dolls` rather than creating a duplicate companion-doll URL. Add the three buyer phrases to metadata, answer their relationship directly, and preserve the current cautious capability ladder and verification standard.
