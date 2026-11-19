/* eslint-disable @typescript-eslint/no-explicit-any */
import { validSnapshot, type ResumeVersion } from "./resumeVersions";
export const MAX_BACKUP_BYTES = 5 * 1024 * 1024;
// Derived AI output is deliberately recalculated after restoring untrusted files.
export const backupSnapshot = (data: Record<string, any>) => ({
  resumeText: data.resumeText,
  parsedResume: data.parsedResume || null,
  jobDescription: data.jobDescription || "",
  letter: data.letter || "",
  tone: ["professional", "enthusiastic", "concise"].includes(data.tone)
    ? data.tone
    : "professional",
  roleLevel: ["intern", "junior", "mid", "senior"].includes(data.roleLevel)
    ? data.roleLevel
    : "junior",
  mode: ["template", "custom", "audit"].includes(data.mode)
    ? data.mode
    : "audit",
  yearsExperience: Math.max(0, Math.min(40, data.yearsExperience || 0)),
  selectedCompany: data.selectedCompany || "google",
  selectedRole: data.selectedRole || "swe",
  result: null,
  skillsData: null,
  parsedTextForModal: { name: "", summary: "", experience: [] },
});
export const readBackup = (text: string) => {
  if (new Blob([text]).size > MAX_BACKUP_BYTES)
    throw new Error("Backup exceeds 5MB.");
  const file = JSON.parse(text);
  if (
    !["matchmyrole-backup", "resumaxer-backup"].includes(file?.format) ||
    file.version !== 1 ||
    !validSnapshot(file.draft) ||
    !Array.isArray(file.versions) ||
    file.versions.length > 20
  )
    throw new Error("This is not a supported MatchMyRole backup.");
  if (
    file.versions.some(
      (v: any) =>
        !v ||
        typeof v.name !== "string" ||
        !validSnapshot(v.data) ||
        !v.data.parsedResume,
    )
  )
    throw new Error("Backup contains an invalid saved version.");
  return {
    draft: backupSnapshot(file.draft),
    versions: file.versions.map((v: any): ResumeVersion => ({
      id: crypto.randomUUID(),
      name: v.name.slice(0, 80) || "Imported version",
      savedAt: new Date().toISOString(),
      data: backupSnapshot(v.data),
    })),
  };
};
