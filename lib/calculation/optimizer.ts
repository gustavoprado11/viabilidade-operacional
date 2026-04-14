import { simulateLamina } from './index';

import type {
  BlendItem,
  LaminaInput,
  LaminaResultado,
  MinerioInput,
  OtimizacaoRestricoes,
} from './types';

export type OtimizacaoResult = Readonly<
  LaminaResultado & { blendStr: string; pcts: ReadonlyArray<number> }
>;

/**
 * Grid search sobre o blend com incremento `step` (default 5%).
 *
 * Para cada combinação com Σ pct = 100:
 *   - roda simulateLamina
 *   - filtra por restrições (feMin, feMax, Al2O3 escória máx, custo/ton máx)
 *   - ranqueia por resultadoCorrida DESC
 *
 * Apenas blends classificados como viavel ou alerta passam — inviáveis ficam fora.
 * Retorna `topN` resultados.
 */
export function otimizarBlend(
  minerios: ReadonlyArray<MinerioInput>,
  restricoes: OtimizacaoRestricoes,
  baseInput: Omit<LaminaInput, 'blend'>,
  step = 5,
  topN = 10,
): ReadonlyArray<OtimizacaoResult> {
  if (minerios.length === 0) return [];

  const combos = generateCombinations(minerios.length, step);
  const results: OtimizacaoResult[] = [];

  for (const pcts of combos) {
    const blend: BlendItem[] = pcts.map((pct, i) => ({
      minerio: minerios[i]!,
      pct,
    }));
    const input: LaminaInput = { ...baseInput, blend };
    const r = simulateLamina(input);

    if (r.validacao.classificacao === 'inviavel') continue;
    if (restricoes.feMin !== undefined && r.blend.fe < restricoes.feMin) continue;
    if (restricoes.feMax !== undefined && r.blend.fe > restricoes.feMax) continue;
    if (restricoes.al2o3EscoriaMax !== undefined && r.escoria.al2o3Pct > restricoes.al2o3EscoriaMax) continue;
    if (restricoes.custoTonMax !== undefined && r.financeiro.custoPorTonGusa > restricoes.custoTonMax) continue;

    const blendStr = pcts.map((p, i) => `${minerios[i]!.nome} ${p}%`).join(' + ');
    results.push({ ...r, blendStr, pcts });
  }

  results.sort(
    (a, b) => b.financeiro.resultadoCorrida - a.financeiro.resultadoCorrida,
  );
  return results.slice(0, topN);
}

/**
 * Gera todas as combinações de N inteiros no intervalo [0, 100] com passo
 * `step` tais que a soma seja exatamente 100.
 *
 * Para N=3 e step=5: 231 combinações. Fórmula: C(100/step + N−1, N−1).
 */
export function generateCombinations(
  n: number,
  step: number,
): number[][] {
  const out: number[][] = [];
  const total = 100;
  const walk = (idx: number, remaining: number, acc: number[]): void => {
    if (idx === n - 1) {
      if (remaining % step === 0 && remaining >= 0) out.push([...acc, remaining]);
      return;
    }
    for (let v = 0; v <= remaining; v += step) {
      acc.push(v);
      walk(idx + 1, remaining - v, acc);
      acc.pop();
    }
  };
  walk(0, total, []);
  return out;
}
