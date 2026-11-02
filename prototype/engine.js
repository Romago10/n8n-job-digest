import { profile as defaultProfile } from "./config.js";

const safe = value => String(value ?? "").trim();
const words = value => safe(value).toLowerCase();
const normalizeUrl = raw => {
  try {
    const url = new URL(raw);
    if (!["https:", "http:"].includes(url.protocol)) return "";
    url.hash = "";
    for (const k of [...url.searchParams.keys()]) if (/^utm_|^(ref|source|tracking)$/i.test(k)) url.searchParams.delete(k);
    url.hostname = url.hostname.toLowerCase();
    return url.toString().replace(/\/$/, "");
  } catch { return ""; }
};
export function normalizeJob(raw, source = "unknown") {
  const description = safe(raw.description ?? raw.job_description);
  const location = safe(raw.location ?? raw.job_city ?? "");
  const modeField = words(raw.workMode ?? raw.work_mode ?? raw.job_is_remote);
  const mode = ["remote","hybrid","onsite"].includes(modeField) ? modeField :
    (raw.job_is_remote === true ? "remote" : raw.job_is_remote === false ? "onsite" : "unknown");
  const salaryMinRaw = raw.salaryMin ?? raw.salary_min ?? raw.job_min_salary;
  const salaryMaxRaw = raw.salaryMax ?? raw.salary_max ?? raw.job_max_salary;
  const salaryMin = Number.isFinite(Number(salaryMinRaw)) && salaryMinRaw !== "" && salaryMinRaw != null ? Number(salaryMinRaw) : null;
  const salaryMax = Number.isFinite(Number(salaryMaxRaw)) && salaryMaxRaw !== "" && salaryMaxRaw != null ? Number(salaryMaxRaw) : null;
  return {
    id: safe(raw.id ?? raw.job_id),
    title: safe(raw.title ?? raw.job_title),
    company: safe(raw.company ?? raw.employer_name),
    description,
    location,
    workMode: mode,
    salaryMin,
    salaryMax,
    salaryPeriod: safe(raw.salaryPeriod ?? raw.job_salary_period ?? "unknown").toLowerCase(),
    url: normalizeUrl(raw.url ?? raw.job_apply_link ?? raw.job_google_link),
    source,
    observedAt: new Date().toISOString()
  };
}
export function canonicalKey(job) {
  if (job.url) return "url:" + job.url;
  return "job:" + [job.company, job.title, job.location].map(x => words(x).replace(/\s+/g," ")).join("|");
}
export function deduplicate(jobs) {
  const seen = new Set();
  return jobs.filter(job => {
    const key = canonicalKey(job);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
export function eligibility(job, p = defaultProfile) {
  const reasons = [];
  if (!job.title || !job.company) reasons.push("missing title or company");
  if (!job.url) reasons.push("missing safe URL");
  if (p.workModes?.length && job.workMode !== "unknown" && !p.workModes.includes(job.workMode)) reasons.push("work mode excluded");
  if (p.requiredLocations?.length && job.workMode !== "remote" && !p.requiredLocations.some(loc => words(job.location).includes(words(loc)))) reasons.push("location excluded");
  if (!p.allowUnknownSalary && job.salaryMin == null && job.salaryMax == null) reasons.push("salary unknown");
  return { eligible: reasons.length === 0, reasons };
}
const countHits = (phrases, text) => phrases.filter(term => text.includes(words(term))).length;
export function scoreJob(job, p = defaultProfile) {
  const text = words([job.title, job.description].join(" "));
  const skills = p.skills ?? [];
  const titles = p.targetTitles ?? [];
  const skillsPart = skills.length ? countHits(skills, text) / skills.length : 0;
  const directionPart = titles.length ? Math.min(1, countHits(titles, words(job.title)) / 1) : 0;
  // Only explicitly annual salaries are comparable to annual targets.
  const annual = ["year", "yearly", "annual", "annually", "yr"].includes(job.salaryPeriod);
  const salaryPart = annual && job.salaryMin != null ? Math.min(1, job.salaryMin / Math.max(1,p.preferredSalary || 75000)) : null;
  const modePart = job.workMode === "remote" ? 1 : job.workMode === "hybrid" ? 0.75 : job.workMode === "onsite" ? 0.5 : null;
  const values = {skills: skillsPart, direction: directionPart, salary:salaryPart, workMode:modePart};
  const weights = p.weights ?? defaultProfile.weights;
  let weighted = 0, used = 0;
  for (const [key,weight] of Object.entries(weights)) {
    if (values[key] != null && Number(weight)>0) { weighted += values[key]*Number(weight); used += Number(weight); }
  }
  return {
    score: used ? Math.round(weighted / used * 100) / 10 : null,
    dimensions: values,
    unknown: Object.entries(values).filter(([,v])=>v==null).map(([k])=>k),
    notes: ["Heuristic ranking only; unknown dimensions excluded rather than scored as zero."]
  };
}
export function rankJobs(rawJobs, p = defaultProfile, source = "unknown") {
  const unique = deduplicate(rawJobs.map(job => normalizeJob(job, source)));
  return unique.map(job => ({...job, eligibility: eligibility(job,p), ranking: scoreJob(job,p)}))
    .filter(job => job.eligibility.eligible)
    .sort((a,b) => (b.ranking.score ?? -1) - (a.ranking.score ?? -1));
}
