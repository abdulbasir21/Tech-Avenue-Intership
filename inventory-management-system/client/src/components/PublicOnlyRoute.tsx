import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export function PublicOnlyRoute() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F5F6FA]">
        <div className="w-8 h-8 border-4 border-icon-chip border-t-navy rounded-full animate-spin" />
      </div>
    );
  }

  if (user) {
    return <Navigate to={user.role === 'admin' ? '/dashboard' : '/welcome'} replace />;
  }

  return <Outlet />;
}
