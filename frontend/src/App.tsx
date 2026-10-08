import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppLayout } from './layouts/AppLayout';
import { DashboardPage } from './pages/DashboardPage';
import { TrafficPage } from './pages/TrafficPage';
import { AlertsPage } from './pages/AlertsPage';
import { ThreatsPage } from './pages/ThreatsPage';
import { HistoryPage } from './pages/HistoryPage';
import { ModelsPage } from './pages/ModelsPage';
import { EvaluationPage } from './pages/EvaluationPage';
import { SystemStatusPage } from './pages/SystemStatusPage';
import { NotFoundPage } from './pages/NotFoundPage';
import { LoginPage } from './pages/LoginPage';
import { AuthProvider, useAuth } from './hooks/useAuth';

function AuthenticatedApp() {
  const { isAuthenticated, loading, login } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-sm text-gray-500">Loading...</div>
      </div>
    );
  }

  // Not authenticated → login page (protected routes are behind this gate).
  if (!isAuthenticated) {
    return <LoginPage onLogin={login} />;
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppLayout />}>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/traffic" element={<TrafficPage />} />
          <Route path="/alerts" element={<AlertsPage />} />
          <Route path="/threats" element={<ThreatsPage />} />
          <Route path="/history" element={<HistoryPage />} />
          <Route path="/models" element={<ModelsPage />} />
          <Route path="/evaluation" element={<EvaluationPage />} />
          <Route path="/system" element={<SystemStatusPage />} />
          <Route path="/login" element={<Navigate to="/" replace />} />
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AuthenticatedApp />
    </AuthProvider>
  );
}
