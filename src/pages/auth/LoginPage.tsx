import { useState } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { FullscreenLoading } from "@/components/ProtectedRoute";
import logo from "@/assets/logo.png";

export default function LoginPage() {
  const { session, loading, signInWithGoogle } = useAuth();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Com sessão salva, a tela de login piscava até a sessão terminar de carregar.
  if (loading) return <FullscreenLoading />;
  if (session) return <Navigate to="/" replace />;

  async function handleGoogle() {
    setBusy(true);
    setError(null);
    try {
      await signInWithGoogle();
    } catch {
      setError("Não foi possível entrar com o Google. Tente de novo.");
      setBusy(false);
    }
  }

  return (
    <div className="flex min-h-dvh flex-col bg-primary sm:items-center sm:justify-center sm:p-6">
      <div className="flex flex-1 flex-col items-center justify-center px-6 pb-10 pt-[calc(env(safe-area-inset-top)+3rem)] text-center text-primary-foreground sm:flex-none sm:pb-8 sm:pt-0">
        <img
          src={logo}
          alt=""
          className="h-24 w-24 rounded-full object-cover ring-4 ring-white/30"
        />
        <h1 className="mt-5 text-2xl font-semibold tracking-tight sm:text-3xl">
          Ateliê Samdesign.ab
        </h1>
        <p className="mt-2">Entre para acompanhar seus pedidos</p>
      </div>

      <div className="animate-fade-in-up rounded-t-[2rem] bg-card px-6 pb-[calc(env(safe-area-inset-bottom)+2rem)] pt-8 sm:w-full sm:max-w-sm sm:rounded-3xl sm:pb-8">
        <button
          type="button"
          onClick={handleGoogle}
          disabled={busy}
          className="btn btn-secondary h-12 w-full gap-3 text-base sm:h-12"
        >
          <GoogleIcon />
          {busy ? "Abrindo o Google..." : "Entrar com Google"}
        </button>
        {error && (
          <p role="alert" className="mt-3 text-center text-sm text-destructive">
            {error}
          </p>
        )}
      </div>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.9c1.7-1.57 2.7-3.88 2.7-6.62z"
      />
      <path
        fill="#34A853"
        d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.9-2.26c-.8.54-1.84.86-3.06.86-2.35 0-4.34-1.59-5.05-3.72H.96v2.33A9 9 0 0 0 9 18z"
      />
      <path
        fill="#FBBC05"
        d="M3.95 10.7A5.4 5.4 0 0 1 3.67 9c0-.59.1-1.17.28-1.7V4.97H.96A9 9 0 0 0 0 9c0 1.45.35 2.83.96 4.03l2.99-2.33z"
      />
      <path
        fill="#EA4335"
        d="M9 3.58c1.32 0 2.51.45 3.44 1.35l2.58-2.58C13.46.89 11.43 0 9 0A9 9 0 0 0 .96 4.97l2.99 2.33C4.66 5.17 6.65 3.58 9 3.58z"
      />
    </svg>
  );
}
