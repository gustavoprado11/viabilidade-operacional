export const CARGAS_PADRAO = 12.8;
export const PESO_POR_CARGA_PADRAO_KG = 450;
export const DENSIDADE_PADRAO_KG_M3 = 220;

export function calcularMdc(
  cargasPorCorrida: number,
  pesoPorCargaKg: number,
  densidadeKgM3: number,
): number {
  if (
    cargasPorCorrida <= 0 ||
    pesoPorCargaKg <= 0 ||
    densidadeKgM3 <= 0 ||
    !Number.isFinite(cargasPorCorrida) ||
    !Number.isFinite(pesoPorCargaKg) ||
    !Number.isFinite(densidadeKgM3)
  ) {
    return 0;
  }
  return (cargasPorCorrida * pesoPorCargaKg) / densidadeKgM3;
}

/**
 * Fallback para lâminas antigas: dado um MDC persistido (pré-12.5), deriva
 * cargas assumindo peso_por_carga padrão. Retorna null se MDC inválido.
 */
export function derivarCargasDoMdc(
  mdc: number,
  pesoPorCargaKg: number,
  densidadeKgM3: number,
): number | null {
  if (mdc <= 0 || pesoPorCargaKg <= 0 || densidadeKgM3 <= 0) return null;
  return (mdc * densidadeKgM3) / pesoPorCargaKg;
}
