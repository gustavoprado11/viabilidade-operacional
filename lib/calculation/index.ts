import { calcularBlendQuimica } from './blend';
import { calcularFinanceiro } from './financial';
import { calcularContaminantesGusa } from './partition';
import { laminaInputSchema } from './schemas';
import { calcularEscoria } from './slag';
import { validarLamina } from './validation';
import { calcularProducao } from './yield';

import type { LaminaInput, LaminaResultado } from './types';

export * from './types';

/**
 * Orquestra o motor completo:
 *   blend → produção (yield) → escória → gusa → financeiro → validação
 *
 * Puro: mesmo input produz mesmo output; não faz I/O, não é async.
 * Valida o input via Zod antes de calcular — lança se inválido.
 */
export function simulateLamina(input: LaminaInput): LaminaResultado {
  laminaInputSchema.parse(input);

  const blend = calcularBlendQuimica(input.blend);
  const producao = calcularProducao(input, blend.fe);
  const escoria = calcularEscoria(input, producao);
  const gusa = calcularContaminantesGusa(
    blend,
    producao.consumoMinerioCorrida,
    producao.gusaVazado,
    escoria.b2,
    input.parametros,
  );
  const financeiro = calcularFinanceiro(
    input,
    producao,
    escoria,
    blend.precoMedio,
  );
  const validacao = validarLamina(gusa, escoria, input.cliente, input.parametros);

  return { blend, producao, escoria, gusa, financeiro, validacao };
}
