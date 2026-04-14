'use client';

import { Button } from '@/components/ui/button';
import { buildCsv, csvFilename } from '@/lib/comparativo/csv';
import type { SimulacaoAgregado } from '@/lib/relatorios/agregados';

function brlRaw(n: number): number {
  return Number.isFinite(n) ? Math.round(n * 100) / 100 : NaN;
}

type Props = {
  simulacoes: SimulacaoAgregado[];
  hrefXlsx: string;
  hrefPdf: string;
};

export function BotoesExport({ simulacoes, hrefXlsx, hrefPdf }: Props) {
  const handleCsv = () => {
    const header = [
      'Nome',
      'Tipo',
      'Classificação',
      'Criada em',
      'Data corrida',
      'Fe blend %',
      'Al2O3 esc %',
      'B2',
      'Rendimento %',
      'Gusa (t)',
      'Custo/ton',
      'Margem/ton',
      'Resultado/corrida',
    ];
    const rows = [header];
    for (const s of simulacoes) {
      const r = s.resultado;
      rows.push([
        s.nome,
        s.tipo,
        s.classificacao,
        new Date(s.created_at).toLocaleString('pt-BR'),
        s.corrida_timestamp
          ? new Date(s.corrida_timestamp).toLocaleString('pt-BR')
          : '',
        r ? String(brlRaw(r.blend.fe)) : '',
        r ? String(brlRaw(r.escoria.al2o3Pct)) : '',
        r ? String(brlRaw(r.escoria.b2)) : '',
        r ? String(brlRaw(r.producao.rendimentoEfetivo * 100)) : '',
        r ? String(brlRaw(r.producao.gusaVazado)) : '',
        r ? String(brlRaw(r.financeiro.custoPorTonGusa)) : '',
        r ? String(brlRaw(r.financeiro.margemPorTon)) : '',
        r ? String(brlRaw(r.financeiro.resultadoCorrida)) : '',
      ]);
    }
    const csv = buildCsv(rows);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `relatorio-${csvFilename(new Date()).replace(/^comparativo-laminas-/, '')}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-wrap gap-2">
      <Button
        variant="outline"
        onClick={handleCsv}
        disabled={simulacoes.length === 0}
        data-testid="export-csv"
      >
        Exportar CSV
      </Button>
      <Button asChild variant="outline" disabled={simulacoes.length === 0}>
        <a href={hrefXlsx} data-testid="export-xlsx">
          Exportar Excel
        </a>
      </Button>
      <Button asChild variant="outline" disabled={simulacoes.length === 0}>
        <a href={hrefPdf} data-testid="export-pdf">
          Exportar PDF
        </a>
      </Button>
    </div>
  );
}
