import { useEffect, useMemo, useState } from "react";
import { Search, Users } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { userRepository } from "@/repositories/userRepository";
import type { User } from "@/types/database";
import { Badge } from "@/components/ds/Badge";
import { EmptyState } from "@/components/ds/EmptyState";
import { ErrorState } from "@/components/ds/ErrorState";
import { useFeedback } from "@/components/ds/Feedback";
import { PageHeader } from "@/components/ds/PageHeader";
import { Skeleton } from "@/components/ds/Skeleton";

export default function AdminClientsPage() {
  const { user: me } = useAuth();
  const { toast, confirm } = useFeedback();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  useEffect(() => {
    loadUsers();
  }, []);

  async function loadUsers() {
    setLoading(true);
    setError(null);
    try {
      const data = await userRepository.listAll();
      setUsers(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao carregar usuários.");
    } finally {
      setLoading(false);
    }
  }

  async function handleToggleRole(user: User) {
    const novoRole = user.role === "admin" ? "cliente" : "admin";
    const ok = await confirm(
      novoRole === "admin"
        ? {
            title: `Tornar ${user.nome} administrador?`,
            description: "Ele terá acesso total ao painel.",
            confirmLabel: "Tornar administrador",
          }
        : {
            title: `Remover o acesso de administrador de ${user.nome}?`,
            description: "Ele volta a ser cliente e deixa de acessar o painel.",
            confirmLabel: "Remover acesso",
            destructive: true,
          }
    );
    if (!ok) return;

    setUpdatingId(user.id);
    try {
      const updated = await userRepository.updateRole(user.id, novoRole);
      setUsers((prev) => prev.map((u) => (u.id === updated.id ? updated : u)));
      toast(`Papel de ${user.nome} atualizado.`, "success");
    } catch (err) {
      toast(err instanceof Error ? err.message : "Erro ao atualizar usuário.", "error");
    } finally {
      setUpdatingId(null);
    }
  }

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return users;
    return users.filter(
      (u) => u.nome.toLowerCase().includes(term) || u.email.toLowerCase().includes(term)
    );
  }, [users, search]);

  return (
    <div className="px-4 py-6 sm:px-6 sm:py-8">
      <PageHeader
        title="Clientes e administradores"
        description="Promova um cliente a administrador para que ele também possa acessar este painel."
      />

      <div className="relative mt-6 sm:max-w-sm">
        <Search
          className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
          aria-hidden="true"
        />
        <input
          type="search"
          aria-label="Buscar por nome ou e-mail"
          placeholder="Buscar por nome ou e-mail"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="input w-full pl-10"
        />
      </div>

      <div className="mt-6">
        {loading ? (
          <div className="flex flex-col gap-3">
            <Skeleton className="h-20" />
            <Skeleton className="h-20" />
            <Skeleton className="h-20" />
          </div>
        ) : error ? (
          <ErrorState title="Não foi possível carregar os usuários" message={error} onRetry={loadUsers} />
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={Users}
            title={users.length === 0 ? "Nenhum usuário cadastrado ainda" : "Ninguém encontrado"}
            description={users.length === 0 ? undefined : "Tente outro nome ou e-mail."}
          />
        ) : (
          <ul className="card divide-y divide-border/60">
            {filtered.map((u) => {
              const isMe = u.id === me?.id;
              return (
                <li
                  key={u.id}
                  className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:gap-4"
                >
                  <div className="flex min-w-0 flex-1 items-center gap-3">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-muted text-sm font-semibold">
                      {u.nome.trim().charAt(0).toUpperCase()}
                    </span>
                    <div className="min-w-0">
                      <p className="truncate font-medium">
                        {u.nome}
                        {isMe && <span className="font-normal text-muted-foreground"> (você)</span>}
                      </p>
                      <p className="truncate text-sm text-muted-foreground">{u.email}</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-3 sm:justify-end">
                    <Badge tone={u.role === "admin" ? "primary" : "neutral"}>
                      {u.role === "admin" ? "Administrador" : "Cliente"}
                    </Badge>
                    {!isMe && (
                      <button
                        type="button"
                        onClick={() => handleToggleRole(u)}
                        disabled={updatingId === u.id}
                        className="btn btn-sm btn-secondary"
                      >
                        {updatingId === u.id
                          ? "Atualizando..."
                          : u.role === "admin"
                            ? "Remover admin"
                            : "Tornar admin"}
                      </button>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
