import { describe, it, expect } from 'vitest';

import type { LaminaResultado } from '@/lib/calculation/types';
import {
  calcularKPIs,
  paretoCustos,
  serieMargemTon,
  type SimulacaoAgregado,
} from '@/lib/relatorios/agregados';

const baseResultado: LaminaResultado = {
  blend: { fe: 63, sio2: 4, al2o3: 2.5, p: 0.06, mn: 0.15, cao: 0.1, mgo: 0.08, ppc: 0, precoMedio: 400 },
  producao: {
    rendimentoTeorico: 0.62,
    fatorEstabilidade: 1,
    rendimentoEfetivo: 0.62,
    consumoMinerioCorrida: 14,
    gusaVazado: 8.7,
    sucataGerada: 0,
    producaoTotal: 8.7,
  },
  escoria: {
    sio2Ton: 1, al2o3Ton: 0.3, caoTon: 0.85, mgoTon: 0.1,
    volumeTon: 2.25, volumePorTonGusa: 259, b2: 0.85, b4: 0.7,
    al2o3Pct: 13.3, mgoAl2o3: 0.33, calcarioNecessario: 1,
  },
  gusa: { p: 0.1, si: 0.5, mn: 0.15, s: 0.025, c: 4.2 },
  financeiro: {
    custoMaterias: 100, custoQuebras: 20, custoFixo: 50, custoFrete: 30,
    custoTotal: 250, custoPorTonGusa: 2500, receitaGusa: 22000,
    receitaSucata: 0, creditoFuturoReprocesso: 0, faturamentoTotal: 22000,
    debitoTributos: 500, creditoTributos: 200, tributosLiquidos: 300,
    margemPorTon: 190, resultadoCorrida: 1000, resultadoProjetadoMes: 480_000,
  },
  validacao: {
    specCliente: { p: true, si: true, mn: true, s: true, c: true },
    escoria: { al2o3OK: true, mgoAl2o3OK: true, b2OK: true },
    classificacao: 'viavel',
    alertas: [],
    erros: [],
  },
};

type Patches = {
  margem?: number;
  custo?: number;
  gusa?: number;
  p?: number; si?: number;
  specP?: boolean;
};

function mkResultado(p: Patches = {}): LaminaResultado {
  return {
    ...baseResultado,
    blend: baseResultado.blend,
    producao: { ...baseResultado.producao, gusaVazado: p.gusa ?? baseResultado.producao.gusaVazado },
    escoria: baseResultado.escoria,
    gusa: {
      ...baseResultado.gusa,
      ...(p.p !== undefined ? { p: p.p } : {}),
      ...(p.si !== undefined ? { si: p.si } : {}),
    },
    financeiro: {
      ...baseResultado.financeiro,
      ...(p.margem !== undefined ? { margemPorTon: p.margem } : {}),
      ...(p.custo !== undefined ? { custoPorTonGusa: p.custo } : {}),
    },
    validacao: {
      ...baseResultado.validacao,
      specCliente: {
        ...baseResultado.validacao.specCliente,
        ...(p.specP !== undefined ? { p: p.specP } : {}),
      },
    },
  };
}

function mk(
  over: Partial<Omit<SimulacaoAgregado, 'resultado'>> & { resultado?: LaminaResultado } = {},
): SimulacaoAgregado {
  return {
    id: 'id-1',
    nome: 'T',
    tipo: 'simulacao',
    classificacao: 'viavel',
    created_at: '2026-04-01T10:00:00Z',
    corrida_timestamp: null,
    cliente_id: null,
    resultado: baseResultado,
    analise_gusa_real: null,
    ...over,
  };
}

describe('calcularKPIs', () => {
  it('lista vazia: zeros e nulls', () => {
    const k = calcularKPIs([]);
    expect(k.totalCorridas).toBe(0);
    expect(k.producaoTotalTon).toBe(0);
    expect(k.margemMediaPonderada).toBeNull();
    expect(k.pctDentroSpec).toBeNull();
    expect(k.maiorMargem).toBeNull();
    expect(k.menorMargem).toBeNull();
  });

  it('1 corrida: margem ponderada = própria margem', () => {
    const k = calcularKPIs([mk({})]);
    expect(k.totalCorridas).toBe(1);
    expect(k.margemMediaPonderada).toBe(190);
    expect(k.porClassificacao.viavel).toBe(1);
  });

  it('média ponderada por produção (peso = gusaVazado)', () => {
    const a = mk({ id: 'a', resultado: mkResultado({ margem: 100, custo: 2400, gusa: 10 }) });
    const b = mk({ id: 'b', resultado: mkResultado({ margem: 200, custo: 2600, gusa: 30 }) });
    const k = calcularKPIs([a, b]);
    expect(k.margemMediaPonderada).toBeCloseTo(175, 6);
    expect(k.custoMedioPonderado).toBeCloseTo(2550, 6);
  });

  it('conta classificações corretamente', () => {
    const s = [
      mk({ id: '1', classificacao: 'viavel' }),
      mk({ id: '2', classificacao: 'viavel' }),
      mk({ id: '3', classificacao: 'alerta' }),
      mk({ id: '4', classificacao: 'inviavel' }),
    ];
    const k = calcularKPIs(s);
    expect(k.porClassificacao).toEqual({ viavel: 2, alerta: 1, inviavel: 1 });
  });

  it('maior/menor margem retornam ids corretos', () => {
    const a = mk({ id: 'a', nome: 'A', resultado: mkResultado({ margem: 50 }) });
    const b = mk({ id: 'b', nome: 'B', resultado: mkResultado({ margem: 300 }) });
    const k = calcularKPIs([a, b]);
    expect(k.maiorMargem?.id).toBe('b');
    expect(k.menorMargem?.id).toBe('a');
  });

  it('% dentro spec: 100% e 50%', () => {
    const ok = mk({});
    const fail = mk({ id: 'x', resultado: mkResultado({ specP: false }) });
    const k = calcularKPIs([ok, fail]);
    expect(k.pctDentroSpec).toBe(0.5);
  });

  it('desvios só agregam corridas reais com análise', () => {
    const simSemAnalise = mk({ id: 's', tipo: 'simulacao' });
    const corridaSem = mk({ id: 'c1', tipo: 'corrida_real' });
    const corridaCom = mk({
      id: 'c2',
      tipo: 'corrida_real',
      analise_gusa_real: { p: 0.11, si: 0.52 },
      resultado: mkResultado({ p: 0.1, si: 0.5 }),
    });
    const k = calcularKPIs([simSemAnalise, corridaSem, corridaCom]);
    expect(k.nCorridasComAnalise).toBe(1);
    expect(k.desvioMedioP).toBeCloseTo(0.1, 6);
    expect(k.desvioMedioSi).toBeCloseTo(0.04, 6);
    expect(k.desvioMedioMn).toBeNull();
  });
});

describe('serieMargemTon', () => {
  it('ordena por timestamp ASC', () => {
    const s = [
      mk({ id: '2', corrida_timestamp: '2026-04-02T10:00:00Z' }),
      mk({ id: '1', corrida_timestamp: '2026-04-01T10:00:00Z' }),
      mk({ id: '3', corrida_timestamp: '2026-04-03T10:00:00Z' }),
    ];
    const serie = serieMargemTon(s);
    expect(serie.map((p) => p.t)).toEqual([
      '2026-04-01T10:00:00Z',
      '2026-04-02T10:00:00Z',
      '2026-04-03T10:00:00Z',
    ]);
  });

  it('fallback para created_at se corrida_timestamp é null', () => {
    const s = [mk({ corrida_timestamp: null, created_at: '2026-04-01T00:00:00Z' })];
    expect(serieMargemTon(s)[0]!.t).toBe('2026-04-01T00:00:00Z');
  });
});

describe('paretoCustos', () => {
  it('ordena DESC por média', () => {
    const p = paretoCustos([mk({})]);
    expect(p.length).toBe(5);
    for (let i = 1; i < p.length; i++) {
      expect(p[i - 1]!.media).toBeGreaterThanOrEqual(p[i]!.media);
    }
  });

  it('lista vazia retorna []', () => {
    expect(paretoCustos([])).toEqual([]);
  });
});
