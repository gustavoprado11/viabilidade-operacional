import { describe, it, expect } from 'vitest';

import { simulateLamina } from '@/lib/calculation/index';
import {
  generateCombinations,
  otimizarBlend,
} from '@/lib/calculation/optimizer';
import { corumba, serra, trindade } from '@/tests/fixtures/minerios';
import { makeInput } from '@/tests/fixtures/inputs';

describe('generateCombinations', () => {
  it('gera 231 combinações para 3 minérios / step 5', () => {
    const combos = generateCombinations(3, 5);
    expect(combos.length).toBe(231);
  });

  it('cada combinação soma 100', () => {
    const combos = generateCombinations(3, 5);
    for (const c of combos) {
      expect(c.reduce((a, b) => a + b, 0)).toBe(100);
    }
  });

  it('step 10 gera 66 combinações para 3 minérios', () => {
    const combos = generateCombinations(3, 10);
    // C(10+2, 2) = C(12,2) = 66
    expect(combos.length).toBe(66);
  });
});

describe('otimizarBlend', () => {
  it('retorna no máximo topN resultados', () => {
    const base = makeInput([{ minerio: serra, pct: 100 }]);
    const { blend: _, ...baseInput } = base;
    const top = otimizarBlend(
      [serra, trindade, corumba],
      { al2o3EscoriaMax: 17 },
      baseInput,
      5,
      5,
    );
    expect(top.length).toBeLessThanOrEqual(5);
  });

  it('todos os resultados respeitam al2o3EscoriaMax', () => {
    const base = makeInput([{ minerio: serra, pct: 100 }]);
    const { blend: _, ...baseInput } = base;
    const top = otimizarBlend(
      [serra, trindade, corumba],
      { al2o3EscoriaMax: 17 },
      baseInput,
      5,
    );
    for (const r of top) {
      expect(r.escoria.al2o3Pct).toBeLessThanOrEqual(17);
    }
  });

  it('nenhum resultado classificado como inviavel', () => {
    const base = makeInput([{ minerio: serra, pct: 100 }]);
    const { blend: _, ...baseInput } = base;
    const top = otimizarBlend([serra, trindade, corumba], {}, baseInput, 5);
    for (const r of top) {
      expect(r.validacao.classificacao).not.toBe('inviavel');
    }
  });

  it('ranking DESC por resultadoCorrida', () => {
    const base = makeInput([{ minerio: serra, pct: 100 }]);
    const { blend: _, ...baseInput } = base;
    const top = otimizarBlend([serra, trindade, corumba], {}, baseInput, 5);
    for (let i = 1; i < top.length; i++) {
      expect(top[i - 1]!.financeiro.resultadoCorrida).toBeGreaterThanOrEqual(
        top[i]!.financeiro.resultadoCorrida,
      );
    }
  });

  it('filtro feMin descarta resultados abaixo', () => {
    const base = makeInput([{ minerio: serra, pct: 100 }]);
    const { blend: _, ...baseInput } = base;
    const top = otimizarBlend(
      [serra, trindade, corumba],
      { feMin: 63.5 },
      baseInput,
      10,
    );
    for (const r of top) expect(r.blend.fe).toBeGreaterThanOrEqual(63.5);
  });

  it('filtro feMax descarta resultados acima', () => {
    const base = makeInput([{ minerio: serra, pct: 100 }]);
    const { blend: _, ...baseInput } = base;
    const top = otimizarBlend(
      [serra, trindade, corumba],
      { feMax: 62.5 },
      baseInput,
      10,
    );
    for (const r of top) expect(r.blend.fe).toBeLessThanOrEqual(62.5);
  });

  it('filtro custoTonMax descarta resultados acima', () => {
    const base = makeInput([{ minerio: serra, pct: 100 }]);
    const { blend: _, ...baseInput } = base;
    const top = otimizarBlend(
      [serra, trindade, corumba],
      { custoTonMax: 2500 },
      baseInput,
      10,
    );
    for (const r of top)
      expect(r.financeiro.custoPorTonGusa).toBeLessThanOrEqual(2500);
  });

  it('otimizador propaga dolomita custom via baseInput (simulação direta reflete MgO/Al₂O₃ maior)', () => {
    // Não usa otimizarBlend aqui porque ele filtra inviáveis; testa direto
    // a forma como otimizarBlend spread-a baseInput em cada iteração.
    const base = makeInput([{ minerio: serra, pct: 50 }, { minerio: trindade, pct: 50 }]);
    const { blend, ...rest } = base;
    const simSem = simulateLamina({ ...rest, blend });
    const simCom = simulateLamina({
      ...rest,
      blend,
      fundentes: {
        ...rest.fundentes,
        dolomita: { ...rest.fundentes.dolomita, kg: 5000 },
      },
    });
    expect(simCom.escoria.mgoAl2o3).toBeGreaterThan(simSem.escoria.mgoAl2o3);
    // E otimizarBlend não deve lançar ao receber baseInput com dolomita custom.
    expect(() =>
      otimizarBlend(
        [serra, trindade, corumba],
        {},
        {
          ...rest,
          fundentes: {
            ...rest.fundentes,
            dolomita: { ...rest.fundentes.dolomita, kg: 5000 },
          },
        },
        10,
        5,
      ),
    ).not.toThrow();
  });

  it('dolomita alta reduz Al₂O₃% da escória via diluição', () => {
    const base = makeInput([{ minerio: serra, pct: 50 }, { minerio: trindade, pct: 50 }]);
    const simSem = simulateLamina(base);
    const simCom = simulateLamina({
      ...base,
      fundentes: {
        ...base.fundentes,
        dolomita: { ...base.fundentes.dolomita, kg: 10000 },
      },
    });
    expect(simCom.escoria.al2o3Pct).toBeLessThan(simSem.escoria.al2o3Pct);
  });

  it('lista vazia retorna vazio', () => {
    const base = makeInput([{ minerio: serra, pct: 100 }]);
    const { blend: _, ...baseInput } = base;
    const top = otimizarBlend([], {}, baseInput, 5);
    expect(top).toHaveLength(0);
  });
});
