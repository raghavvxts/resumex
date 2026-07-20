/* eslint-disable @typescript-eslint/no-explicit-any */
import { environment } from "../../config/environment";
import { AnalysisResult } from "../../types";

export const analyzeResume = async (
  file: File | null,
  resumeText: string,
  resumeInputMode: "pdf" | "text",
  jobDesc: string,
  roleLevel: string,
  yearsExperience: number
): Promise<AnalysisResult> => {
  const fd = new FormData();
  if (resumeInputMode === "pdf" && file) fd.append("resume", file);
  if (resumeInputMode === "text") fd.append("resume_text", resumeText);
  
  fd.append("job_description", jobDesc);
  fd.append("role_level", roleLevel);
  fd.append("years_experience", String(yearsExperience));
  
  const response = await fetch(`${environment.apiUrl}/analyze`, {
    method: "POST",
    body: fd,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    throw new Error(errorData?.error || "Analysis failed.");
  }

  return response.json();
};

export const parseResumeStructural = async (
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

  const response = await fetch(`${environment.apiUrl}/parse-resume`, {
    method: "POST",
    body: fd,
  });

  if (!response.ok) {
    throw new Error("Failed to parse structural resume");
  }

  const data = await response.json();
  if (data.error) throw new Error(data.error);

  return data;
};
