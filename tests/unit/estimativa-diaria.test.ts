import { describe, expect, it } from 'vitest';

import {
  calcularEstimativaDiaria,
  type SimulacaoResumida,
} from '@/lib/laminas/estimativa-diaria';

const mk = (overrides: Partial<SimulacaoResumida> = {}): SimulacaoResumida => ({
  gusaCorrida: 9,
  custoPorTonGusa: 2700,
  margemPorTon: 100,
  resultadoCorrida: 900,
  classificacao: 'viavel',
  ...overrides,
});

describe('calcularEstimativaDiaria', () => {
  it('N=0 retorna zero + observação "Nenhuma lâmina selecionada"', () => {
    const e = calcularEstimativaDiaria([], 16);
    expect(e.n).toBe(0);
    expect(e.gusaDia).toBe(0);
    expect(e.resultadoDia).toBe(0);
    expect(e.resultadoMes).toBe(0);
    expect(e.classificacoes).toEqual({ viavel: 0, alerta: 0, inviavel: 0 });
    expect(e.observacoes).toContain('Nenhuma lâmina selecionada');
  });

  it('N=1 projeta gusa_dia = gusa_corrida × 16 e adiciona observação', () => {
    const e = calcularEstimativaDiaria([mk({ gusaCorrida: 9.5 })], 16);
    expect(e.n).toBe(1);
    expect(e.gusaDia).toBeCloseTo(9.5 * 16, 6);
    expect(e.observacoes).toContain('Projeção baseada em 1 lâmina');
  });

  it('N múltiplas: média ponderada por gusa vazado', () => {
    // Lâmina A: 10 ton × 2000 R$/ton = 20 000
    // Lâmina B: 5 ton × 3000 R$/ton = 15 000
    // Soma: 35 000 ÷ 15 ton = 2333,33 R$/ton (≠ média aritmética 2500)
    const e = calcularEstimativaDiaria(
      [
        mk({ gusaCorrida: 10, custoPorTonGusa: 2000, margemPorTon: 200 }),
        mk({ gusaCorrida: 5, custoPorTonGusa: 3000, margemPorTon: 50 }),
      ],
      16,
    );
    expect(e.mediaCustoTon).toBeCloseTo(35_000 / 15, 4);
    expect(e.mediaMargemTon).toBeCloseTo((200 * 10 + 50 * 5) / 15, 4);
    // Média aritmética daria 2500 — certifica-se que NÃO é isso
    expect(e.mediaCustoTon).not.toBeCloseTo(2500, 0);
  });

  it('todas inviáveis dispara observação de projeção informativa', () => {
    const e = calcularEstimativaDiaria(
      [
        mk({ classificacao: 'inviavel' }),
        mk({ classificacao: 'inviavel' }),
      ],
      16,
    );
    expect(e.classificacoes.inviavel).toBe(2);
    expect(
      e.observacoes.some((o) => o.includes('Todas as lâminas filtradas são inviáveis')),
    ).toBe(true);
  });

  it('mix viável/alerta/inviável conta corretamente', () => {
    const e = calcularEstimativaDiaria(
      [
        mk({ classificacao: 'viavel' }),
        mk({ classificacao: 'viavel' }),
        mk({ classificacao: 'alerta' }),
        mk({ classificacao: 'inviavel' }),
      ],
      16,
    );
    expect(e.classificacoes).toEqual({ viavel: 2, alerta: 1, inviavel: 1 });
    // Nenhuma obs de "todas inviáveis" nem "1 lâmina"
    expect(e.observacoes).not.toContain('Projeção baseada em 1 lâmina');
    expect(
      e.observacoes.some((o) => o.includes('Todas as lâminas filtradas são inviáveis')),
    ).toBe(false);
  });

  it('corridasPorDia custom (12) reflete em gusaDia e resultadoDia', () => {
    const e = calcularEstimativaDiaria(
      [mk({ gusaCorrida: 10, resultadoCorrida: 1000 })],
      12,
    );
    expect(e.corridasPorDia).toBe(12);
    expect(e.gusaDia).toBeCloseTo(120, 6);
    expect(e.resultadoDia).toBeCloseTo(12_000, 6);
    expect(e.resultadoMes).toBeCloseTo(12_000 * 30, 6);
  });

  it('resultadoMes = resultadoDia × 30', () => {
    const e = calcularEstimativaDiaria(
      [mk({ resultadoCorrida: 500 }), mk({ resultadoCorrida: 700 })],
      16,
    );
    expect(e.resultadoMes).toBeCloseTo(e.resultadoDia * 30, 6);
  });
});
