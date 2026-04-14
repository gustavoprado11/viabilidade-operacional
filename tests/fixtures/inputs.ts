import type { LaminaInput, BlendItem } from '@/lib/calculation/types';

import {
  bauxita,
  calcario,
  corumba,
  dolomita,
  serra,
  trindade,
} from './minerios';
import { clienteGusaAciaria, parametros } from './parametros';

/**
 * Fixture padrão de entrada do motor. Blend customizável; demais campos
 * fixos em valores de referência sintéticos.
 */
export function makeInput(
  blend: ReadonlyArray<BlendItem>,
  overrides: Partial<LaminaInput> = {},
): LaminaInput {
  const base: LaminaInput = {
    blend,
    carvao: { mdc: 23.3, densidade: 220, preco: 360, pisCredito: 0, icmsCredito: 0 },
    coque: { kg: 1280, preco: 1408, pisCredito: 143.52, icmsCredito: 340.58 },
    fundentes: {
      calcario: { kg: 600, dados: calcario },
      bauxita: { kg: 200, dados: bauxita },
      dolomita: { kg: 0, dados: dolomita },
    },
    quebras: { minerio: 0.1, carvao: 0.1, coque: 0.05, fundentes: 0.05 },
    estabilidade: 'estavel',
    sucata: { kg: 0, precoTon: 0, destino: 'venda' },
    cliente: clienteGusaAciaria,
    parametros,
  };
  return { ...base, ...overrides };
}

export const blend100Serra: ReadonlyArray<BlendItem> = [
  { minerio: serra, pct: 100 },
];
export const blend100Trindade: ReadonlyArray<BlendItem> = [
  { minerio: trindade, pct: 100 },
];
export const blend100Corumba: ReadonlyArray<BlendItem> = [
  { minerio: corumba, pct: 100 },
];
export const blend50Serra50Trindade: ReadonlyArray<BlendItem> = [
  { minerio: serra, pct: 50 },
  { minerio: trindade, pct: 50 },
];
export const blend15_15_70: ReadonlyArray<BlendItem> = [
  { minerio: serra, pct: 15 },
  { minerio: trindade, pct: 15 },
  { minerio: corumba, pct: 70 },
];
export const blend10_90_0: ReadonlyArray<BlendItem> = [
  { minerio: serra, pct: 10 },
  { minerio: trindade, pct: 90 },
];
