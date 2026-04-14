import Link from 'next/link';

import { DeleteButton } from '@/components/cadastros/DeleteButton';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { deletarMinerioAction } from '@/lib/actions/minerio-actions';
import { listMineriosAtivos } from '@/lib/queries/minerios';

export const dynamic = 'force-dynamic';

export default async function MineriosPage() {
  const minerios = await listMineriosAtivos();

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Minérios</h1>
          <p className="text-sm text-muted-foreground">
            Fornecedores de minério e análise química.
          </p>
        </div>
        <Button asChild>
          <Link href="/cadastros/minerios/novo">Novo minério</Link>
        </Button>
      </header>

      {minerios.length === 0 ? (
        <p className="text-sm text-muted-foreground">Nenhum minério ativo.</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>R$/ton</TableHead>
              <TableHead>Fe</TableHead>
              <TableHead>SiO₂</TableHead>
              <TableHead>Al₂O₃</TableHead>
              <TableHead>P</TableHead>
              <TableHead>Mn</TableHead>
              <TableHead>Validada?</TableHead>
              <TableHead className="w-40 text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {minerios.map((m) => (
              <TableRow key={m.id} data-testid={`minerio-row-${m.nome}`}>
                <TableCell className="font-medium">{m.nome}</TableCell>
                <TableCell data-testid={`minerio-preco-${m.nome}`}>
                  {Number(m.preco_ton).toFixed(2)}
                </TableCell>
                <TableCell>{m.fe_pct}</TableCell>
                <TableCell>{m.sio2_pct}</TableCell>
                <TableCell>{m.al2o3_pct}</TableCell>
                <TableCell>{m.p_pct}</TableCell>
                <TableCell>{m.mn_pct}</TableCell>
                <TableCell>
                  {m.analise_validada ? (
                    <span className="text-xs font-medium text-emerald-600">
                      ✓ validada
                    </span>
                  ) : (
                    <span className="text-xs text-muted-foreground">estimada</span>
                  )}
                </TableCell>
                <TableCell className="flex justify-end gap-2">
                  <Button asChild variant="outline" size="sm">
                    <Link href={`/cadastros/minerios/${m.id}`}>Editar</Link>
                  </Button>
                  <DeleteButton
                    entity="minério"
                    onConfirm={deletarMinerioAction.bind(null, m.id)}
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
