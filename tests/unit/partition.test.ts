import { describe, it, expect } from 'vitest';

import { calcularContaminantesGusa } from '@/lib/calculation/partition';
import { parametros } from '@/tests/fixtures/parametros';
import type { BlendQuimica } from '@/lib/calculation/types';

const blendBase: BlendQuimica = {
  fe: 63,
  sio2: 4,
  al2o3: 2.5,
  p: 0.06,
  mn: 0.15,
  cao: 0.1,
  mgo: 0.08,
  ppc: 0,
  precoMedio: 400,
};

describe('calcularContaminantesGusa', () => {
  it('S e C são constantes do parâmetro', () => {
    const r = calcularContaminantesGusa(blendBase, 14, 8.8, 0.825, parametros);
    expect(r.s).toBe(parametros.sGusaFixo);
    expect(r.c).toBe(parametros.cGusaFixo);
  });

  it('P_gusa aplica partição 0.95 sobre P do blend', () => {
    const r = calcularContaminantesGusa(blendBase, 14, 8.8, 0.825, parametros);
    const esperado =
      ((blendBase.p / 100) * 14 * 100 * parametros.particaoPGusa) / 8.8;
    expect(r.p).toBeCloseTo(esperado, 6);
  });

  it('Mn_gusa aplica partição 0.65', () => {
    const r = calcularContaminantesGusa(blendBase, 14, 8.8, 0.825, parametros);
    const esperado =
      ((blendBase.mn / 100) * 14 * 100 * parametros.particaoMnGusa) / 8.8;
    expect(r.mn).toBeCloseTo(esperado, 6);
  });

  it('Si_gusa = 1.5 - 1.2 × B2 no ponto B2=0.825', () => {
    const r = calcularContaminantesGusa(blendBase, 14, 8.8, 0.825, parametros);
    expect(r.si).toBeCloseTo(1.5 - 1.2 * 0.825, 6);
  });

  it('Si_gusa respeita piso de 0.1', () => {
    // Em B2 muito alto, fórmula daria negativo; o piso trava em 0.1
    const r = calcularContaminantesGusa(blendBase, 14, 8.8, 2.0, parametros);
    expect(r.si).toBe(0.1);
  });

  it('P/Mn retornam 0 quando gusaVazado = 0', () => {
    const r = calcularContaminantesGusa(blendBase, 14, 0, 0.825, parametros);
    expect(r.p).toBe(0);
    expect(r.mn).toBe(0);
  });
});
