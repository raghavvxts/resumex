/* eslint-disable @typescript-eslint/no-explicit-any */
import { environment } from "../config/environment";
import { AnalysisResult } from "../types";

export const uploadResume = async (
  file: File,
  jobDesc: string,
  roleLevel: string,
  yearsExperience: number,
  company: string
): Promise<AnalysisResult> => {
  const fd = new FormData();
  fd.append("resume", file);
  fd.append("job_description", jobDesc);
  fd.append("role_level", roleLevel);
  fd.append("years_experience", yearsExperience.toString());
  fd.append("company", company);

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

export const parseResumeToJSON = async (file: File): Promise<any> => {
  const fd = new FormData();
  fd.append("resume", file);
  
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

export const generatePDF = async (resumeData: any, templateName: string = "jakes_resume"): Promise<Blob> => {
  const updatedResume = JSON.parse(JSON.stringify(resumeData));
  updatedResume.template_name = templateName;
  
  const response = await fetch(`${environment.apiUrl}/generate-pdf`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(updatedResume)
  });

  if (!response.ok) {
    throw new Error("Failed to generate PDF");
  }

  return response.blob();
};
