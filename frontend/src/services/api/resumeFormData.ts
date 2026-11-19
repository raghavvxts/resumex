export const resumeFormData = (
  file: File | null,
  resumeText: string,
  inputMode: "pdf" | "text",
  jobDescription: string,
  roleLevel: string,
  yearsExperience: number,
): FormData => {
  const data = new FormData();
  if (inputMode === "pdf" && file) data.append("resume", file);
  if (inputMode === "text") data.append("resume_text", resumeText);
  data.append("job_description", jobDescription);
  data.append("role_level", roleLevel);
  data.append("years_experience", String(yearsExperience));
  return data;
};
