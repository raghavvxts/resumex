import React, { useRef, useState } from "react";
import { downloadBlob } from "../../../lib/download";
import { MAX_BACKUP_BYTES } from "../../../lib/backup";
import { useResumeContext } from "../../../contexts/ResumeContext";

export const ResumeVersions = () => {
  const {
    versions,
    exportBackup,
    importBackup,
    saveVersion,
    loadVersion,
    deleteVersion,
    activeVersionName,
    versionDirty,
    draftError,
  } = useResumeContext();
  const backupInput = useRef<HTMLInputElement>(null);
  const [backupError, setBackupError] = useState("");
  const [name, setName] = useState("");
  const [selected, setSelected] = useState("");
  const [message, setMessage] = useState("");
  return (
    <details className="resume-versions rounded-xl border border-white/15 p-4 min-w-0">
      <summary className="cursor-pointer font-semibold">
        Application versions{" "}
        <span className="font-normal text-text-secondary">
          ({versions.length})
        </span>
      </summary>
      <p className="text-sm text-text-secondary mt-3">
        Save named copies for different jobs on this browser. Loading a version
        backs up any unsaved resume first. Clear data removes all saved copies.
      </p>
      <div className="flex flex-wrap gap-3 mt-4">
        <button
          className="btn-secondary px-4 py-2"
          onClick={() =>
            downloadBlob(
              new Blob([exportBackup()], { type: "application/json" }),
              "matchmyrole-backup.json",
            )
          }
        >
          Download backup
        </button>
        <button
          className="btn-secondary px-4 py-2"
          onClick={() => backupInput.current?.click()}
        >
          Import backup
        </button>
        <input
          ref={backupInput}
          aria-label="Resume backup file"
          type="file"
          accept=".json,application/json"
          className="hidden"
          onChange={async (e) => {
            const file = e.target.files?.[0];
            e.target.value = "";
            if (!file) return;
            setBackupError("");
            if (file.size > MAX_BACKUP_BYTES) {
              setBackupError("Backup exceeds 5MB.");
              return;
            }
            try {
              if (importBackup(await file.text()))
                setMessage(
                  "Backup restored. Previous work was preserved, draft saving enabled, and analysis can be run again.",
                );
            } catch {
              setBackupError("Backup file could not be read.");
            }
          }}
        />
      </div>
      <p className="text-xs text-text-secondary mt-3">
        Backups contain your resume, letters, target settings, and saved
        versions. Keep them private. Import preserves current work and enables
        saving on this device; rerun AI analysis afterward.
      </p>
      {backupError && (
        <p role="alert" className="text-sm text-amber-200 mt-3">
          {backupError}
        </p>
      )}
      {activeVersionName && (
        <p className="text-sm mt-3">
          {activeVersionName} ·{" "}
          {versionDirty ? "Unsaved changes" : "Saved version"}
        </p>
      )}
      <form
        className="flex flex-wrap gap-3 mt-4"
        onSubmit={(e) => {
          e.preventDefault();
          if (saveVersion(name)) {
            setName("");
            setMessage("Version saved on this device.");
          }
        }}
      >
        <label className="flex-1 min-w-0 basis-48 text-sm">
          Version name
          <input
            maxLength={80}
            className="glass-input w-full p-3 mt-2"
            placeholder="e.g. Frontend engineer — Acme"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </label>
        <button
          disabled={!name.trim()}
          className="btn-secondary self-end px-4 py-3"
        >
          Save new version
        </button>
      </form>
      {!!versions.length && (
        <div className="flex flex-wrap gap-3 mt-4">
          <label className="flex-1 min-w-0 basis-48 text-sm">
            Saved versions
            <select
              className="glass-input w-full p-3 mt-2"
              value={selected}
              onChange={(e) => setSelected(e.target.value)}
            >
              <option value="">Choose a version</option>
              {versions.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.name} · {new Date(v.savedAt).toLocaleDateString()}
                </option>
              ))}
            </select>
          </label>
          <button
            disabled={!selected}
            className="btn-secondary self-end px-4 py-3"
            onClick={() => {
              if (loadVersion(selected))
                setMessage(
                  "Version loaded. Unsaved work, if any, was backed up.",
                );
            }}
          >
            Load version
          </button>
          <button
            disabled={!selected}
            className="text-sm underline self-end py-3"
            onClick={() => {
              if (
                window.confirm(
                  "Remove this saved version from this browser? Your current draft will stay open.",
                )
              ) {
                if (deleteVersion(selected)) {
                  setSelected("");
                  setMessage("Version removed.");
                }
              }
            }}
          >
            Remove version
          </button>
        </div>
      )}
      {message && (
        <p role="status" className="text-sm text-emerald-200 mt-3">
          {message}
        </p>
      )}
      {draftError && (
        <p role="alert" className="text-sm text-amber-200 mt-3">
          {draftError}
        </p>
      )}
    </details>
  );
};
