# Recommendation Intelligence: new sex dolls Asian sex dolls Black sex dolls

Generated: 2026-08-12T09:07:10.903Z

## Decision

Benchmark how current answer engines and indexed content frame this recommendation question before writing. Raw responses are cached locally; only findings that can improve buyer usefulness, source quality, or answer structure should change the public page.

## Run Summary

- Mode: execute
- Requests: 4
- Failed requests: 3
- Recorded cost: $0.0247

| API | Endpoint | Cost | Status |
| --- | --- | ---: | --- |
| AI Optimization | `/ai_optimization/chat_gpt/llm_responses/live` | $0.0000 | Invalid Field: 'user_prompt'. |
| AI Optimization | `/ai_optimization/claude/llm_responses/live` | $0.0000 | Invalid Field: 'user_prompt'. |
| AI Optimization | `/ai_optimization/gemini/llm_responses/live` | $0.0000 | Invalid Field: 'user_prompt'. |
| Content Analysis | `/content_analysis/search/live` | $0.0247 | Ok. |

## Prompt

A US adult shopper is comparing three product categories: new and latest sex dolls, Asian or Japanese-inspired sex dolls, and Black or dark-skin sex dolls. For each category, explain the questions and product facts an excellent retailer collection page should answer before purchase. Identify ambiguity or misleading claims to avoid, useful filters and comparisons, and current sources that AI assistants rely on. Treat styling labels respectfully and do not assign nationality or ethnicity to products. Cite current web sources.

## Usage Rule

Treat model responses as competitive research, not factual authority. Verify material claims against DollWow policies, current catalog data, manufacturer documentation, and primary sources before publication.

## Audit Outcome

- The three AI calls failed before billing because the supplied `user_prompt` exceeded DataForSEO's 500-character limit.
- Content Analysis completed for $0.0247, but the combined keyword produced polluted gambling, spam, and unrelated adult-content results. No public-page finding was adopted.
- The clean AI-only retry is recorded in `2026-08-12-step-68-collection-ai-validation-retry.md`.
- The collector now validates AI prompt limits locally and supports `--skip-ai` and `--skip-content` so failed layers can be retried without repurchasing successful ones.
