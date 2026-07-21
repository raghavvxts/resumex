import React, { useEffect, useRef } from "react";
import { useResumeContext } from "../../../contexts/ResumeContext";
import { HeroSection } from "./HeroSection";
import { AnalysisResults } from "./AnalysisResults";

export const DashboardPage = () => {
  const { isReady, uploadStatus, setUploadStatus } = useResumeContext();
  const resultsRef = useRef<HTMLDivElement>(null);

  // Orchestration moved to AppShell.tsx to run globally

  // Auto-scroll to results when analysis completes
  useEffect(() => {
    if ((uploadStatus === "complete" || (isReady && uploadStatus === "idle")) && resultsRef.current) {
      resultsRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [uploadStatus, isReady]);

  return (
    <div className={`flex flex-col ${uploadStatus === "complete" || isReady ? "min-h-[calc(100vh-3.5rem)]" : "min-h-[100vh]"}`}>
      {uploadStatus === "complete" || (isReady && uploadStatus === "idle") ? (
        <div ref={resultsRef}>
          <AnalysisResults />
        </div>
      ) : (
        <HeroSection />
      )}
    </div>
  );
};
