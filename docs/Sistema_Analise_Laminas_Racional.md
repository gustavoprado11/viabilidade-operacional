# Sistema de Análise de Lâminas — Racional e Proposta

**Siderúrgica Bandeirante — Forno 01 (Carvão Vegetal)**
**Documento para revisão técnica com Engenharia Metalúrgica**
**Versão:** 1.1 — Abril 2026 (atualizada com feedback da engenharia)

### Mudanças na v1.1

- Sucata gerada na corrida incorporada como produto da lâmina
- B2 alvo corrigido para faixa **0,80–0,85** (antes 0,85 fixo)
- Al₂O₃ na escória alvo **12–16%**, tolerância operacional até **17%** (antes 25%)
- Dolomita confirmada como fonte de MgO eficaz
- Temperatura da escória: **não é medida** — removida do modelo
- Rendimento metálico: função da análise E da estabilidade operacional
- Quebras migraram para **inputs variáveis** (antes eram fixas)

---

## 1. Objetivo

Criar um sistema que permita **comparar diferentes lâminas** (configurações de carga do forno) para avaliar qual combinação oferece a melhor viabilidade técnica e financeira por corrida.

O sistema deve responder perguntas como:

- Se eu mudar a proporção Serra/Trindade/Corumbá no carregamento, qual o impacto no resultado desta corrida?
- Com o carvão que recebi este mês (densidade média X), qual lâmina é mais rentável?
- Esta lâmina atende a especificação do cliente com margem de segurança suficiente?
- Qual é o crédito tributário líquido que esta lâmina vai gerar?

---

## 2. Definição de "Lâmina"

**Lâmina** é o conjunto completo de materiais carregados no forno associado a **uma corrida de 1h30**, incluindo tudo que entra e tudo que sai.

### Entradas da lâmina

| Componente | Descrição |
|---|---|
| Minério (blend) | % Serra da Moeda + % Trindade + % LHG Corumbá |
| Carvão vegetal | Quantidade (MDC) + **densidade média do lote** (kg/m³) |
| Coque metalúrgico | Quantidade (kg/corrida) |
| Fundentes | Calcário + Bauxita + Dolomita (kg/corrida) |
| Quebras | % por insumo (variável por corrida) |
| Especificação química alvo | Limites de P, Si, Mn, S, C do cliente destino |

### Saídas da lâmina

| Produto | Descrição |
|---|---|
| **Gusa líquido vazado** | Produto principal — vai ao cliente |
| **Sucata gerada** | Material metálico aderido a canais, cadinho, panelas — recuperado e reprocessado ou vendido como sucata |
| **Escória** | Subproduto — pode ter destino comercial (cimenteiras, etc.) ou passivo |
| **Gases/particulados** | Não entra no balanço financeiro, mas consome carbono |

A **sucata gerada por corrida** é parte importante do balanço metalúrgico: o rendimento "aparente" (gusa vazado ÷ minério) é menor que o rendimento metalúrgico real, pois parte do Fe vira sucata e não gusa. A sucata tem valor (reprocessamento ou venda) e precisa entrar no cálculo financeiro.

### Base de cálculo (referência)

Para uma corrida de 1h30, com operação atual:

| Parâmetro | Valor de referência |
|---|---|
| Duração da corrida | 1h30 (1,5 horas) |
| Corridas por dia | 16 corridas/dia |
| Minério por corrida | ~14,1 ton (225,5 ÷ 16) |
| Carvão por corrida | ~23,3 MDC (373 ÷ 16) |
| Coque por corrida | ~1,28 ton (20,5 ÷ 16) |
| Gusa produzido por corrida | ~8,8 ton (a 62,4% rendimento) |
| Sucata gerada por corrida | A definir com histórico |

*Esses valores precisam ser validados pela engenharia. A divisão por 16 é apenas uma distribuição uniforme — na prática, corridas podem variar.*

---

## 3. Como as Lâminas Serão Comparadas

O sistema vai produzir, para cada lâmina simulada, o seguinte conjunto de resultados:

### 3.1. Balanço Metalúrgico

| Item | Como é calculado |
|---|---|
| Fe no blend | Média ponderada dos minérios |
| SiO₂, Al₂O₃, P, Mn, CaO, MgO no blend | Média ponderada |
| Rendimento metalúrgico total | Função da análise E da estabilidade operacional |
| Produção de gusa vazado | Rendimento total − sucata gerada |
| Sucata gerada por corrida | Histórico operacional (a levantar com engenharia) |
| Basicidade B2 (CaO/SiO₂) | **Faixa 0,80–0,85** (ajustado via calcário) |
| Basicidade B4 | (CaO+MgO)/(SiO₂+Al₂O₃) |
| Volume de escória | kg escória / ton gusa |
| Al₂O₃ na escória | **Alvo 12–16% / máx 17%** |
| Relação MgO/Al₂O₃ | Indicador de fluidez da escória |

> **Importante:** O rendimento não depende só do Fe. Depende **também da estabilidade operacional** — um forno com marcha irregular, paradas, variação de temperatura ou alimentação inconsistente perde rendimento mesmo com blend rico. O modelo precisará ser recalibrado com histórico real, e o sistema deve permitir registro da "condição da corrida" (estável/instável) para análise posterior.

### 3.2. Qualidade do Gusa

Estimativa dos contaminantes no gusa gerado:

| Elemento | Modelo de partição proposto | Spec cliente |
|---|---|---|
| P | ~95% do P do blend vai para o gusa (escória ácida) | máx 0,15% |
| Si | Função inversa da basicidade B2 | máx 1,0% |
| Mn | ~65% do Mn do blend vai para o gusa | máx 1,0% |
| S | ~0,025% (praticamente constante com carvão vegetal) | máx 0,05% |
| C | ~4,2% (auto-regulado) | 3,5–4,5% |

### 3.3. Consumo Específico (Coke Rate)

| Indicador | Fórmula |
|---|---|
| MDC/ton gusa | MDC na corrida ÷ gusa produzido |
| kg carvão/ton gusa | MDC × densidade × 1000 ÷ gusa |
| kg coque/ton gusa | Coque da corrida ÷ gusa produzido |
| Combustível equivalente | Carvão + coque em base de carbono fixo |

A **densidade do carvão** entra aqui: com densidade maior, mais kg de carbono por MDC, mais energia disponível, possivelmente maior rendimento ou menor consumo.

### 3.4. Balanço Financeiro (por corrida e por ton)

| Item | Cálculo |
|---|---|
| Custo direto de materiais | Σ (quantidade × preço) por insumo |
| Custo de quebras | Aplicação das **taxas variáveis** informadas na lâmina |
| Custo fixo rateado | Custo fixo diário ÷ 16 corridas |
| Frete sobre gusa | Gusa vazado × R$ 50,75/ton |
| **Receita gusa** | Gusa vazado × preço de venda |
| **Receita sucata** | Sucata gerada × valor de sucata (R$/ton) |
| **Débitos tributários** | Gusa produzido × (PIS 212,13 + ICMS 312,72 + IPI 84,69) |
| **Créditos tributários** | Σ (insumos × crédito PIS + crédito ICMS por insumo) |
| Tributos líquidos | Débitos − Créditos |
| Custo total | Materiais + quebras + fixo + frete + tributos líquidos |
| **Custo/ton gusa vazado** | Custo total ÷ gusa vazado |
| Margem/ton | Preço venda − custo/ton |
| **Resultado da corrida** | (Receita gusa + Receita sucata) − Custo total |

> **Nota sobre sucata:** o tratamento financeiro da sucata depende do destino. Se for reprocessada internamente (recarga no forno), entra como crédito de matéria-prima na próxima corrida. Se for vendida, entra como receita direta. O sistema precisa permitir os dois cenários.

### 3.5. Validação de Viabilidade

Cada lâmina é classificada automaticamente:

- ✅ **Viável:** atende todas specs do cliente, escória operacional, margem positiva
- ⚠️ **Viável com alerta:** atende specs mas tem algum parâmetro no limite (ex: P próximo de 0,15%, escória com Al₂O₃ > 26%)
- ❌ **Inviável:** não atende spec do cliente OU escória impraticável OU margem muito negativa

---

## 4. Pontos que Precisam da Validação do Engenheiro Metalúrgico

Esta é a parte mais importante deste documento. O sistema depende de premissas técnicas que precisam ser validadas ou corrigidas pela engenharia:

### 4.1. Modelo de Rendimento Metálico

**Premissa inicial (a ser refinada):** Rendimento era modelado como função linear só do Fe no blend, calibrado com 2 pontos:

| Fe no blend | Rendimento observado |
|---|---|
| 63,33% | 62,35% |
| 62,60% | 59,26% |

**Ajuste confirmado pela engenharia:** O rendimento depende da **análise química do blend** E da **estabilidade operacional** — blend rico sem estabilidade perde rendimento. Portanto, o modelo precisa incorporar um fator de estabilidade.

**Proposta de modelo revisado:**

```
rendimento = f(análise_química) × fator_estabilidade
```

Onde:
- `f(análise_química)` = rendimento teórico baseado em Fe, PPC e ganga do blend
- `fator_estabilidade` ∈ [0,85 ; 1,00] = coeficiente operacional que reflete marcha

**Perguntas pendentes para a engenharia:**

- Qual a calibração histórica de fator de estabilidade por tipo de marcha?
- Podemos usar indicadores proxy (pressão, temperatura topo, variação de vazão) para estimar estabilidade?
- Como separar, no histórico, corridas estáveis vs instáveis para calibrar o modelo?
- Existem mais pontos de referência (além dos 2 atuais) de rendimento × blend?

### 4.2. Parâmetros de Escória (atualizados pela engenharia)

**Premissas confirmadas:**

| Parâmetro | Valor | Observação |
|---|---|---|
| B2 alvo | **0,80 – 0,85** | Faixa operacional confirmada |
| B4 faixa | 0,65–0,85 | Literatura — a confirmar na prática |
| Al₂O₃ na escória — **alvo** | **12% – 16%** | Faixa operacional ideal |
| Al₂O₃ na escória — **tolerância** | **até 17%** | Limite superior que o forno aguenta |
| MgO/Al₂O₃ mínimo | A definir (dolomita ajuda) | Dolomita confirmada como recurso |
| Temperatura da escória | **Não medida hoje** | Parâmetro removido do modelo |

> ⚠️ **Consequência crítica para a otimização:** a análise anterior que apontava 100% Trindade como ótimo (Al₂O₃ escória 24–25%) **não é viável operacionalmente**. O limite real é 17%, o que vai exigir otimização **nova** com esta restrição rígida. Dado que os minérios têm 2,3–2,8% de Al₂O₃ e a escória prática fica em torno de 22–25%, o desafio será **aumentar o volume de escória** (para diluir Al₂O₃) ou **encontrar minério com menor Al₂O₃**.

**Implicações para o sistema:**

- Toda lâmina simulada precisa calcular Al₂O₃ na escória
- Lâminas com Al₂O₃ escória > 17% são classificadas automaticamente como ❌ inviáveis
- A dolomita entra como alavanca operacional para balancear fluidez (via MgO/Al₂O₃), não para reduzir Al₂O₃

**Pontos ainda a validar:**

- Qual a Al₂O₃ real medida na escória nas últimas corridas? (para calibrar o modelo de previsão)
- Qual a relação MgO/Al₂O₃ operacional com a dolomita atual?
- Existe histórico de corridas em que o forno "travou" por escória densa?

### 4.3. Partição de Contaminantes

**Premissas atuais:**

| Elemento | Modelo de partição (gusa) |
|---|---|
| P | 95% vai para gusa (escória ácida) |
| Si | `Si_gusa = 1,5 − 1,2 × B2` |
| Mn | 65% vai para gusa |
| S | Constante em 0,025% |
| C | Constante em 4,2% |

**Perguntas para a engenharia:**

- As partições batem com a análise química real do gusa produzido?
- O modelo de Si em função de B2 reflete a realidade? Em que faixa falha?
- O enxofre realmente fica tão constante com carvão vegetal?
- Qual % de Mn fica na escória x vai para o gusa na prática aqui?
- Temos histórico de análise química do gusa para calibrar esses coeficientes?

### 4.4. Consumo Específico e Impacto do Carvão

**Premissas atuais:**

- Densidade do carvão: 220 kg/m³ (média)
- 1,82 MDC por carga
- Consumo diário: 373 MDC/dia
- Coque: 20,5 ton/dia

**Perguntas para a engenharia:**

- A densidade do carvão varia significativamente entre lotes? Qual a faixa real?
- Como a densidade afeta o rendimento? Existe correlação documentada?
- O coke rate (kg coque/ton gusa) é estável ou varia com o blend?
- Há sazonalidade do carvão (umidade, origem) que afete a operação?
- Devemos incluir análise imediata e elementar do carvão (C fixo, cinzas, voláteis) no modelo?

### 4.5. Quebras (agora entrada variável por corrida)

**Mudança importante:** as quebras deixam de ser coeficientes fixos do modelo e passam a ser **inputs variáveis por lâmina**. Cada corrida terá suas próprias quebras informadas.

**Valores históricos de referência (apenas como default inicial):**

| Material | Quebra histórica |
|---|---|
| Minério | 10% |
| Carvão | 10% |
| Coque | 5% |
| Fundentes | 5% |

**Justificativa:** As quebras variam por fornecedor, por lote, por granulometria e por manuseio. Fixá-las no modelo mascara diferenças reais entre lâminas. Com quebras variáveis, o sistema passa a refletir a realidade de cada corrida e permite analisar o impacto financeiro de lotes com quebra atípica.

**Pendências:**

- Definir mecanismo de medição sistemática das quebras por lote
- Criar campo de registro na aba HISTÓRICO para consolidar quebras reais observadas
- A partir de histórico acumulado, derivar faixa esperada por fornecedor

---

## 5. Arquitetura do Sistema Proposto

### 5.1. Entradas (inputs por lâmina)

**Cadastros (fixos, atualizáveis):**

- Fornecedores de minério (preço, Fe, SiO₂, Al₂O₃, P, Mn, CaO, MgO, PPC, tributos)
- Fundentes (calcário, bauxita, dolomita — mesmas propriedades)
- Carvão vegetal (preço/MDC, densidade média por lote)
- Coque (preço/ton, qualidade)
- Specs por cliente (limites de contaminantes)
- Parâmetros de tributos (alíquotas, regras de crédito)

**Inputs variáveis (definidos para cada simulação/corrida):**

- % de cada minério no blend
- MDC de carvão na corrida
- Densidade do carvão daquele lote (kg/m³)
- Coque na corrida (kg)
- Fundentes na corrida (calcário, bauxita, dolomita — kg)
- **Quebras observadas por insumo** (%)
- **Estabilidade operacional** (estável / atenção / instável)
- **Sucata gerada** (kg) — medida na corrida
- Cliente destino (para definir spec)
- Preço de venda do gusa (pode variar por contrato)
- Preço/valor da sucata (R$/ton)

### 5.2. Processamento

1. Calcula composição química do blend de minério
2. Calcula rendimento metalúrgico (análise química × fator estabilidade)
3. Calcula produção de gusa vazado (descontando sucata gerada)
4. Calcula dosagem de fundentes necessária para atingir B2 na faixa 0,80–0,85
5. Calcula composição da escória resultante
6. **Valida Al₂O₃ escória contra limite de 17%**
7. Estima contaminantes no gusa (partição)
8. Valida contra spec do cliente
9. Calcula todos os custos (diretos, quebras variáveis, fixos, tributos)
10. Adiciona receita de sucata ao resultado
11. Calcula resultado financeiro por corrida e por ton
12. Classifica a viabilidade (✅/⚠️/❌)

### 5.3. Saídas

Para cada lâmina, o sistema entrega:

**Relatório técnico:**

- Composição química do blend e da escória
- Volume de escória, basicidades, Al₂O₃ escória
- Qualidade prevista do gusa vs spec
- Consumo específico de carvão e coque

**Relatório financeiro:**

- Custo direto detalhado por insumo
- Tributos (débitos, créditos, saldo)
- Custo/ton gusa
- Resultado da corrida e resultado extrapolado por dia/mês

**Relatório comparativo:**

- Ranking de lâminas simuladas lado a lado
- Gráficos de sensibilidade (ex: margem vs % Trindade no blend)
- Classificação de viabilidade de cada uma

### 5.4. Interface

Proposta: planilha Excel interativa com as seguintes abas:

| Aba | Função |
|---|---|
| CADASTROS | Fornecedores, insumos, clientes, parâmetros |
| SIMULADOR LÂMINA | Entrada dos dados de uma lâmina e resultado detalhado |
| COMPARATIVO | Lado a lado de até 4 lâminas simuladas |
| HISTÓRICO | Registro de lâminas reais produzidas (para calibração futura) |
| PARÂMETROS TÉCNICOS | Coeficientes do modelo (editáveis pela engenharia) |

---

## 6. Premissas de Tributação (Débito/Crédito por Lâmina)

Cada lâmina terá seu próprio cálculo tributário.

### Débitos (sobre gusa produzido na corrida)

| Tributo | Alíquota | R$/ton gusa |
|---|---|---|
| PIS/COFINS | 9,25% | 212,13 |
| ICMS (RJ) | 12% | 312,72 |
| IPI | 3,25% | 84,69 |
| **Total** | — | **609,54** |

### Créditos (sobre insumos da corrida)

Cada insumo tem crédito próprio por tonelada:

| Insumo | PIS/COFINS | ICMS | Observação |
|---|---|---|---|
| Serra da Moeda | R$ 19,83/ton | R$ 30,60/ton | Tributação normal |
| Trindade | R$ 36,08/ton | R$ 0,00 | **ICMS isento** |
| LHG Corumbá | R$ 47,16/ton | R$ 69,52/ton | Maior crédito |
| Coque | R$ 143,52/ton | R$ 340,58/ton | Crédito alto |
| Calcário | R$ 8,70/ton | R$ 0,00 | ICMS isento |
| Bauxita | R$ 41,35/ton | R$ 60,96/ton | — |
| Dolomita | A confirmar | A confirmar | Novo insumo |
| Carvão vegetal | **Atualmente R$ 0** | **Atualmente R$ 0** | ⚠️ Verificar se correto |

### Saldo tributário da lâmina

`Tributos líquidos = Débitos (gusa produzido) − Σ Créditos (insumos consumidos)`

**Ponto importante:** lâminas com alto Corumbá geram mais crédito tributário, mas isso não necessariamente compensa o preço maior do minério. O sistema precisa mostrar esse trade-off claramente.

---

## 7. O que o Sistema NÃO Faz (limitações)

Para alinhar expectativas:

1. **Não otimiza automaticamente o blend ótimo** — o usuário simula e compara. (A otimização automática foi feita separadamente no estudo de blend.)
2. **Não modela dinâmica térmica do forno** — não prevê temperatura, pressão, estabilidade da marcha.
3. **Não substitui análise química real** — estima contaminantes por modelos simplificados. Valores reais dependem de amostragem.
4. **Não considera variação intra-corrida** — trata cada corrida como unidade homogênea.
5. **Não modela efeitos de longo prazo** — como impacto do blend na vida útil do refratário.
6. **Depende de premissas calibradas** — qualidade das previsões é proporcional à qualidade dos coeficientes do modelo (por isso o papel do engenheiro).

---

## 8. Próximos Passos Propostos

### Para o Engenheiro Metalúrgico

1. Revisar e validar este documento, especialmente seção 4 (pontos de validação)
2. Fornecer, se disponível, histórico de corridas com:
   - Blend utilizado (% de cada minério)
   - Rendimento obtido
   - Análise química do gusa
   - Composição real da escória
3. Confirmar ou corrigir faixas operacionais aceitáveis
4. Opinar sobre a divisão de 16 corridas/dia uniforme ou se há padrão diferente

### Para Desenvolvimento

1. Implementar cadastros base no Excel
2. Implementar motor de cálculo da lâmina (uma aba)
3. Implementar comparativo de até 4 lâminas
4. Criar aba de parâmetros técnicos editáveis pela engenharia
5. Testar com 3–5 lâminas reais recentes para validar contra resultados observados

### Para Gestão

1. Definir quem alimenta o sistema (operador? controller? engenheiro?)
2. Definir frequência de atualização dos cadastros (preços, tributos, specs)
3. Definir papéis de revisão: quem aprova mudanças nos coeficientes do modelo

---

## 9. Perguntas em Aberto para Decisão

Antes de começar a construir, precisamos decidir:

1. **Granularidade do histórico:** cada corrida individual será registrada, ou apenas bateladas diárias?
2. **Controle de acesso:** quem pode editar parâmetros do modelo?
3. **Integração com outros sistemas:** o sistema é standalone (Excel) ou integra com ERP/produção?
4. **Alarmes operacionais:** o sistema deve alertar se uma lâmina prevista dá prejuízo antes de ser produzida?
5. **Base comparativa para ranking:** comparar contra blend atual, contra melhor histórico, ou contra ótimo teórico?

---

## 10. Resumo e Ajustes da Versão 1.1

> **Em uma frase:** Queremos uma calculadora de corrida — entra o que vamos carregar (minério + carvão + coque + fundentes + quebras + estabilidade) e sai o que sai do forno (gusa vazado, sucata, escória, custo, tributos, margem), com classificação automática de viabilidade técnica e financeira.

### Ajustes incorporados nesta versão

| Ponto | Antes (v1.0) | Depois (v1.1) |
|---|---|---|
| Sucata gerada | Não considerada | Entrada variável + receita no resultado |
| Rendimento | Função só do Fe | Análise química × fator de estabilidade |
| B2 alvo | 0,85 fixo | Faixa 0,80–0,85 |
| Al₂O₃ escória | Até 25% (literatura permissiva) | Alvo 12–16% / máx 17% (realidade do forno) |
| Dolomita | A validar | Confirmada como recurso útil |
| Temperatura escória | Parâmetro do modelo | Removida (não é medida) |
| Quebras | Coeficientes fixos | Inputs variáveis por corrida |

### Implicação importante

A restrição de Al₂O₃ escória ≤ 17% **invalida o blend de 100% Trindade** que havia sido apontado como ótimo no estudo anterior (gerava escória com ~24,9% de Al₂O₃). Será necessário **rodar nova otimização** com esta restrição rígida antes de tomar decisões de blend operacional.

### Próximo passo sugerido

Com este documento aprovado, o próximo entregável seria:

1. Refazer a otimização de blend com **Al₂O₃ escória ≤ 17%** rígido
2. Implementar o simulador Excel de lâminas conforme arquitetura da seção 5
3. Capturar 3–5 corridas reais recentes para calibrar os coeficientes antes de uso produtivo
