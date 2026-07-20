/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState } from "react";
import { Sparkles, Zap, Mail, ChevronDown, ChevronUp } from "lucide-react";
import { useResumeContext } from "../../../contexts/ResumeContext";
import { generateCoverLetter } from "../../../services/api/coverLetter";
import { PlaceholderView } from "../../../components/ui/PlaceholderView";
import { CopyButton, AILoader } from "../../../components/ui/Shared";

const TONES = [
  { key: "professional", label: "Professional", desc: "Formal and polished" },
  { key: "enthusiastic", label: "Enthusiastic", desc: "Energetic and passionate" },
  { key: "concise", label: "Concise", desc: "Brief and impactful" },
] as const;

export const CoverLetterView = () => {
  const { file, resumeText, jobDescription, setJobDescription, selectedRole, yearsExperience } = useResumeContext();
  const [loading, setLoading] = useState(false);
  const [letter, setLetter] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [tone, setTone] = useState<string>("professional");
  const [showJdInput, setShowJdInput] = useState(false);

  const generate = async () => {
    if (!file && !resumeText) {
      setError("Please upload or paste a resume first.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const letterText = await generateCoverLetter(file, resumeText, file ? "pdf" : "text", jobDescription, selectedRole, yearsExperience, tone);
      setLetter(letterText);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  if (!file && !resumeText) {
    return <PlaceholderView 
      title="Cover Letter Generator" 
      icon={Mail} 
      description="Upload your resume and a job description to automatically generate a tailored cover letter." 
    />;
  }

  return (
    <div className="max-w-3xl mx-auto py-10 px-4 sm:px-6 md:px-8">
      <div className="mb-8">
        <h2 className="text-title font-bold text-white mb-2">Cover Letter Generator</h2>
        <p className="text-[#9CA3AF] text-body-sm">Generate a tailored cover letter based on your resume and job description.</p>
      </div>

      {/* Collapsible JD Input */}
      <div className="mb-6">
        <button
          onClick={() => setShowJdInput(!showJdInput)}
          className="flex items-center gap-2 text-body-sm text-[#9CA3AF] hover:text-white transition-colors mb-3"
        >
          {showJdInput ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          {jobDescription ? "Edit Job Description" : "Add Job Description (optional)"}
        </button>
        {showJdInput && (
          <textarea
            value={jobDescription}
            onChange={e => setJobDescription(e.target.value)}
            onInput={e => setJobDescription((e.target as HTMLTextAreaElement).value)}
            placeholder="Paste the target job description for a more tailored cover letter..."
            rows={4}
            className="glass-input w-full px-3.5 py-3 text-body-sm resize-none"
          />
        )}
        {jobDescription && !showJdInput && (
          <p className="text-caption text-[#4B5563] pl-6">✓ Job description loaded ({jobDescription.trim().split(/\s+/).length} words)</p>
        )}
      </div>

      {/* Tone Selector */}
      {!letter && !loading && (
        <div className="mb-8">
          <p className="label-tiny text-[#6B7280] mb-3">TONE</p>
          <div className="grid grid-cols-3 gap-3">
            {TONES.map(t => (
              <div
                key={t.key}
                onClick={() => setTone(t.key)}
                className={`p-3 rounded-xl cursor-pointer transition-all text-center ${
                  tone === t.key
                    ? "border-2 border-purple-500/50 bg-purple-500/10"
                    : "border border-white/10 hover:border-white/20 hover:bg-white/[0.03]"
                }`}
              >
                <p className={`text-body-sm font-semibold ${tone === t.key ? "text-white" : "text-[#9CA3AF]"}`}>{t.label}</p>
                <p className="text-caption text-[#4B5563] mt-0.5">{t.desc}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {!letter && !loading && (
        <div className="flex justify-center py-6">
          <button onClick={generate} className="btn-primary px-10 py-4 text-[17px] font-semibold gap-3 hover:-translate-y-0.5 transition-all shadow-xl">
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
        <div className="p-4 rounded-xl mb-6" style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)" }}>
          <p className="text-red-400 text-body-sm">{error}</p>
        </div>
      )}

      {letter && !loading && (
        <div className="glass-card p-8 relative group">
          <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
            <CopyButton text={letter} />
          </div>
          <div className="whitespace-pre-wrap text-body-sm text-[#E5E7EB] leading-[1.9]">
            {letter}
          </div>
          <div className="mt-8 flex items-center justify-between">
            <p className="text-caption text-[#4B5563]">Tone: {TONES.find(t => t.key === tone)?.label}</p>
            <button onClick={() => { setLetter(null); }} className="btn-secondary px-6 py-3 text-[14px] font-medium gap-2">
              <Zap className="w-4 h-4" />
              Regenerate
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
