import { describe, it, expect } from 'vitest';

import { calcularRendimento } from '@/lib/calculation/yield';
import { parametros } from '@/tests/fixtures/parametros';

describe('calcularRendimento', () => {
  it('no ponto de referência 1, retorna rendRef1', () => {
    const r = calcularRendimento(parametros.rendFeRef1, 'estavel', parametros);
    expect(r.teorico).toBeCloseTo(parametros.rendRef1, 6);
    expect(r.fator).toBe(parametros.fatorEstavel);
    expect(r.efetivo).toBeCloseTo(parametros.rendRef1, 6);
  });

  it('no ponto de referência 2, retorna rendRef2', () => {
    const r = calcularRendimento(parametros.rendFeRef2, 'estavel', parametros);
    expect(r.teorico).toBeCloseTo(parametros.rendRef2, 6);
  });

  it('interpola linearmente entre os 2 pontos', () => {
    const feMedio = (parametros.rendFeRef1 + parametros.rendFeRef2) / 2;
    const rendMedio = (parametros.rendRef1 + parametros.rendRef2) / 2;
    const r = calcularRendimento(feMedio, 'estavel', parametros);
    expect(r.teorico).toBeCloseTo(rendMedio, 6);
  });

  it('aplica fator de atenção (0.95)', () => {
    const r = calcularRendimento(parametros.rendFeRef1, 'atencao', parametros);
    expect(r.fator).toBe(0.95);
    expect(r.efetivo).toBeCloseTo(parametros.rendRef1 * 0.95, 6);
  });

  it('aplica fator instável (0.88)', () => {
    const r = calcularRendimento(parametros.rendFeRef1, 'instavel', parametros);
    expect(r.fator).toBe(0.88);
    expect(r.efetivo).toBeCloseTo(parametros.rendRef1 * 0.88, 6);
  });

  it('extrapola acima do ponto de referência 1', () => {
    const r = calcularRendimento(65, 'estavel', parametros);
    expect(r.teorico).toBeGreaterThan(parametros.rendRef1);
  });

  it('extrapola abaixo do ponto de referência 2', () => {
    const r = calcularRendimento(60, 'estavel', parametros);
    expect(r.teorico).toBeLessThan(parametros.rendRef2);
  });
});
