import { useDialog } from "../../../hooks/use-dialog";
import React from "react";
import { Link } from "react-router-dom";
import { suggestionWarnings } from "../../../lib/suggestionReview";
import { motion, AnimatePresence } from "framer-motion";
import { X, FileText as FileIcon, ChevronRight } from "lucide-react";
import { useResumeContext } from "../../../contexts/ResumeContext";
import { CopyButton } from "../../../components/ui/Shared";

export const ResumeModal = () => {
  const {
    file,
    resumeText,
    parsedResume,
    result,
    parsedTextForModal,
    showResumeModal,
    setShowResumeModal,
  } = useResumeContext();

  const dialogRef = useDialog(showResumeModal, () => setShowResumeModal(false));
  return (
    <AnimatePresence>
      {showResumeModal && (
        <motion.div
          ref={dialogRef}
          role="dialog"
          aria-modal="true"
          aria-label="Resume suggestions"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-6"
        >
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/60 backdrop-blur-md"
            onClick={() => setShowResumeModal(false)}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.97, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97, y: 16 }}
            transition={{ type: "spring", stiffness: 380, damping: 32 }}
            className="relative z-10 w-full max-w-[500px] max-h-[82vh] flex flex-col rounded-2xl overflow-hidden glass-modal"
          >
            {/* Header */}
            <div
              className="px-5 py-4 flex items-center justify-between"
              style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }}
            >
              <div className="flex items-center gap-3">
                <div
                  className="w-6 h-6 rounded-lg flex items-center justify-center"
                  style={{ background: "rgba(255,255,255,0.1)" }}
                >
                  <FileIcon className="w-3 h-3 text-white" />
                </div>
                <span className="text-body-sm font-semibold text-white">
                  Resume suggestions
                </span>
              </div>
              <button
                aria-label="Close resume suggestions"
                onClick={() => setShowResumeModal(false)}
                className="p-2 rounded-lg text-[#A1A1AA] hover:text-[#9CA3AF] hover:bg-white/5 transition-all"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Candidate pill */}
              <div
                className="flex items-center gap-3 p-4 rounded-xl"
                style={{
                  background: "rgba(255,255,255,0.03)",
                  border: "1px solid rgba(255,255,255,0.07)",
                }}
              >
                <div className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-body-sm text-black bg-white">
                  {parsedTextForModal.name
                    ? parsedTextForModal.name.charAt(0).toUpperCase()
                    : "C"}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-body-sm font-semibold text-white">
                    {parsedTextForModal.name || "Candidate"}
                  </p>
                  <p className="text-caption text-[#A1A1AA] truncate">
                    {file?.name || "Pasted resume"}
                  </p>
                </div>
                {result && (
                  <span
                    className="px-2.5 py-1 rounded-full text-caption font-bold"
                    style={{
                      background: "rgba(255,255,255,0.1)",
                      color: "#FFFFFF",
                    }}
                  >
                    {result.score}% Match
                  </span>
                )}
              </div>

              <details className="border border-white/15 rounded-xl p-4">
                <summary className="cursor-pointer">
                  Original resume reference
                </summary>
                <p className="whitespace-pre-wrap break-words mt-3 text-sm">
                  {resumeText || "Original text is not available yet."}
                </p>
              </details>
              <Link
                className="btn-primary px-4 py-2"
                to="/builder"
                onClick={() => setShowResumeModal(false)}
              >
                Compare and verify suggestions in the editor
              </Link>
              {parsedTextForModal.summary && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="label-tiny">AI Rewritten Summary</p>
                    <CopyButton text={parsedTextForModal.summary} />
                  </div>
                  <p className="text-sm text-text-secondary">
                    Original summary:{" "}
                    {parsedResume?.summary ||
                      "Compare with the source resume above."}
                  </p>
                  {suggestionWarnings(
                    parsedResume?.summary || resumeText,
                    parsedTextForModal.summary,
                  ).map((flag) => (
                    <p key={flag} className="text-sm text-amber-200">
                      {flag}
                    </p>
                  ))}
                  <div
                    className="p-4 rounded-xl italic text-label text-[#9CA3AF] leading-relaxed"
                    style={{
                      background: "rgba(255,255,255,0.05)",
                      border: "1px solid rgba(255,255,255,0.1)",
                    }}
                  >
                    "{parsedTextForModal.summary}"
                  </div>
                </div>
              )}

              {parsedTextForModal.experience?.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="label-tiny">
                      Suggested bullets — verify facts before use
                    </p>
                    <CopyButton
                      text={parsedTextForModal.experience.join("\n")}
                      label="Copy All"
                    />
                  </div>
                  {parsedTextForModal.experience.map((b, i) => (
                    <div
                      key={i}
                      className="flex gap-3 p-4 rounded-xl"
                      style={{
                        background: "rgba(255,255,255,0.02)",
                        border: "1px solid rgba(255,255,255,0.05)",
                      }}
                    >
                      <ChevronRight className="w-4 h-4 text-[#A1A1AA] shrink-0 mt-0.5" />
                      <div className="flex-1 min-w-0 space-y-2">
                        <p className="text-caption text-[#9CA3AF] leading-relaxed">
                          {b}
                        </p>
                        {suggestionWarnings(resumeText, b).map((flag) => (
                          <p key={flag} className="text-sm text-amber-200">
                            {flag}
                          </p>
                        ))}
                      </div>
                      <CopyButton text={b} />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
