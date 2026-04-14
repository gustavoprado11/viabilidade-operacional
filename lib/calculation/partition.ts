import type {
  BlendQuimica,
  ContaminantesGusa,
  ParametrosForno,
} from './types';

/**
 * Contaminantes no gusa (%).
 *
 * P_gusa  = (P_blend/100 × consumoMinerio) / gusaVazado × 100 × particaoPGusa
 * Mn_gusa = (Mn_blend/100 × consumoMinerio) / gusaVazado × 100 × particaoMnGusa
 * Si_gusa = max(0.1, siIntercept + siCoefB2 × B2)
 * S_gusa  = sGusaFixo (constante)
 * C_gusa  = cGusaFixo (constante)
 *
 * Se gusaVazado <= 0, P/Mn retornam 0 (lâmina sem produção de gusa).
 */
export function calcularContaminantesGusa(
  blend: BlendQuimica,
  consumoMinerio: number,
  gusaVazado: number,
  b2: number,
  params: ParametrosForno,
): ContaminantesGusa {
  const p =
    gusaVazado > 0
      ? ((blend.p / 100) * consumoMinerio * 100 * params.particaoPGusa) /
        gusaVazado
      : 0;

  const mn =
    gusaVazado > 0
      ? ((blend.mn / 100) * consumoMinerio * 100 * params.particaoMnGusa) /
        gusaVazado
      : 0;

  const si = Math.max(0.1, params.siIntercept + params.siCoefB2 * b2);

  return {
    p,
    si,
    mn,
    s: params.sGusaFixo,
    c: params.cGusaFixo,
  };
}
