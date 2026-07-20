import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import NotFound from "./pages/NotFound.tsx";
import { AppShell } from "./components/layout/AppShell.tsx";
import { DashboardPage } from "./features/dashboard/components/DashboardPage.tsx";
import { ResumeBuilder } from "./features/builder/components/ResumeBuilder.tsx";
import { CoverLetterView } from "./features/cover-letter/components/CoverLetterView.tsx";
import { SkillsAnalysisView } from "./features/skills/components/SkillsAnalysisView.tsx";

import { ResumeProvider } from "./contexts/ResumeContext";
import { InteractionProvider } from "./contexts/InteractionContext";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
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
  </QueryClientProvider>
);

export default App;
