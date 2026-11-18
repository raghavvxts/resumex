import React from "react";
import { Upload, FileText } from "lucide-react";
import { useResumeContext } from "../../../contexts/ResumeContext";

export const HeroSection = () => {
  const { setShowConfigDrawer, setMode, setResumeInputMode } =
    useResumeContext();
  return (
    <section className="flex-1 flex flex-col justify-center relative px-6 sm:px-8 lg:px-12 py-12 min-h-[calc(100dvh-6rem)] lg:min-h-full">
      <div className="max-w-[720px] lg:w-[90%] xl:w-[80%] relative z-10">
        <h1 className="text-hero sm:text-6xl lg:text-[54px] xl:text-[68px] font-bold text-white leading-[1.08] tracking-[-0.03em] mb-6 font-display">
          Smarter Resumes.
          <br />
          Bigger Opportunities.
        </h1>
        <p className="text-slate-200 text-base lg:text-lg leading-relaxed mb-9 max-w-lg">
          Get AI-powered insights to improve your resume, match the right jobs
          and stand out.
        </p>
        <div className="flex gap-3 flex-wrap mb-3">
          <button
            onClick={() => {
              setShowConfigDrawer(true);
              setResumeInputMode("pdf");
              setMode("template");
            }}
            className="btn-primary px-8 py-4 text-base font-semibold gap-3"
          >
            <Upload className="w-5 h-5" />
            Upload Resume
          </button>
          <button
            onClick={() => {
              setShowConfigDrawer(true);
              setResumeInputMode("text");
              setMode("audit");
            }}
            className="btn-secondary px-8 py-4 text-base font-medium gap-3"
          >
            <FileText className="w-5 h-5" />
            Paste Text
          </button>
        </div>
        <p className="text-sm text-slate-300 mt-3">Supports PDF · Max 10MB</p>
      </div>
    </section>
  );
};
