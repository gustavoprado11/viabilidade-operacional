import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

import type { KPIs, SimulacaoAgregado } from './agregados';

function brl(n: number | null | undefined): string {
  if (typeof n !== 'number' || !Number.isFinite(n)) return '—';
  return n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function pct(n: number | null | undefined, digits = 2): string {
  if (typeof n !== 'number' || !Number.isFinite(n)) return '—';
  return `${(n * 100).toFixed(digits)}%`;
}

/**
 * Gera PDF sem gráficos (v1): cabeçalho + KPIs em lista + tabela das primeiras
 * 20 corridas. Rodapé com data de geração.
 */
export function buildRelatorioPdf(
  kpis: KPIs,
  simulacoes: ReadonlyArray<SimulacaoAgregado>,
  periodoLabel: string,
  userLabel: string,
): Uint8Array {
  const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text('Siderúrgica Bandeirante', 40, 60);
  doc.setFontSize(12);
  doc.text(`Relatório — ${periodoLabel}`, 40, 80);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text(
    `Gerado em ${new Date().toLocaleString('pt-BR')} por ${userLabel}`,
    40,
    96,
  );
  doc.setTextColor(0);

  // Seção KPIs
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text('Resumo executivo', 40, 130);

  const kpiRows: [string, string][] = [
    ['Total de lâminas', String(kpis.totalCorridas)],
    [
      'Viáveis / Alerta / Inviáveis',
      `${kpis.porClassificacao.viavel} / ${kpis.porClassificacao.alerta} / ${kpis.porClassificacao.inviavel}`,
    ],
    ['Produção total (ton)', kpis.producaoTotalTon.toFixed(2)],
    ['Margem média ponderada', brl(kpis.margemMediaPonderada)],
    ['Custo médio ponderado', brl(kpis.custoMedioPonderado)],
    ['Resultado total das corridas', brl(kpis.resultadoTotalCorridas)],
    ['Resultado/mês médio projetado', brl(kpis.resultadoMesProjetadoMedio)],
    ['% dentro da spec do cliente', pct(kpis.pctDentroSpec)],
    ['Corridas com análise química', String(kpis.nCorridasComAnalise)],
    ['Desvio médio |P real−prev|', pct(kpis.desvioMedioP)],
    ['Desvio médio |Si real−prev|', pct(kpis.desvioMedioSi)],
    ['Desvio médio |Mn real−prev|', pct(kpis.desvioMedioMn)],
  ];
  if (kpis.maiorMargem)
    kpiRows.push([
      'Maior margem/ton',
      `${kpis.maiorMargem.nome} (${brl(kpis.maiorMargem.valor)})`,
    ]);
  if (kpis.menorMargem)
    kpiRows.push([
      'Menor margem/ton',
      `${kpis.menorMargem.nome} (${brl(kpis.menorMargem.valor)})`,
    ]);

  autoTable(doc, {
    startY: 140,
    head: [['Indicador', 'Valor']],
    body: kpiRows,
    theme: 'grid',
    styles: { fontSize: 9, cellPadding: 4 },
    headStyles: { fillColor: [15, 23, 42], textColor: 255 },
    columnStyles: { 0: { cellWidth: 240 } },
  });

  // Tabela de corridas (top 20)
  const topCorridas = simulacoes.slice(0, 20);
  const endKpis = (doc as unknown as { lastAutoTable?: { finalY?: number } }).lastAutoTable
    ?.finalY ?? 140;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text('Corridas do período (top 20)', 40, endKpis + 30);

  const bodyCorridas = topCorridas.map((s) => [
    s.nome,
    s.tipo === 'corrida_real' ? 'Real' : 'Sim.',
    s.classificacao === 'viavel'
      ? 'Viável'
      : s.classificacao === 'alerta'
      ? 'Alerta'
      : 'Inviável',
    s.resultado?.blend.fe.toFixed(2) ?? '—',
    s.resultado?.escoria.al2o3Pct.toFixed(2) ?? '—',
    s.resultado ? (s.resultado.producao.rendimentoEfetivo * 100).toFixed(2) : '—',
    brl(s.resultado?.financeiro.margemPorTon),
    brl(s.resultado?.financeiro.resultadoCorrida),
  ]);

  autoTable(doc, {
    startY: endKpis + 40,
    head: [
      [
        'Nome',
        'Tipo',
        'Class.',
        'Fe %',
        'Al₂O₃ esc %',
        'Rend. %',
        'Margem/t',
        'Resultado',
      ],
    ],
    body: bodyCorridas,
    theme: 'striped',
    styles: { fontSize: 8, cellPadding: 3 },
    headStyles: { fillColor: [15, 23, 42], textColor: 255 },
  });

  // Rodapé
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(120);
    doc.text(
      `Página ${i} de ${pageCount}`,
      pageWidth - 80,
      doc.internal.pageSize.getHeight() - 20,
    );
  }

  return new Uint8Array(doc.output('arraybuffer'));
}
