/* eslint-disable react-refresh/only-export-components */
/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { createContext, useContext, useState, ReactNode } from "react";
import { AnalysisResult } from "../types";

interface ResumeContextType {
  file: File | null;
  setFile: (file: File | null) => void;
  resumeText: string;
  setResumeText: (text: string) => void;
  parsedResume: any | null;
  setParsedResume: (data: any) => void;
  parsedTextForModal: { name: string; summary: string; experience: string[] };
  setParsedTextForModal: (data: { name: string; summary: string; experience: string[] }) => void;
  result: AnalysisResult | null;
  setResult: (result: AnalysisResult | null) => void;
  jobDescription: string;
  setJobDescription: (desc: string) => void;
  selectedRole: string;
  setSelectedRole: (role: string) => void;
  selectedCompany: string;
  setSelectedCompany: (company: string) => void;
  yearsExperience: string;
  setYearsExperience: (years: string) => void;
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
  uploadStatus: "idle" | "uploading" | "reading" | "projects" | "skills" | "ats" | "suggestions" | "complete";
  setUploadStatus: (status: "idle" | "uploading" | "reading" | "projects" | "skills" | "ats" | "suggestions" | "complete") => void;
  loading: boolean;
  setLoading: (loading: boolean) => void;
  error: string;
  setError: (error: string) => void;
  isReady: boolean;
  clearData: () => void;
}

const ResumeContext = createContext<ResumeContextType | undefined>(undefined);

export const ResumeProvider = ({ children }: { children: ReactNode }) => {
  const [file, setFile] = useState<File | null>(null);
  const [resumeText, setResumeText] = useState("");
  const [parsedResume, setParsedResume] = useState<any | null>(null);
  const [parsedTextForModal, setParsedTextForModal] = useState({ name: "", summary: "", experience: [] as string[] });
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [jobDescription, setJobDescription] = useState("");
  const [selectedRole, setSelectedRole] = useState("swe");
  const [selectedCompany, setSelectedCompany] = useState("google");
  const [yearsExperience, setYearsExperience] = useState<number>(0);
  const [showConfigDrawer, setShowConfigDrawer] = useState(false);
  const [resumeInputMode, setResumeInputMode] = useState<"pdf" | "text">("pdf");
  const [mode, setMode] = useState<"template" | "custom" | "audit">("template");
  const [showStrategist, setShowStrategist] = useState(false);
  const [showResumeModal, setShowResumeModal] = useState(false);
  const [strategistQuery, setStrategistQuery] = useState("");
  const [uploadStatus, setUploadStatus] = useState<"idle" | "uploading" | "reading" | "projects" | "skills" | "ats" | "suggestions" | "complete">("idle");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const isReady = result !== null;

  const clearData = () => {
    setFile(null);
    setResumeText("");
    setParsedResume(null);
    setResult(null);
    setJobDescription("");
    setYearsExperience("");
    setError("");
  };

  return (
    <ResumeContext.Provider
      value={{
        file, setFile,
        resumeText, setResumeText,
        parsedResume, setParsedResume,
        parsedTextForModal, setParsedTextForModal,
        result, setResult,
        jobDescription, setJobDescription,
        selectedRole, setSelectedRole,
        selectedCompany, setSelectedCompany,
        yearsExperience, setYearsExperience,
        showConfigDrawer, setShowConfigDrawer,
        resumeInputMode, setResumeInputMode,
        mode, setMode,
        showStrategist, setShowStrategist,
        showResumeModal, setShowResumeModal,
        strategistQuery, setStrategistQuery,
        uploadStatus, setUploadStatus,
        loading, setLoading,
        error, setError,
        isReady,
        clearData
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
