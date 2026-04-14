import { OtimizadorPanel } from '@/components/otimizador/OtimizadorPanel';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { listClientesAtivos } from '@/lib/queries/clientes';
import { listInsumosAtivos } from '@/lib/queries/insumos';
import { listMineriosAtivos } from '@/lib/queries/minerios';
import { getParametrosAtivos } from '@/lib/queries/parametros';

export const dynamic = 'force-dynamic';

export default async function OtimizadorPage() {
  const [minerios, clientes, insumos, parametros] = await Promise.all([
    listMineriosAtivos(),
    listClientesAtivos(),
    listInsumosAtivos(),
    getParametrosAtivos(),
  ]);

  if (!parametros || insumos.length === 0 || minerios.length < 2 || clientes.length === 0) {
    return (
      <Alert variant="destructive">
        <AlertDescription>
          Cadastros insuficientes. Precisa de pelo menos 2 minérios, 1 cliente,
          parâmetros ativos e todos os insumos (calcário, bauxita, dolomita,
          carvão, coque).
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
          Cadastro de insumos incompleto (calcário/bauxita/dolomita/carvão/coque).
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold">Otimizador de blend</h1>
        <p className="text-sm text-muted-foreground">
          Grid search sobre combinações de minérios. Retorna top 10 ranqueado
          por resultado/mês projetado.
        </p>
      </header>

      <OtimizadorPanel
        minerios={minerios}
        clientes={clientes}
        calcario={calcario}
        bauxita={bauxita}
        dolomita={dolomita}
        carvao={carvao}
        coque={coque}
        parametros={parametros}
      />
    </div>
  );
}
