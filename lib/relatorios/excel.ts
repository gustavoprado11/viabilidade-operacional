import ExcelJS from 'exceljs';

import type { KPIs, SimulacaoAgregado } from './agregados';

const CLASS_COLOR: Record<string, string> = {
  viavel: 'FFD1FAE5',
  alerta: 'FFFEF3C7',
  inviavel: 'FFFEE2E2',
};

function brl(n: number | null | undefined): string {
  if (typeof n !== 'number' || !Number.isFinite(n)) return '—';
  return n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function pct(n: number | null | undefined, digits = 2): string {
  if (typeof n !== 'number' || !Number.isFinite(n)) return '—';
  return `${(n * 100).toLocaleString('pt-BR', {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  })}%`;
}

/**
 * Gera XLSX com 3 abas: Resumo (KPIs), Corridas (tabela), Agregados por cliente.
 */
export async function buildRelatorioXlsx(
  kpis: KPIs,
  simulacoes: ReadonlyArray<SimulacaoAgregado>,
  periodoLabel: string,
  agregadosCliente: Array<{
    clienteNome: string;
    nCorridas: number;
    producaoTon: number;
    margemMedia: number | null;
    resultadoTotal: number;
  }>,
): Promise<Buffer> {
  const wb = new ExcelJS.Workbook();
  wb.creator = 'Siderúrgica Bandeirante';
  wb.created = new Date();

  // Aba 1: Resumo
  const wsResumo = wb.addWorksheet('Resumo');
  wsResumo.columns = [
    { header: 'Indicador', key: 'label', width: 40 },
    { header: 'Valor', key: 'valor', width: 30 },
  ];
  wsResumo.addRow({ label: 'Período', valor: periodoLabel });
  wsResumo.addRow({ label: 'Total de lâminas', valor: kpis.totalCorridas });
  wsResumo.addRow({
    label: 'Viáveis / Alerta / Inviáveis',
    valor: `${kpis.porClassificacao.viavel} / ${kpis.porClassificacao.alerta} / ${kpis.porClassificacao.inviavel}`,
  });
  wsResumo.addRow({ label: 'Produção total (ton)', valor: kpis.producaoTotalTon });
  wsResumo.addRow({
    label: 'Margem média ponderada (R$/ton)',
    valor: brl(kpis.margemMediaPonderada),
  });
  wsResumo.addRow({
    label: 'Custo médio ponderado (R$/ton)',
    valor: brl(kpis.custoMedioPonderado),
  });
  wsResumo.addRow({
    label: 'Resultado total das corridas (R$)',
    valor: brl(kpis.resultadoTotalCorridas),
  });
  wsResumo.addRow({
    label: 'Resultado/mês médio projetado (R$)',
    valor: brl(kpis.resultadoMesProjetadoMedio),
  });
  wsResumo.addRow({
    label: '% dentro da spec do cliente',
    valor: pct(kpis.pctDentroSpec),
  });
  wsResumo.addRow({
    label: 'Corridas com análise química',
    valor: kpis.nCorridasComAnalise,
  });
  wsResumo.addRow({
    label: 'Desvio médio |P real-prev| (%)',
    valor: pct(kpis.desvioMedioP),
  });
  wsResumo.addRow({
    label: 'Desvio médio |Si real-prev| (%)',
    valor: pct(kpis.desvioMedioSi),
  });
  wsResumo.addRow({
    label: 'Desvio médio |Mn real-prev| (%)',
    valor: pct(kpis.desvioMedioMn),
  });
  if (kpis.maiorMargem) {
    wsResumo.addRow({
      label: 'Maior margem/ton',
      valor: `${kpis.maiorMargem.nome} (${brl(kpis.maiorMargem.valor)})`,
    });
  }
  if (kpis.menorMargem) {
    wsResumo.addRow({
      label: 'Menor margem/ton',
      valor: `${kpis.menorMargem.nome} (${brl(kpis.menorMargem.valor)})`,
    });
  }
  wsResumo.getRow(1).font = { bold: true };

  // Aba 2: Corridas
  const wsCorridas = wb.addWorksheet('Corridas');
  wsCorridas.columns = [
    { header: 'Nome', key: 'nome', width: 32 },
    { header: 'Tipo', key: 'tipo', width: 14 },
    { header: 'Classificação', key: 'classificacao', width: 14 },
    { header: 'Criada em', key: 'criada', width: 20 },
    { header: 'Data corrida', key: 'corrida', width: 20 },
    { header: 'Fe blend %', key: 'fe', width: 11 },
    { header: 'Al₂O₃ esc %', key: 'al2o3', width: 13 },
    { header: 'B2', key: 'b2', width: 8 },
    { header: 'Rendimento %', key: 'rend', width: 13 },
    { header: 'Gusa (t)', key: 'gusa', width: 10 },
    { header: 'Custo/ton', key: 'custo', width: 14 },
    { header: 'Margem/ton', key: 'margem', width: 14 },
    { header: 'Resultado/corrida', key: 'resultado', width: 18 },
  ];
  for (const s of simulacoes) {
    const r = s.resultado;
    const row = wsCorridas.addRow({
      nome: s.nome,
      tipo: s.tipo === 'corrida_real' ? 'Corrida real' : 'Simulação',
      classificacao:
        s.classificacao === 'viavel'
          ? 'Viável'
          : s.classificacao === 'alerta'
          ? 'Alerta'
          : 'Inviável',
      criada: new Date(s.created_at).toLocaleString('pt-BR'),
      corrida: s.corrida_timestamp
        ? new Date(s.corrida_timestamp).toLocaleString('pt-BR')
        : '—',
      fe: r?.blend.fe,
      al2o3: r?.escoria.al2o3Pct,
      b2: r?.escoria.b2,
      rend: r ? r.producao.rendimentoEfetivo * 100 : null,
      gusa: r?.producao.gusaVazado,
      custo: r?.financeiro.custoPorTonGusa,
      margem: r?.financeiro.margemPorTon,
      resultado: r?.financeiro.resultadoCorrida,
    });
    const color = CLASS_COLOR[s.classificacao];
    if (color) {
      row.getCell('classificacao').fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: color },
      };
    }
  }
  wsCorridas.getRow(1).font = { bold: true };

  // Aba 3: Agregados por cliente
  const wsCli = wb.addWorksheet('Por cliente');
  wsCli.columns = [
    { header: 'Cliente', key: 'nome', width: 30 },
    { header: 'N corridas', key: 'n', width: 12 },
    { header: 'Produção (t)', key: 'prod', width: 14 },
    { header: 'Margem média R$/t', key: 'margem', width: 18 },
    { header: 'Resultado total (R$)', key: 'result', width: 20 },
  ];
  for (const a of agregadosCliente) {
    wsCli.addRow({
      nome: a.clienteNome,
      n: a.nCorridas,
      prod: a.producaoTon,
      margem: brl(a.margemMedia),
      result: brl(a.resultadoTotal),
    });
  }
  wsCli.getRow(1).font = { bold: true };

  const buffer = await wb.xlsx.writeBuffer();
  return Buffer.from(buffer);
}
