import { useEffect, useState } from "react";
import { userRepository } from "@/repositories/userRepository";
import type { User } from "@/types/database";

export default function AdminClientsPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

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
    const confirmMsg =
      novoRole === "admin"
        ? `Tornar ${user.nome} um administrador? Ele terá acesso total ao painel.`
        : `Remover privilégios de administrador de ${user.nome}?`;

    if (!window.confirm(confirmMsg)) return;

    setUpdatingId(user.id);
    try {
      const updated = await userRepository.updateRole(user.id, novoRole);
      setUsers((prev) => prev.map((u) => (u.id === updated.id ? updated : u)));
    } catch (err) {
      alert(err instanceof Error ? err.message : "Erro ao atualizar usuário.");
    } finally {
      setUpdatingId(null);
    }
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold">Clientes e administradores</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Promova um cliente a administrador para que ele também possa acessar este painel.
      </p>

      {loading && <p className="mt-4 text-sm text-muted-foreground">Carregando usuários...</p>}
      {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

      {!loading && !error && (
        <div className="mt-4 overflow-hidden rounded-lg border border-border">
          <table className="w-full text-left text-sm">
            <thead className="bg-muted">
              <tr>
                <th className="px-4 py-2 font-medium">Nome</th>
                <th className="px-4 py-2 font-medium">E-mail</th>
                <th className="px-4 py-2 font-medium">Papel</th>
                <th className="px-4 py-2 font-medium">Ação</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="border-t border-border">
                  <td className="px-4 py-2">{u.nome}</td>
                  <td className="px-4 py-2 text-muted-foreground">{u.email}</td>
                  <td className="px-4 py-2">
                    <span
                      className={
                        u.role === "admin"
                          ? "rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary"
                          : "rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground"
                      }
                    >
                      {u.role === "admin" ? "Administrador" : "Cliente"}
                    </span>
                  </td>
                  <td className="px-4 py-2">
                    <button
                      onClick={() => handleToggleRole(u)}
                      disabled={updatingId === u.id}
                      className="rounded-md border border-border px-3 py-1 text-xs font-medium transition hover:bg-muted disabled:opacity-50"
                    >
                      {updatingId === u.id
                        ? "Atualizando..."
                        : u.role === "admin"
                          ? "Remover admin"
                          : "Tornar admin"}
                    </button>
                  </td>
                </tr>
              ))}
              {users.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-6 text-center text-muted-foreground">
                    Nenhum usuário cadastrado ainda.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
