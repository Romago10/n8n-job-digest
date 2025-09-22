# n8n Automated Job Search Digest

![n8n](https://img.shields.io/badge/automation-n8n-blue) 
![APIs](https://img.shields.io/badge/jobs-API-green) 
![License: MIT](https://img.shields.io/badge/License-MIT-yellow)

Automates multi-source job discovery and sends a scored email digest every 6 hours using **n8n**. The workflow fetches jobs from **JSearch (RapidAPI)** and **RemoteOK**, merges & de-duplicates results, **filters + scores** roles against your skills, then **emails a digest** via Gmail.

> ⚡️ This is a transferable automation pattern you can adapt for lead gen, competitor monitoring, or compliance checks.

---

## ✨ Features
- **Multi-source fetch:** JSearch (RapidAPI) + RemoteOK.
- **De-duplication:** Based on URL/title/company.
- **Filter + Score:** Keyword match against configurable skill set → 0–10 score.
- **Email Digest:** HTML summary to your inbox on a schedule (default: every 6 hours).
- **Portable Design:** Swap sources or templates with minimal changes.

---

## 🛠 Architecture

The workflow runs every 6 hours, fetches jobs from multiple sources, merges and deduplicates them, applies a keyword-based scoring system, and emails a digest.

```mermaid
graph LR
  A[Every 6 hours] --> B[JSearch API]
  A --> C[RemoteOK API]
  B --> D[Merge + Dedup]
  C --> D[Merge + Dedup]
  D --> E[Filter + Score]
  E --> F[Aggregate Digest HTML]
  F --> G[Gmail Send]

```
*![Workflow Screenshot](docs/img/workflow.png)
*

---

## 📩 Example Digest

Here’s a sample of the email digest this workflow generates (simplified & redacted):

🔹 Data Analyst — RemoteOK
Score: 9/10
Company: Remote First Inc.
Link: https://remoteok.io/jobs/12345

🔹 Business Intelligence Analyst — JSearch
Score: 8/10
Company: AnalyticsPro
Link: https://jsearch.com/job/67890

🔹 Junior Data Engineer — RemoteOK
Score: 7/10
Company: CloudWorks
Link: https://remoteok.io/jobs/22222

🔹 Reporting Analyst — JSearch
Score: 7/10
Company: InsightCorp
Link: https://jsearch.com/job/33333

---

**Subject:** Your Job Digest — 4 New Matches (Scored vs Skills)

**Body:**

## 🚀 Quick Start

### 1) Prerequisites
- **n8n** (Cloud or self‑hosted; v1+ recommended)
- **RapidAPI key** for JSearch
- **Gmail** (OAuth or SMTP; n8n credential)
- Optional: **Docker** for running n8n locally

### 2) Import the workflow
1. In n8n, click **Workflows → Import from File**.
2. Select `workflow/job_digest_workflow.json` (export yours from your n8n editor: **Workflow menu → Export**).

> This repo includes the structure and sample code snippets; export your own JSON so you don’t commit secrets.

### 3) Configure credentials
- **JSearch (HTTP Request node):**
  - Method: `GET`
  - URL: `https://jsearch.p.rapidapi.com/search`
  - Headers:
    - `x-rapidapi-key: {{ RAPIDAPI_KEY }}`
    - `x-rapidapi-host: jsearch.p.rapidapi.com`
- **RemoteOK (HTTP Request node):**
  - Method: `GET`
  - URL: `https://remoteok.io/api`
- **Gmail (Gmail node):**
  - From: `{{ GMAIL_FROM }}`
  - To: `{{ RECIPIENT_EMAIL }}`

> Store secrets in n8n’s **Credentials**. Do not commit real keys to Git.

### 4) Set schedule
- Add a **Cron** node → Every **6 hours** (or use env var `DIGEST_EVERY_HOURS`).

### 5) Customize scoring & filters
In your **Filter + Score** Function node, paste/adapt the code in `workflow/scoring.js`.

### 6) Aggregate HTML email
In your **Aggregate Digest** Function node, paste/adapt the code in `workflow/email_template.js`.

### 7) Test & activate
- Click **Execute workflow** to test.
- Review the email; tweak skills/filters.
- Toggle **Active** to schedule.

---

## 🛠 Project Structure

```
.
├─ README.md
├─ LICENSE
├─ .gitignore
├─ .env.example
├─ workflow/
│  ├─ job_digest_workflow.json   # export yours from n8n (no secrets)
│  ├─ scoring.js                 # code snippet for scoring node
│  └─ email_template.js          # code snippet for email digest node
└─ docs/
   └─ img/
      └─ workflow.png            # optional screenshot
```
## Setup
1. Clone repo  
2. Install n8n (Docker or npm)  
3. Import `workflow/job_digest_workflow.json` into n8n  
4. Add your API keys and Gmail creds to `.env`  
5. Start n8n and activate workflow  

---

## 🔐 Security Notes
- Keep real secrets in **n8n Credentials** or `.env` used by Docker; never commit them.
- The included `.gitignore` already ignores `.env`, `.n8n/`, etc.

---

## 📈 Resume/Portfolio Angle
*Built an n8n automation that fetches, merges, scores, and emails job leads every 6 hours; reduced manual search time ~80% and demonstrated portable automation skills (APIs, scoring, HTML email).*

## 🔮 Future Enhancements
- Add salary/location filters  
- Slack/Discord notifications instead of email  
- Save results into a database for trend analysis  
- Power BI dashboard from job data  

---

## 📝 License
MIT — see `LICENSE`.

🔗 Featured on [LinkedIn](https://www.linkedin.com/posts/rowan-celestino_automation-ai-dataanalytics-activity-7376020052971565056-w-I3?utm_source=share&utm_medium=member_desktop&rcm=ACoAACzdnukBMOVGkHR3b2WrZfK3RYZkxBuSOIU) — project walkthrough & discussion
