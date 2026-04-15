# Sistema de Análise de Lâminas — Siderúrgica Bandeirante

Simulação metalúrgica + financeira de lâminas (carga do alto-forno) para
decisões de blend, fundentes e operação. Veja `docs/PRD_Sistema_Laminas.md`
e `docs/CLAUDE.md` para contexto.

**Produção:** https://viabilidade-operacional.vercel.app/

## Stack

Next.js 15 · TypeScript strict · Tailwind v3 · shadcn/ui (manual) · Supabase
(Postgres + Auth + RLS) · Vitest · Playwright · Vercel.

## Setup local

```bash
pnpm install
cp .env.local.example .env.local   # preencher
pnpm dev
```

Abra http://localhost:3000 — a home redireciona para `/login`.

## Bootstrap de dados (uma vez, após criar o usuário no Supabase Auth)

1. Criar usuário em **Supabase Dashboard → Authentication → Users**
   (Auto Confirm marcado).
2. Preencher `.env.local`:
   ```
   SUPABASE_SERVICE_ROLE_KEY=...
   BOOTSTRAP_USER_EMAIL=<email do usuário criado>
   ```
3. Rodar:
   ```bash
   pnpm tsx scripts/bootstrap-data.ts
   ```
   O script é idempotente: aborta se o usuário já tem cadastros ativos.

Cadastros inseridos (conforme `PRD seção 9`):
- 3 minérios (Serra, Trindade, LHG Corumbá)
- 5 insumos (calcário, bauxita, dolomita, coque, carvão vegetal)
- 1 cliente (Gusa Aciaria)
- 1 parâmetro do forno (defaults do schema)

## Scripts

```bash
pnpm dev                 # desenvolvimento
pnpm build               # build de produção
pnpm typecheck           # tsc --noEmit
pnpm lint
pnpm test:unit           # Vitest
pnpm test:unit:coverage  # Vitest com cobertura
pnpm test:e2e            # Playwright (requer pnpm exec playwright install chromium na 1ª vez)
```

## Arquitetura

- **Motor de cálculo** em `lib/calculation/` — puro, sem I/O, sem Next/Supabase.
- **Mutações** em `lib/actions/` (Server Actions).
- **Queries** em `lib/queries/` (Server Components).
- **Cadastros versionados**: `softUpdate`/`softDelete` em
  `lib/queries/versioning.ts` nunca destroem linhas — `valid_to` marca o fim.

Detalhes em `docs/Specs_Tecnicas_Sistema_Laminas.md`.

## Deploy

- **Frontend:** Vercel, auto-deploy a partir de `main`. URL:
  https://viabilidade-operacional.vercel.app/
- **Backend:** Supabase **single-project** (`heztorfzqfddfgezxhyk`) para dev,
  E2E e produção. Isolamento por `user_id` + RLS.
- **CI:** GitHub Actions (`.github/workflows/ci.yml`) roda lint + typecheck
  + test:unit em todo PR e push na `main`. E2E não roda em CI (requer
  Supabase autenticado) — executar manualmente antes de releases.

### Usuários no Supabase

| Usuário | Papel | Onde usar |
|---|---|---|
| `teste@teste.com` | conta pessoal de dev | desenvolvimento local |
| `e2e-test@teste.com` | automação Playwright | specs E2E (ver `tests/e2e/helpers/auth.ts`) |
| `gustavo@siderurgicabandeirante.ind.br` | produção real | app em produção |

### Env vars no Vercel (Production)

Devem estar configuradas como **Production-only**:

```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
```

### Aplicar migrations em produção

**Nunca rode direto em prod sem testar.** Fluxo:

1. Criar a migration em `supabase/migrations/NNNN_nome.sql`.
2. **Local:** `pnpm exec supabase db push` com `.env.local` apontando para o
   projeto de dev. Validar que tudo funciona.
3. **Backup de prod:** Supabase Dashboard → Database → Backups → garantir
   que existe backup recente (automático diário, ou criar manual).
4. **Aplicar em prod:** como o projeto é single-project, a migration já é
   aplicada no mesmo push. Para projetos separados no futuro, `supabase link
   --project-ref <prod>` + `db push`.

### Backup do Supabase

- **Automáticos:** diários, retenção conforme plano (7 dias no free tier).
- **Dashboard:** Supabase → Database → Backups → download manual ou restore.
- **Antes de migration arriscada:** gerar backup manual pelo dashboard.

### Variáveis de teste (local)

`.env.local` também precisa de `E2E_USER_EMAIL` e `E2E_USER_PASSWORD`
para rodar a suíte E2E. Veja `.env.local.example`.
