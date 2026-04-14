import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type { DesviosResult } from '@/lib/calculation/desvios';

function fmt(n: number | null, digits = 3, suffix = '') {
  if (n === null) return '—';
  return `${n.toLocaleString('pt-BR', { minimumFractionDigits: digits, maximumFractionDigits: digits })}${suffix}`;
}

function classePct(p: number | null, tol: number, atencao: number) {
  if (p === null) return '';
  const abs = Math.abs(p);
  if (abs <= tol) return 'text-emerald-600';
  if (abs <= atencao) return 'text-amber-600';
  return 'text-destructive';
}

type Props = {
  desvios: DesviosResult;
  tolerancia?: number;
  atencao?: number;
};

export function DesviosCard({ desvios, tolerancia = 0.05, atencao = 0.15 }: Props) {
  const tem =
    desvios.gusa.some((i) => i.real !== null) ||
    desvios.escoria.some((i) => i.real !== null);

  return (
    <Card data-testid="desvios-card">
      <CardHeader>
        <CardTitle className="text-base">Desvios previsto × real</CardTitle>
        <CardDescription>
          {tem
            ? 'Comparação entre snapshot previsto e análise química medida.'
            : 'Sem análise química real registrada ainda.'}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {(['gusa', 'escoria'] as const).map((bloco) => (
          <div key={bloco}>
            <h3 className="mb-2 text-xs font-semibold uppercase text-muted-foreground">
              {bloco === 'gusa' ? 'Gusa' : 'Escória'}
            </h3>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Campo</TableHead>
                  <TableHead>Previsto</TableHead>
                  <TableHead>Real</TableHead>
                  <TableHead>Δ absoluto</TableHead>
                  <TableHead>Δ %</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {desvios[bloco].map((i) => (
                  <TableRow key={i.campo}>
                    <TableCell className="text-sm">{i.campo}</TableCell>
                    <TableCell className="tabular-nums">{fmt(i.previsto)}</TableCell>
                    <TableCell className="tabular-nums">{fmt(i.real)}</TableCell>
                    <TableCell className="tabular-nums">{fmt(i.desvio)}</TableCell>
                    <TableCell className={`tabular-nums ${classePct(i.desvioPct, tolerancia, atencao)}`}>
                      {i.desvioPct === null ? '—' : fmt(i.desvioPct * 100, 2, '%')}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
