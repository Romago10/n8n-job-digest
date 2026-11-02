# Career Intelligence v2 — development-only prototype

This folder is an isolated, provider-agnostic prototype. It does not deploy, fetch jobs, schedule runs, call LLM APIs, send emails, or submit applications. Existing n8n snippets remain unchanged.

## Run locally
Install Node.js 20+ and run `npm test` from the repository root. The prototype requires no dependencies or API keys.

## Architecture
1. Normalize incoming jobs from adapters into a common shape with explicit work-mode and salary-period fields.
2. Deduplicate entries within a batch. A future persistent store should add cross-run deduplication using `canonicalKey`.
3. Apply eligibility rules, then transparent heuristic ranking.
4. Optionally send only shortlisted jobs with `evaluationPayload` and `systemPrompt` to an LLM via a future n8n integration. Validate output with `validateEvaluation`.
5. Store evaluations and application feedback in a future database.

## Known limitations
- No importable n8n workflow JSON is included in the current repository.
- Multi-source fuzzy duplicate matching is not implemented.
- Salary currency and hourly conversion are deliberately not assumed.
- Work mode must come from structured source metadata. Unknown is not automatically classified as remote.
- Heuristic matching is not semantic; an optional LLM stage is specified but not integrated.
- Cross-run persistence, tests against real API samples, observability, and model evaluation are future work.
- This branch is for experimentation, not production deployment.

## Recommended next additions
- JSearch/RemoteOK adapter fixtures with real redacted responses.
- SQLite/PostgreSQL persistence and status tracking.
- Optional LLM provider adapter with strict JSON parsing, budget controls, and a labeled evaluation dataset.
- n8n workflow export that calls these modules from an appropriate execution environment.
