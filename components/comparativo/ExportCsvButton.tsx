'use client';

import { Button } from '@/components/ui/button';
import { buildCsv, csvFilename, type CsvCell } from '@/lib/comparativo/csv';
import { ROWS, SECTIONS, type RowContext, type Simulacao } from '@/lib/comparativo/rows';
import type { Database } from '@/lib/supabase/types';

type Props = {
  laminas: Simulacao[];
  minerios: Database['public']['Tables']['minerios']['Row'][];
  clientes: Database['public']['Tables']['clientes']['Row'][];
};

export function ExportCsvButton({ laminas, minerios, clientes }: Props) {
  const handle = () => {
    const ctx: RowContext = {
      mineriosById: new Map(minerios.map((m) => [m.id, m])),
      clientesById: new Map(clientes.map((c) => [c.id, c])),
    };
    const header: CsvCell[] = ['Seção', 'Parâmetro', ...laminas.map((l) => l.nome)];
    const rows: CsvCell[][] = [header];
    for (const section of SECTIONS) {
      for (const row of ROWS.filter((r) => r.section === section)) {
        rows.push([
          section,
          row.label,
          ...laminas.map((l) => row.extract(l, ctx) ?? ''),
        ]);
      }
    }
    const csv = buildCsv(rows);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = csvFilename(new Date());
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Button variant="outline" onClick={handle} data-testid="export-csv">
      Exportar CSV
    </Button>
  );
}
