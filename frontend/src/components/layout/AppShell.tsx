import React from "react";
import { Outlet, useLocation } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";
import { MobileNavbar } from "./MobileNavbar";
import { StrategistDrawer } from "../../features/strategist/components/StrategistDrawer";
import { ConfigDrawer } from "../../features/dashboard/components/ConfigDrawer";
import { ResumeModal } from "../../features/dashboard/components/ResumeModal";
import { useResumeContext } from "../../contexts/ResumeContext";

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
  } = useResumeContext();

  return (
    <div className="app-shell flex bg-bg-base text-text-primary selection:bg-accent-functional/30 relative overflow-hidden h-[100dvh]">
      <div className="app-background" aria-hidden="true">
        <img
          src="/images/homepage-background.jpg"
          alt=""
          width={1672}
          height={941}
          decoding="async"
        />
        <div className="app-background-shade" />
      </div>

      {/* Embedded Components (Layer 2 - Glass & Layer 3 - Interactive) */}
      <Sidebar />

      <div className="flex-1 flex flex-col relative z-10 min-w-0 h-full overflow-hidden">
        {(isReady || parsedResume) && <Topbar />}

        <main
          ref={mainRef}
          id="main-content"
          className="app-main flex-1 min-h-0 relative overflow-y-auto"
        >
          <Outlet />
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
