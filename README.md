# Ateliê Samdesign.ab — App de gestão de pedidos

Base do projeto: React + Vite + TypeScript + TailwindCSS + Supabase.

## O que já está pronto nesta base

- Estrutura de pastas (clean architecture): `components`, `pages`, `hooks`,
  `services`, `repositories`, `api`, `contexts`, `types`, `schemas`, `utils`,
  `styles`, `providers`, `layouts`.
- Cliente Supabase (`src/api/supabaseClient.ts`).
- Schema SQL completo do banco com Row Level Security
  (`supabase/schema.sql`) — tabelas `users`, `products`, `product_variants`,
  `orders`, `order_items`, `production`, `notifications`.
- Autenticação Google + GitHub via Supabase Auth, com sincronização
  automática do usuário na tabela `users` (`src/contexts/AuthContext.tsx`,
  `src/repositories/userRepository.ts`).
- Rotas protegidas para área do cliente e área admin
  (`src/components/ProtectedRoute.tsx`).
- Tela de login (`src/pages/auth/LoginPage.tsx`).

## O que falta (próximas fases)

- Catálogo de produtos, carrinho, checkout, cálculo de frete.
- Timeline de pedidos, rastreamento, painel de produção (Kanban).
- Painel admin completo (produtos, pedidos, clientes, relatórios).
- Integração Correios (`ShippingProvider`), push notifications, PWA.

---

## Passo a passo para rodar do zero

### 1. Criar o projeto no Supabase

1. Acesse https://supabase.com e crie uma conta (pode entrar com GitHub).
2. Clique em **New Project**, escolha um nome (ex: `atelie-samdesign`),
   uma senha de banco (guarde-a) e a região mais próxima (`South America`).
3. Aguarde a criação do projeto (leva ~2 minutos).

### 2. Rodar o schema do banco

1. No painel do Supabase, vá em **SQL Editor**.
2. Cole o conteúdo do arquivo `supabase/schema.sql` deste projeto e
   clique em **Run**.
3. Isso cria todas as tabelas, índices e as políticas de RLS.

### 3. Ativar login Google e GitHub

**Google:**
1. Vá em **Authentication > Providers > Google** no Supabase e ative.
2. Você vai precisar de um **Client ID** e **Client Secret** do Google —
   crie em https://console.cloud.google.com/apis/credentials
   (tipo "OAuth client ID" > "Web application").
3. Em **Authorized redirect URIs**, cole a URL de callback que o próprio
   Supabase mostra na tela do provider (algo como
   `https://SEU-PROJETO.supabase.co/auth/v1/callback`).
4. Cole o Client ID e Secret de volta no Supabase e salve.

**GitHub:**
1. Vá em **Authentication > Providers > GitHub** no Supabase e ative.
2. Crie um OAuth App em https://github.com/settings/developers
   ("New OAuth App").
3. Em **Authorization callback URL**, use a mesma URL de callback do
   Supabase mostrada na tela do provider.
4. Cole o Client ID e Secret gerados pelo GitHub de volta no Supabase.

### 4. Configurar variáveis de ambiente do app

1. Em **Project Settings > API** no Supabase, copie a **Project URL** e
   a **anon public key**.
2. Copie `.env.example` para `.env.local` e preencha:

   ```
   VITE_SUPABASE_URL=https://SEU-PROJETO.supabase.co
   VITE_SUPABASE_ANON_KEY=sua-anon-key
   ```

### 5. Instalar e rodar

```bash
npm install
npm run dev
```

Abra http://localhost:5173 — a tela de login deve aparecer, com os
botões "Entrar com Google" e "Entrar com GitHub".

### 6. Tornar seu usuário admin

Depois de logar pelo menos uma vez (isso cria seu registro em `users`),
vá no **Table Editor > users** do Supabase e mude sua linha:
coluna `role` de `cliente` para `admin`. Assim você acessa `/admin`.

---

## Estrutura de pastas

```
src/
  api/            # clientes de infraestrutura (supabase, correios, etc.)
  components/     # componentes reutilizáveis de UI
  contexts/       # React Context (ex: AuthContext)
  hooks/          # hooks customizados
  layouts/        # layouts de página (client, admin)
  pages/
    auth/         # login
    client/       # área do cliente
    admin/        # área administrativa
  providers/      # provedores de terceiros (ex: ShippingProvider)
  repositories/   # camada de acesso a dados (isola o Supabase)
  schemas/        # validações Zod
  services/       # regras de negócio
  types/          # tipos TypeScript (espelham o schema do banco)
  utils/          # funções utilitárias
supabase/
  schema.sql      # schema completo do banco com RLS
```
