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
import { deletarInsumoAction } from '@/lib/actions/insumo-actions';
import { listInsumosAtivos } from '@/lib/queries/insumos';

export const dynamic = 'force-dynamic';

const TIPO_LABEL: Record<string, string> = {
  calcario: 'Calcário',
  bauxita: 'Bauxita',
  dolomita: 'Dolomita',
  coque: 'Coque',
  carvao: 'Carvão',
  outro: 'Outro',
};

export default async function FundentesPage() {
  const insumos = await listInsumosAtivos();

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Fundentes e insumos</h1>
          <p className="text-sm text-muted-foreground">
            Calcário, bauxita, dolomita, coque e carvão vegetal.
          </p>
        </div>
        <Button asChild>
          <Link href="/cadastros/fundentes/novo">Novo insumo</Link>
        </Button>
      </header>

      {insumos.length === 0 ? (
        <p className="text-sm text-muted-foreground">Nenhum insumo ativo.</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Preço</TableHead>
              <TableHead>Unidade</TableHead>
              <TableHead>CaO</TableHead>
              <TableHead>SiO₂</TableHead>
              <TableHead>Al₂O₃</TableHead>
              <TableHead>MgO</TableHead>
              <TableHead className="w-40 text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {insumos.map((i) => (
              <TableRow key={i.id}>
                <TableCell className="font-medium">{i.nome}</TableCell>
                <TableCell>{TIPO_LABEL[i.tipo] ?? i.tipo}</TableCell>
                <TableCell>R$ {Number(i.preco_unit).toFixed(2)}</TableCell>
                <TableCell>{i.unidade}</TableCell>
                <TableCell>{i.cao_pct ?? '—'}</TableCell>
                <TableCell>{i.sio2_pct ?? '—'}</TableCell>
                <TableCell>{i.al2o3_pct ?? '—'}</TableCell>
                <TableCell>{i.mgo_pct ?? '—'}</TableCell>
                <TableCell className="flex justify-end gap-2">
                  <Button asChild variant="outline" size="sm">
                    <Link href={`/cadastros/fundentes/${i.id}`}>Editar</Link>
                  </Button>
                  <DeleteButton
                    entity="insumo"
                    onConfirm={deletarInsumoAction.bind(null, i.id)}
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
