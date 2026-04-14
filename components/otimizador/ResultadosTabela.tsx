'use client';

import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type { LaminaResultado } from '@/lib/calculation/types';
import type { Database } from '@/lib/supabase/types';

type MinerioRow = Database['public']['Tables']['minerios']['Row'];

type OtimizacaoResult = LaminaResultado & {
  blendStr: string;
  pcts: number[];
};

const brl = (n: number) =>
  n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const pct = (n: number, d = 2) =>
  `${n.toLocaleString('pt-BR', { minimumFractionDigits: d, maximumFractionDigits: d })}%`;

const classColor: Record<string, string> = {
  viavel: 'text-emerald-600',
  alerta: 'text-amber-600',
  inviavel: 'text-destructive',
};

export function ResultadosTabela({
  resultados,
  minerios,
  onAbrir,
}: {
  resultados: OtimizacaoResult[];
  minerios: MinerioRow[];
  onAbrir: (r: OtimizacaoResult) => void;
}) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-10">#</TableHead>
          <TableHead>Blend</TableHead>
          <TableHead>Fe blend</TableHead>
          <TableHead>Al₂O₃ esc</TableHead>
          <TableHead>Rendimento</TableHead>
          <TableHead>Gusa/corrida</TableHead>
          <TableHead>Custo/ton</TableHead>
          <TableHead>Margem/ton</TableHead>
          <TableHead>Resultado/mês</TableHead>
          <TableHead>Classif.</TableHead>
          <TableHead className="w-32 text-right">Ação</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {resultados.map((r, i) => (
          <TableRow key={i} data-testid={`opt-row-${i}`}>
            <TableCell>{i + 1}</TableCell>
            <TableCell className="text-sm">
              {minerios
                .map((m, j) => `${m.nome}: ${r.pcts[j]}%`)
                .join(' · ')}
            </TableCell>
            <TableCell className="tabular-nums">{pct(r.blend.fe)}</TableCell>
            <TableCell className="tabular-nums">{pct(r.escoria.al2o3Pct)}</TableCell>
            <TableCell className="tabular-nums">
              {pct(r.producao.rendimentoEfetivo * 100)}
            </TableCell>
            <TableCell className="tabular-nums">
              {r.producao.gusaVazado.toFixed(2)} t
            </TableCell>
            <TableCell className="tabular-nums">
              {brl(r.financeiro.custoPorTonGusa)}
            </TableCell>
            <TableCell className="tabular-nums">
              {brl(r.financeiro.margemPorTon)}
            </TableCell>
            <TableCell className="tabular-nums">
              {brl(r.financeiro.resultadoProjetadoMes)}
            </TableCell>
            <TableCell className={classColor[r.validacao.classificacao] ?? ''}>
              {r.validacao.classificacao}
            </TableCell>
            <TableCell className="text-right">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onAbrir(r)}
                data-testid={`abrir-${i}`}
              >
                Abrir
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
