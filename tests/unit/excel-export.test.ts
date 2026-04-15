import ExcelJS from 'exceljs';
import { describe, it, expect } from 'vitest';

import { buildRelatorioXlsx } from '@/lib/relatorios/excel';
import type { KPIs, SimulacaoAgregado } from '@/lib/relatorios/agregados';
import type { LaminaResultado } from '@/lib/calculation/types';

const kpis: KPIs = {
  totalCorridas: 2,
  porClassificacao: { viavel: 1, alerta: 1, inviavel: 0 },
  producaoTotalTon: 17.4,
  margemMediaPonderada: 175,
  custoMedioPonderado: 2550,
  resultadoTotalCorridas: 2000,
  resultadoMesProjetadoMedio: 960_000,
  maiorMargem: { id: 'b', nome: 'B', valor: 300 },
  menorMargem: { id: 'a', nome: 'A', valor: 50 },
  pctDentroSpec: 0.5,
  desvioMedioP: 0.1,
  desvioMedioSi: 0.04,
  desvioMedioMn: null,
  nCorridasComAnalise: 1,
};

const resultado: LaminaResultado = {
  blend: { fe: 63, sio2: 4, al2o3: 2.5, p: 0.06, mn: 0.15, cao: 0.1, mgo: 0.08, ppc: 0, precoMedio: 400 },
  producao: {
    rendimentoTeorico: 0.62, fatorEstabilidade: 1, rendimentoEfetivo: 0.62,
    consumoMinerioCorrida: 14, gusaVazado: 8.7, sucataGerada: 0, producaoTotal: 8.7,
  },
  escoria: {
    sio2Ton: 1, al2o3Ton: 0.3, caoTon: 0.85, mgoTon: 0.1, volumeTon: 2.25,
    volumePorTonGusa: 259, b2: 0.85, b4: 0.7, al2o3Pct: 13.3, mgoAl2o3: 0.33,
    calcarioNecessario: 1, contribuicoes: { sio2: { minerio: 0, bauxita: 0, calcario: 0, dolomita: 0 }, al2o3: { minerio: 0, bauxita: 0, calcario: 0, dolomita: 0 }, cao: { minerio: 0, bauxita: 0, calcario: 0, dolomita: 0 }, mgo: { minerio: 0, bauxita: 0, calcario: 0, dolomita: 0 } },
  },
  gusa: { p: 0.1, si: 0.5, mn: 0.15, s: 0.025, c: 4.2 },
  financeiro: {
    custoMaterias: 100, custoQuebras: 20, custoFixo: 50, custoFrete: 30,
    custoTotal: 250, custoPorTonGusa: 2500, receitaGusa: 22000, receitaSucata: 0,
    creditoFuturoReprocesso: 0, faturamentoTotal: 22000, debitoTributos: 500,
    creditoTributos: 200, tributosLiquidos: 300, margemPorTon: 190,
    resultadoCorrida: 1000, resultadoProjetadoMes: 480_000,
  },
  validacao: {
    specCliente: { p: true, si: true, mn: true, s: true, c: true },
    escoria: { al2o3OK: true, mgoAl2o3OK: true, b2OK: true },
    classificacao: 'viavel', alertas: [], erros: [],
  },
};

const simulacoes: SimulacaoAgregado[] = [
  {
    id: 'a', nome: 'Sim A', tipo: 'simulacao', classificacao: 'viavel',
    created_at: '2026-04-01T10:00:00Z', corrida_timestamp: null, cliente_id: 'cli-1',
    resultado, analise_gusa_real: null,
  },
  {
    id: 'b', nome: 'Corrida B', tipo: 'corrida_real', classificacao: 'alerta',
    created_at: '2026-04-02T10:00:00Z', corrida_timestamp: '2026-04-02T10:00:00Z',
    cliente_id: 'cli-1', resultado, analise_gusa_real: { p: 0.11 },
  },
];

describe('buildRelatorioXlsx', () => {
  it('retorna buffer não-vazio', async () => {
    const buf = await buildRelatorioXlsx(kpis, simulacoes, '2026-04-01 a 2026-04-02', []);
    expect(buf.length).toBeGreaterThan(1000);
  });

  it('workbook tem 3 abas com nomes corretos', async () => {
    const buf = await buildRelatorioXlsx(kpis, simulacoes, '2026-04-01 a 2026-04-02', [
      { clienteNome: 'Gusa Aciaria', nCorridas: 2, producaoTon: 17.4, margemMedia: 175, resultadoTotal: 2000 },
    ]);
    const wb = new ExcelJS.Workbook();
    await wb.xlsx.load(buf as unknown as ArrayBuffer);
    expect(wb.worksheets.map((w) => w.name)).toEqual(['Resumo', 'Corridas', 'Por cliente']);
  });

  it('aba Corridas tem N+1 linhas (header + simulações)', async () => {
    const buf = await buildRelatorioXlsx(kpis, simulacoes, 'x', []);
    const wb = new ExcelJS.Workbook();
    await wb.xlsx.load(buf as unknown as ArrayBuffer);
    const ws = wb.getWorksheet('Corridas')!;
    expect(ws.rowCount).toBe(simulacoes.length + 1);
  });

  it('formato vazio quando simulacoes = []', async () => {
    const buf = await buildRelatorioXlsx(kpis, [], 'x', []);
    const wb = new ExcelJS.Workbook();
    await wb.xlsx.load(buf as unknown as ArrayBuffer);
    const ws = wb.getWorksheet('Corridas')!;
    expect(ws.rowCount).toBe(1); // só header
  });
});
