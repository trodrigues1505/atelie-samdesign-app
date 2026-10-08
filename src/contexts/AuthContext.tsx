import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/api/supabaseClient";
import { userRepository } from "@/repositories/userRepository";
import type { User } from "@/types/database";

interface AuthContextValue {
  session: Session | null;
  user: User | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // O listener do Supabase é criado uma vez só, então lê o usuário atual por ref.
  const userRef = useRef<User | null>(null);
  // Sincronização em andamento: o Supabase dispara INITIAL_SESSION logo ao assinar,
  // o que fazia a mesma consulta rodar duas vezes na abertura do app.
  const inflight = useRef<{ userId: string; promise: Promise<void> } | null>(null);

  useEffect(() => {
    let isMounted = true;

    function applyUser(next: User | null) {
      userRef.current = next;
      if (isMounted) setUser(next);
    }

    function syncUser(currentSession: Session | null): Promise<void> {
      if (!currentSession) {
        inflight.current = null;
        applyUser(null);
        return Promise.resolve();
      }

      const userId = currentSession.user.id;
      if (inflight.current?.userId === userId) return inflight.current.promise;

      const promise: Promise<void> = (async () => {
        try {
          const dbUser = await userRepository.syncFromAuthUser(currentSession.user);
          // Se saiu da conta (ou trocou de usuário) enquanto buscava, descarta o resultado.
          if (inflight.current?.userId === userId) applyUser(dbUser);
        } catch (err) {
          console.error("Falha ao sincronizar usuário na tabela users:", err);
        }
      })().finally(() => {
        if (inflight.current?.promise === promise) inflight.current = null;
      });

      inflight.current = { userId, promise };
      return promise;
    }

    // Sessão inicial
    supabase.auth
      .getSession()
      .then(({ data: { session: initialSession } }) => {
        if (!isMounted) return;
        setSession(initialSession);
        return syncUser(initialSession);
      })
      .catch((err: unknown) => {
        console.error("Falha ao ler a sessão:", err);
      })
      .finally(() => {
        // Sem o catch acima, uma falha aqui deixava o app em "carregando" para sempre.
        if (isMounted) setLoading(false);
      });

    // Mudanças de sessão (login, logout, refresh token)
    const { data: subscription } = supabase.auth.onAuthStateChange((_event, newSession) => {
      if (!isMounted) return;
      setSession(newSession);
      // Chegou a sessão mas o perfil ainda não: mantém "carregando" para as rotas não
      // decidirem com user === null (ex.: AdminRoute mandando o admin para "/").
      // Com o perfil já carregado (refresh de token) não mexe, para não trocar a tela.
      if (newSession && !userRef.current) setLoading(true);
      void syncUser(newSession).finally(() => {
        if (isMounted) setLoading(false);
      });
    });

    return () => {
      isMounted = false;
      inflight.current = null;
      subscription.subscription.unsubscribe();
    };
  }, []);

  const signInWithGoogle = useCallback(async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: window.location.origin + import.meta.env.BASE_URL,
      },
    });
    if (error) throw error;
  }, []);

  const signOut = useCallback(async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  }, []);

  // Sem memoização, cada renovação de token recriava o objeto e re-renderizava
  // todos os componentes que usam useAuth.
  const value = useMemo(
    () => ({ session, user, loading, signInWithGoogle, signOut }),
    [session, user, loading, signInWithGoogle, signOut]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth deve ser usado dentro de <AuthProvider>");
  return ctx;
}
