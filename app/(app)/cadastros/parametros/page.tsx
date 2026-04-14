import { ParametrosForm } from '@/components/cadastros/ParametrosForm';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { atualizarParametrosAction } from '@/lib/actions/parametros-actions';
import {
  getParametrosAtivos,
  listParametrosHistorico,
} from '@/lib/queries/parametros';

export const dynamic = 'force-dynamic';

export default async function ParametrosPage() {
  const ativo = await getParametrosAtivos();
  const historico = await listParametrosHistorico();

  if (!ativo) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-semibold">Parâmetros do forno</h1>
        <p className="text-sm text-muted-foreground">
          Nenhum parâmetro ativo. Rode o script de bootstrap para carregar os
          defaults.
        </p>
      </div>
    );
  }

  const action = atualizarParametrosAction.bind(null, ativo.id);

  return (
    <div className="space-y-6">
      <header className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Parâmetros do forno</h1>
          <p className="text-sm text-muted-foreground">
            Coeficientes do modelo metalúrgico e financeiro. Alterar cria nova
            versão e arquiva a anterior.
          </p>
        </div>
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="outline">Ver histórico ({historico.length})</Button>
          </DialogTrigger>
          <DialogContent className="max-h-[80vh] max-w-3xl overflow-auto">
            <DialogHeader>
              <DialogTitle>Histórico de parâmetros</DialogTitle>
              <DialogDescription>
                Versões anteriores (somente leitura).
              </DialogDescription>
            </DialogHeader>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Válido de</TableHead>
                  <TableHead>Válido até</TableHead>
                  <TableHead>B2 alvo</TableHead>
                  <TableHead>Al₂O₃ limite</TableHead>
                  <TableHead>Custo fixo/dia</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {historico.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell>{new Date(p.valid_from).toLocaleString('pt-BR')}</TableCell>
                    <TableCell>
                      {p.valid_to
                        ? new Date(p.valid_to).toLocaleString('pt-BR')
                        : 'ativa'}
                    </TableCell>
                    <TableCell>{p.b2_alvo}</TableCell>
                    <TableCell>{p.al2o3_escoria_limite}%</TableCell>
                    <TableCell>R$ {Number(p.custo_fixo_dia).toFixed(2)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </DialogContent>
        </Dialog>
      </header>

      <ParametrosForm action={action} initial={ativo} />
    </div>
  );
}
