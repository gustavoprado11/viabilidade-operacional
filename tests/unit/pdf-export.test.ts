import { describe, it, expect } from 'vitest';

import { buildRelatorioPdf } from '@/lib/relatorios/pdf';
import type { KPIs, SimulacaoAgregado } from '@/lib/relatorios/agregados';

const kpisVazio: KPIs = {
  totalCorridas: 0,
  porClassificacao: { viavel: 0, alerta: 0, inviavel: 0 },
  producaoTotalTon: 0,
  margemMediaPonderada: null,
  custoMedioPonderado: null,
  resultadoTotalCorridas: 0,
  resultadoMesProjetadoMedio: null,
  maiorMargem: null,
  menorMargem: null,
  pctDentroSpec: null,
  desvioMedioP: null,
  desvioMedioSi: null,
  desvioMedioMn: null,
  nCorridasComAnalise: 0,
};

describe('buildRelatorioPdf', () => {
  it('gera bytes não-vazios com lista vazia', () => {
    const bytes = buildRelatorioPdf(
      kpisVazio,
      [] as unknown as SimulacaoAgregado[],
      '2026-04-01 a 2026-04-02',
      'teste@teste.com',
    );
    expect(bytes.length).toBeGreaterThan(500);
    // PDFs começam com %PDF-
    expect(String.fromCharCode(bytes[0]!, bytes[1]!, bytes[2]!, bytes[3]!, bytes[4]!)).toBe(
      '%PDF-',
    );
  });
});
