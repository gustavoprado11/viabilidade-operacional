import type { Classificacao } from '@/lib/calculation/types';

export type SimulacaoResumida = Readonly<{
  gusaCorrida: number;
  custoPorTonGusa: number;
  margemPorTon: number;
  resultadoCorrida: number;
  classificacao: Classificacao;
}>;

export interface EstimativaDiaria {
  n: number;
  corridasPorDia: number;
  mediaGusaCorrida: number;
  gusaDia: number;
  mediaCustoTon: number;
  mediaMargemTon: number;
  resultadoDia: number;
  resultadoMes: number;
  classificacoes: {
    viavel: number;
    alerta: number;
    inviavel: number;
  };
  observacoes: string[];
}

const ZERO_CLASS = { viavel: 0, alerta: 0, inviavel: 0 };

export function calcularEstimativaDiaria(
  laminas: readonly SimulacaoResumida[],
  corridasPorDia: number,
): EstimativaDiaria {
  if (laminas.length === 0) {
    return {
      n: 0,
      corridasPorDia,
      mediaGusaCorrida: 0,
      gusaDia: 0,
      mediaCustoTon: 0,
      mediaMargemTon: 0,
      resultadoDia: 0,
      resultadoMes: 0,
      classificacoes: { ...ZERO_CLASS },
      observacoes: ['Nenhuma lâmina selecionada'],
    };
  }

  const n = laminas.length;
  const classificacoes = { ...ZERO_CLASS };
  let somaGusa = 0;
  let somaResultado = 0;
  let somaCustoPonderado = 0;
  let somaMargemPonderada = 0;

  for (const l of laminas) {
    somaGusa += l.gusaCorrida;
    somaResultado += l.resultadoCorrida;
    somaCustoPonderado += l.custoPorTonGusa * l.gusaCorrida;
    somaMargemPonderada += l.margemPorTon * l.gusaCorrida;
    classificacoes[l.classificacao] += 1;
  }

  const mediaGusaCorrida = somaGusa / n;
  const mediaResultadoCorrida = somaResultado / n;
  // Ponderação por gusa vazado; se todas = 0 (edge), cai pra média simples.
  const mediaCustoTon =
    somaGusa > 0
      ? somaCustoPonderado / somaGusa
      : laminas.reduce((acc, l) => acc + l.custoPorTonGusa, 0) / n;
  const mediaMargemTon =
    somaGusa > 0
      ? somaMargemPonderada / somaGusa
      : laminas.reduce((acc, l) => acc + l.margemPorTon, 0) / n;

  const gusaDia = mediaGusaCorrida * corridasPorDia;
  const resultadoDia = mediaResultadoCorrida * corridasPorDia;
  const resultadoMes = resultadoDia * 30;

  const observacoes: string[] = [];
  if (n === 1) observacoes.push('Projeção baseada em 1 lâmina');
  if (classificacoes.inviavel === n) {
    observacoes.push(
      '⚠ Todas as lâminas filtradas são inviáveis — projeção informativa, não operacional',
    );
  }

  return {
    n,
    corridasPorDia,
    mediaGusaCorrida,
    gusaDia,
    mediaCustoTon,
    mediaMargemTon,
    resultadoDia,
    resultadoMes,
    classificacoes,
    observacoes,
  };
}
