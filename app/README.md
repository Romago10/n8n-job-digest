# Career Intelligence — local vanilla application

This is a **development-only** interface built on the separate prototype branch. No hosting, external job feeds, n8n schedules, Gmail sends, or AI inference are activated.

## Requirements and local run

Node.js **24+** is recommended for the built-in \`node:sqlite\` module. From the repository root:

\`\`\`sh
npm start
\`\`\`

Open \`http://127.0.0.1:3000\` in your browser. Data is stored in \`app/career.db\` and is not intended for production or internet-facing use.

Use **Load sample opportunities** to populate three explicitly fictional listings. Add additional sample jobs with the manual-entry form.

## Features

- Dashboard: job counts, ranked opportunities, seed sample data.
- Opportunities: local listing ingestion, search/filter, scores and explanations, status and notes.
- Applications: saved and progressed job records.
- Settings: editable skills, target titles, annual salary, and work arrangements.
- Backend: local-only HTTP server, SQLite persistence, shared scoring/eligibility code.
- LLM: provider-agnostic contract exists in \`prototype/evaluation-contract.js\` but is deliberately not connected.
- Email: existing n8n digest concept is preserved but sending is not connected.

## Next development steps

Add a proper job-ingestion adapter, cross-source canonicalization, server-side profile validation, real data fixtures, structured model evaluations with explicit approval, and an email digest renderer reading stored results. Harden the API and authentication before considering deployment.


## Offline evaluation milestone (November 2026)

The application now includes five fictional job fixtures in `prototype/fixtures.js`, an offline deterministic structured evaluator in `prototype/offline-evaluator.js`, and an HTML digest generator in `prototype/digest.js`.

**How to explore:** Run `npm start` (Node.js 24+). From Dashboard click **Load fictional fixtures**, then open any job in Opportunities and click **Evaluate offline**. Back on Dashboard click **Preview digest** to render the stored listings as a sandboxed email preview. This does not send email.

**API:**
- `POST /api/fixtures` inserts the five fictional records (idempotent by canonical URL).
- `POST /api/jobs/:id/evaluate` computes and persists a rules-based JSON evaluation, not LLM inference.
- `GET /api/digest-preview` returns a subject, sanitized HTML, and count.

**Model extension boundary:** `prototype/evaluation-contract.js` defines a provider-independent prompt, payload, and output validator for future model integration. No provider is configured or called. The offline evaluator is a placeholder for testing the data flow; its explanation is based on explicit keyword overlap and must not be presented as independent AI reasoning. A future model adapter should use strict JSON validation, source grounding, timeouts and manual approval.

**Safety and operational scope:** The fixture companies and URLs are invented; job links are not verified openings. No API keys, user accounts, deployments, scraping, schedules, or email sends. Existing stored evaluations are invalidated when candidate settings are modified. An integrated runtime test was attempted but unavailable due to network access restrictions; run `npm test` locally before relying on the app.

## Reliability and evaluation lab

The **Evaluation Lab** tab compares a baseline score and the offline evaluator against five provisional human labels on fictional listings. Both evaluators share the same core heuristic: the comparison is a diagnostic baseline, **not** independent model accuracy. Run `npm test` after cloning. The lab endpoint is `GET /api/lab`.

Profile writes now validate all skills, role titles, work modes, salary preference and scoring weights. The score API separately reports `completeness`, the proportion of scoring dimensions with observed inputs; this is **not** evidence confidence. Opportunity search preserves focus, and the details panel follows current filters.

**Known remaining limitations:** unverified runtime tests in this environment; same-company/title/location deduplication can conflate distinct openings; no independent LLM provider; no genuine human-labeled benchmark; no historical evaluation versioning; no live API adapters or email sending. Do not deploy publicly or treat the lab agreement as predictive performance.
