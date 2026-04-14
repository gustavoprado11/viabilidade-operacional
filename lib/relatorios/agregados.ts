/**
 * Agregados de relatório — funções puras.
 * Recebem lista de simulacoes (snapshot + tipo + classificacao) e calculam
 * KPIs sem I/O. Testável unit sem mocks.
 */

import type { LaminaResultado } from '@/lib/calculation/types';

export type SimulacaoAgregado = Readonly<{
  id: string;
  nome: string;
  tipo: 'simulacao' | 'corrida_real';
  classificacao: 'viavel' | 'alerta' | 'inviavel';
  created_at: string;
  corrida_timestamp: string | null;
  cliente_id: string | null;
  resultado: LaminaResultado;
  analise_gusa_real: { p?: number; si?: number; mn?: number; s?: number; c?: number } | null;
}>;

export type KPIs = Readonly<{
  totalCorridas: number;
  porClassificacao: Readonly<{ viavel: number; alerta: number; inviavel: number }>;
  producaoTotalTon: number;
  margemMediaPonderada: number | null; // R$/ton
  custoMedioPonderado: number | null; // R$/ton
  resultadoTotalCorridas: number; // R$
  resultadoMesProjetadoMedio: number | null;
  maiorMargem: { id: string; nome: string; valor: number } | null;
  menorMargem: { id: string; nome: string; valor: number } | null;
  pctDentroSpec: number | null; // 0..1 (usa validacao.specCliente)
  desvioMedioP: number | null; // % relativo de |real - prev|/|prev|
  desvioMedioSi: number | null;
  desvioMedioMn: number | null;
  nCorridasComAnalise: number;
}>;

function somaPonderada(
  pares: ReadonlyArray<{ valor: number; peso: number }>,
): number | null {
  const validos = pares.filter(
    (p) => Number.isFinite(p.valor) && Number.isFinite(p.peso) && p.peso > 0,
  );
  if (validos.length === 0) return null;
  const pesoTotal = validos.reduce((a, b) => a + b.peso, 0);
  if (pesoTotal === 0) return null;
  return validos.reduce((a, b) => a + b.valor * b.peso, 0) / pesoTotal;
}

function mediaAbsPctDesvios(
  pares: ReadonlyArray<{ real: number | undefined | null; prev: number }>,
): number | null {
  const validos = pares.filter(
    (p): p is { real: number; prev: number } =>
      typeof p.real === 'number' && Number.isFinite(p.real) && Number.isFinite(p.prev) && p.prev !== 0,
  );
  if (validos.length === 0) return null;
  const total = validos.reduce(
    (a, p) => a + Math.abs((p.real - p.prev) / Math.abs(p.prev)),
    0,
  );
  return total / validos.length;
}

export function calcularKPIs(simulacoes: ReadonlyArray<SimulacaoAgregado>): KPIs {
  const porClass = { viavel: 0, alerta: 0, inviavel: 0 };
  let producaoTotal = 0;
  let resultadoTotal = 0;
  const pesosMargem: { valor: number; peso: number }[] = [];
  const pesosCusto: { valor: number; peso: number }[] = [];
  const resultadosMes: number[] = [];
  let maior: { id: string; nome: string; valor: number } | null = null;
  let menor: { id: string; nome: string; valor: number } | null = null;
  let dentroSpecCount = 0;
  let totalSpecConsiderado = 0;

  const paresP: { real: number | undefined | null; prev: number }[] = [];
  const paresSi: { real: number | undefined | null; prev: number }[] = [];
  const paresMn: { real: number | undefined | null; prev: number }[] = [];
  let nAnalise = 0;

  for (const s of simulacoes) {
    porClass[s.classificacao]++;
    const r = s.resultado;
    if (!r) continue;
    const gusa = r.producao.gusaVazado;
    producaoTotal += gusa;
    resultadoTotal += r.financeiro.resultadoCorrida;
    resultadosMes.push(r.financeiro.resultadoProjetadoMes);
    if (gusa > 0) {
      pesosMargem.push({ valor: r.financeiro.margemPorTon, peso: gusa });
      pesosCusto.push({ valor: r.financeiro.custoPorTonGusa, peso: gusa });
    }
    const m = r.financeiro.margemPorTon;
    if (Number.isFinite(m)) {
      if (!maior || m > maior.valor) maior = { id: s.id, nome: s.nome, valor: m };
      if (!menor || m < menor.valor) menor = { id: s.id, nome: s.nome, valor: m };
    }
    // spec
    const sp = r.validacao.specCliente;
    totalSpecConsiderado++;
    if (sp.p && sp.si && sp.mn && sp.s && sp.c) dentroSpecCount++;

    // desvios (apenas corridas reais com analise)
    if (s.tipo === 'corrida_real' && s.analise_gusa_real) {
      const a = s.analise_gusa_real;
      if (typeof a.p === 'number' || typeof a.si === 'number' || typeof a.mn === 'number') {
        nAnalise++;
        paresP.push({ real: a.p, prev: r.gusa.p });
        paresSi.push({ real: a.si, prev: r.gusa.si });
        paresMn.push({ real: a.mn, prev: r.gusa.mn });
      }
    }
  }

  const mediaResultadoMes =
    resultadosMes.length === 0
      ? null
      : resultadosMes.reduce((a, b) => a + b, 0) / resultadosMes.length;

  return {
    totalCorridas: simulacoes.length,
    porClassificacao: porClass,
    producaoTotalTon: producaoTotal,
    margemMediaPonderada: somaPonderada(pesosMargem),
    custoMedioPonderado: somaPonderada(pesosCusto),
    resultadoTotalCorridas: resultadoTotal,
    resultadoMesProjetadoMedio: mediaResultadoMes,
    maiorMargem: maior,
    menorMargem: menor,
    pctDentroSpec:
      totalSpecConsiderado === 0 ? null : dentroSpecCount / totalSpecConsiderado,
    desvioMedioP: mediaAbsPctDesvios(paresP),
    desvioMedioSi: mediaAbsPctDesvios(paresSi),
    desvioMedioMn: mediaAbsPctDesvios(paresMn),
    nCorridasComAnalise: nAnalise,
  };
}

/**
 * Série temporal de margem/ton por corrida, ordenada por timestamp ASC.
 * Usada pelo gráfico de evolução.
 */
export function serieMargemTon(
  simulacoes: ReadonlyArray<SimulacaoAgregado>,
): Array<{ t: string; margem: number; nome: string; classificacao: string }> {
  return simulacoes
    .filter((s) => Number.isFinite(s.resultado?.financeiro.margemPorTon))
    .map((s) => ({
      t: s.corrida_timestamp ?? s.created_at,
      margem: s.resultado.financeiro.margemPorTon,
      nome: s.nome,
      classificacao: s.classificacao,
    }))
    .sort((a, b) => a.t.localeCompare(b.t));
}

/**
 * Pareto de custo: top 5 insumos/rubricas do custo total médio por corrida.
 * Categorias: matérias, quebras, fixo, frete, tributos líquidos.
 */
export function paretoCustos(
  simulacoes: ReadonlyArray<SimulacaoAgregado>,
): Array<{ categoria: string; media: number }> {
  const n = simulacoes.length;
  if (n === 0) return [];
  let mat = 0, qb = 0, fx = 0, fr = 0, tr = 0;
  for (const s of simulacoes) {
    const f = s.resultado?.financeiro;
    if (!f) continue;
    mat += f.custoMaterias;
    qb += f.custoQuebras;
    fx += f.custoFixo;
    fr += f.custoFrete;
    tr += f.tributosLiquidos;
  }
  const itens = [
    { categoria: 'Matérias', media: mat / n },
    { categoria: 'Quebras', media: qb / n },
    { categoria: 'Fixo', media: fx / n },
    { categoria: 'Frete', media: fr / n },
    { categoria: 'Tributos líquidos', media: tr / n },
  ];
  return itens.sort((a, b) => b.media - a.media);
}
