import { useDialog } from "../../../hooks/use-dialog";
import { cancelRequests } from "../../../services/api/request";
import React, { useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Upload,
  FileText,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  AlertCircle,
} from "lucide-react";
import { useResumeContext } from "../../../contexts/ResumeContext";
import { AILoader } from "../../../components/ui/Shared";
import {
  COMPANY_TEMPLATES,
  COMPANY_NAMES,
  ROLE_NAMES,
  MIN_JOB_WORDS,
} from "../../../constants";
import {
  analyzeResume,
  parseResumeStructural,
} from "../../../services/api/analysis";
import { AnalysisResult } from "../../../types";

export const ConfigDrawer = () => {
  const {
    showConfigDrawer,
    setShowConfigDrawer,
    file,
    setFile,
    mode,
    setMode,
    selectedCompany,
    setSelectedCompany,
    selectedRole,
    setSelectedRole,
    jobDescription,
    setJobDescription,
    roleLevel,
    setRoleLevel,
    yearsExperience,
    setYearsExperience,
    loading,
    setLoading,
    error,
    setError,
    setResult,
    setParsedResume,
    setParsedTextForModal,
    setSkillsData,
    setLetter,
    setMessages,
    sessionVersion,
    startSession,
    setUploadStatus,
    resumeText,
    setResumeText,
    resumeInputMode,
    setResumeInputMode,
  } = useResumeContext();

  const dialogRef = useDialog(showConfigDrawer, () => {
    if (!loading) setShowConfigDrawer(false);
  });
  const currentVersion = useRef(sessionVersion);
  currentVersion.current = sessionVersion;
  const fileInputRef = useRef<HTMLInputElement>(null);
  const jdRef = useRef<HTMLTextAreaElement>(null);
  const [dragOver, setDragOver] = React.useState(false);

  const handleCompanyChange = (company: string) => {
    setSelectedCompany(company);
    const roles = Object.keys(COMPANY_TEMPLATES[company]);
    if (roles.length) setSelectedRole(roles[0]);
  };

  const handleFile = (f: File) => {
    if (f.type !== "application/pdf") {
      setError("Only PDF files are accepted.");
      return;
    }
    if (f.size > 10 * 1024 * 1024) {
      setError("PDF must be 10MB or smaller.");
      return;
    }
    setError("");
    setFile(f);
  };

  const handleAnalyze = async () => {
    if (resumeInputMode === "pdf" && !file) {
      setError("Please upload a resume PDF first.");
      return;
    }
    if (resumeInputMode === "text" && !resumeText.trim()) {
      setError("Please paste your resume text.");
      return;
    }
    let version = sessionVersion;
    let jd = "";
    if (mode === "template") {
      jd = COMPANY_TEMPLATES[selectedCompany]?.[selectedRole] || "";
    } else if (mode === "custom") {
      jd = jdRef.current?.value || jobDescription;
      if (jd !== jobDescription) setJobDescription(jd); // Sync state if DOM had hidden changes
      if (!jd.trim()) {
        setError("Please paste a job description.");
        return;
      }
      if (jd.trim().split(/\s+/).length < MIN_JOB_WORDS) {
        setError(`At least ${MIN_JOB_WORDS} words needed.`);
        return;
      }
    }
    version = startSession();
    setJobDescription(jd);
    setSkillsData(null);
    setLetter("");
    setMessages([]);
    setParsedResume(null);
    setError("");
    setLoading(true);
    setResult(null);
    setUploadStatus("reading");

    try {
      // Parsing and analysis are independent; overlap their network/provider latency.
      const parsed = parseResumeStructural(
        file,
        resumeText,
        resumeInputMode,
        jd,
        roleLevel,
        yearsExperience,
      ).then(
        (data) => ({ data, error: null }),
        (error) => ({ data: null, error }),
      );
      const data = await analyzeResume(
        file,
        resumeText,
        resumeInputMode,
        jd,
        roleLevel,
        yearsExperience,
      );
      if (currentVersion.current !== version) return;
      setResult({
        ...data,
        analysis_mode: mode,
        target_label:
          mode === "template"
            ? `${COMPANY_NAMES[selectedCompany]} — ${ROLE_NAMES[selectedRole]}`
            : mode === "audit"
              ? "General resume audit"
              : "Custom job description",
      });
      if (data.source_text) setResumeText(data.source_text);
      const summary = data.ai_recommendations?.summary_rewrite || "";
      const bullets = data.ai_recommendations?.rewritten_bullets || [];
      setParsedTextForModal({
        name: data.candidate_name || "Candidate",
        summary,
        experience: bullets,
      });

      setUploadStatus("complete");
      setLoading(false);
      setShowConfigDrawer(false);
      void parsed.then(({ data, error }) => {
        if (currentVersion.current !== version) return;
        if (error) {
          setError(
            error instanceof Error
              ? error.message
              : "Resume parsing failed. Please retry.",
          );
          return;
        }
        setParsedResume(data);
        if (data.source_text) setResumeText(data.source_text);
      });
    } catch (e) {
      if (currentVersion.current !== version) return;
      setError(e instanceof Error ? e.message : "Something went wrong.");
      setShowConfigDrawer(true); // Re-open on error
      setUploadStatus("idle");
      setLoading(false);
    }
  };

  return (
    <>
      {showConfigDrawer && (
        <div
          ref={dialogRef}
          role="dialog"
          aria-modal="true"
          aria-label="New scan"
          className="fixed inset-0 z-50 flex justify-end"
        >
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => !loading && setShowConfigDrawer(false)}
          />

          <motion.div
            initial={{ x: "100%", opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{
              x: "100%",
              opacity: 0,
              transition: { duration: 0.25, ease: "easeInOut" },
            }}
            transition={{ type: "spring", stiffness: 350, damping: 30 }}
            className="relative z-10 w-full max-w-[480px] h-full flex flex-col shadow-[-20px_0_60px_rgba(0,0,0,0.4)] bg-black/50 border-l border-white/5 backdrop-blur-[60px]"
          >
            {loading && showConfigDrawer ? (
              <div className="flex-1 flex items-center justify-center">
                <div>
                  <AILoader msg="Analyzing your resume. This may take up to 90 seconds." />
                  <button
                    className="btn-secondary px-6 py-3"
                    onClick={() => {
                      cancelRequests();
                      setLoading(false);
                      setUploadStatus("idle");
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="px-5 sm:px-8 pt-5 sm:pt-8 pb-4 flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-heading font-bold text-white tracking-tight">
                      New Scan
                    </h3>
                    <p className="text-caption text-[#A1A1AA] mt-0.5">
                      Your resume is sent to our backend and Google Gemini for
                      processing. Local saving is optional; Clear data removes
                      your local draft. Avoid including sensitive identifiers.
                    </p>
                  </div>
                  <button
                    aria-label="Close scan settings"
                    onClick={() => setShowConfigDrawer(false)}
                    className="shrink-0 p-2 rounded-xl text-[#A1A1AA] hover:bg-white/5 hover:text-white transition-all"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>

                <div className="flex-1 min-h-0 overflow-y-auto p-5 sm:p-8 space-y-6 sm:space-y-8">
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <p className="label-tiny text-[#A1A1AA]">
                        1. RESUME INPUT
                      </p>
                      <div className="flex bg-white/5 rounded-lg p-0.5">
                        <button
                          onClick={() => setResumeInputMode("pdf")}
                          className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${resumeInputMode === "pdf" ? "bg-white/10 text-white shadow-sm" : "text-gray-400 hover:text-white"}`}
                        >
                          PDF
                        </button>
                        <button
                          onClick={() => setResumeInputMode("text")}
                          className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${resumeInputMode === "text" ? "bg-white/10 text-white shadow-sm" : "text-gray-400 hover:text-white"}`}
                        >
                          Text
                        </button>
                      </div>
                    </div>

                    <AnimatePresence mode="wait">
                      {resumeInputMode === "text" ? (
                        <motion.div
                          key="text-input"
                          initial={{ opacity: 0, y: 5 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -5 }}
                        >
                          <textarea
                            value={resumeText}
                            onChange={(e) => setResumeText(e.target.value)}
                            aria-label="Resume text"
                            placeholder="Paste your raw resume text here..."
                            rows={6}
                            className="glass-input w-full px-3.5 py-3 text-body-sm resize-none"
                          />
                        </motion.div>
                      ) : (
                        <motion.div
                          key="pdf-input"
                          initial={{ opacity: 0, y: 5 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -5 }}
                        >
                          <input
                            type="file"
                            ref={fileInputRef}
                            accept=".pdf"
                            className="hidden"
                            onChange={(e) => {
                              if (e.target.files?.[0])
                                handleFile(e.target.files[0]);
                            }}
                          />
                          <div
                            className={`drop-zone p-6 text-center ${dragOver ? "active" : ""} ${file ? "has-file" : ""}`}
                            onDragOver={(e) => {
                              e.preventDefault();
                              setDragOver(true);
                            }}
                            onDragLeave={() => setDragOver(false)}
                            onDrop={(e) => {
                              e.preventDefault();
                              setDragOver(false);
                              if (e.dataTransfer.files[0])
                                handleFile(e.dataTransfer.files[0]);
                            }}
                            onClick={() =>
                              !file && fileInputRef.current?.click()
                            }
                          >
                            <AnimatePresence mode="wait">
                              {file ? (
                                <motion.div
                                  key="file"
                                  initial={{ opacity: 0, scale: 0.97 }}
                                  animate={{ opacity: 1, scale: 1 }}
                                  exit={{ opacity: 0 }}
                                  className="flex items-center justify-between gap-3 p-4 rounded-xl"
                                  style={{
                                    background: "rgba(255,255,255,0.02)",
                                    border: "1px solid rgba(255,255,255,0.05)",
                                  }}
                                >
                                  <div className="flex items-center gap-4 min-w-0">
                                    <div
                                      className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                                      style={{
                                        background: "rgba(255,255,255,0.04)",
                                      }}
                                    >
                                      <FileText className="w-5 h-5 text-text-secondary" />
                                    </div>
                                    <div className="text-left min-w-0">
                                      <p className="text-white font-medium text-body-sm truncate">
                                        {file.name}
                                      </p>
                                      <p className="text-[#A1A1AA] text-caption mt-0.5">
                                        {(file.size / 1024).toFixed(0)} KB
                                      </p>
                                    </div>
                                  </div>
                                  <button
                                    aria-label="Remove uploaded PDF"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setFile(null);
                                    }}
                                    className="p-2 rounded-xl hover:bg-red-500/10 text-[#A1A1AA] hover:text-red-400 shrink-0"
                                  >
                                    <X className="w-4 h-4" />
                                  </button>
                                </motion.div>
                              ) : (
                                <motion.div
                                  key="empty"
                                  initial={{ opacity: 0 }}
                                  animate={{ opacity: 1 }}
                                  exit={{ opacity: 0 }}
                                  className="flex flex-col items-center gap-3 p-6 rounded-xl"
                                  style={{
                                    background: "rgba(255,255,255,0.015)",
                                    border: "1px solid rgba(255,255,255,0.05)",
                                  }}
                                >
                                  <div
                                    className="w-10 h-10 rounded-xl flex items-center justify-center mb-1"
                                    style={{
                                      background: "rgba(255,255,255,0.04)",
                                    }}
                                  >
                                    <Upload className="w-4.5 h-4.5 text-[#9CA3AF]" />
                                  </div>
                                  <div className="text-center">
                                    <p className="text-[#D1D5DB] text-body-sm font-medium mb-0.5">
                                      Drop PDF here or{" "}
                                      <span className="text-white font-semibold cursor-pointer">
                                        browse
                                      </span>
                                    </p>
                                    <p className="text-[#A1A1AA] text-caption">
                                      Max 10MB
                                    </p>
                                  </div>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  <div>
                    <p className="label-tiny mb-4 text-[#A1A1AA]">
                      2. TARGET MODE
                    </p>
                    <div className="mode-tabs mb-4">
                      {(["template", "custom", "audit"] as const).map((m) => (
                        <button
                          type="button"
                          aria-pressed={mode === m}
                          key={m}
                          onClick={() => setMode(m)}
                          className={`mode-tab ${mode === m ? "active" : ""}`}
                        >
                          {m === "template"
                            ? "Example roles"
                            : m === "custom"
                              ? "Custom JD"
                              : "Audit"}
                        </button>
                      ))}
                    </div>

                    <AnimatePresence mode="wait">
                      {mode === "template" && (
                        <motion.div
                          key="tmpl"
                          initial={{ opacity: 0, y: 6 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -4 }}
                          className="space-y-3"
                        >
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <p className="label-tiny mb-2">Company</p>
                              <select
                                aria-label="Example company"
                                value={selectedCompany}
                                onChange={(e) =>
                                  handleCompanyChange(e.target.value)
                                }
                                className="glass-input w-full px-3 py-2 text-body-sm"
                              >
                                {Object.keys(COMPANY_TEMPLATES).map((k) => (
                                  <option key={k} value={k}>
                                    {
                                      COMPANY_NAMES[
                                        k as keyof typeof COMPANY_NAMES
                                      ]
                                    }
                                  </option>
                                ))}
                              </select>
                            </div>
                            <div>
                              <p className="label-tiny mb-2">Role</p>
                              <select
                                aria-label="Example role"
                                value={selectedRole}
                                onChange={(e) =>
                                  setSelectedRole(e.target.value)
                                }
                                className="glass-input w-full px-3 py-2 text-body-sm"
                              >
                                {Object.keys(
                                  COMPANY_TEMPLATES[selectedCompany] || {},
                                ).map((k) => (
                                  <option key={k} value={k}>
                                    {ROLE_NAMES[k as keyof typeof ROLE_NAMES]}
                                  </option>
                                ))}
                              </select>
                            </div>
                          </div>
                          <div
                            className="p-4 rounded-xl text-caption text-[#A1A1AA] italic leading-relaxed"
                            style={{
                              background: "rgba(255,255,255,0.04)",
                              border: "1px solid rgba(255,255,255,0.12)",
                            }}
                          >
                            <span className="text-white not-italic font-semibold text-caption uppercase tracking-widest block mb-1">
                              Illustrative role example, not a current vacancy
                            </span>
                            "
                            {COMPANY_TEMPLATES[selectedCompany]?.[selectedRole]}
                            "
                          </div>
                        </motion.div>
                      )}
                      {mode === "custom" && (
                        <motion.div
                          key="custom"
                          initial={{ opacity: 0, y: 6 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -4 }}
                        >
                          <textarea
                            ref={jdRef}
                            value={jobDescription}
                            onChange={(e) => setJobDescription(e.target.value)}
                            onInput={(e) =>
                              setJobDescription(
                                (e.target as HTMLTextAreaElement).value,
                              )
                            }
                            aria-label="Job description"
                            placeholder="Paste full job description (min 20 words)..."
                            rows={5}
                            className="glass-input w-full px-3.5 py-3 text-body-sm resize-none"
                          />
                          {jobDescription.trim() && (
                            <p className="text-caption text-[#A1A1AA] mt-1.5 pl-1">
                              {jobDescription.trim().split(/\s+/).length} words
                            </p>
                          )}
                        </motion.div>
                      )}
                      {mode === "audit" && (
                        <motion.div
                          key="audit"
                          initial={{ opacity: 0, y: 6 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -4 }}
                          className="flex gap-4 p-4 rounded-xl items-start"
                          style={{
                            background: "rgba(255,255,255,0.02)",
                            border: "1px solid rgba(255,255,255,0.05)",
                          }}
                        >
                          <CheckCircle2 className="w-4.5 h-4.5 text-[#A855F7] shrink-0 mt-0.5" />
                          <div>
                            <p className="text-white text-body-sm font-medium mb-1">
                              General resume audit
                            </p>
                            <p className="text-[#9CA3AF] text-caption leading-relaxed">
                              Checks section completeness and measurable
                              achievements without a target job.
                            </p>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  <div>
                    <p className="label-tiny mb-4 text-[#A1A1AA]">3. DETAILS</p>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="label-tiny mb-2 text-[#9CA3AF]">
                          Seniority
                        </p>
                        <select
                          aria-label="Seniority"
                          value={roleLevel}
                          onChange={(e) => setRoleLevel(e.target.value)}
                          className="glass-input w-full h-10 px-3 py-2 text-body-sm"
                        >
                          <option value="junior">Junior</option>
                          <option value="mid">Mid-Level</option>
                          <option value="senior">Senior</option>
                        </select>
                      </div>
                      <div>
                        <p className="label-tiny mb-2 text-[#9CA3AF]">
                          Experience (yrs)
                        </p>
                        <input
                          aria-label="Years of experience"
                          type="number"
                          min={0}
                          max={40}
                          value={yearsExperience}
                          onChange={(e) =>
                            setYearsExperience(Number(e.target.value))
                          }
                          className="glass-input w-full h-10 px-3 py-2 text-body-sm"
                        />
                      </div>
                    </div>
                  </div>

                  <AnimatePresence>
                    {error && (
                      <motion.div
                        initial={{ opacity: 0, y: -6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="flex gap-2 p-3 rounded-xl"
                        style={{
                          background: "rgba(239,68,68,0.08)",
                          border: "1px solid rgba(239,68,68,0.2)",
                        }}
                      >
                        <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                        <p className="text-red-400 text-label leading-relaxed">
                          {error}
                        </p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Sticky Run Analysis footer — always visible, outside scroll area */}
                <div className="px-5 sm:px-8 pb-5 sm:pb-8 pt-5 border-t border-white/[0.06] bg-black/30 backdrop-blur-sm flex-shrink-0">
                  <button
                    onClick={handleAnalyze}
                    disabled={
                      resumeInputMode === "pdf" ? !file : !resumeText.trim()
                    }
                    className={`w-full py-4 text-[15px] font-semibold gap-3 group ${(resumeInputMode === "pdf" ? file : resumeText.trim()) ? "btn-primary" : "btn-secondary"}`}
                  >
                    <Sparkles
                      className={`w-5 h-5 ${(resumeInputMode === "pdf" ? file : resumeText.trim()) ? "text-white" : "text-[#A1A1AA]"}`}
                    />
                    <span className="tracking-wide">Run Analysis</span>
                    <ArrowRight
                      className={`w-5 h-5 ml-1 ${(resumeInputMode === "pdf" ? file : resumeText.trim()) ? "text-white opacity-80 group-hover:translate-x-1 transition-transform" : "text-[#A1A1AA]"}`}
                    />
                  </button>
                </div>
              </>
            )}
          </motion.div>
        </div>
      )}
    </>
  );
};
