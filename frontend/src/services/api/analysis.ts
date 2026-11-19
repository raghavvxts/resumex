import { resumeFormData } from "./resumeFormData";
import { request } from "./request";
/* eslint-disable @typescript-eslint/no-explicit-any */
import { environment } from "../../config/environment";
import { AnalysisResult } from "../../types";

export const analyzeResume = async (
  file: File | null,
  resumeText: string,
  resumeInputMode: "pdf" | "text",
  jobDesc: string,
  roleLevel: string,
  yearsExperience: number,
): Promise<AnalysisResult> => {
  const fd = resumeFormData(
    file,
    resumeText,
    resumeInputMode,
    jobDesc,
    roleLevel,
    yearsExperience,
  );

  const response = await request(`${environment.apiUrl}/analyze`, {
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

  const response = await request(`${environment.apiUrl}/parse-resume`, {
    method: "POST",
    body: fd,
  });

  if (!response.ok) {
    const data = await response.json().catch(() => null);
    throw new Error(data?.error || "Resume parsing failed. Please retry.");
  }

  const data = await response.json();
  if (data.error) throw new Error(data.error);

  return data;
};
