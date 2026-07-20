/* eslint-disable @typescript-eslint/no-explicit-any */
import { environment } from "../../config/environment";

export const generateSkillsAnalysis = async (
  file: File | null,
  resumeText: string,
  resumeInputMode: "pdf" | "text",
  jobDesc: string,
  roleLevel: string,
  yearsExperience: number
): Promise<any> => {
  const fd = new FormData();
  if (resumeInputMode === "pdf" && file) fd.append("resume", file);
  if (resumeInputMode === "text") fd.append("resume_text", resumeText);
  
  fd.append("job_description", jobDesc);
  fd.append("role_level", roleLevel);
  fd.append("years_experience", String(yearsExperience));

  const response = await fetch(`${environment.apiUrl}/skills-analysis`, {
    method: "POST",
    body: fd,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    throw new Error(errorData?.error || "Failed to analyze skills");
  }

  const data = await response.json();
  if (data.error) throw new Error(data.error);

  return data;
};
