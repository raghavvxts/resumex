import React, { useState } from "react";
import { X } from "lucide-react";
import { useResumeContext } from "../../contexts/ResumeContext";
import { generatePDF } from "../../services/api/builder";

export const Topbar = () => {
  const { parsedResume, result, clearData, uploadStatus, isReady } = useResumeContext();
  const [isExporting, setIsExporting] = useState(false);

  // Determine AI Status text based on the uploadStatus
  let aiStatusText = "Ready";
  let pulse = false;
  let progress = 0;
  if (uploadStatus === "uploading" || uploadStatus === "reading") { aiStatusText = "Reading Resume"; pulse = true; progress = 20; }
  else if (uploadStatus === "projects" || uploadStatus === "skills") { aiStatusText = "Analyzing Data"; pulse = true; progress = 50; }
  else if (uploadStatus === "ats") { aiStatusText = "Matching Job"; pulse = true; progress = 75; }
  else if (uploadStatus === "suggestions") { aiStatusText = "Generating Suggestions"; pulse = true; progress = 90; }
  else if (uploadStatus === "complete" || (isReady && uploadStatus === "idle")) { aiStatusText = "Analysis Complete"; pulse = false; progress = 100; }

  const exportPDF = async () => {
    if (!parsedResume) return;
    setIsExporting(true);
    try {
      const updatedResume = JSON.parse(JSON.stringify(parsedResume));
      updatedResume.template_name = "jakes_resume";
      
      if (result?.ai_recommendations?.rewritten_bullets?.length && updatedResume.experience?.length) {
        const aiBullets = result.ai_recommendations.rewritten_bullets;
        const exp = updatedResume.experience[0];
        exp.bullets = [...aiBullets, ...exp.bullets.slice(aiBullets.length)];
      }
      
      const blob = await generatePDF(updatedResume);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "resume.pdf";
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error(e);
      alert("Failed to export PDF");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <header className="topbar h-16 px-6 flex items-center justify-between">
      {/* AI Status */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <div className="relative flex items-center justify-center w-2 h-2">
            {pulse && <div className="absolute w-2 h-2 bg-accent-functional rounded-full animate-ping opacity-75" />}
            <div className={`relative w-2 h-2 rounded-full ${pulse ? "bg-accent-functional" : "bg-text-muted"}`} />
          </div>
          <span className="text-caption font-semibold tracking-wide uppercase text-text-muted">
            {aiStatusText}
          </span>
        </div>
        {pulse && (
          <div className="w-24 h-1.5 bg-white/10 rounded-full overflow-hidden">
            <div className="h-full bg-accent-functional transition-all duration-500 ease-out" style={{ width: `${progress}%` }} />
          </div>
        )}
      </div>

      <div className="flex items-center gap-4">
        {parsedResume && (
        <button 
          onClick={exportPDF}
          disabled={isExporting}
          className="flex items-center justify-center gap-3 px-10 py-4 rounded-xl bg-accent-functional hover:opacity-80 text-white transition-all text-[17px] font-semibold disabled:opacity-50 shadow-xl hover:-translate-y-0.5"
        >
          {isExporting ? (
            <span className="flex items-center gap-3">
              <span className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" /> 
              Generating PDF...
            </span>
          ) : (
            <>Export PDF (LaTeX)</>
          )}
        </button>
      )}
        <button onClick={clearData} className="flex items-center gap-2 px-6 py-4 rounded-xl hover:bg-white/5 text-white transition-all text-[15px] font-semibold">
          <X className="w-5 h-5" />
          Clear Data
        </button>
      </div>
    </header>
  );
};
