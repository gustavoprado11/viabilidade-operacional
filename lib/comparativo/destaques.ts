/**
 * Destaques de melhor/pior por métrica no comparativo.
 * Puro, sem deps de framework — testável unit.
 */

export type Direcao = 'higher_better' | 'lower_better' | 'neutral';

export type Destaque = 'melhor' | 'pior' | null;

/**
 * Dada uma lista de valores numéricos e uma direção, retorna para cada
 * posição se é o 'melhor', 'pior' ou null (caso empate total ou neutral).
 *
 * - `higher_better`: maior valor é melhor (ex: Fe, margem, resultado).
 * - `lower_better`: menor valor é melhor (ex: custo, Al2O3 escória).
 * - `neutral`: não marca destaque.
 *
 * Se todos os valores forem iguais, retorna null para todos.
 * null/undefined/NaN na lista são tratados como "sem valor" — não disputam destaque.
 */
export function calcularDestaques(
  valores: ReadonlyArray<number | null | undefined>,
  direcao: Direcao,
): Destaque[] {
  if (direcao === 'neutral') return valores.map(() => null);

  const validos = valores
    .map((v, i) => ({ v, i }))
    .filter((x): x is { v: number; i: number } => typeof x.v === 'number' && Number.isFinite(x.v));
  if (validos.length < 2) return valores.map(() => null);

  const vals = validos.map((x) => x.v);
  const maior = Math.max(...vals);
  const menor = Math.min(...vals);
  if (maior === menor) return valores.map(() => null);

  return valores.map((v) => {
    if (typeof v !== 'number' || !Number.isFinite(v)) return null;
    const best = direcao === 'higher_better' ? maior : menor;
    const worst = direcao === 'higher_better' ? menor : maior;
    if (v === best) return 'melhor';
    if (v === worst) return 'pior';
    return null;
  });
}

/**
 * Diferença relativa significativa: (maior - menor) / |menor| > 0.05.
 * Retorna true se a variação ultrapassar 5% entre os valores numéricos válidos.
 */
export function diferencaSignificativa(
  valores: ReadonlyArray<number | null | undefined>,
  threshold = 0.05,
): boolean {
  const vals = valores.filter(
    (v): v is number => typeof v === 'number' && Number.isFinite(v),
  );
  if (vals.length < 2) return false;
  const maior = Math.max(...vals);
  const menor = Math.min(...vals);
  if (menor === 0) return maior !== 0;
  return Math.abs(maior - menor) / Math.abs(menor) > threshold;
}
