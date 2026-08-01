import { supabase } from "@/api/supabaseClient";
import type { User } from "@/types/database";
import type { User as SupabaseAuthUser } from "@supabase/supabase-js";

/**
 * Camada de acesso à tabela `users`.
 * Nenhuma outra parte do app deve chamar `supabase.from("users")` diretamente —
 * assim, se trocarmos de provedor de banco, só este arquivo muda.
 */
export const userRepository = {
  async findById(id: string): Promise<User | null> {
    const { data, error } = await supabase
      .from("users")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (error) throw error;
    return data;
  },

  /**
   * Garante que exista um registro em `users` para o usuário autenticado
   * (chamado logo após login OAuth). Cria se não existir; sincroniza
   * nome/email se já existir e algo mudou no provedor.
   */
  async syncFromAuthUser(authUser: SupabaseAuthUser): Promise<User> {
    const nome =
      (authUser.user_metadata?.full_name as string | undefined) ??
      (authUser.user_metadata?.name as string | undefined) ??
      authUser.email?.split("@")[0] ??
      "Usuário";

    const email = authUser.email ?? "";
    const provider = (authUser.app_metadata?.provider as string | undefined) ?? "google";

    // 1. Já existe um registro para este id de autenticação? Atualiza e retorna.
    const existing = await this.findById(authUser.id);
    if (existing) {
      const { data, error } = await supabase
        .from("users")
        .update({ nome, email, auth_provider: provider })
        .eq("id", authUser.id)
        .select("*")
        .single();

      if (error) throw error;
      return data;
    }

    // 2. Não existe ainda: cria um novo registro.
    const { data, error } = await supabase
      .from("users")
      .insert({ id: authUser.id, nome, email, auth_provider: provider })
      .select("*")
      .single();

    if (error) {
      if (error.code === "23505") {
        // Já existe outra conta com este e-mail vinculada a um id de login
        // diferente (ex: login testado antes com outro provedor). É preciso
        // remover a linha antiga em Table Editor > users no Supabase.
        throw new Error(
          `Já existe um usuário cadastrado com o e-mail ${email}, vinculado a outro login. ` +
            "Remova a linha duplicada na tabela 'users' do Supabase (Table Editor) e tente novamente."
        );
      }
      throw error;
    }
    return data;
  },

  async updateProfile(
    id: string,
    updates: Partial<Pick<User, "nome" | "telefone" | "endereco">>
  ): Promise<User> {
    const { data, error } = await supabase
      .from("users")
      .update(updates)
      .eq("id", id)
      .select("*")
      .single();

    if (error) throw error;
    return data;
  },
};
