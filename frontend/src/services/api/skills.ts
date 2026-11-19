import { resumeFormData } from "./resumeFormData";
import { request } from "./request";
/* eslint-disable @typescript-eslint/no-explicit-any */
import { environment } from "../../config/environment";

export const generateSkillsAnalysis = async (
  file: File | null,
  resumeText: string,
  resumeInputMode: "pdf" | "text",
  jobDesc: string,
  roleLevel: string,
  yearsExperience: number,
): Promise<any> => {
  const fd = resumeFormData(
    file,
    resumeText,
    resumeInputMode,
    jobDesc,
    roleLevel,
    yearsExperience,
  );

  const response = await request(`${environment.apiUrl}/skills-analysis`, {
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
