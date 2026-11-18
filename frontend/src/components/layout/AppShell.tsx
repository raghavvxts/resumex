import React from "react";
import { Outlet, useLocation } from "react-router-dom";
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
  const location = useLocation();
  const mainRef = React.useRef<HTMLElement>(null);
  React.useEffect(() => {
    if (mainRef.current) mainRef.current.scrollTop = 0;
  }, [location.pathname]);
  const {
    isReady,
    parsedResume,
    showStrategist,
    setShowStrategist,
    strategistQuery,
    showConfigDrawer,
    uploadStatus,
    setUploadStatus,
  } = useResumeContext();

  const isHomepage =
    !isReady &&
    (location.pathname === "/" || location.pathname === "/dashboard");

  return (
    <div
      className={`flex bg-bg-base text-text-primary selection:bg-accent-functional/30 relative overflow-hidden h-[100dvh] ${isHomepage ? "app-shell--homepage" : ""}`}
    >
      {/* The Global Material Environment */}
      {isHomepage ? (
        <div className="homepage-background" aria-hidden="true">
          <img
            src="/images/homepage-background.jpg"
            alt=""
            width={1672}
            height={941}
            loading="eager"
            decoding="async"
          />
          <div className="homepage-background-shade" />
        </div>
      ) : (
        <MaterialSurface />
      )}

      {/* Embedded Components (Layer 2 - Glass & Layer 3 - Interactive) */}
      <Sidebar />

      <div className="flex-1 flex flex-col relative z-10 min-w-0 h-full overflow-hidden">
        {(isReady || parsedResume) && <Topbar />}

        <main
          ref={mainRef}
          id="main-content"
          className={`flex-1 relative overflow-y-auto pb-24 lg:pb-0`}
        >
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
