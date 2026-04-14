import { describe, it, expect } from 'vitest';

import { calcularDesvios, temMedicaoReal } from '@/lib/calculation/desvios';
import type { LaminaResultado } from '@/lib/calculation/types';

const previsto: LaminaResultado = {
  blend: { fe: 63, sio2: 4, al2o3: 2.5, p: 0.06, mn: 0.15, cao: 0.1, mgo: 0.08, ppc: 0, precoMedio: 400 },
  producao: {
    rendimentoTeorico: 0.62,
    fatorEstabilidade: 1,
    rendimentoEfetivo: 0.62,
    consumoMinerioCorrida: 14,
    gusaVazado: 8.68,
    sucataGerada: 0,
    producaoTotal: 8.68,
  },
  escoria: {
    sio2Ton: 1,
    al2o3Ton: 0.3,
    caoTon: 0.85,
    mgoTon: 0.1,
    volumeTon: 2.25,
    volumePorTonGusa: 259,
    b2: 0.85,
    b4: 0.7,
    al2o3Pct: 13.3,
    mgoAl2o3: 0.33,
    calcarioNecessario: 1,
  },
  gusa: { p: 0.099, si: 0.48, mn: 0.169, s: 0.025, c: 4.2 },
  financeiro: {
    custoMaterias: 1, custoQuebras: 1, custoFixo: 1, custoFrete: 1,
    custoTotal: 1, custoPorTonGusa: 1, receitaGusa: 1, receitaSucata: 0,
    creditoFuturoReprocesso: 0, faturamentoTotal: 1, debitoTributos: 1,
    creditoTributos: 1, tributosLiquidos: 0, margemPorTon: 0,
    resultadoCorrida: 0, resultadoProjetadoMes: 0,
  },
  validacao: { specCliente: { p: true, si: true, mn: true, s: true, c: true }, escoria: { al2o3OK: true, mgoAl2o3OK: true, b2OK: true }, classificacao: 'viavel', alertas: [], erros: [] },
};

describe('calcularDesvios', () => {
  it('sem análise real: todos com real=null, desvios=null', () => {
    const d = calcularDesvios(previsto, null, null);
    expect(d.gusa.every((i) => i.real === null && i.desvio === null)).toBe(true);
    expect(d.escoria.every((i) => i.real === null && i.desvio === null)).toBe(true);
    expect(temMedicaoReal(d)).toBe(false);
  });

  it('P real 0.11 vs previsto 0.099 → desvio +0.011, +11.11%', () => {
    const d = calcularDesvios(previsto, { p: 0.11 }, null);
    const p = d.gusa.find((i) => i.campo === 'P (%)')!;
    expect(p.previsto).toBeCloseTo(0.099, 6);
    expect(p.real).toBe(0.11);
    expect(p.desvio).toBeCloseTo(0.011, 6);
    expect(p.desvioPct).toBeCloseTo(0.11111, 4);
    expect(temMedicaoReal(d)).toBe(true);
  });

  it('campos não medidos ficam null; medidos têm desvio', () => {
    const d = calcularDesvios(previsto, { p: 0.1 }, null);
    expect(d.gusa.find((i) => i.campo === 'P (%)')!.real).toBe(0.1);
    expect(d.gusa.find((i) => i.campo === 'Si (%)')!.real).toBeNull();
  });

  it('previsto=0 produz desvioPct=null mas mantém desvio absoluto', () => {
    const p2 = { ...previsto, gusa: { ...previsto.gusa, p: 0 } };
    const d = calcularDesvios(p2, { p: 0.05 }, null);
    const p = d.gusa.find((i) => i.campo === 'P (%)')!;
    expect(p.desvio).toBe(0.05);
    expect(p.desvioPct).toBeNull();
  });

  it('análise escória: B2 e Al2O3 comparados', () => {
    const d = calcularDesvios(previsto, null, { b2: 0.82, al2o3Pct: 14 });
    const b2 = d.escoria.find((i) => i.campo === 'B2')!;
    const al = d.escoria.find((i) => i.campo === 'Al₂O₃ escória (%)')!;
    expect(b2.real).toBe(0.82);
    expect(b2.desvio).toBeCloseTo(-0.03, 6);
    expect(al.real).toBe(14);
    expect(al.desvioPct).toBeCloseTo((14 - 13.3) / 13.3, 4);
  });

  it('valores não finitos na análise real ignorados', () => {
    const d = calcularDesvios(previsto, { p: NaN as unknown as number }, null);
    const p = d.gusa.find((i) => i.campo === 'P (%)')!;
    expect(p.real).toBeNull();
  });

  it('determinismo: mesma entrada = mesma saída', () => {
    const d1 = calcularDesvios(previsto, { p: 0.1, si: 0.5 }, { b2: 0.83 });
    const d2 = calcularDesvios(previsto, { p: 0.1, si: 0.5 }, { b2: 0.83 });
    expect(d1).toEqual(d2);
  });

  it('temMedicaoReal cobre casos vazio/parcial/cheio', () => {
    expect(temMedicaoReal(calcularDesvios(previsto, null, null))).toBe(false);
    expect(temMedicaoReal(calcularDesvios(previsto, {}, {}))).toBe(false);
    expect(temMedicaoReal(calcularDesvios(previsto, { si: 0.5 }, null))).toBe(true);
    expect(temMedicaoReal(calcularDesvios(previsto, null, { volumeTon: 2.2 }))).toBe(true);
  });
});
