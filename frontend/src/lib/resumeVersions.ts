/* eslint-disable @typescript-eslint/no-explicit-any */
export const VERSIONS_KEY = "resumaxer-versions-v1";
export interface ResumeVersion {
  id: string;
  name: string;
  savedAt: string;
  data: Record<string, any>;
}
export const validSnapshot = (data: any): boolean => {
  if (!data || typeof data !== "object" || Array.isArray(data)) return false;
  if (typeof data.resumeText !== "string") return false;
  for (const key of [
    "jobDescription",
    "letter",
    "tone",
    "roleLevel",
    "mode",
    "selectedCompany",
    "selectedRole",
  ])
    if (data[key] !== undefined && typeof data[key] !== "string") return false;
  if (
    data.yearsExperience !== undefined &&
    (typeof data.yearsExperience !== "number" ||
      !Number.isFinite(data.yearsExperience))
  )
    return false;
  const resume = data.parsedResume;
  if (!resume) return true;
  if (
    typeof resume !== "object" ||
    !resume.personal_info ||
    typeof resume.personal_info !== "object" ||
    Array.isArray(resume.personal_info)
  )
    return false;
  if (
    Object.values(resume.personal_info).some(
      (value) => typeof value !== "string",
    )
  )
    return false;
  if (resume.summary !== undefined && typeof resume.summary !== "string")
    return false;
  if (
    resume.parsing_warnings !== undefined &&
    (!Array.isArray(resume.parsing_warnings) ||
      resume.parsing_warnings.some((value: any) => typeof value !== "string"))
  )
    return false;
  for (const key of ["education", "experience", "projects"]) {
    if (resume[key] !== undefined && !Array.isArray(resume[key])) return false;
    for (const entry of resume[key] || []) {
      if (!entry || typeof entry !== "object" || Array.isArray(entry))
        return false;
      if (
        Object.entries(entry).some(([field, value]) =>
          field === "bullets"
            ? !Array.isArray(value) ||
              value.some((bullet) => typeof bullet !== "string")
            : typeof value !== "string",
        )
      )
        return false;
    }
  }
  if (
    resume.skills !== undefined &&
    (!resume.skills ||
      typeof resume.skills !== "object" ||
      Array.isArray(resume.skills) ||
      Object.values(resume.skills).some(
        (value) =>
          typeof value !== "string" &&
          (!Array.isArray(value) ||
            value.some((skill) => typeof skill !== "string")),
      ))
  )
    return false;
  return true;
};
export const readVersions = (): ResumeVersion[] => {
  try {
    const data = JSON.parse(localStorage.getItem(VERSIONS_KEY) || "[]");
    if (!Array.isArray(data)) return [];
    return data
      .filter(
        (v) =>
          v &&
          typeof v.id === "string" &&
          typeof v.name === "string" &&
          typeof v.savedAt === "string" &&
          validSnapshot(v.data) &&
          v.data.parsedResume,
      )
      .slice(0, 20);
  } catch {
    return [];
  }
};
export const resumeToText = (resume: Record<string, any>): string => {
  const lines = Object.values(resume.personal_info || {})
    .filter(Boolean)
    .map(String);
  if (resume.summary) lines.push("Summary", resume.summary);
  for (const section of ["experience", "projects", "education"]) {
    if (!resume[section]?.length) continue;
    lines.push(section[0].toUpperCase() + section.slice(1));
    for (const entry of resume[section]) {
      lines.push(
        Object.entries(entry)
          .filter(([key, value]) => key !== "bullets" && value)
          .map(([, value]) => String(value))
          .join(" | "),
      );
      lines.push(...(entry.bullets || []));
    }
  }
  if (Object.values(resume.skills || {}).some(Boolean))
    lines.push(
      "Skills",
      ...Object.entries(resume.skills)
        .filter(([, value]) => value)
        .map(
          ([key, value]) =>
            `${key}: ${Array.isArray(value) ? value.join(", ") : value}`,
        ),
    );
  return lines.join("\n");
};
