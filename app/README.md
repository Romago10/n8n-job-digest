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
