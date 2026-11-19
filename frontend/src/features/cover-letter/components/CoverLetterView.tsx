/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useRef } from "react";
import { Sparkles, Zap, Mail, ChevronDown, ChevronUp } from "lucide-react";
import { useResumeContext } from "../../../contexts/ResumeContext";
import { generateCoverLetter } from "../../../services/api/coverLetter";
import { PlaceholderView } from "../../../components/ui/PlaceholderView";
import { CopyButton, AILoader } from "../../../components/ui/Shared";

const TONES = [
  { key: "professional", label: "Professional", desc: "Formal and polished" },
  {
    key: "enthusiastic",
    label: "Enthusiastic",
    desc: "Energetic and passionate",
  },
  { key: "concise", label: "Concise", desc: "Brief and impactful" },
] as const;

export const CoverLetterView = () => {
  const {
    sessionVersion,
    file,
    resumeText,
    jobDescription,
    setJobDescription,
    roleLevel,
    resumeInputMode,
    letter,
    setLetter,
    tone,
    setTone,
    yearsExperience,
  } = useResumeContext();
  const activeVersion = useRef(sessionVersion);
  activeVersion.current = sessionVersion;
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showJdInput, setShowJdInput] = useState(false);

  const generate = async () => {
    if (!file && !resumeText) {
      setError("Please upload or paste a resume first.");
      return;
    }
    const version = sessionVersion;
    setLoading(true);
    setError(null);
    try {
      const letterText = await generateCoverLetter(
        file,
        resumeText,
        resumeInputMode,
        jobDescription,
        roleLevel,
        yearsExperience,
        tone,
      );
      if (activeVersion.current !== version) return;
      setLetter(letterText);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  if (!file && !resumeText) {
    return (
      <div className="workspace-page">
        <PlaceholderView
          title="Cover Letter Generator"
          icon={Mail}
          description="Add your resume to draft and edit a cover letter. A job description is optional."
        />
      </div>
    );
  }

  return (
    <div className="workspace-page space-y-6">
      <div className="mb-8">
        <h1 className="text-title font-bold text-white mb-2">
          Cover Letter Generator
        </h1>
        <p className="text-[#9CA3AF] text-body-sm">
          Generate a tailored cover letter based on your resume and job
          description.
        </p>
      </div>

      {/* Collapsible JD Input */}
      <div className="mb-6">
        <button
          onClick={() => setShowJdInput(!showJdInput)}
          className="flex items-center gap-2 text-body-sm text-[#9CA3AF] hover:text-white transition-colors mb-3"
        >
          {showJdInput ? (
            <ChevronUp className="w-4 h-4" />
          ) : (
            <ChevronDown className="w-4 h-4" />
          )}
          {jobDescription
            ? "Edit Job Description"
            : "Add Job Description (optional)"}
        </button>
        {showJdInput && (
          <textarea
            value={jobDescription}
            onChange={(e) => setJobDescription(e.target.value)}
            onInput={(e) =>
              setJobDescription((e.target as HTMLTextAreaElement).value)
            }
            aria-label="Cover letter job description"
            placeholder="Paste the target job description for a more tailored cover letter..."
            rows={4}
            className="glass-input w-full px-3.5 py-3 text-body-sm resize-none"
          />
        )}
        {jobDescription && !showJdInput && (
          <p className="text-caption text-[#A1A1AA] pl-6">
            ✓ Job description loaded (
            {jobDescription.trim().split(/\s+/).length} words)
          </p>
        )}
      </div>

      {/* Tone Selector */}
      {!loading && (
        <div className="mb-8">
          <p className="label-tiny text-[#A1A1AA] mb-3">TONE</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {TONES.map((t) => (
              <button
                type="button"
                aria-pressed={tone === t.key}
                key={t.key}
                onClick={() => {
                  setTone(t.key);
                  setLetter("");
                }}
                className={`p-3 rounded-xl cursor-pointer transition-all text-center ${
                  tone === t.key
                    ? "border-2 border-purple-500/50 bg-purple-500/10"
                    : "border border-white/10 hover:border-white/20 hover:bg-white/[0.03]"
                }`}
              >
                <p
                  className={`text-body-sm font-semibold ${tone === t.key ? "text-white" : "text-[#9CA3AF]"}`}
                >
                  {t.label}
                </p>
                <p className="text-caption text-[#A1A1AA] mt-0.5">{t.desc}</p>
              </button>
            ))}
          </div>
        </div>
      )}

      {!letter && !loading && (
        <div className="flex justify-center py-6">
          <button
            onClick={generate}
            className="btn-primary px-10 py-4 text-[17px] font-semibold gap-3 hover:-translate-y-0.5 transition-all shadow-xl"
          >
            <Sparkles className="w-5 h-5" />
            Generate Cover Letter
          </button>
        </div>
      )}

      {loading && (
        <div className="py-12">
          <AILoader msg="Drafting your cover letter..." />
        </div>
      )}

      {error && (
        <div
          className="p-4 rounded-xl mb-6"
          style={{
            background: "rgba(239,68,68,0.08)",
            border: "1px solid rgba(239,68,68,0.2)",
          }}
        >
          <p className="text-red-400 text-body-sm">{error}</p>
        </div>
      )}

      {letter && !loading && (
        <div className="glass-card p-5 sm:p-7 relative group">
          <div className="flex justify-end mb-4">
            <CopyButton text={letter} />
          </div>
          <label className="block text-sm mb-2" htmlFor="letter-editor">
            Edit your letter
          </label>
          <textarea
            id="letter-editor"
            className="glass-input w-full min-h-[420px] p-4 leading-relaxed"
            value={letter}
            onChange={(e) => setLetter(e.target.value)}
          />
          <a
            className="btn-secondary px-4 py-2 inline-flex mt-4"
            href={`data:text/plain;charset=utf-8,${encodeURIComponent(letter)}`}
            download="cover-letter.txt"
          >
            Download text
          </a>
          <div className="mt-6 flex flex-wrap gap-4 items-center justify-between">
            <p className="text-caption text-[#A1A1AA]">
              Tone: {TONES.find((t) => t.key === tone)?.label}
            </p>
            <button
              onClick={() => {
                setLetter("");
              }}
              className="btn-secondary px-6 py-3 text-[14px] font-medium gap-2"
            >
              <Zap className="w-4 h-4" />
              Regenerate
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
