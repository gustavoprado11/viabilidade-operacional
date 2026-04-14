import Link from 'next/link';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type { SimulacaoAgregado } from '@/lib/relatorios/agregados';

const classColor: Record<string, string> = {
  viavel: 'text-emerald-600',
  alerta: 'text-amber-600',
  inviavel: 'text-destructive',
};

const brl = (n: number | undefined) =>
  typeof n === 'number' && Number.isFinite(n)
    ? n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
    : '—';

export function TabelaResumoCorridas({ simulacoes }: { simulacoes: SimulacaoAgregado[] }) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Nome</TableHead>
          <TableHead>Tipo</TableHead>
          <TableHead>Classificação</TableHead>
          <TableHead>Fe %</TableHead>
          <TableHead>Al₂O₃ esc %</TableHead>
          <TableHead>Margem/t</TableHead>
          <TableHead>Resultado</TableHead>
          <TableHead className="w-20 text-right"></TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {simulacoes.map((s) => {
          const r = s.resultado;
          return (
            <TableRow key={s.id} data-testid={`relatorio-row-${s.nome}`}>
              <TableCell className="font-medium">{s.nome}</TableCell>
              <TableCell>
                {s.tipo === 'corrida_real' ? 'Corrida real' : 'Simulação'}
              </TableCell>
              <TableCell className={classColor[s.classificacao] ?? ''}>
                {s.classificacao}
              </TableCell>
              <TableCell className="tabular-nums">
                {r ? r.blend.fe.toFixed(2) : '—'}
              </TableCell>
              <TableCell className="tabular-nums">
                {r ? r.escoria.al2o3Pct.toFixed(2) : '—'}
              </TableCell>
              <TableCell className="tabular-nums">
                {brl(r?.financeiro.margemPorTon)}
              </TableCell>
              <TableCell className="tabular-nums">
                {brl(r?.financeiro.resultadoCorrida)}
              </TableCell>
              <TableCell className="text-right">
                <Link
                  href={
                    s.tipo === 'corrida_real'
                      ? `/corridas/${s.id}`
                      : `/laminas/${s.id}`
                  }
                  className="text-xs underline"
                >
                  abrir
                </Link>
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
