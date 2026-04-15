import { describe, expect, it } from 'vitest';

import { calcularMdc, derivarCargasDoMdc } from '@/lib/laminas/mdc-calc';

describe('calcularMdc', () => {
  it('(12.8 × 450) / 220 ≈ 26.18', () => {
    const mdc = calcularMdc(12.8, 450, 220);
    expect(mdc).toBeCloseTo((12.8 * 450) / 220, 4);
    expect(mdc).toBeGreaterThan(26.17);
    expect(mdc).toBeLessThan(26.19);
  });

  it('(10 × 500) / 200 = 25.00', () => {
    expect(calcularMdc(10, 500, 200)).toBeCloseTo(25, 6);
  });

  it('qualquer zero → resultado 0', () => {
    expect(calcularMdc(0, 450, 220)).toBe(0);
    expect(calcularMdc(12.8, 0, 220)).toBe(0);
    expect(calcularMdc(12.8, 450, 0)).toBe(0);
  });

  it('valores negativos/NaN → 0 (defensivo)', () => {
    expect(calcularMdc(-1, 450, 220)).toBe(0);
    expect(calcularMdc(12.8, -1, 220)).toBe(0);
    expect(calcularMdc(12.8, 450, -1)).toBe(0);
    expect(calcularMdc(Number.NaN, 450, 220)).toBe(0);
    expect(calcularMdc(12.8, Number.NaN, 220)).toBe(0);
  });

  it('roundtrip: derivarCargasDoMdc inverte calcularMdc', () => {
    const mdc = calcularMdc(12.8, 450, 220);
    const cargas = derivarCargasDoMdc(mdc, 450, 220);
    expect(cargas).toBeCloseTo(12.8, 6);
  });
});
