import { describe, it, expect } from 'vitest';

import {
  calcularDestaques,
  diferencaSignificativa,
} from '@/lib/comparativo/destaques';

describe('calcularDestaques', () => {
  it('higher_better: maior é melhor, menor é pior', () => {
    expect(calcularDestaques([10, 20, 15], 'higher_better')).toEqual([
      'pior',
      'melhor',
      null,
    ]);
  });

  it('lower_better: menor é melhor, maior é pior', () => {
    expect(calcularDestaques([10, 20, 15], 'lower_better')).toEqual([
      'melhor',
      'pior',
      null,
    ]);
  });

  it('neutral: nunca destaca', () => {
    expect(calcularDestaques([10, 20, 15], 'neutral')).toEqual([null, null, null]);
  });

  it('todos iguais: null para todos', () => {
    expect(calcularDestaques([5, 5, 5], 'higher_better')).toEqual([
      null,
      null,
      null,
    ]);
  });

  it('null/undefined/NaN não disputam', () => {
    expect(calcularDestaques([null, 10, 20], 'higher_better')).toEqual([
      null,
      'pior',
      'melhor',
    ]);
    expect(calcularDestaques([undefined, NaN, 10], 'higher_better')).toEqual([
      null,
      null,
      null,
    ]);
  });

  it('lista com 1 valor válido: sem destaque', () => {
    expect(calcularDestaques([10, null, null], 'higher_better')).toEqual([
      null,
      null,
      null,
    ]);
  });
});

describe('diferencaSignificativa', () => {
  it('variação > 5% é significativa', () => {
    expect(diferencaSignificativa([100, 110])).toBe(true);
  });

  it('variação ≤ 5% não é significativa', () => {
    expect(diferencaSignificativa([100, 104])).toBe(false);
  });

  it('trata 0 como menor: true se há qualquer outro valor', () => {
    expect(diferencaSignificativa([0, 10])).toBe(true);
    expect(diferencaSignificativa([0, 0])).toBe(false);
  });

  it('ignora null/undefined/NaN', () => {
    expect(diferencaSignificativa([100, null, 110])).toBe(true);
    expect(diferencaSignificativa([null, undefined, 100])).toBe(false);
  });
});
