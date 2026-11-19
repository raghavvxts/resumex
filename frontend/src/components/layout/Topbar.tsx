import React from "react";
import { Link, useLocation } from "react-router-dom";
import { useResumeContext } from "../../contexts/ResumeContext";

export const Topbar = () => {
  const { pathname } = useLocation();
  const {
    file,
    parsedResume,
    result,
    jobDescription,
    resumeText,
    clearData,
    setShowConfigDrawer,
    draftError,
    draftEnabled,
    setDraftEnabled,
  } = useResumeContext();
  return (
    <header className="workspace-topbar shrink-0 border-b border-white/10">
      <div className="topbar-context min-w-0 text-sm text-text-secondary">
        <span className="block truncate text-white font-medium">
          {file?.name ||
            (parsedResume?.personal_info?.name
              ? `${parsedResume.personal_info.name} · editable resume`
              : "Pasted resume")}{" "}
          ·{" "}
          {result?.target_label ||
            (jobDescription ? "Custom target" : "General resume audit")}
        </span>
        <span className="block text-xs mt-1">
          {result?.source_text && result.source_text !== resumeText
            ? "Edited since last analysis"
            : draftEnabled
              ? "Autosaved on this device"
              : "Not saved automatically"}
        </span>
      </div>
      <div className="topbar-actions flex flex-wrap items-center gap-2">
        <button
          className="btn-secondary px-3 py-2 text-xs sm:text-sm"
          aria-label="Change resume / target"
          onClick={() => setShowConfigDrawer(true)}
        >
          <span className="sm:hidden">Change input</span>
          <span className="hidden sm:inline">Change resume / target</span>
        </button>
        {pathname !== "/builder" && (
          <Link
            to="/builder"
            className="topbar-editor-link btn-primary px-3 py-2 text-sm"
          >
            Edit & export
          </Link>
        )}
        <button
          title="Clears the current draft and all saved application versions on this browser"
          className="btn-secondary px-3 py-2 text-xs sm:text-sm"
          onClick={clearData}
        >
          Clear data
        </button>
        <label className="flex gap-2 items-center text-xs text-text-secondary whitespace-nowrap">
          <input
            aria-label="Save draft on this device"
            type="checkbox"
            checked={draftEnabled}
            onChange={(e) => setDraftEnabled(e.target.checked)}
          />
          Save draft
        </label>
      </div>
      {draftError && (
        <p role="alert" className="text-amber-300 text-sm">
          {draftError}
        </p>
      )}
    </header>
  );
};
