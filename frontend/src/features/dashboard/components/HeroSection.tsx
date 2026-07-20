import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Upload, FileText as FileIcon } from "lucide-react";
import { useResumeContext } from "../../../contexts/ResumeContext";
import { useInteractionContext } from "../../../contexts/InteractionContext";

import { ResumeCore } from "./hero/ResumeCore";
import { Module } from "./hero/Module";
import { ConnectionLines } from "./hero/ConnectionLines";

export const HeroSection = () => {
  const { setShowConfigDrawer, setMode, setResumeInputMode, uploadStatus, isReady } = useResumeContext();
  const { hoveredElement, setHoveredElement } = useInteractionContext();

  const isUploading = uploadStatus !== "idle" && uploadStatus !== "complete";

  const isProjectsActive = ["projects", "skills", "ats", "suggestions"].includes(uploadStatus);
  const isSkillsActive = ["skills", "ats", "suggestions"].includes(uploadStatus);
  const isAtsActive = ["ats", "suggestions"].includes(uploadStatus);
  const isStrategistActive = ["suggestions"].includes(uploadStatus);

  return (
    <div className="flex-1 flex flex-col justify-center relative px-8 overflow-hidden">
      {/* ─────────────────── HERO VIEW ────────────────────── */}
      <div className="relative flex flex-col lg:flex-row items-center justify-between w-full px-0 h-full max-h-[800px]">
        {/* Left: headline + upload */}
        <div className="flex-1 max-w-[750px] relative z-20 shrink-0">
          <motion.h1
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}
            className="text-hero sm:text-6xl lg:text-[54px] xl:text-[68px] font-bold text-white leading-[1.08] tracking-[-0.03em] mb-6 font-display"
          >
            Smarter Resumes.<br />
            <span 
              className="lg:whitespace-nowrap"
              style={{ background: "linear-gradient(90deg, #FFFFFF, #E2E8F0)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}
            >
              Bigger Opportunities.
            </span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.1 }}
            className="text-text-secondary text-[15px] lg:text-[17px] leading-relaxed mb-10 max-w-lg"
          >
            Get AI-powered insights to improve your resume, match the right jobs and stand out.
          </motion.p>

          {/* Upload buttons */}
          <motion.div
            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.18 }}
            className="flex gap-3 flex-wrap mb-3"
          >
            <button
              onClick={() => { setShowConfigDrawer(true); setResumeInputMode("pdf"); setMode("template"); }}
              onMouseEnter={() => setHoveredElement("upload")}
              onMouseLeave={() => setHoveredElement(null)}
              className="btn-primary px-10 py-4 text-[17px] font-semibold gap-3 shadow-xl hover:shadow-2xl hover:-translate-y-0.5 transition-all"
            >
              <Upload className="w-6 h-6" />
              Upload Resume
            </button>
            <button
              onClick={() => { setShowConfigDrawer(true); setResumeInputMode("text"); setMode("audit"); }}
              onMouseEnter={() => setHoveredElement("upload")}
              onMouseLeave={() => setHoveredElement(null)}
              className="btn-secondary px-10 py-4 text-[17px] font-medium gap-3 hover:-translate-y-0.5 transition-all"
            >
              <FileIcon className="w-6 h-6 opacity-80" />
              Paste Text
            </button>
          </motion.div>
          <p className="text-caption text-text-muted mt-2">Supports PDF · Max 10MB</p>

          <AnimatePresence>
            {isReady && (
              <motion.button
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                onClick={() => {
                  const dashboard = document.querySelector('.min-h-\\[calc\\(100vh-4rem\\)\\]');
                  if (dashboard) dashboard.scrollIntoView({ behavior: 'smooth' });
                }}
                className="mt-8 flex items-center justify-center gap-2 px-5 py-2.5 rounded-full bg-white/5 border border-white/10 text-white font-medium hover:bg-white/10 hover:border-white/20 transition-all shadow-lg backdrop-blur-md"
              >
                View Results 
                <span className="animate-bounce">↓</span>
              </motion.button>
            )}
          </AnimatePresence>
        </div>

        {/* Right: Resume Core Identity */}
        <div className="flex-1 hidden lg:flex justify-end w-full relative h-[600px] items-center pointer-events-none">
          {/* We lock the width and height of this container so the percentage-based modules never collapse into the core */}
          <div className="relative w-[480px] xl:w-[600px] shrink-0 h-full flex items-center justify-center translate-x-12 xl:translate-x-0">
            <ConnectionLines active={isUploading || hoveredElement === "upload"} />
            <Module label="ATS" x={50} y={10} delay={0.2} isActive={isAtsActive || hoveredElement === "ats"} hoveredElement={hoveredElement} />
            <Module label="Projects" x={10} y={40} delay={0.4} isActive={isProjectsActive} hoveredElement={hoveredElement} />
            <Module label="Skills" x={90} y={40} delay={0.6} isActive={isSkillsActive || hoveredElement === "skills"} hoveredElement={hoveredElement} />
            <Module label="Experience" x={15} y={75} delay={0.8} isActive={isProjectsActive} hoveredElement={hoveredElement} />
            <Module label="Summary" x={85} y={75} delay={1.0} isActive={isUploading} hoveredElement={hoveredElement} />
            <Module label="Strategist" x={50} y={90} delay={1.2} isActive={isStrategistActive || hoveredElement === "strategist"} hoveredElement={hoveredElement} />
            <ResumeCore isProcessing={isUploading} hoveredElement={hoveredElement} />
          </div>
        </div>
      </div>
    </div>
  );
};
