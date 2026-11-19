import { lazy } from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import NotFound from "./pages/NotFound.tsx";
import { AppShell } from "./components/layout/AppShell.tsx";
import { DashboardPage } from "./features/dashboard/components/DashboardPage.tsx";
import { ResumeProvider } from "./contexts/ResumeContext";
import { InteractionProvider } from "./contexts/InteractionContext";

const ResumeBuilder = lazy(() =>
  import("./features/builder/components/ResumeBuilder").then((m) => ({
    default: m.ResumeBuilder,
  })),
);
const CoverLetterView = lazy(() =>
  import("./features/cover-letter/components/CoverLetterView").then((m) => ({
    default: m.CoverLetterView,
  })),
);
const SkillsAnalysisView = lazy(() =>
  import("./features/skills/components/SkillsAnalysisView").then((m) => ({
    default: m.SkillsAnalysisView,
  })),
);

const App = () => (
  <InteractionProvider>
    <ResumeProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<AppShell />}>
            <Route index element={<DashboardPage />} />
            <Route path="dashboard" element={<DashboardPage />} />
            <Route path="builder" element={<ResumeBuilder />} />
            <Route path="cover" element={<CoverLetterView />} />
            <Route path="skills" element={<SkillsAnalysisView />} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </ResumeProvider>
  </InteractionProvider>
);
export default App;
