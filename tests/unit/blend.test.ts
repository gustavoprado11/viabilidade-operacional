import { describe, it, expect } from 'vitest';

import { calcularBlendQuimica } from '@/lib/calculation/blend';
import { serra, trindade, corumba } from '@/tests/fixtures/minerios';

describe('calcularBlendQuimica', () => {
  it('retorna valores do próprio minério quando pct = 100', () => {
    const r = calcularBlendQuimica([{ minerio: serra, pct: 100 }]);
    expect(r.fe).toBeCloseTo(serra.fe, 6);
    expect(r.sio2).toBeCloseTo(serra.sio2, 6);
    expect(r.al2o3).toBeCloseTo(serra.al2o3, 6);
    expect(r.precoMedio).toBeCloseTo(serra.preco, 6);
  });

  it('média ponderada correta para 2 minérios 50/50', () => {
    const r = calcularBlendQuimica([
      { minerio: serra, pct: 50 },
      { minerio: trindade, pct: 50 },
    ]);
    expect(r.fe).toBeCloseTo((serra.fe + trindade.fe) / 2, 6);
    expect(r.sio2).toBeCloseTo((serra.sio2 + trindade.sio2) / 2, 6);
    expect(r.precoMedio).toBeCloseTo((serra.preco + trindade.preco) / 2, 6);
  });

  it('média ponderada correta para 3 minérios 33/33/34', () => {
    const r = calcularBlendQuimica([
      { minerio: serra, pct: 33 },
      { minerio: trindade, pct: 33 },
      { minerio: corumba, pct: 34 },
    ]);
    const esperadoFe =
      0.33 * serra.fe + 0.33 * trindade.fe + 0.34 * corumba.fe;
    expect(r.fe).toBeCloseTo(esperadoFe, 6);
  });

  it('blend vazio retorna zeros', () => {
    const r = calcularBlendQuimica([]);
    expect(r.fe).toBe(0);
    expect(r.precoMedio).toBe(0);
  });

  it('pct = 0 em um minério não contribui', () => {
    const r = calcularBlendQuimica([
      { minerio: serra, pct: 100 },
      { minerio: corumba, pct: 0 },
    ]);
    expect(r.fe).toBeCloseTo(serra.fe, 6);
  });
});
