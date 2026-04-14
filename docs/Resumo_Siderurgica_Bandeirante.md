# Siderúrgica Bandeirante — Resumo de Análises

**Proprietário:** Gustavo Costa  
**Período de referência:** Abril 2026  
**Última atualização:** Abril 2026  

---

## 1. Visão Geral da Operação

A Siderúrgica Bandeirante opera um alto-forno a carvão vegetal (Forno 01) produzindo ferro-gusa aciaria. A operação atual apresenta prejuízo mensal, e esta análise investigou custos, tributos, blend de minério e parâmetros de escória para encontrar um caminho de viabilidade.

### Dados do Forno

| Parâmetro | Valor |
|---|---|
| Tipo | Alto-forno a carvão vegetal |
| Consumo de minério | 225,5 ton/dia |
| Carvão vegetal | 373 MDC/dia (1,82 MDC/carga × 205 cargas) |
| Densidade do carvão | 220 kg/m³ |
| Coque metalúrgico | 20,5 ton/dia |
| Calcário (base) | 31,57 ton/dia |
| Bauxita (base) | 3,08 ton/dia |
| Preço venda gusa | R$ 2.690,66/ton (líquido + frete R$ 43,25) |

### Especificação do Cliente (Gusa Aciaria)

| Elemento | Limite |
|---|---|
| P | máx 0,15% |
| Si | máx 1,0% |
| Mn | máx 1,0% |
| S | máx 0,05% |
| C | 3,5 – 4,5% |

---

## 2. Fornecedores de Minério

> **ATENÇÃO:** Todos os valores de análise química são ESTIMADOS. Necessário substituir por laudos laboratoriais reais.

| Fornecedor | R$/ton | Fe% | SiO₂% | Al₂O₃% | P% | Mn% | CaO% | MgO% | ICMS |
|---|---|---|---|---|---|---|---|---|---|
| Serra da Moeda | 245,00 | 62,00 | 5,50 | 2,80 | 0,055 | 0,150 | 0,10 | 0,08 | R$ 30,60/ton |
| Trindade | 390,00 | 64,00 | 3,20 | 2,30 | 0,060 | 0,120 | 0,15 | 0,05 | **ISENTO** |
| LHG Corumbá | 579,37 | 63,50 | 4,80 | 2,50 | 0,065 | 0,180 | 0,12 | 0,10 | R$ 69,52/ton |

### Fundentes

| Fundente | R$/ton | CaO% | MgO% | SiO₂% | Al₂O₃% |
|---|---|---|---|---|---|
| Calcário Sandra | 94,00 | 52,0 | 2,0 | 2,0 | 0,5 |
| Bauxita Sto Expedito | 508,00 | 0,5 | 0,3 | 6,0 | 55,0 |
| Dolomita (estimada) | 120,00 | 30,0 | 21,0 | 1,5 | 0,3 |

**Nota sobre Trindade:** Apesar do melhor Fe e menor SiO₂, o ICMS isento significa **zero crédito tributário**, o que afeta o custo líquido. Mesmo assim, é o minério mais vantajoso na otimização.

---

## 3. Rendimento Metálico

O rendimento é função do Fe no blend. Modelo linear baseado em 2 pontos de referência:

| Fe no blend | Rendimento | Blend de referência |
|---|---|---|
| 63,33% | 62,35% | Operação com 67% Corumbá |
| 62,60% | 59,26% | Operação com 40% Corumbá |

**Coeficiente:** ~4,23 pp de rendimento por %Fe no blend.

**Fórmula:**  
`rendimento = 0.6235 + (Fe_blend - 63.33) × (0.6235 - 0.5926) / (63.33 - 62.60)`

---

## 4. Análise Tributária (PIS/COFINS, ICMS, IPI)

### Débitos (sobre venda do gusa)

| Tributo | R$/ton gusa | R$/dia (140,6 t) |
|---|---|---|
| PIS/COFINS (9,25%) | 212,13 | 29.822 |
| ICMS (12%) | 312,72 | 43.957 |
| IPI (3,25%) | 84,69 | 11.907 |
| **Total débitos** | **609,54** | **85.686** |

### Créditos (sobre compra de insumos)

Os créditos são calculados sobre cada insumo individualmente. Pontos-chave:

- **Carvão vegetal:** não gera crédito de PIS/COFINS nem ICMS (verificar se correto)
- **Trindade:** ICMS isento = zero crédito de ICMS
- **Corumbá:** maior crédito por ton (R$ 47,16 PIS + R$ 69,52 ICMS)

**Saldo tributário líquido diário (operação atual):** ~R$ 54.392/dia

### Quebras (perdas de material)

| Insumo | Quebra |
|---|---|
| Minério | 10% |
| Carvão | 10% |
| Coque | 5% |
| Calcário/Fundentes | 5% |

---

## 5. Consolidação Financeira — Q1 2026

A análise do Q1 2026 mostrou que a operação é deficitária nos preços de mercado correntes. Abril apresentou resultado positivo apenas porque utilizou estoque de insumos comprados a preços mais baixos.

**Projeção a preços de mercado (maio em diante):** prejuízo de ~R$ 1,28 milhão/mês com blend atual (17/17/66).

---

## 6. Otimização de Blend — Evolução

### Fase 1: Blend simples (sem variação de rendimento)

Testou 6 cenários variando Serra/Trindade/Corumbá. Melhor: 60/0/40 com economia de R$ 655 mil/mês (antes da correção de rendimento).

### Fase 2: Blend com rendimento variável

Corrigiu o modelo para considerar que o rendimento cai com menos Corumbá (Fe mais baixo). Mesmo assim, blend 60/0/40 ainda compensa: economia de R$ 306 mil/mês. Rendimento mínimo para viabilidade: 57,04% (real é 59,26%).

### Fase 3: Blend completo com escória e contaminantes

Incorporou: cálculo de calcário para basicidade alvo, volume de escória, partição de contaminantes (P, Si, Mn, S, C), basicidade B2 e B4, Al₂O₃ na escória, relação MgO/Al₂O₃.

**Resultado sem restrição de escória:** Melhores blends são todos Serra+Trindade com zero Corumbá. #1: 100% Trindade → R$ 377 mil/mês lucro. Porém, Al₂O₃ na escória chega a 32% (inviável operacionalmente).

### Fase 4: Blend com restrições de escória obrigatórias

**Descoberta crítica:** É impossível manter Al₂O₃ na escória abaixo de 18% com NENHUMA combinação destes minérios — mesmo com zero bauxita e até 30 ton/dia de dolomita. Razão: os minérios itabiríticos têm 2,3-2,8% Al₂O₃, que gera ~25% na escória. O limite de 18% da literatura aplica-se a fornos a coque com minérios de baixa ganga alumínica.

**Solução:** Restrições progressivas mostraram a faixa viável para operação a carvão:

| Al₂O₃ máx escória | MgO/Al₂O₃ mín | Melhor blend | Fe% | Dolom t/d | Escória kg/t | Result/mês |
|---|---|---|---|---|---|---|
| 18% | 0,45 | --- | --- | --- | --- | INVIÁVEL |
| 20% | 0,40 | 90/10/0% | 62,2 | 10,0 | 244 | R$ 377.607 |
| 22% | 0,35 | 50/50/0% | 63,0 | 8,0 | 194 | R$ 386.477 |
| 24% | 0,30 | 20/80/0% | 63,6 | 7,0 | 161 | R$ 392.010 |
| **25%** | **0,25** | **10/90/0%** | **63,8** | **5,0** | **148** | **R$ 397.585** |
| 26% | 0,20 | 0/100/0% | 64,0 | 4,0 | 137 | R$ 400.921 |
| 30% | 0,10 | 0/100/0% | 64,0 | 1,0 | 133 | R$ 407.636 |

---

## 7. Blend Recomendado

**10% Serra da Moeda / 90% Trindade / 0% Corumbá + 5 ton/dia de dolomita**

### Comparativo com operação atual

| Parâmetro | Atual (15/15/70) | Otimizado (10/90/0) | Diferença |
|---|---|---|---|
| Fe blend | 63,35% | 63,80% | +0,45pp |
| SiO₂ blend | 4,67% | 3,43% | -1,24pp |
| Rendimento | 62,43% | 64,34% | +1,91pp |
| Produção | 140,8 t/d | 145,1 t/d | +4,3 t/d |
| Custo blend | R$ 500,81/ton | R$ 375,50/ton | -R$ 125,31 |
| Calcário | 17,2 t/d | 9,6 t/d | -7,6 t/d |
| Dolomita | 0,0 t/d | 5,0 t/d | +5,0 t/d |
| Escória | 188 kg/t | 148 kg/t | -40 kg/t |
| Al₂O₃ escória | 21,8% | 24,9% | +3,1pp |
| MgO/Al₂O₃ | 0,09 | 0,25 | +0,16 |
| B2 (CaO/SiO₂) | 0,850 | 0,850 | = |
| Custo/ton gusa | R$ 2.788 | R$ 2.599 | -R$ 189 |
| **Resultado/mês** | **-R$ 411.800** | **+R$ 397.585** | **+R$ 809.384** |

**Economia anual projetada: R$ 9,7 milhões**

### Qualidade do Gusa (blend otimizado)

| Elemento | Valor estimado | Limite | Status |
|---|---|---|---|
| P | 0,093% | máx 0,15% | OK (margem ampla) |
| Si | 0,48% | máx 1,0% | OK |
| Mn | 0,133% | máx 1,0% | OK |
| S | 0,025% | máx 0,05% | OK |
| C | 4,2% | 3,5–4,5% | OK |

---

## 8. Parâmetros de Escória — Referência Técnica

Para forno a carvão vegetal produzindo gusa aciaria:

| Parâmetro | Faixa ideal (literatura) | Faixa prática (carvão/itabirítico) |
|---|---|---|
| B2 (CaO/SiO₂) | 0,75 – 0,95 | 0,85 (alvo) |
| B4 (CaO+MgO)/(SiO₂+Al₂O₃) | 0,65 – 0,85 | 0,70 |
| Al₂O₃ na escória | < 18% | 22–26% (realidade com itabiríticos) |
| MgO/Al₂O₃ | 0,45 – 0,60 | 0,25+ (com dolomita) |
| Escória (kg/ton gusa) | 100–200 | 148 (blend otimizado) |

**Nota:** A referência de Al₂O₃ < 18% é para fornos a coque com minérios australianos/africanos. Para forno a carvão com minérios itabiríticos brasileiros, a faixa prática é 22-26%, compensando com temperatura de vazamento adequada (>1.500°C).

---

## 9. Arquivos Gerados

### Planilhas Excel

| Arquivo | Conteúdo |
|---|---|
| `Analise_Completa_Siderurgica_Abril2026.xlsx` | Consolidação financeira Q1 2026, projeção mensal |
| `Simulador_Siderurgica_v2.xlsx` | Simulador interativo com 6 abas, 345 fórmulas, análise química |
| `Otimizacao_Blend_Siderurgica_v4.xlsx` | Resultado da otimização com restrições de escória |

### Scripts Python

| Arquivo | Função |
|---|---|
| `tributos.py` | Apuração tributária débito/crédito detalhada |
| `blend_analise.py` | Primeira otimização de blend (sem variação de rendimento) |
| `blend_v2.py` | Otimização com rendimento variável por Fe |
| `blend_completo.py` | Otimização com escória, contaminantes e financeiro (sem restrição de Al₂O₃) |
| `blend_v3.py` / `blend_v3b.py` | Tentativa com restrição rígida (Al₂O₃ < 18%) — inviável |
| `blend_v4.py` | Otimização final com restrições progressivas de escória |
| `simulador.py` / `simulador_v2.py` | Geradores do simulador Excel |

---

## 10. Pendências e Próximos Passos

### Dados necessários

- [ ] **Análise laboratorial real** dos 3 minérios (Fe, SiO₂, Al₂O₃, P, Mn, CaO, MgO, PPC) — atualmente todos os valores são estimativas
- [ ] **Cotação real de dolomita** — estimada em R$ 120/ton, confirmar disponibilidade e preço com fornecedores da região
- [ ] **Verificar crédito tributário do carvão vegetal** — na análise atual, carvão não gera crédito PIS/COFINS nem ICMS (pode estar incorreto)
- [ ] **Dados de Fazendas/receitas adicionais** — clarificar se há receitas acessórias que afetam o resultado

### Ações recomendadas

- [ ] Validar o modelo com dados reais de análise química
- [ ] Testar blend intermediário antes da mudança radical (ex: 30/50/20 como transição)
- [ ] Cotar dolomita e validar disponibilidade logística
- [ ] Monitorar viscosidade da escória ao alterar blend (Al₂O₃ 25% exige atenção)
- [ ] Considerar renegociação de contrato com Trindade dado o aumento de volume (de 17% para 90%)
- [ ] Atualizar simulador Excel com parâmetros de escória e dolomita

### Melhorias no modelo

- [ ] Incluir cinzas do carvão e coque na composição da escória
- [ ] Modelo de rendimento com mais pontos de referência (não-linear)
- [ ] Incorporar custo logístico diferenciado por fornecedor
- [ ] Considerar sazonalidade de preços (carvão, minério)
- [ ] Modelo de partição de Si mais sofisticado (função de temperatura e basicidade)

---

## 11. Fórmulas e Modelos Utilizados

### Rendimento metálico
```
rendimento = 0.6235 + (Fe_blend - 63.33) × 0.04233
```

### Basicidade binária (B2)
```
B2 = CaO_total / SiO₂_total = 0.85 (alvo)
```

### Calcário necessário
```
calc = [B2×(SiO₂_min + SiO₂_baux) - (CaO_min + CaO_baux)] / [CaO_calc% - B2×SiO₂_calc%]
```

### Fósforo no gusa
```
P_gusa = (P_blend% × consumo_minério) / produção × 100
```
(~95% do P vai para o gusa em escória ácida)

### Silício no gusa (modelo simplificado)
```
Si_gusa = 1.5 - 1.2 × B2
```

### Manganês no gusa
```
Mn_gusa = (Mn_blend% × consumo) / produção × 100 × 0.65
```
(65% do Mn vai para o gusa)

### Tributos líquidos
```
tributos = débitos_venda - (créditos_PIS_insumos + créditos_ICMS_insumos)
```

### Resultado diário
```
resultado = faturamento - custo_operacional - tributos_líquidos
faturamento = produção × preço_gusa
custo_op = minério + carvão + coque + calcário + dolomita + bauxita + fixo + frete + quebras
```
