import type {
  Classificacao,
  ClienteSpec,
  ContaminantesGusa,
  EscoriaResult,
  ParametrosForno,
  ValidacaoResult,
} from './types';

const ALERTA_MARGEM_PCT = 0.05;

/**
 * Classifica a lâmina em viável / alerta / inviável conforme regras do CLAUDE.md.
 *
 * INVIÁVEL se:
 *   - P_gusa > P_max, Si_gusa > Si_max, Mn_gusa > Mn_max, S_gusa > S_max
 *   - C_gusa fora de [C_min, C_max]
 *   - Al2O3_escoria > al2o3_escoria_limite (17%)
 *
 * ALERTA se:
 *   - Al2O3_escoria entre al2o3_escoria_alvo_max e al2o3_escoria_limite
 *   - B2 fora de [b2_min, b2_max] mas dentro de ±5% da faixa
 *   - Qualquer contaminante no gusa a <5% da borda da spec
 *   - MgO/Al2O3 < mgo_al2o3_min
 *
 * VIÁVEL caso contrário.
 */
export function validarLamina(
  gusa: ContaminantesGusa,
  escoria: EscoriaResult,
  cliente: ClienteSpec,
  params: ParametrosForno,
): ValidacaoResult {
  const erros: string[] = [];
  const alertas: string[] = [];

  // Spec do cliente: INVIÁVEL se violada
  const pOK = gusa.p <= cliente.pMax;
  const siOK = gusa.si <= cliente.siMax;
  const mnOK = gusa.mn <= cliente.mnMax;
  const sOK = gusa.s <= cliente.sMax;
  const cOK = gusa.c >= cliente.cMin && gusa.c <= cliente.cMax;

  if (!pOK) erros.push(`P no gusa (${gusa.p.toFixed(3)}%) excede ${cliente.pMax}%.`);
  if (!siOK) erros.push(`Si no gusa (${gusa.si.toFixed(3)}%) excede ${cliente.siMax}%.`);
  if (!mnOK) erros.push(`Mn no gusa (${gusa.mn.toFixed(3)}%) excede ${cliente.mnMax}%.`);
  if (!sOK) erros.push(`S no gusa (${gusa.s.toFixed(3)}%) excede ${cliente.sMax}%.`);
  if (!cOK)
    erros.push(
      `C no gusa (${gusa.c.toFixed(3)}%) fora da faixa [${cliente.cMin}, ${cliente.cMax}]%.`,
    );

  // Al2O3 escória: limite rígido
  const al2o3OK = escoria.al2o3Pct <= params.al2o3EscoriaLimite;
  if (!al2o3OK)
    erros.push(
      `Al2O3 na escória (${escoria.al2o3Pct.toFixed(2)}%) excede o limite de ${params.al2o3EscoriaLimite}%.`,
    );

  // Alertas
  if (
    escoria.al2o3Pct > params.al2o3EscoriaAlvoMax &&
    escoria.al2o3Pct <= params.al2o3EscoriaLimite
  ) {
    alertas.push(
      `Al2O3 na escória (${escoria.al2o3Pct.toFixed(2)}%) na faixa de tolerância (${params.al2o3EscoriaAlvoMax}–${params.al2o3EscoriaLimite}%).`,
    );
  }

  const b2Central = (params.b2Min + params.b2Max) / 2;
  const b2Tolerancia = (params.b2Max - params.b2Min) / 2 + 0.05 * b2Central;
  const b2DentroAlvo =
    escoria.b2 >= params.b2Min && escoria.b2 <= params.b2Max;
  const b2DentroToleravel = Math.abs(escoria.b2 - b2Central) <= b2Tolerancia;
  const b2OK = b2DentroAlvo;
  if (!b2DentroAlvo && b2DentroToleravel) {
    alertas.push(
      `B2 (${escoria.b2.toFixed(3)}) fora da faixa alvo [${params.b2Min}, ${params.b2Max}] mas dentro de ±5%.`,
    );
  } else if (!b2DentroAlvo && !b2DentroToleravel) {
    erros.push(
      `B2 (${escoria.b2.toFixed(3)}) fora da faixa tolerável de [${params.b2Min}, ${params.b2Max}].`,
    );
  }

  if (escoria.mgoAl2o3 < params.mgoAl2o3Min) {
    alertas.push(
      `MgO/Al2O3 (${escoria.mgoAl2o3.toFixed(3)}) abaixo do mínimo (${params.mgoAl2o3Min}).`,
    );
  }
  const mgoAl2o3OK = escoria.mgoAl2o3 >= params.mgoAl2o3Min;

  // Alertas por proximidade da borda da spec (<5%)
  if (pOK && cliente.pMax - gusa.p < ALERTA_MARGEM_PCT * cliente.pMax)
    alertas.push(`P no gusa próximo do limite.`);
  if (siOK && cliente.siMax - gusa.si < ALERTA_MARGEM_PCT * cliente.siMax)
    alertas.push(`Si no gusa próximo do limite.`);
  if (mnOK && cliente.mnMax - gusa.mn < ALERTA_MARGEM_PCT * cliente.mnMax)
    alertas.push(`Mn no gusa próximo do limite.`);
  if (sOK && cliente.sMax - gusa.s < ALERTA_MARGEM_PCT * cliente.sMax)
    alertas.push(`S no gusa próximo do limite.`);
  if (cOK) {
    if (gusa.c - cliente.cMin < ALERTA_MARGEM_PCT * cliente.cMin)
      alertas.push(`C no gusa próximo do mínimo.`);
    if (cliente.cMax - gusa.c < ALERTA_MARGEM_PCT * cliente.cMax)
      alertas.push(`C no gusa próximo do máximo.`);
  }

  const classificacao: Classificacao =
    erros.length > 0 ? 'inviavel' : alertas.length > 0 ? 'alerta' : 'viavel';

  return {
    specCliente: { p: pOK, si: siOK, mn: mnOK, s: sOK, c: cOK },
    escoria: { al2o3OK, mgoAl2o3OK, b2OK },
    classificacao,
    alertas,
    erros,
  };
}
