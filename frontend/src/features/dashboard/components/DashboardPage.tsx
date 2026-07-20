import React, { useEffect, useRef } from "react";
import { useResumeContext } from "../../../contexts/ResumeContext";
import { HeroSection } from "./HeroSection";
import { AnalysisResults } from "./AnalysisResults";

export const DashboardPage = () => {
  const { isReady, uploadStatus, setUploadStatus } = useResumeContext();
  const resultsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Orchestrate the Upload Ceremony
    // "reading" -> "projects" -> "skills" -> "ats" -> "suggestions" -> "complete"
    
    // We already jump to 'projects' when the API finishes in ConfigDrawer. 
    // Now we sequence the rest for visual impact.
    if (uploadStatus === "projects") {
      const sequence = async () => {
        const wait = (ms: number) => new Promise(r => setTimeout(r, ms));
        
        await wait(800);
        setUploadStatus("skills");
        
        await wait(800);
        setUploadStatus("ats");
        
        await wait(800);
        setUploadStatus("suggestions");
        
        await wait(1200);
        setUploadStatus("complete");
      };
      sequence();
    }
  }, [uploadStatus, setUploadStatus]);

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
