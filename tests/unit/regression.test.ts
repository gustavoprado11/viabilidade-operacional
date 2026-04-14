/**
 * Regressão Python → TypeScript — suíte parcial.
 *
 * Campos validados por lâmina estão definidos em reference-laminas.ts
 * (história e motivos). Tolerância: ±1% relativo. Classificação: string match.
 *
 * Divergência > 1% = teste vermelho. NÃO ajustar o motor para casar — cada
 * divergência é discussão com o PO.
 */

import { describe, it, expect } from 'vitest';

import { simulateLamina } from '@/lib/calculation';
import {
  CORRIDAS_POR_DIA,
  laminasRegressao,
  type LaminaExpected,
} from '@/tests/fixtures/reference-laminas';

const TOLERANCIA = 0.01;

function expectWithin(
  label: string,
  esperado: number,
  obtido: number,
  tol = TOLERANCIA,
): void {
  if (Math.abs(esperado) < 1e-9) {
    expect(Math.abs(obtido), `${label}: esperado ~0, obtido ${obtido}`).toBeLessThan(
      1e-9,
    );
    return;
  }
  const erroRel = Math.abs(obtido - esperado) / Math.abs(esperado);
  expect(
    erroRel,
    `${label}: esperado ${esperado}, obtido ${obtido}, desvio ${(erroRel * 100).toFixed(3)}% (limite ${(tol * 100).toFixed(0)}%)`,
  ).toBeLessThanOrEqual(tol);
}

describe('regressão blend_v4.py — suíte parcial (ver reference-laminas.ts)', () => {
  for (const lamina of laminasRegressao as ReadonlyArray<LaminaExpected>) {
    describe(lamina.nome, () => {
      const r = simulateLamina(lamina.input);

      it('Fe blend', () => expectWithin('Fe blend', lamina.blend.fe, r.blend.fe));
      it('SiO2 blend', () =>
        expectWithin('SiO2 blend', lamina.blend.sio2, r.blend.sio2));
      it('Al2O3 blend', () =>
        expectWithin('Al2O3 blend', lamina.blend.al2o3, r.blend.al2o3));

      if (lamina.rendimentoPct !== undefined) {
        it('Rendimento efetivo', () =>
          expectWithin(
            'rendimento %',
            lamina.rendimentoPct!,
            r.producao.rendimentoEfetivo * 100,
          ));
      }

      if (lamina.gusaVazadoDia !== undefined) {
        it('Gusa vazado (ton/dia)', () =>
          expectWithin(
            'gusa/dia',
            lamina.gusaVazadoDia!,
            r.producao.gusaVazado * CORRIDAS_POR_DIA,
          ));
      }

      it('Classificação', () => {
        expect(r.validacao.classificacao).toBe(lamina.classificacao);
      });
    });
  }
});
