import Link from 'next/link';

import { SimuladorForm } from '@/components/lamina/SimuladorForm';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { criarSimulacaoAction } from '@/lib/actions/lamina-actions';
import { listClientesAtivos } from '@/lib/queries/clientes';
import { listInsumosAtivos } from '@/lib/queries/insumos';
import { listMineriosAtivos } from '@/lib/queries/minerios';
import { getParametrosAtivos } from '@/lib/queries/parametros';

export const dynamic = 'force-dynamic';

export default async function NovaLaminaPage() {
  const [minerios, clientes, insumos, parametros] = await Promise.all([
    listMineriosAtivos(),
    listClientesAtivos(),
    listInsumosAtivos(),
    getParametrosAtivos(),
  ]);

  if (!parametros) {
    return (
      <Alert variant="destructive">
        <AlertDescription>
          Nenhum parâmetro do forno ativo. Rode o bootstrap ou{' '}
          <Link className="underline" href="/cadastros/parametros">
            acesse os parâmetros
          </Link>
          .
        </AlertDescription>
      </Alert>
    );
  }

  const calcario = insumos.find((i) => i.tipo === 'calcario');
  const bauxita = insumos.find((i) => i.tipo === 'bauxita');
  const dolomita = insumos.find((i) => i.tipo === 'dolomita');
  const carvao = insumos.find((i) => i.tipo === 'carvao');
  const coque = insumos.find((i) => i.tipo === 'coque');

  if (!calcario || !bauxita || !dolomita || !carvao || !coque) {
    return (
      <Alert variant="destructive">
        <AlertDescription>
          Cadastros de insumos incompletos. Verifique calcário, bauxita,
          dolomita, carvão e coque em{' '}
          <Link className="underline" href="/cadastros/fundentes">
            Cadastros → Fundentes
          </Link>
          .
        </AlertDescription>
      </Alert>
    );
  }

  if (minerios.length === 0 || clientes.length === 0) {
    return (
      <Alert variant="destructive">
        <AlertDescription>
          Cadastre pelo menos 1 minério e 1 cliente antes de simular.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-4">
      <header>
        <h1 className="text-2xl font-semibold">Nova simulação</h1>
        <p className="text-sm text-muted-foreground">
          Ajuste os campos à esquerda — o resultado à direita atualiza em tempo real.
        </p>
      </header>

      <SimuladorForm
        action={criarSimulacaoAction}
        minerios={minerios}
        clientes={clientes}
        calcario={calcario}
        bauxita={bauxita}
        dolomita={dolomita}
        carvao={carvao}
        coque={coque}
        parametros={parametros}
        submitLabel="Salvar"
      />
    </div>
  );
}
