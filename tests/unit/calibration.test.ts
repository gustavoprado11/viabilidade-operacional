import { describe, it, expect } from 'vitest';

import {
  calcularEstatisticasDesvios,
  gerarRecomendacoes,
  type DesvioHistoricoInput,
} from '@/lib/calculation/calibration';
import type { LaminaResultado } from '@/lib/calculation/types';
import { parametros } from '@/tests/fixtures/parametros';

const previstoBase: LaminaResultado = {
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
    calcarioNecessario: 1, contribuicoes: { sio2: { minerio: 0, bauxita: 0, calcario: 0, dolomita: 0 }, al2o3: { minerio: 0, bauxita: 0, calcario: 0, dolomita: 0 }, cao: { minerio: 0, bauxita: 0, calcario: 0, dolomita: 0 }, mgo: { minerio: 0, bauxita: 0, calcario: 0, dolomita: 0 } },
  },
  gusa: { p: 0.1, si: 0.5, mn: 0.15, s: 0.025, c: 4.2 },
  financeiro: {
    custoMaterias: 0, custoQuebras: 0, custoFixo: 0, custoFrete: 0,
    custoTotal: 0, custoPorTonGusa: 0, receitaGusa: 0, receitaSucata: 0,
    creditoFuturoReprocesso: 0, faturamentoTotal: 0, debitoTributos: 0,
    creditoTributos: 0, tributosLiquidos: 0, margemPorTon: 0,
    resultadoCorrida: 0, resultadoProjetadoMes: 0,
  },
  validacao: { specCliente: { p: true, si: true, mn: true, s: true, c: true }, escoria: { al2o3OK: true, mgoAl2o3OK: true, b2OK: true }, classificacao: 'viavel', alertas: [], erros: [] },
};

function historico(
  n: number,
  gusaReal: Partial<{ p: number; si: number; mn: number; s: number; c: number }>,
): DesvioHistoricoInput[] {
  return Array.from({ length: n }, (_, i) => ({
    corridaId: `c-${i}`,
    timestamp: new Date(2026, 3, i + 1).toISOString(),
    previsto: previstoBase,
    gusaReal,
    escoriaReal: null,
  }));
}

describe('calcularEstatisticasDesvios', () => {
  it('histórico vazio: todos os campos com n=0', () => {
    const s = calcularEstatisticasDesvios([]);
    expect(s.length).toBe(10);
    expect(s.every((x) => x.n === 0)).toBe(true);
    expect(s.every((x) => x.confianca === 'baixa')).toBe(true);
  });

  it('5 amostras com P real 0.11 vs previsto 0.1: média +10%, confiança baixa', () => {
    const s = calcularEstatisticasDesvios(historico(5, { p: 0.11 }));
    const p = s.find((x) => x.campo === 'gusa.p')!;
    expect(p.n).toBe(5);
    expect(p.mediaDesvioAbs).toBeCloseTo(0.01, 6);
    expect(p.mediaDesvioPct).toBeCloseTo(0.1, 6);
    expect(p.tendencia).toBe('previsto_subestima');
    expect(p.confianca).toBe('baixa');
  });

  it('10 amostras sobem para confiança média', () => {
    const s = calcularEstatisticasDesvios(historico(10, { p: 0.11 }));
    expect(s.find((x) => x.campo === 'gusa.p')!.confianca).toBe('media');
  });

  it('30 amostras: confiança alta', () => {
    const s = calcularEstatisticasDesvios(historico(30, { p: 0.11 }));
    expect(s.find((x) => x.campo === 'gusa.p')!.confianca).toBe('alta');
  });

  it('tendência neutro quando média próxima de zero', () => {
    const s = calcularEstatisticasDesvios(historico(20, { p: 0.1 }));
    expect(s.find((x) => x.campo === 'gusa.p')!.tendencia).toBe('neutro');
  });

  it('tendência previsto_superestima quando real < previsto', () => {
    const s = calcularEstatisticasDesvios(historico(20, { p: 0.09 }));
    expect(s.find((x) => x.campo === 'gusa.p')!.tendencia).toBe(
      'previsto_superestima',
    );
  });

  it('campos sem medição real são ignorados (n=0 sem NaN)', () => {
    const s = calcularEstatisticasDesvios(historico(10, { p: 0.11 }));
    const si = s.find((x) => x.campo === 'gusa.si')!;
    expect(si.n).toBe(0);
    expect(Number.isNaN(si.mediaDesvioPct)).toBe(false);
  });
});

describe('gerarRecomendacoes', () => {
  it('confiança baixa: nenhuma recomendação', () => {
    const s = calcularEstatisticasDesvios(historico(5, { p: 0.11 }));
    const r = gerarRecomendacoes(s, parametros);
    expect(r).toHaveLength(0);
  });

  it('confiança média + desvio consistente: recomenda ajuste incremental (50% do caminho)', () => {
    // 15 amostras todas com P real 0.11 (10% acima)
    const s = calcularEstatisticasDesvios(historico(15, { p: 0.11 }));
    const r = gerarRecomendacoes(s, parametros);
    const rec = r.find((x) => x.parametro === 'particaoPGusa');
    expect(rec).toBeDefined();
    // 0.95 × (1 + 0.10 × 0.5) = 0.9975
    expect(rec!.valorSugerido).toBeCloseTo(0.9975, 3);
    expect(rec!.baseadoEmNCorridas).toBe(15);
    expect(rec!.confianca).toBe('media');
  });

  it('ruído alto (σ > 50% da |média|): não recomenda', () => {
    // 15 amostras alternando: 0.05 e 0.15 → média 0.10 (neutro contra previsto 0.1),
    // mas sd alto. Melhor: 0.11 e 0.13 (média 0.12 → +20%, sd grande)
    const hist: DesvioHistoricoInput[] = [];
    for (let i = 0; i < 15; i++) {
      hist.push({
        corridaId: `c-${i}`,
        timestamp: new Date(2026, 3, i + 1).toISOString(),
        previsto: previstoBase,
        gusaReal: { p: i % 2 === 0 ? 0.05 : 0.2 }, // ruído violento
        escoriaReal: null,
      });
    }
    const s = calcularEstatisticasDesvios(hist);
    const r = gerarRecomendacoes(s, parametros);
    expect(r.find((x) => x.parametro === 'particaoPGusa')).toBeUndefined();
  });

  it('tendência neutra: não recomenda', () => {
    const s = calcularEstatisticasDesvios(historico(20, { p: 0.1 }));
    const r = gerarRecomendacoes(s, parametros);
    expect(r.find((x) => x.parametro === 'particaoPGusa')).toBeUndefined();
  });

  it('recomendação respeita min/max do parâmetro (clamp)', () => {
    // Desvio gigantesco: P real 0.3 vs 0.1 → +200%; passo 50% → +100%; atual 0.95 × 2 = 1.9
    // Clamp máx 1.0
    const s = calcularEstatisticasDesvios(historico(30, { p: 0.3 }));
    // Com ruído 0 (mesmos valores), passa no filtro
    const r = gerarRecomendacoes(s, parametros);
    const rec = r.find((x) => x.parametro === 'particaoPGusa')!;
    expect(rec.valorSugerido).toBeLessThanOrEqual(1);
    expect(rec.valorSugerido).toBeGreaterThanOrEqual(0.5);
  });

  it('C e S: ajuste absoluto (valor fixo)', () => {
    const s = calcularEstatisticasDesvios(historico(20, { c: 4.3 }));
    const r = gerarRecomendacoes(s, parametros);
    const rec = r.find((x) => x.parametro === 'cGusaFixo')!;
    // atual 4.2, mediaAbs = 0.1, passo 0.5 → sugerido 4.25
    expect(rec.valorSugerido).toBeCloseTo(4.25, 3);
  });
});
