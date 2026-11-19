import { request } from "./request";
/* eslint-disable @typescript-eslint/no-explicit-any */
import { environment } from "../../config/environment";

export class PDFGenerationError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
  }
}

export const generatePDF = async (
  resumeData: any,
  templateName: string = "simple_resume",
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
    throw new PDFGenerationError(
      data?.error || "Failed to generate PDF. Please retry.",
      response.status,
    );
  }

  const bytes = await response.arrayBuffer();
  if (new TextDecoder().decode(bytes.slice(0, 5)) !== "%PDF-") {
    throw new Error("The server returned an invalid PDF. Please retry.");
  }
  return new Blob([bytes], { type: "application/pdf" });
};
