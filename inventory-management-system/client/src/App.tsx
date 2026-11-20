import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { Layout } from './components/Layout';
import { ProtectedRoute } from './components/ProtectedRoute';
import { PublicOnlyRoute } from './components/PublicOnlyRoute';
import { RoleRoute } from './components/RoleRoute';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { ToastProvider } from './context/ToastContext';
import { DashboardPage } from './pages/DashboardPage';
import { LoginPage } from './pages/LoginPage';
import { ThemeSettingsPage } from './pages/ThemeSettingsPage';
import { WelcomePage } from './pages/WelcomePage';

function RootRedirect() {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F5F6FA]">
        <div className="w-8 h-8 border-4 border-icon-chip border-t-navy rounded-full animate-spin" />
      </div>
    );
  }
  if (!user) return <Navigate to="/login" replace />;
  return <Navigate to={user.role === 'admin' ? '/dashboard' : '/welcome'} replace />;
}

export default function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
        <ThemeProvider>
          <AuthProvider>
            <Routes>
              <Route element={<PublicOnlyRoute />}>
                <Route path="/login" element={<LoginPage />} />
              </Route>

              <Route element={<ProtectedRoute />}>
                <Route path="/welcome" element={<WelcomePage />} />

                <Route element={<RoleRoute allowedRoles={['admin']} />}>
                  <Route
                    path="/dashboard"
                    element={
                      <Layout>
                        <DashboardPage />
                      </Layout>
                    }
                  />
                  <Route
                    path="/theme-settings"
                    element={
                      <Layout>
                        <ThemeSettingsPage />
                      </Layout>
                    }
                  />
                </Route>
              </Route>

              <Route path="/" element={<RootRedirect />} />
              <Route path="*" element={<RootRedirect />} />
            </Routes>
          </AuthProvider>
        </ThemeProvider>
      </ToastProvider>
    </BrowserRouter>
  );
}
