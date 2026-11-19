import React from "react";
import { Link } from "react-router-dom";
import { useResumeContext } from "../../../contexts/ResumeContext";

export const AnalysisResults = () => {
  const {
    result,
    resumeText,
    setShowConfigDrawer,
    mode,
    setShowStrategist,
    setStrategistQuery,
    setShowResumeModal,
  } = useResumeContext();
  if (!result) return null;
  const audit = (result.analysis_mode || mode) === "audit";
  const findings = [
    ...new Set(
      [
        ...(result.action_plan || []),
        ...(result.ai_recommendations?.weak_points || []),
      ].filter(Boolean),
    ),
  ].slice(0, 3);
  const discuss = (finding: string) => {
    setStrategistQuery(
      `Help me address this finding using only facts from my resume: ${finding}`,
    );
    setShowStrategist(true);
  };
  return (
    <div className="workspace-page space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm text-text-secondary mb-2">
            1. Analyze <span aria-hidden="true">→</span> 2. Review{" "}
            <span aria-hidden="true">→</span> 3. Edit & export
          </p>
          <h1 className="text-2xl font-bold">Analysis Report</h1>
          <p className="mt-2 text-text-secondary">
            {result.candidate_name || "Your resume"} ·{" "}
            {result.target_label ||
              (audit ? "General resume audit" : "Target job")}
          </p>
        </div>
        <Link className="btn-primary px-5 py-3" to="/builder">
          Review & edit resume
        </Link>
      </header>
      {result.source_text && result.source_text !== resumeText && (
        <div
          role="status"
          className="border border-amber-300/30 rounded-xl p-4 text-sm"
        >
          <p>
            This report reflects your previous scan. Your resume has changed.
          </p>
          <button
            className="underline mt-2"
            onClick={() => setShowConfigDrawer(true)}
          >
            Analyze latest edits
          </button>
        </div>
      )}
      <section aria-labelledby="priority-heading" className="space-y-4">
        <div>
          <h2 id="priority-heading" className="text-xl font-semibold">
            {findings.length
              ? `${findings.length} thing${findings.length === 1 ? "" : "s"} to fix first`
              : "Your next step"}
          </h2>
          <p className="text-text-secondary mt-2">
            Start here. Use only skills and achievements you can support.
          </p>
        </div>
        <div className="grid xl:grid-cols-3 gap-4">
          {findings.map((finding, i) => (
            <article
              key={finding}
              className="glass-card min-w-0 p-5 flex flex-col items-start gap-4"
            >
              <span className="text-sm text-purple-300 font-semibold">
                Priority {i + 1}
              </span>
              <p className="text-base leading-relaxed flex-1">{finding}</p>
              <div className="flex flex-wrap gap-3">
                <Link to="/builder" className="btn-secondary px-4 py-2 text-sm">
                  Edit resume
                </Link>
                <button
                  className="text-sm underline underline-offset-4"
                  onClick={() => discuss(finding)}
                >
                  Get guidance
                </button>
              </div>
            </article>
          ))}
        </div>
        {!findings.length && (
          <p className="rounded-xl border border-white/15 p-5">
            No priority findings were returned. Review your parsed details and
            PDF before exporting.
          </p>
        )}
      </section>
      {result.ai_recommendations?.status !== "ok" &&
        result.ai_recommendations?.message && (
          <p
            role="status"
            className="text-sm text-amber-200 border-l-2 border-amber-300 pl-4"
          >
            {result.ai_recommendations.message}
          </p>
        )}
      <section
        aria-label="Score summary"
        className="glass-card grid sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-white/15"
      >
        <div className="p-5">
          <p className="text-sm text-text-secondary">
            {audit ? "Resume completeness" : "Text similarity estimate"}
          </p>
          <p className="text-3xl font-semibold mt-2">
            {Math.round(result.score)}
            <span className="text-sm font-normal text-text-secondary">
              {" "}
              / 100
            </span>
          </p>
        </div>
        <div className="p-5">
          <p className="text-sm text-text-secondary">
            {audit ? "Sections present" : "Requirement keyword coverage"}
          </p>
          <p className="text-3xl font-semibold mt-2">
            {Math.round(result.keyword_coverage || 0)}%
          </p>
        </div>
      </section>
      <p className="text-sm text-text-secondary">
        Scores describe the text in this resume. They do not measure your actual
        proficiency or predict hiring outcomes.
      </p>
      <details className="glass-card p-5">
        <summary className="cursor-pointer font-semibold">
          See supporting details
        </summary>
        <div className="space-y-6 mt-5">
          <div>
            <h3 className="font-semibold mb-3">
              {audit ? "Section coverage" : "Section relevance estimates"}
            </h3>
            <dl className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {Object.entries(result.section_scores || {}).map(
                ([section, score]) => (
                  <div key={section} className="rounded-lg bg-white/5 p-3">
                    <dt className="capitalize text-sm text-text-secondary">
                      {section.replace(/_/g, " ")}
                    </dt>
                    <dd className="mt-1">{Math.round(score)}%</dd>
                  </div>
                ),
              )}
            </dl>
          </div>
          {!audit && (
            <div>
              <h3 className="font-semibold mb-2">
                Requirements not evidenced in this resume
              </h3>
              <p className="text-sm text-text-secondary mb-3">
                A missing keyword does not mean you lack the skill. Add
                supporting experience only if it is accurate.
              </p>
              <div className="flex flex-wrap gap-2">
                {(result.missing_keywords || []).map((keyword) => (
                  <button
                    key={keyword}
                    className="border border-amber-300/30 text-amber-200 rounded-lg px-3 py-2 text-sm"
                    onClick={() =>
                      discuss(
                        `The target mentions ${keyword}, but my resume does not show it.`,
                      )
                    }
                  >
                    {keyword}
                  </button>
                ))}
              </div>
              {!result.missing_keywords?.length && (
                <p>No missing keywords were detected.</p>
              )}
            </div>
          )}
          <button
            className="btn-secondary px-4 py-2"
            onClick={() => setShowResumeModal(true)}
          >
            View writing suggestions
          </button>
        </div>
      </details>
    </div>
  );
};
