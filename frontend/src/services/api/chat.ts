import { resumeFormData } from "./resumeFormData";
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
  const fd = resumeFormData(
    file,
    resumeText,
    resumeInputMode,
    jobDesc,
    roleLevel,
    yearsExperience,
  );
  fd.append("message", message);
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
