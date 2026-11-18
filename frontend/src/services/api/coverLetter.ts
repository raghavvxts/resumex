import { request } from "./request";
import { environment } from "../../config/environment";

export const generateCoverLetter = async (
  file: File | null,
  resumeText: string,
  resumeInputMode: "pdf" | "text",
  jobDesc: string,
  roleLevel: string,
  yearsExperience: number,
  tone: string,
): Promise<string> => {
  const fd = new FormData();
  if (resumeInputMode === "pdf" && file) fd.append("resume", file);
  if (resumeInputMode === "text") fd.append("resume_text", resumeText);

  fd.append("job_description", jobDesc);
  fd.append("role_level", roleLevel);
  fd.append("years_experience", String(yearsExperience));
  fd.append("tone", tone);

  const response = await request(`${environment.apiUrl}/cover-letter`, {
    method: "POST",
    body: fd,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    throw new Error(errorData?.error || "Failed to generate cover letter");
  }

  const data = await response.json();
  if (data.error) throw new Error(data.error);

  return data.cover_letter;
};
