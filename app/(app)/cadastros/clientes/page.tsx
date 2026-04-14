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
import { deletarClienteAction } from '@/lib/actions/cliente-actions';
import { listClientesAtivos } from '@/lib/queries/clientes';

export const dynamic = 'force-dynamic';

export default async function ClientesPage() {
  const clientes = await listClientesAtivos();

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Clientes</h1>
          <p className="text-sm text-muted-foreground">
            Specs químicas e preço de venda do gusa por cliente.
          </p>
        </div>
        <Button asChild>
          <Link href="/cadastros/clientes/novo">Novo cliente</Link>
        </Button>
      </header>

      {clientes.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Nenhum cliente cadastrado.
        </p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>P máx</TableHead>
              <TableHead>Si máx</TableHead>
              <TableHead>Mn máx</TableHead>
              <TableHead>C</TableHead>
              <TableHead>Preço R$/t</TableHead>
              <TableHead className="w-40 text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {clientes.map((c) => (
              <TableRow key={c.id} data-testid={`cliente-row-${c.nome}`}>
                <TableCell className="font-medium">{c.nome}</TableCell>
                <TableCell>{c.p_max}</TableCell>
                <TableCell>{c.si_max}</TableCell>
                <TableCell>{c.mn_max}</TableCell>
                <TableCell>
                  {c.c_min}–{c.c_max}
                </TableCell>
                <TableCell>{Number(c.preco_gusa_ton).toFixed(2)}</TableCell>
                <TableCell className="flex justify-end gap-2">
                  <Button asChild variant="outline" size="sm">
                    <Link href={`/cadastros/clientes/${c.id}`}>Editar</Link>
                  </Button>
                  <DeleteButton
                    entity="cliente"
                    onConfirm={deletarClienteAction.bind(null, c.id)}
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
