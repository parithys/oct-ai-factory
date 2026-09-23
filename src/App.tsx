import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { AppProvider, useApp } from "@/context/AppContext";
import AppLayout from "@/components/AppLayout";
import PersonaRouteGuard from "@/components/PersonaRouteGuard";
import ToastContainer from "@/components/ToastContainer";
import Dashboard from "@/pages/Dashboard";
import UseCases from "@/pages/UseCases";
import UseCaseDetail from "@/pages/UseCaseDetail";
import DataManagement from "@/pages/DataManagement";
import ModelLab from "@/pages/ModelLab";
import Deployment from "@/pages/Deployment";
import Monitoring from "@/pages/Monitoring";
import Governance from "@/pages/Governance";
import Analytics from "@/pages/Analytics";
import SettingsPage from "@/pages/SettingsPage";
import ProfilePage from "@/pages/ProfilePage";
import LoginPage from "@/pages/LoginPage";
import NotFound from "@/pages/NotFound";

const queryClient = new QueryClient();

function GuardedPage({ children }: { children: React.ReactNode }) {
  return (
    <AppLayout>
      <PersonaRouteGuard>{children}</PersonaRouteGuard>
    </AppLayout>
  );
}

function AuthenticatedRoutes() {
  const { state } = useApp();

  if (!state.isAuthenticated) {
    return (
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }

  return (
    <Routes>
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="/login" element={<Navigate to="/dashboard" replace />} />
      <Route path="/dashboard" element={<GuardedPage><Dashboard /></GuardedPage>} />
      <Route path="/use-cases" element={<GuardedPage><UseCases /></GuardedPage>} />
      <Route path="/use-cases/:id" element={<GuardedPage><UseCaseDetail /></GuardedPage>} />
      <Route path="/data" element={<GuardedPage><DataManagement /></GuardedPage>} />
      <Route path="/model-lab" element={<GuardedPage><ModelLab /></GuardedPage>} />
      <Route path="/model-lab/:experimentId" element={<GuardedPage><ModelLab /></GuardedPage>} />
      <Route path="/deployment" element={<GuardedPage><Deployment /></GuardedPage>} />
      <Route path="/monitoring" element={<GuardedPage><Monitoring /></GuardedPage>} />
      <Route path="/monitoring/:endpointId" element={<GuardedPage><Monitoring /></GuardedPage>} />
      <Route path="/governance" element={<GuardedPage><Governance /></GuardedPage>} />
      <Route path="/analytics" element={<GuardedPage><Analytics /></GuardedPage>} />
      <Route path="/settings" element={<GuardedPage><SettingsPage /></GuardedPage>} />
      <Route path="/profile" element={<GuardedPage><ProfilePage /></GuardedPage>} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AppProvider>
      <ToastContainer />
      <BrowserRouter>
        <AuthenticatedRoutes />
      </BrowserRouter>
    </AppProvider>
  </QueryClientProvider>
);

export default App;
