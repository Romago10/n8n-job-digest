// Provider-agnostic contract: no model calls are made by this module.
// Send systemPrompt + JSON.stringify(payload) to a separately configured LLM only if desired.
export const systemPrompt = `You are an evidence-based career fit evaluator.
Use only the supplied candidate profile and job posting. Do not invent skills,
salary, location, qualifications, or employers. Missing information stays unknown.
Return a single JSON object with: recommendation ("apply"|"review"|"skip"),
fitScore (integer 0-10), evidence (array of short strings), gaps (array),
uncertainties (array), and suggestedAction (string). Avoid protected-trait inferences.
Do not take external actions or submit applications.`;
export function evaluationPayload(job, candidateProfile) {
  return {
    candidate: {
      skills: candidateProfile.skills ?? [],
      experience: candidateProfile.experience ?? [],
      goals: candidateProfile.goals ?? []
    },
    job: {
      title: job.title, company: job.company, description: job.description,
      location: job.location, workMode: job.workMode,
      salaryMin: job.salaryMin, salaryMax: job.salaryMax, salaryPeriod: job.salaryPeriod
    }
  };
}
export function validateEvaluation(value) {
  if (!value || typeof value !== "object" || !["apply","review","skip"].includes(value.recommendation) ||
      !Number.isInteger(value.fitScore) || value.fitScore < 0 || value.fitScore > 10 ||
      !["evidence","gaps","uncertainties"].every(key => Array.isArray(value[key]) && value[key].every(x => typeof x === "string")) ||
      typeof value.suggestedAction !== "string") throw new Error("Invalid LLM evaluation output");
  return value;
}
