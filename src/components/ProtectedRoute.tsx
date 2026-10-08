import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import logo from "@/assets/logo.png";

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

export function FullscreenLoading() {
  return (
    <div
      role="status"
      className="flex min-h-dvh flex-col items-center justify-center gap-5 bg-background"
    >
      <img src={logo} alt="" className="h-16 w-16 rounded-full object-cover" />
      <div
        aria-hidden="true"
        className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent"
      />
      <span className="sr-only">Carregando...</span>
    </div>
  );
}
