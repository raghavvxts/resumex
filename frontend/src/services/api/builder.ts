import { request } from "./request";
/* eslint-disable @typescript-eslint/no-explicit-any */
import { environment } from "../../config/environment";

export const generatePDF = async (
  resumeData: any,
  templateName: string = "jakes_resume",
): Promise<Blob> => {
  const updatedResume = JSON.parse(JSON.stringify(resumeData));
  updatedResume.template_name = templateName;

  const response = await request(`${environment.apiUrl}/generate-pdf`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(updatedResume),
  });

  if (!response.ok) {
    const data = await response.json().catch(() => null);
    throw new Error(data?.error || "Failed to generate PDF. Please retry.");
  }

  return response.blob();
};
