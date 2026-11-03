import { Routes, Route, Navigate } from 'react-router-dom';
import { ProtectedRoute } from './auth/ProtectedRoute';
import { AppLayout } from './components/Layout/AppLayout';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { Leaves } from './pages/Leaves';
import { LeaveApprovals } from './pages/LeaveApprovals';
import { Assets } from './pages/Assets';
import { Inventory } from './pages/Inventory';
import { Users } from './pages/Users';
import { NotFound } from './pages/NotFound';

export function App() {
  return (
    <Routes>
      {/* Public Route */}
      <Route path="/login" element={<Login />} />

      {/* Protected App Routes */}
      <Route
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/leaves" element={<Leaves />} />

        {/* Manager and Admin only */}
        <Route
          path="/approvals"
          element={
            <ProtectedRoute allowedRoles={['manager', 'admin']}>
              <LeaveApprovals />
            </ProtectedRoute>
          }
        />

        <Route path="/assets" element={<Assets />} />

        {/* Manager and Admin only */}
        <Route
          path="/inventory"
          element={
            <ProtectedRoute allowedRoles={['manager', 'admin']}>
              <Inventory />
            </ProtectedRoute>
          }
        />

        {/* Admin only */}
        <Route
          path="/users"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <Users />
            </ProtectedRoute>
          }
        />
      </Route>

      {/* 404 Route */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

export default App;
