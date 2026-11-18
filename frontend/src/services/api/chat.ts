import { request } from "./request";
import { environment } from "../../config/environment";

export const chatWithStrategist = async (
  file: File | null,
  resumeText: string,
  resumeInputMode: "pdf" | "text",
  jobDesc: string,
  message: string,
  chatHistory: Array<{ role: string; content: string }>,
  roleLevel: string,
  yearsExperience: number,
): Promise<string> => {
  const fd = new FormData();
  if (resumeInputMode === "pdf" && file) fd.append("resume", file);
  if (resumeInputMode === "text") fd.append("resume_text", resumeText);
  fd.append("job_description", jobDesc);
  fd.append("message", message);
  fd.append("role_level", roleLevel);
  fd.append("years_experience", String(yearsExperience));
  fd.append("history", JSON.stringify(chatHistory));

  const response = await request(`${environment.apiUrl}/chat`, {
    method: "POST",
    body: fd,
  });

  if (!response.ok) {
    const data = await response.json().catch(() => null);
    throw new Error(data?.error || "Chat failed. Please retry.");
  }

  const data = await response.json();
  if (data.error) throw new Error(data.error);

  return data.reply;
};
