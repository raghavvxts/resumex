import React from "react";
import { Outlet } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";
import { MobileNavbar } from "./MobileNavbar";
import { StrategistDrawer } from "../../features/strategist/components/StrategistDrawer";
import { ConfigDrawer } from "../../features/dashboard/components/ConfigDrawer";
import { ResumeModal } from "../../features/dashboard/components/ResumeModal";
import { useResumeContext } from "../../contexts/ResumeContext";
import { MaterialSurface } from "../ui/MaterialSurface";
import { motion, AnimatePresence } from "framer-motion";

export const AppShell = () => {
  const { isReady, showStrategist, setShowStrategist, strategistQuery, showConfigDrawer, uploadStatus, setUploadStatus } = useResumeContext();

  React.useEffect(() => {
    // Orchestrate the Upload Ceremony
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

  return (
    <div className={`flex bg-bg-base text-text-primary selection:bg-accent-functional/30 relative overflow-hidden ${isReady ? "min-h-[100dvh]" : "h-[100dvh] overflow-hidden"}`}>
      {/* The Global Material Environment */}
      <MaterialSurface />

      {/* Embedded Components (Layer 2 - Glass & Layer 3 - Interactive) */}
      <Sidebar />

      <div className="flex-1 flex flex-col relative z-10 min-w-0 h-full">
        {isReady && <Topbar />}

        <main className={`flex-1 relative overflow-y-auto pb-24 lg:pb-0`}>
          <AnimatePresence mode="wait">
            <Outlet />
          </AnimatePresence>
        </main>
      </div>

      {!showConfigDrawer && !showStrategist && <MobileNavbar />}

      <StrategistDrawer 
        isOpen={showStrategist} 
        onClose={() => setShowStrategist(false)} 
        initialQuery={strategistQuery} 
      />

      <ConfigDrawer />
      <ResumeModal />
    </div>
  );
};
