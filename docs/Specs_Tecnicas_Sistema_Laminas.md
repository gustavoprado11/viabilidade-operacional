# Specs Técnicas — Sistema de Análise de Lâminas

**Versão:** 1.0
**Data:** Abril 2026
**Stack:** Next.js 15 (App Router) + TypeScript + Supabase (Postgres + Auth + Storage) + Tailwind CSS + shadcn/ui

---

## 1. Arquitetura de Alto Nível

```
┌─────────────────────────────────────────────────────────┐
│                    Cliente (Browser)                     │
│  Next.js 15 App Router · React Server Components · RSC  │
│  Tailwind · shadcn/ui · Recharts · TanStack Query       │
└──────────────────────┬──────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────┐
│                 Next.js API Routes                       │
│   /api/simulate · /api/optimize · /api/corridas         │
│   Calculation engine (pure TS, testável)                │
└──────────────────────┬──────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────┐
│              Supabase (Postgres + Auth)                  │
│   Tables: minerios, insumos, clientes, parametros,      │
│           simulacoes, corridas, calibracoes              │
│   RLS habilitado por user_id                             │
└─────────────────────────────────────────────────────────┘
```

### Princípios arquiteturais

1. **Motor de cálculo em TypeScript puro**: toda a lógica metalúrgica e financeira vive em `lib/calculation/` como funções puras, 100% testáveis sem dependência de banco ou UI.
2. **Server Components por padrão**: apenas componentes interativos usam `"use client"`.
3. **Server Actions para mutações**: formulários usam Server Actions do Next 15.
4. **Versionamento de cadastros**: nenhum UPDATE destrutivo — toda mudança cria nova linha com `valid_from`/`valid_to`.
5. **RLS**: toda query passa pelo filtro de user_id do Supabase Auth.
6. **Testes**: Vitest para unit (motor de cálculo), Playwright para E2E.

---

## 2. Estrutura de Pastas

```
siderurgica-laminas/
├── app/
│   ├── layout.tsx
│   ├── page.tsx                          # Dashboard home
│   ├── login/page.tsx
│   ├── cadastros/
│   │   ├── minerios/page.tsx
│   │   ├── fundentes/page.tsx
│   │   ├── clientes/page.tsx
│   │   └── parametros/page.tsx
│   ├── laminas/
│   │   ├── nova/page.tsx                 # Simulador (F5)
│   │   ├── [id]/page.tsx                 # Visualização/edição
│   │   └── comparar/page.tsx             # Comparativo (F6)
│   ├── corridas/
│   │   ├── page.tsx                      # Histórico (F7)
│   │   ├── nova/page.tsx
│   │   └── [id]/page.tsx
│   ├── calibracao/page.tsx               # F8
│   ├── relatorios/page.tsx               # F9
│   ├── otimizador/page.tsx               # F10
│   └── api/
│       ├── simulate/route.ts
│       ├── optimize/route.ts
│       └── export/route.ts
├── lib/
│   ├── calculation/
│   │   ├── blend.ts                      # Composição química do blend
│   │   ├── slag.ts                       # Cálculo da escória e basicidade
│   │   ├── yield.ts                      # Rendimento metalúrgico
│   │   ├── partition.ts                  # Partição de contaminantes
│   │   ├── financial.ts                  # Custos, tributos, margem
│   │   ├── validation.ts                 # Regras de viabilidade
│   │   ├── optimizer.ts                  # Busca em grade
│   │   └── index.ts                      # Orquestra tudo (simulateLamina)
│   ├── supabase/
│   │   ├── client.ts                     # createBrowserClient
│   │   ├── server.ts                     # createServerClient
│   │   └── types.ts                      # Tipos gerados com supabase gen types
│   ├── queries/                          # Data access layer
│   │   ├── minerios.ts
│   │   ├── simulacoes.ts
│   │   └── corridas.ts
│   ├── actions/                          # Server Actions
│   │   ├── lamina-actions.ts
│   │   └── corrida-actions.ts
│   └── utils/
│       ├── format.ts                     # Formatação R$, %, números
│       └── export.ts                     # CSV, Excel, PDF
├── components/
│   ├── ui/                               # shadcn/ui
│   ├── lamina/
│   │   ├── SimuladorForm.tsx
│   │   ├── ResultadoCard.tsx
│   │   ├── EscoriaCard.tsx
│   │   ├── GusaQualidadeCard.tsx
│   │   └── FinanceiroCard.tsx
│   ├── comparativo/
│   │   └── ComparativoTabela.tsx
│   └── charts/
│       ├── MargemChart.tsx
│       └── SensibilidadeChart.tsx
├── tests/
│   ├── unit/
│   │   ├── blend.test.ts
│   │   ├── slag.test.ts
│   │   ├── yield.test.ts
│   │   └── financial.test.ts
│   └── e2e/
│       ├── simulacao.spec.ts
│       └── comparativo.spec.ts
├── supabase/
│   ├── migrations/
│   │   └── 0001_initial_schema.sql
│   └── seed.sql                          # Dados de bootstrap
├── CLAUDE.md                             # Instruções para o Claude Code
├── README.md
├── package.json
├── tsconfig.json
├── tailwind.config.ts
├── next.config.js
└── .env.local.example
```

---

## 3. Modelagem de Dados (Supabase Postgres)

### 3.1. Tabelas principais

```sql
-- ============================================================
-- CADASTROS (versionados)
-- ============================================================

CREATE TABLE minerios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  nome TEXT NOT NULL,
  preco_ton NUMERIC(10,2) NOT NULL,
  fe_pct NUMERIC(5,2) NOT NULL,
  sio2_pct NUMERIC(5,2) NOT NULL,
  al2o3_pct NUMERIC(5,2) NOT NULL,
  p_pct NUMERIC(6,4) NOT NULL,
  mn_pct NUMERIC(6,4) NOT NULL,
  cao_pct NUMERIC(5,2) NOT NULL DEFAULT 0,
  mgo_pct NUMERIC(5,2) NOT NULL DEFAULT 0,
  ppc_pct NUMERIC(5,2) NOT NULL DEFAULT 0,
  pis_credito_ton NUMERIC(10,2) NOT NULL DEFAULT 0,
  icms_credito_ton NUMERIC(10,2) NOT NULL DEFAULT 0,
  analise_validada BOOLEAN NOT NULL DEFAULT FALSE,
  valid_from TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  valid_to TIMESTAMPTZ,                  -- NULL = versão atual
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_minerios_user_ativo ON minerios(user_id) WHERE valid_to IS NULL;

CREATE TABLE insumos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  nome TEXT NOT NULL,
  tipo TEXT NOT NULL CHECK (tipo IN ('calcario','bauxita','dolomita','coque','carvao','outro')),
  preco_unit NUMERIC(10,2) NOT NULL,
  unidade TEXT NOT NULL DEFAULT 'ton',   -- 'ton' ou 'MDC'
  fe_pct NUMERIC(5,2) DEFAULT 0,
  sio2_pct NUMERIC(5,2) DEFAULT 0,
  al2o3_pct NUMERIC(5,2) DEFAULT 0,
  cao_pct NUMERIC(5,2) DEFAULT 0,
  mgo_pct NUMERIC(5,2) DEFAULT 0,
  c_fixo_pct NUMERIC(5,2),               -- para coque e carvão
  densidade_kg_m3 NUMERIC(7,2),          -- para carvão
  pis_credito NUMERIC(10,2) DEFAULT 0,
  icms_credito NUMERIC(10,2) DEFAULT 0,
  valid_from TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  valid_to TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE clientes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  nome TEXT NOT NULL,
  cnpj TEXT,
  p_max NUMERIC(5,3) NOT NULL,
  si_max NUMERIC(5,3) NOT NULL,
  mn_max NUMERIC(5,3) NOT NULL,
  s_max NUMERIC(5,3) NOT NULL,
  c_min NUMERIC(5,3) NOT NULL,
  c_max NUMERIC(5,3) NOT NULL,
  preco_gusa_ton NUMERIC(10,2) NOT NULL,
  valid_from TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  valid_to TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE parametros_forno (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  corridas_por_dia INT NOT NULL DEFAULT 16,
  duracao_corrida_min INT NOT NULL DEFAULT 90,
  consumo_minerio_dia NUMERIC(10,2) NOT NULL DEFAULT 225.5,
  b2_min NUMERIC(4,3) NOT NULL DEFAULT 0.80,
  b2_max NUMERIC(4,3) NOT NULL DEFAULT 0.85,
  b2_alvo NUMERIC(4,3) NOT NULL DEFAULT 0.825,
  al2o3_escoria_alvo_min NUMERIC(5,2) NOT NULL DEFAULT 12.0,
  al2o3_escoria_alvo_max NUMERIC(5,2) NOT NULL DEFAULT 16.0,
  al2o3_escoria_limite NUMERIC(5,2) NOT NULL DEFAULT 17.0,
  mgo_al2o3_min NUMERIC(4,3) NOT NULL DEFAULT 0.25,

  -- Coeficientes do modelo de rendimento
  rend_fe_ref1 NUMERIC(5,2) NOT NULL DEFAULT 63.33,
  rend_ref1 NUMERIC(5,4) NOT NULL DEFAULT 0.6235,
  rend_fe_ref2 NUMERIC(5,2) NOT NULL DEFAULT 62.60,
  rend_ref2 NUMERIC(5,4) NOT NULL DEFAULT 0.5926,

  -- Fatores de estabilidade
  fator_estavel NUMERIC(4,3) NOT NULL DEFAULT 1.00,
  fator_atencao NUMERIC(4,3) NOT NULL DEFAULT 0.95,
  fator_instavel NUMERIC(4,3) NOT NULL DEFAULT 0.88,

  -- Partição de contaminantes
  particao_p_gusa NUMERIC(4,3) NOT NULL DEFAULT 0.95,
  particao_mn_gusa NUMERIC(4,3) NOT NULL DEFAULT 0.65,
  si_intercept NUMERIC(5,3) NOT NULL DEFAULT 1.500,
  si_coef_b2 NUMERIC(5,3) NOT NULL DEFAULT -1.200,
  s_gusa_fixo NUMERIC(5,3) NOT NULL DEFAULT 0.025,
  c_gusa_fixo NUMERIC(5,3) NOT NULL DEFAULT 4.20,

  -- Custos fixos
  custo_fixo_dia NUMERIC(10,2) NOT NULL DEFAULT 27167,
  frete_gusa_ton NUMERIC(10,2) NOT NULL DEFAULT 50.75,

  -- Tributos débito sobre gusa
  deb_pis_ton NUMERIC(10,2) NOT NULL DEFAULT 212.13,
  deb_icms_ton NUMERIC(10,2) NOT NULL DEFAULT 312.72,
  deb_ipi_ton NUMERIC(10,2) NOT NULL DEFAULT 84.69,

  valid_from TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  valid_to TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- SIMULAÇÕES E CORRIDAS
-- ============================================================

CREATE TABLE simulacoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  nome TEXT NOT NULL,
  tipo TEXT NOT NULL CHECK (tipo IN ('simulacao','corrida_real')),

  -- Inputs do blend (snapshot dos IDs + quantidades)
  cliente_id UUID REFERENCES clientes(id),
  blend JSONB NOT NULL,                  -- [{minerio_id, pct}]
  carvao_mdc NUMERIC(8,3) NOT NULL,
  carvao_densidade NUMERIC(7,2) NOT NULL,
  coque_kg NUMERIC(10,2) NOT NULL,
  calcario_kg NUMERIC(10,2) NOT NULL,
  bauxita_kg NUMERIC(10,2) NOT NULL,
  dolomita_kg NUMERIC(10,2) NOT NULL DEFAULT 0,
  quebras JSONB NOT NULL,                -- {minerio:0.10, carvao:0.10, coque:0.05, fundentes:0.05}
  estabilidade TEXT CHECK (estabilidade IN ('estavel','atencao','instavel')),
  sucata_kg NUMERIC(10,2) NOT NULL DEFAULT 0,
  sucata_preco_ton NUMERIC(10,2) NOT NULL DEFAULT 0,

  -- Resultados calculados (snapshot)
  resultado JSONB NOT NULL,              -- objeto completo com todos os outputs
  classificacao TEXT NOT NULL CHECK (classificacao IN ('viavel','alerta','inviavel')),
  parametros_id UUID NOT NULL REFERENCES parametros_forno(id),

  -- Para corridas reais
  corrida_timestamp TIMESTAMPTZ,
  observacoes TEXT,
  analise_gusa_real JSONB,               -- {p, si, mn, s, c} se disponível
  analise_escoria_real JSONB,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_simulacoes_user ON simulacoes(user_id);
CREATE INDEX idx_simulacoes_tipo ON simulacoes(user_id, tipo);
CREATE INDEX idx_simulacoes_created ON simulacoes(user_id, created_at DESC);

-- ============================================================
-- CALIBRAÇÕES (log de ajustes no modelo)
-- ============================================================

CREATE TABLE calibracoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  parametros_old_id UUID NOT NULL REFERENCES parametros_forno(id),
  parametros_new_id UUID NOT NULL REFERENCES parametros_forno(id),
  justificativa TEXT NOT NULL,
  corridas_analisadas INT NOT NULL,
  desvio_medio_antes JSONB,
  desvio_medio_depois JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- RLS (Row Level Security)
-- ============================================================

ALTER TABLE minerios ENABLE ROW LEVEL SECURITY;
ALTER TABLE insumos ENABLE ROW LEVEL SECURITY;
ALTER TABLE clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE parametros_forno ENABLE ROW LEVEL SECURITY;
ALTER TABLE simulacoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE calibracoes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users see their own data" ON minerios FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users see their own data" ON insumos FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users see their own data" ON clientes FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users see their own data" ON parametros_forno FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users see their own data" ON simulacoes FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users see their own data" ON calibracoes FOR ALL USING (auth.uid() = user_id);
```

### 3.2. Seed inicial (`supabase/seed.sql`)

Ver dados de bootstrap na seção 9 do PRD.

---

## 4. Motor de Cálculo (`lib/calculation/`)

### 4.1. Tipos centrais

```typescript
// lib/calculation/types.ts

export interface MinerioInput {
  id: string;
  nome: string;
  preco: number;
  fe: number;
  sio2: number;
  al2o3: number;
  p: number;
  mn: number;
  cao: number;
  mgo: number;
  ppc: number;
  pisCredito: number;
  icmsCredito: number;
}

export interface FundenteInput {
  nome: string;
  preco: number;
  fe?: number;
  sio2: number;
  al2o3: number;
  cao: number;
  mgo: number;
  pisCredito?: number;
  icmsCredito?: number;
}

export interface ClienteSpec {
  pMax: number;
  siMax: number;
  mnMax: number;
  sMax: number;
  cMin: number;
  cMax: number;
  precoGusa: number;
}

export interface LaminaInput {
  blend: Array<{ minerio: MinerioInput; pct: number }>;
  carvao: { mdc: number; densidade: number; preco: number };
  coque: { kg: number; preco: number };
  fundentes: {
    calcario: { kg: number; dados: FundenteInput };
    bauxita: { kg: number; dados: FundenteInput };
    dolomita: { kg: number; dados: FundenteInput };
  };
  quebras: { minerio: number; carvao: number; coque: number; fundentes: number };
  estabilidade: 'estavel' | 'atencao' | 'instavel';
  sucata: { kg: number; precoTon: number };
  cliente: ClienteSpec;
  parametros: ParametrosForno;
}

export interface LaminaResultado {
  blend: {
    fe: number; sio2: number; al2o3: number; p: number; mn: number;
    cao: number; mgo: number; ppc: number; precoMedio: number;
  };
  producao: {
    rendimentoTeorico: number;
    fatorEstabilidade: number;
    rendimentoEfetivo: number;
    gusaVazado: number;          // ton
    sucataGerada: number;        // ton
    producaoTotal: number;       // gusa + sucata
  };
  escoria: {
    sio2Ton: number; al2o3Ton: number; caoTon: number; mgoTon: number;
    volumeTon: number; volumePorTonGusa: number;
    b2: number; b4: number;
    al2o3Pct: number; mgoAl2o3: number;
    calcarioNecessario: number;
  };
  gusa: {
    p: number; si: number; mn: number; s: number; c: number;
  };
  financeiro: {
    custoMaterias: number;
    custoQuebras: number;
    custoFixo: number;
    custoFrete: number;
    custoTotal: number;
    custoPorTonGusa: number;
    receitaGusa: number;
    receitaSucata: number;
    faturamentoTotal: number;
    debitoTributos: number;
    creditoTributos: number;
    tributosLiquidos: number;
    margemPorTon: number;
    resultadoCorrida: number;
    resultadoProjetadoMes: number;
  };
  validacao: {
    specCliente: { p: boolean; si: boolean; mn: boolean; s: boolean; c: boolean };
    escoria: { al2o3OK: boolean; mgoAl2o3OK: boolean; b2OK: boolean };
    classificacao: 'viavel' | 'alerta' | 'inviavel';
    alertas: string[];
    erros: string[];
  };
}
```

### 4.2. Funções do motor

#### `lib/calculation/blend.ts`
```typescript
export function calcularBlendQuimica(
  blend: Array<{ minerio: MinerioInput; pct: number }>
): BlendQuimica;
```
Calcula média ponderada de cada elemento químico. Valida que `Σ pct = 100%`.

#### `lib/calculation/yield.ts`
```typescript
export function calcularRendimento(
  feBlend: number,
  estabilidade: Estabilidade,
  params: ParametrosForno
): { teorico: number; fator: number; efetivo: number };
```
Interpolação linear com os 2 pontos de referência, multiplicado pelo fator de estabilidade.

#### `lib/calculation/slag.ts`
```typescript
export function calcularCalcarioParaB2(
  sio2Parcial: number,
  caoParcial: number,
  b2Alvo: number,
  calcario: FundenteInput
): number;

export function calcularEscoria(
  input: LaminaInput
): EscoriaResult;
```
Calcula dosagem de calcário, composição total da escória, B2, B4, Al₂O₃%, MgO/Al₂O₃.

#### `lib/calculation/partition.ts`
```typescript
export function calcularContaminantesGusa(
  blend: BlendQuimica,
  consumoMinerio: number,
  gusaVazado: number,
  b2: number,
  params: ParametrosForno
): ContaminantesGusa;
```

#### `lib/calculation/financial.ts`
```typescript
export function calcularFinanceiro(
  input: LaminaInput,
  producao: ProducaoResult,
  escoria: EscoriaResult
): FinanceiroResult;
```

#### `lib/calculation/validation.ts`
```typescript
export function validarLamina(
  resultado: Omit<LaminaResultado, 'validacao'>,
  cliente: ClienteSpec,
  params: ParametrosForno
): ValidacaoResult;
```
Regras de classificação:
- **Inviável**: qualquer spec do cliente violada OU Al₂O₃ escória > `al2o3_escoria_limite` (17%)
- **Alerta**: Al₂O₃ escória entre alvo_max e limite OU algum parâmetro a <5% da borda da spec
- **Viável**: tudo dentro dos alvos

#### `lib/calculation/index.ts`
```typescript
export function simulateLamina(input: LaminaInput): LaminaResultado;
```
Orquestra chamadas na sequência: blend → rendimento → escória → contaminantes → financeiro → validação.

#### `lib/calculation/optimizer.ts`
```typescript
export function otimizarBlend(
  minerios: MinerioInput[],
  restricoes: OtimizacaoRestricoes,
  baseInput: Omit<LaminaInput, 'blend'>,
  step = 5  // incremento em %
): Array<LaminaResultado & { blendStr: string }>;
```
Grid search com incremento de 5% (231 combinações para 3 minérios). Retorna top 10 ranqueado por resultado da corrida.

---

## 5. Server Actions

### `lib/actions/lamina-actions.ts`
```typescript
'use server';

export async function criarSimulacao(data: FormData): Promise<Result<Simulacao>>;
export async function atualizarSimulacao(id: string, data: FormData): Promise<Result<Simulacao>>;
export async function deletarSimulacao(id: string): Promise<Result<void>>;
export async function duplicarSimulacao(id: string): Promise<Result<Simulacao>>;
```

### `lib/actions/corrida-actions.ts`
```typescript
'use server';

export async function registrarCorridaReal(data: FormData): Promise<Result<Simulacao>>;
export async function atualizarAnaliseQuimicaGusa(id: string, analise: AnaliseQuimica): Promise<Result<void>>;
```

### `lib/actions/calibracao-actions.ts`
```typescript
'use server';

export async function aplicarCalibracao(
  novosParametros: Partial<ParametrosForno>,
  justificativa: string
): Promise<Result<ParametrosForno>>;

export async function calcularDesviosHistorico(
  periodoInicio: Date,
  periodoFim: Date
): Promise<DesviosReport>;
```

---

## 6. API Routes

### `app/api/simulate/route.ts`
```
POST /api/simulate
Body: LaminaInput (JSON)
Response: LaminaResultado (JSON)
```
Endpoint puro de cálculo (não persiste). Usado pelo simulador para preview em tempo real.

### `app/api/optimize/route.ts`
```
POST /api/optimize
Body: { restricoes, baseInput, step? }
Response: { blends: LaminaResultado[], tempoExecucaoMs: number }
```

### `app/api/export/route.ts`
```
GET /api/export?tipo=simulacao&id=<uuid>&formato=<csv|xlsx|pdf>
Response: file download
```

---

## 7. Componentes UI (shadcn/ui)

### 7.1. SimuladorForm.tsx
- Formulário com 6 seções: Cliente · Blend · Carvão · Coque · Fundentes · Operação
- Cálculo client-side em tempo real ao mudar qualquer campo (debounce 300ms)
- Validação com Zod no submit
- Botões: Salvar simulação · Salvar como corrida real · Limpar

### 7.2. ResultadoLamina (composto)
Container que mostra 4 cards lado a lado:
- `ProducaoCard`: rendimento, gusa, sucata
- `EscoriaCard`: B2, B4, Al₂O₃%, MgO/Al₂O₃ com indicadores visuais (✓/⚠/✗)
- `GusaQualidadeCard`: P, Si, Mn, S, C vs spec
- `FinanceiroCard`: custos, receita, margem, resultado/corrida, resultado/mês projetado

### 7.3. ComparativoTabela.tsx
Tabela com 4 colunas de lâminas, linhas por parâmetro. Diferenças destacadas em cores. Suporta até 4 lâminas.

### 7.4. OtimizadorPanel.tsx
- Input de restrições (faixa Fe, Al₂O₃ escória máx, custo máx)
- Botão "Otimizar"
- Tabela de top 10 resultados
- Cada linha clicável para abrir como simulação

---

## 8. Testes

### 8.1. Unit tests (Vitest)

Localização: `tests/unit/*.test.ts`

Cobertura obrigatória:
- `blend.test.ts`: média ponderada correta para 1, 2, 3 minérios
- `yield.test.ts`: interpolação nos 2 pontos de referência + extremos
- `slag.test.ts`: cálculo de calcário para B2 alvo, B2 real, Al₂O₃%, MgO/Al₂O₃
- `partition.test.ts`: P, Si (função de B2), Mn, S, C
- `financial.test.ts`: débito, crédito, tributos líquidos, custo total, margem
- `validation.test.ts`: classificação ✅/⚠/❌ nos casos de fronteira
- `optimizer.test.ts`: retorna 231 combinações válidas para 3 minérios / step 5

### 8.2. Regressão contra `blend_v4.py`

Criar `tests/unit/regression.test.ts` que roda 5 lâminas conhecidas e verifica que o resultado bate com o output do blend_v4.py em ±1%.

### 8.3. E2E (Playwright)

Localização: `tests/e2e/*.spec.ts`

Cenários:
- Login → criar simulação → ver resultado → salvar → aparece no histórico
- Criar 4 simulações → abrir comparativo → exportar CSV
- Registrar corrida real → calcular desvio vs simulação
- Rodar otimizador → top 10 aparece em < 30s

---

## 9. Dependências (package.json)

```json
{
  "dependencies": {
    "next": "^15.1.0",
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "@supabase/ssr": "^0.6.0",
    "@supabase/supabase-js": "^2.45.0",
    "@tanstack/react-query": "^5.62.0",
    "zod": "^3.24.0",
    "react-hook-form": "^7.54.0",
    "@hookform/resolvers": "^3.9.0",
    "tailwindcss": "^3.4.0",
    "class-variance-authority": "^0.7.0",
    "clsx": "^2.1.0",
    "tailwind-merge": "^2.6.0",
    "lucide-react": "^0.468.0",
    "recharts": "^2.15.0",
    "exceljs": "^4.4.0",
    "jspdf": "^2.5.2",
    "jspdf-autotable": "^3.8.4"
  },
  "devDependencies": {
    "@types/node": "^22.10.0",
    "@types/react": "^19.0.0",
    "@types/react-dom": "^19.0.0",
    "typescript": "^5.7.0",
    "vitest": "^2.1.0",
    "@vitest/ui": "^2.1.0",
    "@playwright/test": "^1.49.0",
    "eslint": "^9.17.0",
    "eslint-config-next": "^15.1.0",
    "prettier": "^3.4.0",
    "supabase": "^2.0.0"
  }
}
```

---

## 10. Variáveis de Ambiente (`.env.local`)

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=       # apenas server-side
```

---

## 11. Deploy

- **Frontend**: Vercel (conectado ao repo Git)
- **Backend**: Supabase (gerenciado)
- **Domínio**: a definir (sugestão: `laminas.siderurgicabandeirante.com.br`)
- **CI**: GitHub Actions rodando `lint`, `typecheck`, `test:unit` em todo PR

---

## 12. Ordem de Implementação Sugerida

1. **Setup inicial**: Next.js + Supabase + shadcn/ui + Tailwind configurados
2. **Schema + Seed**: migrations aplicadas, dados de bootstrap carregados
3. **Motor de cálculo**: `lib/calculation/` completo com testes unit
4. **Auth + layout**: login, header, nav
5. **Cadastros (F1-F4)**: CRUD com versionamento
6. **Simulador (F5)**: formulário + resultado em tempo real + salvar
7. **Comparativo (F6)**: seleção + tabela + gráficos
8. **Histórico (F7)**: listagem + registro de corrida real
9. **Calibração (F8)**: cálculo de desvios + aplicação de ajustes
10. **Otimizador (F10)**: grid search + UI
11. **Relatórios (F9)**: dashboard + exportação CSV/Excel/PDF
12. **E2E tests + polish**
13. **Deploy produção + onboarding de dados reais**

---

## 13. Padrões de Código

- **TypeScript strict**: `"strict": true` no tsconfig
- **ESLint**: `eslint-config-next` + `eslint-plugin-unicorn`
- **Prettier**: padrão, 2 espaços, aspas simples
- **Commits**: Conventional Commits (feat/fix/chore/docs/test)
- **Branches**: `main` protegida; features em branches separadas; PR obrigatório
- **Funções do motor**: puras, sem side effects, sem async
- **Nomes**: camelCase variáveis/funções, PascalCase componentes/tipos, kebab-case arquivos

---

## 14. Notas Finais

- O sistema é single-tenant na v1, mas toda query passa por `user_id` para já estar preparado para multi-tenant na v1.1.
- Todos os cadastros são versionados (`valid_from`/`valid_to`). A view de "ativo" filtra `valid_to IS NULL`.
- Simulações e corridas armazenam snapshot completo do input E do resultado — não dependem do estado atual dos cadastros (reprodutibilidade).
- O campo `parametros_id` em `simulacoes` garante que o cálculo original pode ser reproduzido mesmo após calibração.
- Performance crítica: motor de cálculo em TypeScript puro roda em microssegundos; otimizador (231 combinações) deve rodar em < 2s.
