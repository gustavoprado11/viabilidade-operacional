import { describe, it, expect } from 'vitest';

import { validarLamina } from '@/lib/calculation/validation';
import { clienteGusaAciaria, parametros } from '@/tests/fixtures/parametros';
import type {
  ContaminantesGusa,
  EscoriaResult,
} from '@/lib/calculation/types';

const escoriaOK: EscoriaResult = {
  sio2Ton: 1,
  al2o3Ton: 0.15,
  caoTon: 0.825,
  mgoTon: 0.05,
  volumeTon: 2,
  volumePorTonGusa: 200,
  b2: 0.825,
  b4: 0.7,
  al2o3Pct: 14,
  mgoAl2o3: 0.3,
  calcarioNecessario: 0.5,
};

const gusaOK: ContaminantesGusa = {
  p: 0.09,
  si: 0.5,
  mn: 0.13,
  s: 0.025,
  c: 4.2,
};

describe('validarLamina', () => {
  it('viável quando tudo está dentro dos alvos', () => {
    const v = validarLamina(gusaOK, escoriaOK, clienteGusaAciaria, parametros);
    expect(v.classificacao).toBe('viavel');
    expect(v.erros).toHaveLength(0);
    expect(v.alertas).toHaveLength(0);
  });

  it('inviável quando P_gusa > pMax', () => {
    const v = validarLamina(
      { ...gusaOK, p: 0.2 },
      escoriaOK,
      clienteGusaAciaria,
      parametros,
    );
    expect(v.classificacao).toBe('inviavel');
    expect(v.specCliente.p).toBe(false);
  });

  it('inviável quando C_gusa fora da faixa', () => {
    const v = validarLamina(
      { ...gusaOK, c: 5.0 },
      escoriaOK,
      clienteGusaAciaria,
      parametros,
    );
    expect(v.classificacao).toBe('inviavel');
  });

  it('fronteira Al2O3 = 16.99% → viável', () => {
    const v = validarLamina(
      gusaOK,
      { ...escoriaOK, al2o3Pct: 16.99 },
      clienteGusaAciaria,
      parametros,
    );
    expect(v.classificacao).toBe('alerta');
    expect(v.escoria.al2o3OK).toBe(true);
  });

  it('fronteira Al2O3 = 17.00% → viável/alerta (no limite, OK)', () => {
    const v = validarLamina(
      gusaOK,
      { ...escoriaOK, al2o3Pct: 17.0 },
      clienteGusaAciaria,
      parametros,
    );
    expect(v.escoria.al2o3OK).toBe(true);
    expect(v.classificacao).not.toBe('inviavel');
  });

  it('fronteira Al2O3 = 17.01% → inviável', () => {
    const v = validarLamina(
      gusaOK,
      { ...escoriaOK, al2o3Pct: 17.01 },
      clienteGusaAciaria,
      parametros,
    );
    expect(v.classificacao).toBe('inviavel');
    expect(v.escoria.al2o3OK).toBe(false);
  });

  it('alerta quando Al2O3 entre alvo_max (16) e limite (17)', () => {
    const v = validarLamina(
      gusaOK,
      { ...escoriaOK, al2o3Pct: 16.5 },
      clienteGusaAciaria,
      parametros,
    );
    expect(v.classificacao).toBe('alerta');
  });

  it('alerta quando MgO/Al2O3 < mínimo', () => {
    const v = validarLamina(
      gusaOK,
      { ...escoriaOK, mgoAl2o3: 0.1 },
      clienteGusaAciaria,
      parametros,
    );
    expect(v.classificacao).toBe('alerta');
    expect(v.escoria.mgoAl2o3OK).toBe(false);
  });

  it('alerta quando P no gusa a <5% do limite', () => {
    const v = validarLamina(
      { ...gusaOK, p: 0.148 }, // 0.148 vs 0.15 → margem < 5%
      escoriaOK,
      clienteGusaAciaria,
      parametros,
    );
    expect(v.classificacao).toBe('alerta');
  });

  it('alerta quando B2 fora do alvo mas dentro de ±5%', () => {
    // b2Alvo faixa 0.80-0.85; central 0.825; tolerância ~0.066
    const v = validarLamina(
      gusaOK,
      { ...escoriaOK, b2: 0.87 },
      clienteGusaAciaria,
      parametros,
    );
    expect(v.classificacao).toBe('alerta');
  });

  it('inviável quando B2 muito fora da faixa tolerável', () => {
    const v = validarLamina(
      gusaOK,
      { ...escoriaOK, b2: 0.3 },
      clienteGusaAciaria,
      parametros,
    );
    expect(v.classificacao).toBe('inviavel');
    expect(v.escoria.b2OK).toBe(false);
  });

  it('alerta quando Si/Mn/S próximos do limite e C próximo do mínimo', () => {
    const v = validarLamina(
      { p: 0.09, si: 0.96, mn: 0.96, s: 0.048, c: 3.6 },
      escoriaOK,
      clienteGusaAciaria,
      parametros,
    );
    expect(v.classificacao).toBe('alerta');
    expect(v.alertas.length).toBeGreaterThan(0);
  });
});
