import Link from 'next/link';

import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { listCorridas } from '@/lib/queries/corridas';

export const dynamic = 'force-dynamic';

const classLabel: Record<string, { label: string; color: string }> = {
  viavel: { label: 'Viável', color: 'text-emerald-600' },
  alerta: { label: 'Alerta', color: 'text-amber-600' },
  inviavel: { label: 'Inviável', color: 'text-destructive' },
};

export default async function CorridasPage() {
  const corridas = await listCorridas();

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Corridas reais</h1>
          <p className="text-sm text-muted-foreground">
            Histórico de corridas registradas. Ordenadas por data da corrida.
          </p>
        </div>
        <Button asChild>
          <Link href="/corridas/nova">Nova corrida</Link>
        </Button>
      </header>

      {corridas.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Nenhuma corrida registrada.
        </p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Data da corrida</TableHead>
              <TableHead>Classificação prevista</TableHead>
              <TableHead>Análise química?</TableHead>
              <TableHead className="w-32 text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {corridas.map((c) => {
              const cls = classLabel[c.classificacao] ?? {
                label: c.classificacao,
                color: '',
              };
              const temAnalise = c.analise_gusa_real || c.analise_escoria_real;
              return (
                <TableRow key={c.id} data-testid={`corrida-row-${c.nome}`}>
                  <TableCell className="font-medium">{c.nome}</TableCell>
                  <TableCell>
                    {c.corrida_timestamp
                      ? new Date(c.corrida_timestamp).toLocaleString('pt-BR')
                      : '—'}
                  </TableCell>
                  <TableCell className={cls.color}>{cls.label}</TableCell>
                  <TableCell>
                    {temAnalise ? (
                      <span className="text-xs text-emerald-600">✓ registrada</span>
                    ) : (
                      <span className="text-xs text-muted-foreground">pendente</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button asChild variant="outline" size="sm">
                      <Link href={`/corridas/${c.id}`}>Abrir</Link>
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
