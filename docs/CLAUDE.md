# CLAUDE.md — Instruções para o Claude Code

Este arquivo orienta o Claude Code ao trabalhar no repositório do **Sistema de Análise de Lâminas** da Siderúrgica Bandeirante.

---

## Contexto do Projeto

Sistema web para simular, comparar e registrar lâminas (configurações de carga) do alto-forno a carvão vegetal da Siderúrgica Bandeirante. Permite análise metalúrgica (rendimento, escória, contaminantes) e financeira (custos, tributos, margem) de cada corrida antes e depois da produção.

**Documentos de referência (nesta ordem):**

1. `docs/PRD_Sistema_Laminas.md` — o quê e por quê
2. `docs/Specs_Tecnicas_Sistema_Laminas.md` — como
3. `docs/Sistema_Analise_Laminas_Racional.md` v1.1 — premissas técnicas validadas com engenharia
4. `docs/Resumo_Siderurgica_Bandeirante.md` — contexto completo da operação

**Sempre consulte estes docs antes de tomar decisões arquiteturais.**

---

## Stack Técnica

- **Framework:** Next.js 15 (App Router, Server Components, Server Actions)
- **Linguagem:** TypeScript strict
- **Banco:** Supabase (Postgres + Auth + Storage + RLS)
- **UI:** Tailwind CSS + shadcn/ui
- **Estado servidor:** TanStack Query
- **Formulários:** React Hook Form + Zod
- **Testes:** Vitest (unit) + Playwright (E2E)
- **Gráficos:** Recharts
- **Export:** ExcelJS, jsPDF

---

## Princípios Fundamentais

### 1. Motor de cálculo é sagrado

Toda a lógica metalúrgica e financeira vive em `lib/calculation/`. Essas funções são:
- **Puras** — sem side effects, sem async, sem fetch
- **100% testadas** — cada função tem cobertura unit em `tests/unit/`
- **Independentes** — não dependem de React, Supabase ou qualquer framework
- **Reprodutíveis** — mesmo input → mesmo output, sempre

**Nunca coloque lógica de cálculo em componentes, API routes ou Server Actions.** Todos esses chamam o motor.

### 2. Server Components por padrão

Use `"use client"` apenas quando necessário (interatividade, hooks, event handlers). Fetch de dados acontece em Server Components via funções de `lib/queries/`.

### 3. Mutações via Server Actions

Formulários usam Server Actions (`"use server"`) em `lib/actions/`. Não criar API routes para mutações internas (somente para endpoints de cálculo puro e export).

### 4. Versionamento de cadastros

Cadastros (minérios, insumos, clientes, parâmetros) nunca são atualizados destrutivamente. Toda mudança:
1. Seta `valid_to = NOW()` na linha atual
2. Insere nova linha com `valid_from = NOW()` e `valid_to = NULL`

A view "ativa" sempre filtra `valid_to IS NULL`.

### 5. Snapshots em simulações

Simulações e corridas armazenam snapshot completo do input e do resultado. Elas referenciam o `parametros_id` usado no cálculo, garantindo reprodutibilidade mesmo após calibrações futuras.

### 6. RLS obrigatório

Toda tabela tem RLS habilitado filtrando por `auth.uid() = user_id`. Nunca faça queries que burlem isso. Quando usar `SUPABASE_SERVICE_ROLE_KEY`, documente o motivo no código.

---

## Convenções de Código

### Nomenclatura

- **Variáveis e funções**: camelCase (`calcularRendimento`)
- **Componentes e tipos**: PascalCase (`SimuladorForm`, `LaminaResultado`)
- **Arquivos**: kebab-case (`simulador-form.tsx`, `lamina-actions.ts`)
- **Constantes globais**: UPPER_SNAKE_CASE (`B2_ALVO_DEFAULT`)

### TypeScript

- `strict: true` obrigatório
- Nunca use `any`. Se não souber o tipo, use `unknown` e valide.
- Prefira `type` a `interface` para objetos de dado; `interface` para contratos de componente.
- Zod para validação de inputs externos (formulários, API).

### Idioma

- **Código em inglês** (nomes de funções, variáveis, tipos)
- **UI em português brasileiro** (labels, mensagens, textos)
- **Domínio metalúrgico em português** quando for termo técnico específico (ex: `blend`, `gusa`, `escoria`, `basicidade`, `fundente`)

### Formatação

- Prettier com configuração padrão
- Tailwind com `prettier-plugin-tailwindcss` para ordenação automática
- Imports organizados: externos → internos `@/` → relativos

### Git

- Conventional Commits: `feat:`, `fix:`, `chore:`, `docs:`, `test:`, `refactor:`
- Mensagens em inglês
- PRs obrigatórios, `main` protegida
- Rodar `pnpm lint && pnpm typecheck && pnpm test:unit` antes de commitar

---

## Fórmulas Críticas (não inventar)

As fórmulas abaixo estão validadas com o engenheiro metalúrgico. Não altere sem autorização explícita.

### Blend (média ponderada)
```typescript
propBlend = Σ (pct[i]/100 × propMinerio[i])
```
Para cada propriedade química (Fe, SiO2, Al2O3, P, Mn, CaO, MgO, PPC, preço).

### Rendimento metalúrgico
```typescript
rendTeorico = rend_ref1 + ((fe_blend - fe_ref1) × (rend_ref1 - rend_ref2) / (fe_ref1 - fe_ref2))
rendEfetivo = rendTeorico × fator_estabilidade
```
Onde `fator_estabilidade ∈ {1.00, 0.95, 0.88}` para {estável, atenção, instável}.

### Calcário para B2 alvo
```typescript
calcario = (B2_alvo × (sio2_min + sio2_baux + sio2_dolom) - (cao_min + cao_baux + cao_dolom))
           / (cao_calc_frac - B2_alvo × sio2_calc_frac)
```
Onde `_frac` = pct/100.

### Basicidades
```typescript
B2 = CaO_total / SiO2_total
B4 = (CaO_total + MgO_total) / (SiO2_total + Al2O3_total)
```

### Al₂O₃ na escória e MgO/Al₂O₃
```typescript
al2o3_pct_escoria = al2o3_total / escoria_total × 100
mgo_al2o3_ratio = mgo_total / al2o3_total
```

### Contaminantes no gusa
```typescript
P_gusa = (P_blend/100 × consumo_minerio) / gusa_vazado × 100 × particao_p_gusa  // 0.95
Si_gusa = max(0.1, si_intercept + si_coef_b2 × B2)                              // 1.5 - 1.2×B2
Mn_gusa = (Mn_blend/100 × consumo_minerio) / gusa_vazado × 100 × particao_mn    // 0.65
S_gusa = s_gusa_fixo                                                            // 0.025
C_gusa = c_gusa_fixo                                                            // 4.2
```

### Financeiro
```typescript
custo_total = custo_materias + custo_quebras + custo_fixo_rateado + custo_frete + tributos_liquidos
tributos_liquidos = debitos_gusa - (creditos_pis_insumos + creditos_icms_insumos)
resultado_corrida = (receita_gusa + receita_sucata) - custo_total
margem_ton = preco_gusa - (custo_total / gusa_vazado)
```

### Regras de validação (classificação)
```
INVIÁVEL se:
  - P_gusa > P_max_cliente
  - Si_gusa > Si_max_cliente
  - Mn_gusa > Mn_max_cliente
  - S_gusa > S_max_cliente
  - C_gusa fora de [C_min, C_max]
  - Al2O3_escoria > al2o3_escoria_limite (17%)

ALERTA se:
  - Al2O3_escoria entre al2o3_escoria_alvo_max (16%) e al2o3_escoria_limite (17%)
  - B2 fora de [b2_min, b2_max] mas dentro de ±5%
  - Qualquer contaminante no gusa a menos de 5% da borda da spec
  - MgO/Al2O3 < mgo_al2o3_min

VIÁVEL se:
  - Tudo OK
```

---

## Restrições e Limites (validados com engenharia)

| Parâmetro | Valor |
|---|---|
| B2 alvo | 0,80 – 0,85 |
| Al₂O₃ escória alvo | 12% – 16% |
| Al₂O₃ escória limite | **17% (acima = inviável)** |
| MgO/Al₂O₃ mínimo | 0,25 (com dolomita) |
| Corridas por dia | 16 |
| Duração corrida | 1h30 |
| Temperatura escória | **NÃO modelar — não é medida** |

---

## Dados de Bootstrap

Sempre presentes em `supabase/seed.sql`:

**Minérios (3):** Serra da Moeda · Trindade · LHG Corumbá
**Fundentes (3):** Calcário Sandra · Bauxita Sto Expedito · Dolomita
**Insumos (2):** Coque (R$ 1.408/ton) · Carvão vegetal (R$ 360/MDC, densidade 220 kg/m³)
**Cliente (1):** Gusa Aciaria (spec P≤0,15% Si≤1,0% Mn≤1,0% S≤0,05% C 3,5-4,5% @ R$ 2.690,66)

Dados detalhados na seção 9 do PRD.

---

## Workflow de Implementação

Siga a ordem sugerida na seção 12 das specs técnicas:

1. Setup (Next + Supabase + Tailwind + shadcn)
2. Schema + seed
3. Motor de cálculo + testes unit
4. Auth + layout
5. Cadastros (F1-F4)
6. Simulador (F5)
7. Comparativo (F6)
8. Histórico (F7)
9. Calibração (F8)
10. Otimizador (F10)
11. Relatórios (F9)
12. E2E + polish
13. Deploy

**Cada etapa só avança quando:**
- Typecheck passa
- Lint passa
- Testes relevantes passam
- PR revisado

---

## Como Pedir Ajuda ao Claude Code

Para tarefas novas, dê ao Claude:

1. **Referência ao documento:** "Implementar F5 (Simulador) conforme PRD seção 4.2 e Specs seção 7.1"
2. **Input esperado:** tipos e exemplos
3. **Output esperado:** comportamento visível e dados persistidos
4. **Testes:** quais cenários devem passar

**Exemplo:**
> "Implementar a função `calcularEscoria` em `lib/calculation/slag.ts` conforme Specs seção 4.2. Precisa aceitar um `LaminaInput`, chamar `calcularCalcarioParaB2` internamente, e retornar `EscoriaResult` com todas as propriedades. Cobrir com testes unit em `tests/unit/slag.test.ts`: (1) blend 100% Trindade gera Al2O3 escória > 17%, (2) blend 50/50 Serra/Trindade com dolomita 5t fica dentro da faixa, (3) calcário calculado atinge B2 = 0,825."

---

## Proibido

- Alterar fórmulas do motor sem referência explícita a docs
- Remover testes existentes
- Comitar com `.env` ou secrets
- Fazer UPDATE destrutivo em cadastros (use versionamento)
- Ignorar RLS
- Usar `any` ou `@ts-ignore` sem justificativa comentada
- Adicionar dependências não listadas nas specs sem consulta

---

## Contato

Product Owner: Gustavo Costa
Referência técnica metalúrgica: Engenheiro metalúrgico da Siderúrgica Bandeirante (a definir)

Em caso de dúvida que os documentos não respondam, **pause e pergunte antes de inventar solução**.
