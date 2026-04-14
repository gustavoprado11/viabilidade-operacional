# PRD — Sistema de Análise de Lâminas

**Produto:** Sistema de Análise de Lâminas — Siderúrgica Bandeirante
**Cliente:** Siderúrgica Bandeirante (Forno 01, a carvão vegetal)
**Proprietário do produto:** Gustavo Costa
**Versão:** 1.0
**Data:** Abril 2026

---

## 1. Sumário Executivo

Sistema web para **simular, comparar e registrar lâminas** (configurações de carga) do alto-forno a carvão vegetal da Siderúrgica Bandeirante, permitindo decisões de blend, fundentes e operação baseadas em análise técnica (metalurgia) e financeira (custo, tributos, margem) em tempo real.

**Problema que resolve:** hoje as decisões de blend e carregamento são tomadas com base em intuição e planilhas estáticas. Não há visibilidade do impacto financeiro e técnico antes de carregar o forno, nem calibração contínua do modelo com corridas reais.

**Ganho esperado:** identificação de blends mais rentáveis (estudo anterior mostrou potencial de R$ 9,7 milhões/ano), redução de risco operacional (violação de specs ou escória inviável) e base de dados calibrada para decisões futuras.

---

## 2. Contexto de Negócio

### 2.1. A operação

- 1 alto-forno a carvão vegetal (Forno 01)
- Produção alvo: ~140 ton gusa/dia (~8,8 ton por corrida de 1h30; 16 corridas/dia)
- Cliente principal: gusa aciaria (especificação restrita de P, Si, Mn, S, C)
- Principais insumos: 3 minérios (Serra da Moeda, Trindade, LHG Corumbá), carvão vegetal, coque, calcário, bauxita, dolomita (novo)

### 2.2. Situação atual

Operação historicamente deficitária aos preços de mercado atuais (projeção ~R$ 1,28M/mês de prejuízo com blend 17/17/66). Análises prévias identificaram oportunidade de blend com maior Trindade e menor Corumbá, mas exigem simulação caso-a-caso considerando restrições de escória (Al₂O₃ ≤ 17%) validadas pelo engenheiro metalúrgico.

### 2.3. Métricas de sucesso do produto

| Métrica | Meta |
|---|---|
| Tempo para simular 1 lâmina | < 30 segundos |
| Tempo para comparar 4 lâminas | < 1 minuto |
| Corridas reais registradas nos 3 primeiros meses | ≥ 300 |
| Desvio médio do modelo vs realidade (após calibração) | < 5% no custo/ton e no rendimento |
| Decisões de blend suportadas pelo sistema/mês | ≥ 20 |

---

## 3. Usuários e Personas

### Persona única — v1

**Gustavo (Dono / Analista / Tomador de decisão)**
- Acompanha a operação remotamente e precisa comparar cenários rapidamente
- Tem conhecimento financeiro e conceitual de metalurgia, mas depende da engenharia para validação técnica profunda
- Usa o sistema para: simular blends, comparar cenários, registrar corridas reais, consultar relatórios e histórico

*Observação:* O engenheiro metalúrgico, operadores e controller podem ser adicionados em v2 como personas secundárias. Na v1, Gustavo atua como operador único; a engenharia contribui com parâmetros revisados que ele registra manualmente.

---

## 4. Funcionalidades (v1 — Sistema completo)

### 4.1. Módulos

| Módulo | Descrição |
|---|---|
| **Autenticação** | Login de usuário único (Supabase Auth) |
| **Cadastros** | Fornecedores, insumos, fundentes, clientes, tributos, parâmetros técnicos |
| **Simulador de Lâmina** | Criação e cálculo de uma lâmina teórica ou real |
| **Comparativo** | Visualização lado a lado de até 4 lâminas |
| **Histórico de Corridas** | Registro de corridas reais + análise química observada |
| **Calibração** | Ajuste de coeficientes do modelo baseado em histórico |
| **Relatórios** | Dashboards agregados por período (diário, semanal, mensal) |
| **Otimizador** | Busca automática de blend ótimo dado restrições |

### 4.2. Features detalhadas

#### F1 — Cadastro de Minérios
- CRUD de fornecedores de minério
- Campos: nome, preço R$/ton, análise química (Fe, SiO₂, Al₂O₃, P, Mn, PPC, CaO, MgO), PIS/COFINS crédito R$/ton, ICMS crédito R$/ton
- Versionamento: toda alteração cria nova versão histórica (não sobrescreve)

#### F2 — Cadastro de Fundentes e Outros Insumos
- CRUD de calcário, bauxita, dolomita, coque, carvão vegetal
- Campos análogos ao F1, mais específicos: densidade (carvão), % C fixo (coque)

#### F3 — Cadastro de Clientes
- Nome, CNPJ, especificação química do gusa (P_max, Si_max, Mn_max, S_max, C_min, C_max)
- Preço do gusa negociado (R$/ton líquido)

#### F4 — Cadastro de Parâmetros Técnicos do Forno
- Corridas por dia, duração por corrida, consumo base de minério
- B2 alvo (faixa), Al₂O₃ escória máx, MgO/Al₂O₃ mín
- Coeficientes do modelo (rendimento vs Fe, partição P/Si/Mn/S/C)
- Editável apenas por usuário com permissão especial (admin)

#### F5 — Simulador de Lâmina (core)
- Input: blend (%), carvão (MDC + densidade), coque (kg), fundentes (kg cada), quebras (%), estabilidade (estável/atenção/instável), sucata gerada (kg), cliente destino
- Cálculo automático de: composição química do blend, rendimento, produção de gusa, composição da escória, contaminantes no gusa, custos, tributos, resultado financeiro
- Validação automática contra spec do cliente e restrições de escória
- Classificação: ✅ Viável / ⚠️ Viável com alerta / ❌ Inviável
- Salvar simulação (draft ou corrida real)

#### F6 — Comparativo de Lâminas
- Seleção de até 4 lâminas (simuladas ou reais) para comparação lado a lado
- Tabela comparativa com destaque de diferenças
- Gráficos: margem/ton, rendimento, Al₂O₃ escória, consumo específico

#### F7 — Registro de Corrida Real
- Após a corrida, usuário registra: blend real, quantidades reais de cada insumo, sucata gerada medida, análise química do gusa (se disponível), análise da escória (se disponível)
- Sistema calcula desvio previsto × real
- Armazena para calibração

#### F8 — Calibração do Modelo
- Visualização dos desvios histórico (previsto vs real)
- Recomendação de ajuste de coeficientes (rendimento, partição, B2)
- Aplicação manual (admin) — criando nova versão dos parâmetros

#### F9 — Dashboard e Relatórios
- Visão agregada: corridas do dia, margem média, desvio médio
- Filtros por período, cliente, blend
- Exportação: CSV, Excel, PDF

#### F10 — Otimizador de Blend
- Usuário informa restrições (faixa Fe desejada, Al₂O₃ escória máx, custo máx)
- Sistema testa todas as combinações (incremento 5%) e retorna top 10
- Respeita todas as restrições técnicas e specs do cliente

---

## 5. Fluxos de Uso Principais

### Fluxo 1: Simular uma lâmina antes de carregar o forno
1. Gustavo abre "Nova Simulação"
2. Seleciona cliente destino → sistema carrega spec
3. Preenche blend (%), carvão (MDC e densidade), coque, fundentes, quebras, estabilidade
4. Clica "Calcular"
5. Sistema exibe resultado em < 2 segundos com classificação e detalhes
6. Gustavo pode salvar, editar ou duplicar a simulação

### Fluxo 2: Comparar 4 cenários de blend
1. Gustavo cria 4 simulações com diferentes blends
2. Abre "Comparativo" e seleciona as 4
3. Visualiza tabela lado a lado + gráficos
4. Identifica melhor cenário e anota decisão

### Fluxo 3: Registrar corrida real
1. Após corrida, Gustavo abre "Nova Corrida Real"
2. Preenche dados reais: blend carregado, quantidades, sucata, análise química
3. Sistema compara com a simulação (se houver) e calcula desvios
4. Registro entra no histórico

### Fluxo 4: Otimizar blend mensal
1. Gustavo abre "Otimizador"
2. Define restrições (ex: Al₂O₃ escória ≤ 17%, cliente = gusa aciaria)
3. Sistema retorna top 10 blends com resultado financeiro ranqueado
4. Gustavo salva top 3 como simulações para análise detalhada

---

## 6. Requisitos Não-Funcionais

| Requisito | Meta |
|---|---|
| Performance (simulação de 1 lâmina) | < 2 segundos |
| Performance (otimizador de blend completo) | < 30 segundos |
| Disponibilidade | ≥ 99% (SLA Supabase padrão) |
| Acesso | Web (desktop + mobile responsive) |
| Idioma | Português (Brasil) |
| Moeda | Real brasileiro (R$) |
| Backup | Automático diário (Supabase) |
| Segurança | Auth obrigatório, RLS no Supabase |

---

## 7. Escopo v1 — O que ENTRA e o que FICA DE FORA

### ✅ Entra na v1

- Todos os 10 módulos acima (F1 a F10)
- Banco de dados completo com versionamento de cadastros
- Interface web responsiva
- Autenticação de usuário único
- Exportação CSV/Excel/PDF
- Histórico ilimitado de corridas

### ❌ Fica fora da v1 (futuras versões)

- Multi-usuário com roles diferenciados (operador, controller, engenheiro)
- Integração com ERP/sistema de produção
- Notificações automáticas (email/WhatsApp)
- API externa para terceiros
- App mobile nativo
- Machine learning para calibração automática
- Módulo de controle de estoque de insumos

---

## 8. Premissas Técnicas

Todas as premissas abaixo são baseadas no documento **Sistema_Analise_Laminas_Racional.md v1.1** (validado com engenharia metalúrgica em abril/2026):

| Premissa | Valor |
|---|---|
| Corridas por dia | 16 (ajustável no cadastro) |
| Duração da corrida | 1h30 (ajustável) |
| B2 alvo | 0,80 – 0,85 |
| Al₂O₃ escória alvo | 12% – 16% (máx 17%) |
| MgO/Al₂O₃ | Dolomita ajuda; relação mín a calibrar |
| Rendimento | Função da análise química × fator de estabilidade |
| Quebras | Variáveis por corrida |
| Sucata | Input variável; gera receita |
| Temperatura da escória | Não medida |

---

## 9. Dados de Referência (bootstrap)

O sistema deve vir pré-cadastrado com os seguintes dados (v0):

### Minérios

| Fornecedor | R$/ton | Fe% | SiO₂% | Al₂O₃% | P% | Mn% | CaO% | MgO% | PIS R$/t | ICMS R$/t |
|---|---|---|---|---|---|---|---|---|---|---|
| Serra da Moeda | 245,00 | 62,00 | 5,50 | 2,80 | 0,055 | 0,150 | 0,10 | 0,08 | 19,83 | 30,60 |
| Trindade | 390,00 | 64,00 | 3,20 | 2,30 | 0,060 | 0,120 | 0,15 | 0,05 | 36,08 | 0,00 |
| LHG Corumbá | 579,37 | 63,50 | 4,80 | 2,50 | 0,065 | 0,180 | 0,12 | 0,10 | 47,16 | 69,52 |

### Fundentes e outros

| Insumo | R$/ton | CaO% | MgO% | SiO₂% | Al₂O₃% |
|---|---|---|---|---|---|
| Calcário Sandra | 94,00 | 52,0 | 2,0 | 2,0 | 0,5 |
| Bauxita Sto Expedito | 508,00 | 0,5 | 0,3 | 6,0 | 55,0 |
| Dolomita | 120,00 | 30,0 | 21,0 | 1,5 | 0,3 |
| Coque | 1.408,00 | — | — | — | — |
| Carvão vegetal | R$ 360/MDC | densidade 220 kg/m³ | — | — | — |

### Cliente referência

Gusa Aciaria: P≤0,15% / Si≤1,0% / Mn≤1,0% / S≤0,05% / C 3,5–4,5% / preço R$ 2.690,66/ton

### Tributos sobre gusa

PIS/COFINS 9,25% (R$ 212,13/ton) / ICMS RJ 12% (R$ 312,72/ton) / IPI 3,25% (R$ 84,69/ton)

---

## 10. Critérios de Aceitação v1

| Critério | Como validar |
|---|---|
| Simulador calcula lâmina completa em < 2s | Teste automatizado |
| Resultado da simulação bate com blend_v4.py em ±1% | Teste de regressão |
| Todas as specs do cliente são validadas corretamente | Teste unitário |
| Al₂O₃ escória > 17% marca lâmina como inviável | Teste unitário |
| Histórico persiste após refresh da página | Teste E2E |
| Otimizador retorna top 10 em < 30s | Teste de performance |
| Exportação Excel tem todas as colunas legíveis | Revisão manual |
| Cadastros versionam sem perder dados históricos | Teste E2E |

---

## 11. Riscos e Mitigações

| Risco | Impacto | Mitigação |
|---|---|---|
| Análise química dos minérios está estimada | Alto | Criar flag "validado laboratorialmente" e destacar no UI |
| Modelo de rendimento ainda não calibrado com realidade | Médio | Módulo de calibração (F8) permite ajuste contínuo |
| Engenheiro não revisou todos os coeficientes | Médio | Parâmetros são editáveis em F4 |
| Operação real pode divergir do modelo | Alto | F7 (histórico) + F8 (calibração) reduzem desvio ao longo do tempo |
| Preço da dolomita é estimado | Baixo | Editável no cadastro, fácil ajustar |

---

## 12. Roadmap Pós-v1 (futuro)

### v1.1
- Multi-usuário com roles (dono, engenheiro, operador, controller)
- Notificações por email quando lâmina registrada fica fora de spec
- Histórico versionado de parâmetros do modelo

### v2.0
- Integração com ERP (entrada de preços e consumos reais via API)
- Módulo de controle de estoque
- Preditor de rendimento baseado em ML
- Alertas em tempo real durante corrida

### v3.0
- Multi-forno (caso haja expansão)
- App mobile para registro de corrida pelo operador no chão de fábrica
- Dashboard público para acionistas/investidores

---

## 13. Entregáveis

1. Código-fonte no repositório Git
2. Documentação técnica (inline + README)
3. Documentação de usuário (manual básico)
4. Ambiente de produção hospedado (Vercel + Supabase)
5. Dados de bootstrap carregados
6. Plano de testes e suíte de testes executável

---

## 14. Documentos Relacionados

- `Resumo_Siderurgica_Bandeirante.md` — contexto da siderúrgica
- `Sistema_Analise_Laminas_Racional.md v1.1` — racional técnico validado com engenharia
- `Specs_Tecnicas_Sistema_Laminas.md` — detalhamento técnico para implementação
- `CLAUDE.md` — instruções de contexto para Claude Code
