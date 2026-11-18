import React from "react";
import { Link } from "react-router-dom";
import { useResumeContext } from "../../contexts/ResumeContext";

export const Topbar = () => {
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
    <header className="shrink-0 border-b border-white/10 px-4 py-3 flex flex-wrap items-center gap-3 bg-black/60">
      <div className="basis-full flex flex-wrap justify-between gap-2 text-sm text-text-secondary">
        <span>
          {file?.name ||
            (parsedResume?.personal_info?.name
              ? `${parsedResume.personal_info.name} · editable resume`
              : "Pasted resume")}{" "}
          ·{" "}
          {result?.target_label ||
            (jobDescription ? "Custom target" : "General resume audit")}
        </span>
        <span>
          {result?.source_text && result.source_text !== resumeText
            ? "Edited since last analysis"
            : draftEnabled
              ? "Autosaved on this device"
              : "Not saved automatically"}
        </span>
      </div>
      <button
        className="btn-secondary px-3 py-2 text-sm"
        onClick={() => setShowConfigDrawer(true)}
      >
        Change resume / target
      </button>
      <Link to="/builder" className="btn-primary px-3 py-2 text-sm">
        Edit & export
      </Link>
      <button
        title="Clears the current draft and all saved application versions on this browser"
        className="btn-secondary px-3 py-2 text-sm"
        onClick={clearData}
      >
        Clear data
      </button>
      <label className="flex gap-2 items-center text-sm text-text-secondary">
        <input
          type="checkbox"
          checked={draftEnabled}
          onChange={(e) => setDraftEnabled(e.target.checked)}
        />
        Save draft on this device
      </label>
      {draftError && (
        <p role="alert" className="text-amber-300 text-sm">
          {draftError}
        </p>
      )}
    </header>
  );
};
