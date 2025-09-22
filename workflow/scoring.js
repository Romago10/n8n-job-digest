// scoring.js — n8n Function node snippet

const SKILLS = ({{$json.SKILLS || ''}} || ({{$env.SKILLS || ''}}) || 'sql,python,excel,tableau,power bi,automation,n8n,github,etl')
  .toLowerCase()
  .split(',')
  .map(s => s.trim())
  .filter(Boolean);

function scoreJob(job) {
  const text = [job.title, job.company, job.description, ...(job.tags || [])]
    .filter(Boolean).join(' ').toLowerCase();
  const matches = SKILLS.reduce((acc, s) => acc + (text.includes(s) ? 1 : 0), 0);
  const coverage = matches / Math.max(SKILLS.length, 1);
  const bonus = ['remote','analyst','automation','ai'].reduce((acc, k) => acc + (text.includes(k) ? 0.5 : 0), 0);
  return Math.min(10, Math.round((coverage * 10) + bonus));
}

const seen = new Set();
const cleaned = $input.all().map(i => i.json).filter(job => {
  const key = (job.url || job.title || '') + '::' + (job.company || '');
  if (seen.has(key)) return false;
  seen.add(key);
  return true;
});

const filtered = cleaned.filter(job => {
  const text = [job.title, job.description, job.location].join(' ').toLowerCase();
  return text.includes('remote');
}).map(job => ({ json: { ...job, score: scoreJob(job) } }));

const TOP_N = 20;
return filtered.sort((a, b) => b.json.score - a.json.score).slice(0, TOP_N);
