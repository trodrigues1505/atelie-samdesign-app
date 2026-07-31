import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

export function ProtectedRoute() {
  const { session, loading } = useAuth();

  if (loading) return <FullscreenLoading />;
  if (!session) return <Navigate to="/login" replace />;

  return <Outlet />;
}

export function AdminRoute() {
  const { session, user, loading } = useAuth();

  if (loading) return <FullscreenLoading />;
  if (!session) return <Navigate to="/login" replace />;
  if (user?.role !== "admin") return <Navigate to="/" replace />;

  return <Outlet />;
}

function FullscreenLoading() {
  return (
    <div className="flex h-screen items-center justify-center">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
    </div>
  );
}
