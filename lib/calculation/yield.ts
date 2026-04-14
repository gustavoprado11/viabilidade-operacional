import type {
  Estabilidade,
  LaminaInput,
  ParametrosForno,
  ProducaoResult,
} from './types';

/**
 * Rendimento metalúrgico: interpolação linear entre 2 pontos de referência,
 * multiplicado pelo fator de estabilidade.
 *
 * rendTeorico = rend_ref1 + ((fe - fe_ref1) × (rend_ref1 - rend_ref2) / (fe_ref1 - fe_ref2))
 * rendEfetivo = rendTeorico × fator_estabilidade
 */
export function calcularRendimento(
  feBlend: number,
  estabilidade: Estabilidade,
  params: ParametrosForno,
): { teorico: number; fator: number; efetivo: number } {
  const { rendFeRef1, rendRef1, rendFeRef2, rendRef2 } = params;

  const teorico =
    rendRef1 +
    ((feBlend - rendFeRef1) * (rendRef1 - rendRef2)) /
      (rendFeRef1 - rendFeRef2);

  const fator = fatorPorEstabilidade(estabilidade, params);
  const efetivo = teorico * fator;

  return { teorico, fator, efetivo };
}

/**
 * Produção da corrida:
 *   consumoMinerioCorrida = consumoMinerioDia / corridasPorDia
 *   producaoTotal         = consumoMinerioCorrida × rendimentoEfetivo
 *   sucataGerada          = input.sucata.kg / 1000 (ton)
 *   gusaVazado            = producaoTotal − sucataGerada (piso em 0)
 */
export function calcularProducao(
  input: LaminaInput,
  feBlend: number,
): ProducaoResult {
  const { teorico, fator, efetivo } = calcularRendimento(
    feBlend,
    input.estabilidade,
    input.parametros,
  );

  const consumoMinerioCorrida =
    input.parametros.consumoMinerioDia / input.parametros.corridasPorDia;
  const producaoTotal = consumoMinerioCorrida * efetivo;
  const sucataGerada = input.sucata.kg / 1000;
  const gusaVazado = Math.max(0, producaoTotal - sucataGerada);

  return {
    rendimentoTeorico: teorico,
    fatorEstabilidade: fator,
    rendimentoEfetivo: efetivo,
    consumoMinerioCorrida,
    gusaVazado,
    sucataGerada,
    producaoTotal,
  };
}

function fatorPorEstabilidade(
  estabilidade: Estabilidade,
  params: ParametrosForno,
): number {
  switch (estabilidade) {
    case 'estavel':
      return params.fatorEstavel;
    case 'atencao':
      return params.fatorAtencao;
    case 'instavel':
      return params.fatorInstavel;
  }
}
