/* eslint-disable react-refresh/only-export-components */
/* eslint-disable @typescript-eslint/no-explicit-any */
import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
  useMemo,
  ReactNode,
} from "react";
import { cancelRequests } from "../services/api/request";
import {
  readVersions,
  validSnapshot,
  VERSIONS_KEY,
  ResumeVersion,
} from "../lib/resumeVersions";
import { AnalysisResult } from "../types";

interface ResumeContextType {
  versions: ResumeVersion[];
  saveVersion: (name: string) => boolean;
  loadVersion: (id: string) => boolean;
  deleteVersion: (id: string) => boolean;
  activeVersionName: string;
  versionDirty: boolean;
  roleLevel: string;
  setRoleLevel: (value: string) => void;
  draftError: string;
  draftEnabled: boolean;
  setDraftEnabled: (value: boolean) => void;
  skillsData: any;
  setSkillsData: (value: any) => void;
  letter: string;
  setLetter: (value: string) => void;
  tone: string;
  setTone: (value: string) => void;
  messages: Array<{ sender: string; text: string }>;
  setMessages: React.Dispatch<
    React.SetStateAction<Array<{ sender: string; text: string }>>
  >;
  sessionVersion: number;
  startSession: () => number;
  file: File | null;
  setFile: (file: File | null) => void;
  resumeText: string;
  setResumeText: (text: string) => void;
  parsedResume: any | null;
  setParsedResume: (data: any) => void;
  parsedTextForModal: { name: string; summary: string; experience: string[] };
  setParsedTextForModal: (data: {
    name: string;
    summary: string;
    experience: string[];
  }) => void;
  result: AnalysisResult | null;
  setResult: (result: AnalysisResult | null) => void;
  jobDescription: string;
  setJobDescription: (desc: string) => void;
  selectedRole: string;
  setSelectedRole: (role: string) => void;
  selectedCompany: string;
  setSelectedCompany: (company: string) => void;
  yearsExperience: number;
  setYearsExperience: (years: number) => void;
  showConfigDrawer: boolean;
  setShowConfigDrawer: (show: boolean) => void;
  resumeInputMode: "pdf" | "text";
  setResumeInputMode: (mode: "pdf" | "text") => void;
  mode: "template" | "custom" | "audit";
  setMode: (mode: "template" | "custom" | "audit") => void;
  showStrategist: boolean;
  setShowStrategist: (show: boolean) => void;
  showResumeModal: boolean;
  setShowResumeModal: (show: boolean) => void;
  strategistQuery: string;
  setStrategistQuery: (query: string) => void;
  uploadStatus:
    | "idle"
    | "uploading"
    | "reading"
    | "projects"
    | "skills"
    | "ats"
    | "suggestions"
    | "complete";
  setUploadStatus: (
    status:
      | "idle"
      | "uploading"
      | "reading"
      | "projects"
      | "skills"
      | "ats"
      | "suggestions"
      | "complete",
  ) => void;
  loading: boolean;
  setLoading: (loading: boolean) => void;
  error: string;
  setError: (error: string) => void;
  isReady: boolean;
  clearData: () => void;
}

const ResumeContext = createContext<ResumeContextType | undefined>(undefined);

const DRAFT_KEY = "resumaxer-draft-v1";
const readDraft = () => {
  try {
    const value = JSON.parse(localStorage.getItem(DRAFT_KEY) || "null");
    return validSnapshot(value) ? value : {};
  } catch {
    return {};
  }
};

export const ResumeProvider = ({ children }: { children: ReactNode }) => {
  const [draft] = useState(readDraft);
  const [versions, setVersions] = useState(readVersions);
  const [activeVersionId, setActiveVersionId] = useState("");
  const [draftError, setDraftError] = useState("");
  const [draftEnabled, setDraftEnabled] = useState(
    Boolean(draft.resumeText || draft.parsedResume),
  );
  const [roleLevel, setRoleLevel] = useState(draft.roleLevel || "junior");
  const [skillsData, setSkillsData] = useState<any>(draft.skillsData || null);
  const [letter, setLetter] = useState<string>(draft.letter || "");
  const [tone, setTone] = useState<string>(draft.tone || "professional");
  const [messages, setMessages] = useState<
    Array<{ sender: string; text: string }>
  >([]);
  const [sessionVersion, setSessionVersion] = useState(0);
  const sessionCounter = useRef(0);
  const startSession = () => {
    cancelRequests();
    const version = ++sessionCounter.current;
    setSessionVersion(version);
    return version;
  };
  const [file, setFile] = useState<File | null>(null);
  const [resumeText, setResumeText] = useState(draft.resumeText || "");
  const [parsedResume, setParsedResume] = useState<any | null>(
    draft.parsedResume || null,
  );
  const [parsedTextForModal, setParsedTextForModal] = useState(
    draft.parsedTextForModal || {
      name: "",
      summary: "",
      experience: [] as string[],
    },
  );
  const [result, setResult] = useState<AnalysisResult | null>(
    draft.result || null,
  );
  const [jobDescription, setJobDescriptionState] = useState(
    draft.jobDescription || "",
  );
  const [selectedRole, setSelectedRole] = useState(draft.selectedRole || "swe");
  const [selectedCompany, setSelectedCompany] = useState(
    draft.selectedCompany || "google",
  );
  const [yearsExperience, setYearsExperience] = useState<number>(
    draft.yearsExperience || 0,
  );
  const [showConfigDrawer, setShowConfigDrawer] = useState(false);
  const [resumeInputMode, setResumeInputMode] = useState<"pdf" | "text">(
    draft.resumeText ? "text" : "pdf",
  );
  const [mode, setMode] = useState<"template" | "custom" | "audit">(
    draft.mode || "template",
  );
  const [showStrategist, setShowStrategist] = useState(false);
  const [showResumeModal, setShowResumeModal] = useState(false);
  const [strategistQuery, setStrategistQuery] = useState("");
  const [uploadStatus, setUploadStatus] = useState<
    | "idle"
    | "uploading"
    | "reading"
    | "projects"
    | "skills"
    | "ats"
    | "suggestions"
    | "complete"
  >("idle");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const isReady = result !== null;
  const setJobDescription = (value: string) => {
    if (value !== jobDescription) {
      setSkillsData(null);
      setLetter("");
      setMessages([]);
    }
    setJobDescriptionState(value);
  };

  const snapshot = useMemo(
    () => ({
      resumeText,
      parsedResume,
      result,
      jobDescription,
      roleLevel,
      yearsExperience,
      mode,
      skillsData,
      letter,
      tone,
      selectedCompany,
      selectedRole,
      parsedTextForModal,
    }),
    [
      resumeText,
      parsedResume,
      result,
      jobDescription,
      roleLevel,
      yearsExperience,
      mode,
      skillsData,
      letter,
      tone,
      selectedCompany,
      selectedRole,
      parsedTextForModal,
    ],
  );
  const snapshotJSON = useMemo(
    () => (draftEnabled || activeVersionId ? JSON.stringify(snapshot) : ""),
    [snapshot, draftEnabled, activeVersionId],
  );
  const activeVersion = versions.find((v) => v.id === activeVersionId);
  const activeSnapshotJSON = useMemo(
    () => (activeVersion ? JSON.stringify(activeVersion.data) : ""),
    [activeVersion],
  );
  const versionDirty = Boolean(
    activeVersion && snapshotJSON !== activeSnapshotJSON,
  );
  const writeVersions = (next: ResumeVersion[]) => {
    try {
      localStorage.setItem(VERSIONS_KEY, JSON.stringify(next));
      setVersions(next);
      setDraftError("");
      return true;
    } catch {
      setDraftError(
        "Versions could not be saved. Browser storage may be full or unavailable.",
      );
      return false;
    }
  };
  const saveVersion = (name: string) => {
    if (!name.trim() || !parsedResume?.personal_info) {
      setDraftError("Add a resume and version name before saving.");
      return false;
    }
    if (versions.length >= 20) {
      setDraftError(
        "You have 20 versions. Remove an old version before saving another.",
      );
      return false;
    }
    const version = {
      id: crypto.randomUUID(),
      name: name.trim().slice(0, 80),
      savedAt: new Date().toISOString(),
      data: JSON.parse(snapshotJSON || JSON.stringify(snapshot)),
    };
    if (!writeVersions([...versions, version])) return false;
    setActiveVersionId(version.id);
    return true;
  };
  const loadVersion = (id: string) => {
    const version = versions.find((v) => v.id === id);
    if (!version) return false;
    // Preserve the current work before replacing it, even if autosave is disabled.
    const currentSnapshotJSON = snapshotJSON || JSON.stringify(snapshot);
    const currentIsSaved = versions.some(
      (v) => JSON.stringify(v.data) === currentSnapshotJSON,
    );
    if (
      parsedResume &&
      !currentIsSaved &&
      !saveVersion(`Before loading ${version.name}`)
    )
      return false;
    startSession();
    const d = JSON.parse(JSON.stringify(version.data));
    setFile(null);
    setResumeInputMode("text");
    setResumeText(d.resumeText);
    setParsedResume(d.parsedResume);
    setResult(d.result || null);
    setJobDescriptionState(d.jobDescription || "");
    setRoleLevel(d.roleLevel || "junior");
    setYearsExperience(d.yearsExperience || 0);
    setMode(d.mode || "audit");
    setSkillsData(d.skillsData || null);
    setLetter(d.letter || "");
    setTone(d.tone || "professional");
    setSelectedCompany(d.selectedCompany || "google");
    setSelectedRole(d.selectedRole || "swe");
    setParsedTextForModal(
      d.parsedTextForModal || { name: "", summary: "", experience: [] },
    );
    setMessages([]);
    setStrategistQuery("");
    setShowStrategist(false);
    setShowResumeModal(false);
    setShowConfigDrawer(false);
    setLoading(false);
    setUploadStatus("idle");
    setError("");
    setActiveVersionId(id);
    return true;
  };
  const deleteVersion = (id: string) => {
    if (!writeVersions(versions.filter((v) => v.id !== id))) return false;
    if (activeVersionId === id) setActiveVersionId("");
    return true;
  };

  useEffect(() => {
    if (draftEnabled) {
      try {
        localStorage.setItem(DRAFT_KEY, snapshotJSON);
        setDraftError("");
      } catch {
        setDraftError(
          "Draft could not be saved. Browser storage may be unavailable or full.",
        );
        setDraftEnabled(false);
      }
    } else {
      try {
        localStorage.removeItem(DRAFT_KEY);
      } catch {
        /* Storage unavailable. */
      }
    }
  }, [draftEnabled, snapshotJSON]);

  const clearData = () => {
    startSession();
    setVersions([]);
    setActiveVersionId("");
    try {
      localStorage.removeItem(VERSIONS_KEY);
    } catch {
      /* Browser may deny storage. */
    }
    setDraftError("");
    setSkillsData(null);
    setLetter("");
    setMessages([]);
    setParsedTextForModal({ name: "", summary: "", experience: [] });
    setStrategistQuery("");
    setShowStrategist(false);
    setShowResumeModal(false);
    setUploadStatus("idle");
    setLoading(false);
    setShowConfigDrawer(false);
    setRoleLevel("junior");
    setMode("audit");
    setDraftEnabled(false);
    try {
      localStorage.removeItem(DRAFT_KEY);
    } catch {
      /* Storage unavailable. */
    }
    setFile(null);
    setResumeText("");
    setParsedResume(null);
    setResult(null);
    setJobDescriptionState("");
    setYearsExperience(0);
    setError("");
  };

  return (
    <ResumeContext.Provider
      value={{
        versions,
        saveVersion,
        loadVersion,
        deleteVersion,
        activeVersionName: activeVersion?.name || "",
        versionDirty,
        roleLevel,
        setRoleLevel,
        draftError,
        draftEnabled,
        setDraftEnabled,
        skillsData,
        setSkillsData,
        letter,
        setLetter,
        tone,
        setTone,
        messages,
        setMessages,
        sessionVersion,
        startSession,
        file,
        setFile,
        resumeText,
        setResumeText,
        parsedResume,
        setParsedResume,
        parsedTextForModal,
        setParsedTextForModal,
        result,
        setResult,
        jobDescription,
        setJobDescription,
        selectedRole,
        setSelectedRole,
        selectedCompany,
        setSelectedCompany,
        yearsExperience,
        setYearsExperience,
        showConfigDrawer,
        setShowConfigDrawer,
        resumeInputMode,
        setResumeInputMode,
        mode,
        setMode,
        showStrategist,
        setShowStrategist,
        showResumeModal,
        setShowResumeModal,
        strategistQuery,
        setStrategistQuery,
        uploadStatus,
        setUploadStatus,
        loading,
        setLoading,
        error,
        setError,
        isReady,
        clearData,
      }}
    >
      {children}
    </ResumeContext.Provider>
  );
};

export const useResumeContext = () => {
  const context = useContext(ResumeContext);
  if (context === undefined) {
    throw new Error("useResumeContext must be used within a ResumeProvider");
  }
  return context;
};
