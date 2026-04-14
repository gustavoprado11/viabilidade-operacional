# Sistema de Análise de Lâminas — Siderúrgica Bandeirante

Simulação metalúrgica + financeira de lâminas (carga do alto-forno) para
decisões de blend, fundentes e operação. Veja `docs/PRD_Sistema_Laminas.md`
e `docs/CLAUDE.md` para contexto.

## Stack
Next.js 15 · TypeScript strict · Tailwind v3 · shadcn/ui (manual) · Supabase
(Postgres + Auth + RLS) · Vitest · Playwright.

## Setup local

```bash
pnpm install
cp .env.local.example .env.local   # preencher
pnpm dev
```

Abra http://localhost:3000 — a home redireciona para `/login`.

## Bootstrap de dados (uma vez, após criar o usuário no Supabase Auth)

1. Criar usuário em **Supabase Dashboard → Authentication → Users**.
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
