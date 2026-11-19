/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useState, useRef } from "react";
import { useResumeContext } from "../../../contexts/ResumeContext";
import { generatePDF, PDFGenerationError } from "../../../services/api/builder";
import { PlaceholderView } from "../../../components/ui/PlaceholderView";
import { ResumeVersions } from "./ResumeVersions";
import { resumeToText } from "../../../lib/resumeVersions";
import { PDFPreview } from "../../../components/ui/PDFPreview";
import { downloadBlob } from "../../../lib/download";
import { printResume } from "../../../lib/browserPdf";
import { suggestionWarnings } from "../../../lib/suggestionReview";
import { FileText } from "lucide-react";

export const ResumeBuilder = () => {
  const {
    parsedResume,
    sessionVersion,
    setParsedResume,
    result,
    setResumeText,
    setResumeInputMode,
    setSkillsData,
    setLetter,
    setMessages,
    error: parseError,
    setShowConfigDrawer,
  } = useResumeContext();
  const currentResume = useRef(parsedResume);
  currentResume.current = parsedResume;
  const [previous, setPrevious] = useState<any>(null);
  const [bulletTarget, setBulletTarget] = useState("");
  const [confirmedClaims, setConfirmedClaims] = useState<string[]>([]);
  const [skipped, setSkipped] = useState<string[]>([]);
  const [autoPreview, setAutoPreview] = useState(false);
  const template = parsedResume?.template_name || "simple_resume";
  const warnings: string[] = parsedResume?.parsing_warnings || [];
  const needsReview = warnings.length > 0 && !parsedResume?.parsing_reviewed;
  const previewTimer = useRef<ReturnType<typeof setTimeout>>();
  const generation = useRef(0);
  const inFlight = useRef(false);
  const [completed, setCompleted] = useState(0);
  const [preview, setPreview] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [downloading, setDownloading] = useState(false);
  const [exportNotice, setExportNotice] = useState("");
  useEffect(() => {
    setPreview("");
    setBulletTarget("");
    setConfirmedClaims([]);
    generation.current += 1;
    return () => {
      generation.current += 1;
    };
  }, [parsedResume]);
  useEffect(() => {
    if (
      autoPreview &&
      !needsReview &&
      parsedResume?.personal_info?.name?.trim()
    )
      previewTimer.current = setTimeout(() => {
        void generate();
      }, 800);
    return () => clearTimeout(previewTimer.current);
    // Only the latest resume and auto-preview setting should schedule a generation.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [parsedResume, autoPreview, needsReview, completed]);
  useEffect(() => {
    setPrevious(null);
    setSkipped([]);
    setBulletTarget("");
    setError("");
  }, [sessionVersion]);
  useEffect(
    () => () => {
      if (preview) URL.revokeObjectURL(preview);
    },
    [preview],
  );
  const commit = (resume: any) => {
    const text = resumeToText(resume);
    setParsedResume(resume);
    if (text === resumeToText(parsedResume)) return;
    setResumeText(text);
    setResumeInputMode("text");
    setSkillsData(null);
    setLetter("");
    setMessages([]);
  };
  const update = (key: string, value: any) => {
    setPrevious(parsedResume);
    commit({ ...parsedResume, [key]: value });
  };
  const generate = async () => {
    clearTimeout(previewTimer.current);
    if (inFlight.current) return;
    inFlight.current = true;
    const snapshot = parsedResume;
    const id = ++generation.current;
    setLoading(true);
    setError("");
    try {
      const blob = await generatePDF(snapshot, template);
      if (currentResume.current === snapshot && id === generation.current)
        setPreview(URL.createObjectURL(blob));
    } catch (e) {
      if (id === generation.current)
        setError(e instanceof Error ? e.message : "PDF generation failed.");
    } finally {
      inFlight.current = false;
      setLoading(false);
      if (currentResume.current !== snapshot)
        setCompleted((value) => value + 1);
    }
  };
  const download = async () => {
    if (downloading) return;
    if (!navigator.onLine) {
      localPDF();
      return;
    }
    const snapshot = parsedResume;
    setDownloading(true);
    setError("");
    setExportNotice("");
    try {
      let blob: Blob;
      try {
        blob = await generatePDF(snapshot, template);
      } catch (cause) {
        if (
          template === "simple_resume" ||
          (cause instanceof PDFGenerationError &&
            [400, 413, 422].includes(cause.status)) ||
          (cause instanceof Error && /cancel/i.test(cause.message))
        )
          throw cause;
        if (currentResume.current !== snapshot) return;
        setExportNotice(
          "Selected template failed. Preparing Simple PDF instead…",
        );
        blob = await generatePDF(snapshot, "simple_resume");
        if (currentResume.current === snapshot)
          setExportNotice(
            "Downloaded Simple PDF because the selected template could not be generated.",
          );
      }
      if (currentResume.current !== snapshot) {
        setExportNotice(
          "Your resume changed during export. Download again to export your latest edits.",
        );
        return;
      }
      downloadBlob(blob, "resume.pdf");
      setExportNotice(
        (notice) => notice || "PDF ready. Your download has started.",
      );
    } catch (cause) {
      if (currentResume.current === snapshot) {
        setError(
          `${cause instanceof Error ? cause.message : "PDF download failed."} Opening Browser PDF; you can retry it below if the print dialog was blocked.`,
        );
        localPDF();
      }
    } finally {
      setDownloading(false);
    }
  };
  const localPDF = () => {
    printResume(parsedResume);
    setExportNotice(
      "Choose Save as PDF and disable headers and footers in the print dialog. Browser PDF uses a single-column layout and stays on your device.",
    );
  };
  const claimReview = (key: string, original: string, suggestion: string) => {
    const flags = suggestionWarnings(original, suggestion);
    if (!flags.length) return null;
    return (
      <div className="rounded-xl border border-amber-300/30 p-3 space-y-2 text-sm">
        {flags.map((flag) => (
          <p key={flag} className="text-amber-200">
            {flag}
          </p>
        ))}
        <label className="flex gap-2 items-start">
          <input
            type="checkbox"
            checked={confirmedClaims.includes(key)}
            onChange={(e) =>
              setConfirmedClaims((values) =>
                e.target.checked
                  ? [...values, key]
                  : values.filter((value) => value !== key),
              )
            }
          />
          I verified these claims against my actual experience.
        </label>
      </div>
    );
  };
  const selectedBullet = bulletTarget
    ? parsedResume?.[bulletTarget.split(":")[0]]?.[
        Number(bulletTarget.split(":")[1])
      ]?.bullets?.[Number(bulletTarget.split(":")[2])] || ""
    : "";
  const summaryFlags = suggestionWarnings(
    parsedResume?.summary || "",
    result?.ai_recommendations?.summary_rewrite || "",
  );
  if (!parsedResume)
    return (
      <div className="workspace-page builder-empty-page space-y-5">
        <PlaceholderView
          title="Resume Builder"
          icon={FileText}
          description={
            parseError ||
            "Analyze your resume to create an editable draft. Parsing can take a little longer than analysis."
          }
        >
          <button
            className="btn-secondary px-5 py-3"
            onClick={() =>
              setParsedResume({
                personal_info: { name: "" },
                summary: "",
                education: [],
                experience: [],
                projects: [],
                skills: {},
              })
            }
          >
            Start an empty resume
          </button>
        </PlaceholderView>
        <ResumeVersions />
      </div>
    );
  const field = (
    label: string,
    value: string,
    onChange: (value: string) => void,
    multiline = false,
  ) => (
    <label className="block text-sm space-y-2" key={label}>
      <span>{label}</span>
      {multiline ? (
        <textarea
          className="glass-input w-full p-3 min-h-[110px]"
          value={value || ""}
          onChange={(e) => onChange(e.target.value)}
        />
      ) : (
        <input
          className="glass-input w-full p-3"
          value={value || ""}
          onChange={(e) => onChange(e.target.value)}
        />
      )}
    </label>
  );
  return (
    <div className="workspace-page builder-page space-y-5">
      <header>
        <p className="text-sm text-text-secondary mb-2">
          Review → Edit → Export
        </p>
        <h1 className="text-2xl font-bold">Resume Builder</h1>
        <a
          href="#pdf-preview"
          className="builder-preview-link inline-block underline text-sm mt-3"
        >
          Jump to PDF download & preview
        </a>
        <p className="text-text-secondary mt-2">
          Download your latest edits directly. Preview is optional; enable
          auto-preview if you want it to update while editing.
        </p>
        {previous && (
          <button
            className="btn-secondary mt-3 px-4 py-2"
            onClick={() => {
              commit(previous);
              setPrevious(null);
            }}
          >
            Undo last edit
          </button>
        )}
      </header>
      <p className="text-sm text-text-secondary">
        For automated application systems, choose Simple or Jake for a
        single-column reading order.
      </p>
      <div className="builder-toolbar">
        <label className="block min-w-0 space-y-2 text-sm">
          <span>PDF template</span>
          <select
            className="glass-input w-full p-3"
            value={template}
            onChange={(e) => update("template_name", e.target.value)}
          >
            <option value="jakes_resume">Jake — classic single column</option>
            <option value="deedy_resume">Deedy — compact two columns</option>
            <option value="simple_resume">
              Simple — wraps and paginates long resumes
            </option>
          </select>
        </label>
        <ResumeVersions />
      </div>
      {template === "deedy_resume" && (
        <p className="text-sm text-text-secondary">
          Two-column PDFs can be read in a different order by automated systems.
          Choose Jake or Simple when an application requests a single-column
          resume.
        </p>
      )}
      {warnings.length > 0 && (
        <section
          className="glass-card p-5 space-y-3"
          aria-label="Parsing review"
        >
          <h2 className="text-xl">Check the extracted draft</h2>
          <p>
            These comparisons can miss content. Review every section before
            exporting.
          </p>
          <ul className="list-disc pl-5">
            {warnings.map((warning) => (
              <li key={warning}>{warning}</li>
            ))}
          </ul>
          <details>
            <summary className="cursor-pointer">
              Compare with original text
            </summary>
            <pre className="whitespace-pre-wrap text-sm mt-3">
              {parsedResume.source_text}
            </pre>
          </details>
          <label className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={Boolean(parsedResume.parsing_reviewed)}
              onChange={(e) => update("parsing_reviewed", e.target.checked)}
            />
            I reviewed the source and corrected missing information.
          </label>
        </section>
      )}
      {Boolean(
        result?.ai_recommendations?.summary_rewrite ||
        result?.ai_recommendations?.rewritten_bullets?.length,
      ) && (
        <details className="glass-card p-5">
          <summary className="cursor-pointer font-semibold">
            Review AI suggestions
          </summary>
          <div className="space-y-4 mt-4">
            {!!skipped.length && (
              <button
                className="text-sm underline"
                onClick={() => setSkipped([])}
              >
                Show skipped suggestions ({skipped.length})
              </button>
            )}
            <p>
              Use only suggestions that accurately describe your experience.
              Choose exactly which bullet to replace. Automated checks flag new
              numbers and selected claim types; they cannot verify every fact.
            </p>
            {result.ai_recommendations.summary_rewrite &&
              !skipped.includes("summary") && (
                <div className="space-y-3">
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="border border-white/15 rounded-xl p-4">
                      <p className="text-sm text-text-secondary mb-2">
                        Original
                      </p>
                      <p>{parsedResume.summary || "No summary yet"}</p>
                    </div>
                    <div className="border border-purple-300/25 rounded-xl p-4">
                      <p className="text-sm text-purple-200 mb-2">
                        Suggested revision
                      </p>
                      <p>{result.ai_recommendations.summary_rewrite}</p>
                    </div>
                  </div>
                  {claimReview(
                    "summary",
                    parsedResume.summary || "",
                    result.ai_recommendations.summary_rewrite,
                  )}
                  <button
                    className="btn-secondary px-4 py-2"
                    disabled={
                      summaryFlags.length > 0 &&
                      !confirmedClaims.includes("summary")
                    }
                    onClick={() =>
                      update(
                        "summary",
                        result.ai_recommendations.summary_rewrite,
                      )
                    }
                  >
                    Use this summary
                  </button>
                  <button
                    className="text-sm underline ml-4"
                    onClick={() => setSkipped((prev) => [...prev, "summary"])}
                  >
                    Skip summary
                  </button>
                </div>
              )}
            {!!result.ai_recommendations.rewritten_bullets?.length && (
              <>
                <label className="block">
                  Original bullet to replace
                  <select
                    aria-label="Original bullet to replace"
                    className="glass-input w-full p-3"
                    value={bulletTarget}
                    onChange={(e) => {
                      setBulletTarget(e.target.value);
                      setConfirmedClaims([]);
                    }}
                  >
                    <option value="">Choose an original bullet</option>
                    {["experience", "projects"].flatMap((section) =>
                      (parsedResume[section] || []).flatMap(
                        (entry: any, i: number) =>
                          (entry.bullets || []).map(
                            (bullet: string, j: number) => (
                              <option
                                key={`${section}:${i}:${j}`}
                                value={`${section}:${i}:${j}`}
                              >
                                {entry.company ||
                                  entry.name ||
                                  entry.role ||
                                  `${section} ${i + 1}`}
                                : {bullet}
                              </option>
                            ),
                          ),
                      ),
                    )}
                  </select>
                </label>
                {result.ai_recommendations.rewritten_bullets.map(
                  (bullet, i) =>
                    !skipped.includes(`bullet-${i}`) && (
                      <div
                        key={i}
                        className="border border-white/15 p-4 rounded-xl"
                      >
                        <div className="grid sm:grid-cols-2 gap-4">
                          <div>
                            <p className="text-sm text-text-secondary mb-2">
                              Original
                            </p>
                            <p>
                              {bulletTarget
                                ? parsedResume[bulletTarget.split(":")[0]]?.[
                                    Number(bulletTarget.split(":")[1])
                                  ]?.bullets?.[
                                    Number(bulletTarget.split(":")[2])
                                  ]
                                : "Choose an original bullet above to compare."}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-purple-200 mb-2">
                              Suggested revision
                            </p>
                            <p>{bullet}</p>
                          </div>
                        </div>
                        {bulletTarget &&
                          claimReview(`bullet-${i}`, selectedBullet, bullet)}
                        <button
                          className="btn-secondary mt-3 px-4 py-2"
                          disabled={
                            !bulletTarget ||
                            (suggestionWarnings(selectedBullet, bullet).length >
                              0 &&
                              !confirmedClaims.includes(`bullet-${i}`))
                          }
                          onClick={() => {
                            const [section, index, selectedBullet] =
                              bulletTarget.split(":");
                            const expIndex = Number(index);
                            const bulletIndex = Number(selectedBullet);
                            update(
                              section,
                              parsedResume[section].map(
                                (exp: any, j: number) =>
                                  j === expIndex
                                    ? {
                                        ...exp,
                                        bullets: exp.bullets.map(
                                          (b: string, k: number) =>
                                            k === bulletIndex ? bullet : b,
                                        ),
                                      }
                                    : exp,
                              ),
                            );
                            setBulletTarget("");
                          }}
                        >
                          Replace selected bullet
                        </button>
                        <button
                          className="text-sm underline ml-4"
                          onClick={() =>
                            setSkipped((prev) => [...prev, `bullet-${i}`])
                          }
                        >
                          Skip suggestion
                        </button>
                      </div>
                    ),
                )}
              </>
            )}
          </div>
        </details>
      )}

      <div className="builder-columns grid gap-6 items-start">
        <div className="min-w-0 space-y-6">
          <section className="glass-card p-5 space-y-4">
            <h2 className="text-xl">Personal information</h2>
            <div className="grid sm:grid-cols-2 gap-4">
              {[
                "name",
                "email",
                "phone",
                "linkedin",
                "github",
                "portfolio",
              ].map((key) =>
                field(
                  key[0].toUpperCase() + key.slice(1),
                  parsedResume.personal_info?.[key],
                  (value) =>
                    update("personal_info", {
                      ...parsedResume.personal_info,
                      [key]: value,
                    }),
                ),
              )}
            </div>
            {!parsedResume.personal_info?.name && (
              <p role="alert" className="text-amber-300">
                Add your name before exporting.
              </p>
            )}
            {field(
              "Summary",
              parsedResume.summary,
              (value) => update("summary", value),
              true,
            )}
          </section>
          {["education", "experience", "projects"].map((section) => (
            <section key={section} className="glass-card p-5 space-y-4">
              <h2 className="text-xl capitalize">{section}</h2>
              {(parsedResume[section] || []).map((item: any, index: number) => (
                <div
                  key={index}
                  className="border border-white/15 p-4 rounded-xl space-y-4"
                >
                  <div className="grid sm:grid-cols-2 gap-4">
                    {(section === "education"
                      ? ["institution", "degree", "location", "date", "gpa"]
                      : section === "experience"
                        ? ["role", "company", "location", "date"]
                        : ["name", "technologies", "date"]
                    ).map((key) =>
                      field(`${key} (${index + 1})`, item[key], (value) =>
                        update(
                          section,
                          parsedResume[section].map((entry: any, i: number) =>
                            i === index ? { ...entry, [key]: value } : entry,
                          ),
                        ),
                      ),
                    )}
                  </div>
                  {section !== "education" &&
                    field(
                      `Bullets (${section} ${index + 1}, one per line)`,
                      (item.bullets || []).join("\n"),
                      (value) =>
                        update(
                          section,
                          parsedResume[section].map((entry: any, i: number) =>
                            i === index
                              ? { ...entry, bullets: value.split("\n") }
                              : entry,
                          ),
                        ),
                      true,
                    )}
                  <button
                    className="btn-secondary px-4 py-2"
                    onClick={() =>
                      update(
                        section,
                        parsedResume[section].filter(
                          (_: any, i: number) => i !== index,
                        ),
                      )
                    }
                  >
                    Remove entry
                  </button>
                </div>
              ))}
              <button
                className="btn-secondary px-4 py-2"
                onClick={() =>
                  update(section, [
                    ...(parsedResume[section] || []),
                    { bullets: [] },
                  ])
                }
              >
                Add {section} entry
              </button>
            </section>
          ))}
          <section className="glass-card p-5 space-y-4">
            <h2 className="text-xl">Skills</h2>
            {["languages", "frameworks", "tools"].map((key) =>
              field(
                key,
                Array.isArray(parsedResume.skills?.[key])
                  ? parsedResume.skills[key].join(", ")
                  : parsedResume.skills?.[key],
                (value) =>
                  update("skills", { ...parsedResume.skills, [key]: value }),
              ),
            )}
          </section>
        </div>
        <aside
          id="pdf-preview"
          aria-label="PDF preview panel"
          className="builder-preview glass-card min-w-0 p-5 space-y-4"
        >
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-xl font-semibold">PDF preview</h2>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={autoPreview}
                onChange={(e) => setAutoPreview(e.target.checked)}
              />
              Auto-preview
            </label>
          </div>
          <p role="status" className="text-sm text-text-secondary">
            {error
              ? "PDF generation failed. Please retry."
              : loading
                ? "Updating PDF…"
                : preview
                  ? "Preview is up to date. Download generates your latest edits."
                  : autoPreview
                    ? "Your latest edits are waiting for a preview."
                    : "Preview paused. Generate a PDF when you are ready."}
          </p>
          <div className="flex flex-wrap gap-3">
            <button
              className="btn-secondary px-4 py-2"
              aria-label={loading ? "Generating PDF…" : "Generate PDF preview"}
              disabled={
                loading ||
                needsReview ||
                !parsedResume.personal_info?.name?.trim()
              }
              onClick={() => void generate()}
            >
              {loading
                ? "Generating PDF…"
                : preview
                  ? "Refresh preview"
                  : "Generate preview"}
            </button>
            <button
              className="btn-primary px-4 py-2"
              disabled={
                downloading ||
                needsReview ||
                !parsedResume.personal_info?.name?.trim()
              }
              onClick={() => void download()}
            >
              {downloading ? "Preparing download…" : "Download PDF"}
            </button>
          </div>
          <button
            className="btn-secondary px-4 py-2"
            disabled={needsReview || !parsedResume.personal_info?.name?.trim()}
            onClick={localPDF}
          >
            Browser PDF
          </button>
          <p className="text-xs text-text-secondary">
            Browser PDF works without our server. Choose Save as PDF in your
            browser’s print dialog.
          </p>
          {exportNotice && (
            <p role="status" className="text-sm text-text-secondary">
              {exportNotice}
            </p>
          )}
          {error && (
            <p role="alert" className="text-red-300">
              {error}
            </p>
          )}
          {preview ? (
            <PDFPreview url={preview} />
          ) : (
            <div className="min-h-[300px] sm:min-h-[420px] rounded-xl border border-dashed border-white/20 flex items-center justify-center p-8 text-center text-text-secondary">
              {!parsedResume.personal_info?.name?.trim()
                ? "Add your name to create a PDF preview."
                : "Your PDF will appear here. You can keep editing while it updates."}
            </div>
          )}
        </aside>
      </div>
      <div
        className="mobile-export-bar lg:hidden"
        aria-label="Quick PDF export"
      >
        <button
          className="btn-primary px-4 py-3"
          aria-label="Download PDF from mobile toolbar"
          disabled={
            downloading ||
            needsReview ||
            !parsedResume.personal_info?.name?.trim()
          }
          onClick={() => void download()}
        >
          {downloading ? "Preparing…" : "Download PDF"}
        </button>
        <button
          className="btn-secondary px-4 py-3"
          aria-label="Browser PDF from mobile toolbar"
          disabled={needsReview || !parsedResume.personal_info?.name?.trim()}
          onClick={localPDF}
        >
          Browser PDF
        </button>
      </div>
    </div>
  );
};
