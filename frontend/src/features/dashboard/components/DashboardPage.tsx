import React from "react";
import { useResumeContext } from "../../../contexts/ResumeContext";
import { HeroSection } from "./HeroSection";
import { AnalysisResults } from "./AnalysisResults";
export const DashboardPage = () => {
  const { isReady } = useResumeContext();
  return (
    <div className="flex flex-col min-h-full">
      {isReady ? <AnalysisResults /> : <HeroSection />}
    </div>
  );
};
