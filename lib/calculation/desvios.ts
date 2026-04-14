import type { ContaminantesGusa, EscoriaResult, LaminaResultado } from './types';

/**
 * Análise química real medida (opcional). Campos ausentes não geram desvio.
 */
export type AnaliseGusaReal = Partial<ContaminantesGusa>;
export type AnaliseEscoriaReal = Partial<
  Pick<EscoriaResult, 'b2' | 'b4' | 'al2o3Pct' | 'mgoAl2o3' | 'volumeTon'>
>;

export type DesvioItem = Readonly<{
  campo: string;
  previsto: number | null;
  real: number | null;
  desvio: number | null; // absoluto: real - previsto
  desvioPct: number | null; // relativo: (real - previsto) / |previsto|; null se previsto=0
}>;

export type DesviosResult = Readonly<{
  gusa: ReadonlyArray<DesvioItem>;
  escoria: ReadonlyArray<DesvioItem>;
}>;

function item(
  campo: string,
  previsto: number | undefined,
  real: number | undefined | null,
): DesvioItem {
  const pVal = typeof previsto === 'number' && Number.isFinite(previsto) ? previsto : null;
  const rVal = typeof real === 'number' && Number.isFinite(real) ? real : null;
  let desvio: number | null = null;
  let desvioPct: number | null = null;
  if (pVal !== null && rVal !== null) {
    desvio = rVal - pVal;
    desvioPct = pVal === 0 ? null : desvio / Math.abs(pVal);
  }
  return { campo, previsto: pVal, real: rVal, desvio, desvioPct };
}

/**
 * Compara o snapshot previsto (resultado da simulação) com a análise química
 * real medida. Puro — mesma entrada produz mesma saída.
 *
 * Campos ausentes na análise real ficam com `real=null` / `desvio=null`.
 * Sem campos reais preenchidos, todos os items têm `real=null` — usado pela
 * UI para mostrar "sem medição ainda".
 */
export function calcularDesvios(
  previsto: LaminaResultado,
  gusaReal: AnaliseGusaReal | null | undefined,
  escoriaReal: AnaliseEscoriaReal | null | undefined,
): DesviosResult {
  const g = gusaReal ?? {};
  const e = escoriaReal ?? {};

  return {
    gusa: [
      item('P (%)', previsto.gusa.p, g.p),
      item('Si (%)', previsto.gusa.si, g.si),
      item('Mn (%)', previsto.gusa.mn, g.mn),
      item('S (%)', previsto.gusa.s, g.s),
      item('C (%)', previsto.gusa.c, g.c),
    ],
    escoria: [
      item('B2', previsto.escoria.b2, e.b2),
      item('B4', previsto.escoria.b4, e.b4),
      item('Al₂O₃ escória (%)', previsto.escoria.al2o3Pct, e.al2o3Pct),
      item('MgO/Al₂O₃', previsto.escoria.mgoAl2o3, e.mgoAl2o3),
      item('Volume escória (ton)', previsto.escoria.volumeTon, e.volumeTon),
    ],
  };
}

/**
 * True se há pelo menos uma medição real preenchida em `gusa` ou `escoria`.
 */
export function temMedicaoReal(d: DesviosResult): boolean {
  return (
    d.gusa.some((i) => i.real !== null) ||
    d.escoria.some((i) => i.real !== null)
  );
}
