import Link from 'next/link';

import { SimuladorForm } from '@/components/lamina/SimuladorForm';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { criarSimulacaoAction } from '@/lib/actions/lamina-actions';
import { listClientesAtivos } from '@/lib/queries/clientes';
import { listInsumosAtivos } from '@/lib/queries/insumos';
import { listMineriosAtivos } from '@/lib/queries/minerios';
import { getParametrosAtivos } from '@/lib/queries/parametros';
import { getSimulacao } from '@/lib/queries/simulacoes';

export const dynamic = 'force-dynamic';

type Props = { searchParams: Promise<{ origem?: string }> };

type BlendDb = Array<{ minerio_id: string; pct: number }>;

export default async function NovaCorridaPage({ searchParams }: Props) {
  const sp = await searchParams;
  const origem = sp.origem ? await getSimulacao(sp.origem) : null;

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
  const calcario = insumos.find((i) => i.tipo === 'calcario')!;
  const bauxita = insumos.find((i) => i.tipo === 'bauxita')!;
  const dolomita = insumos.find((i) => i.tipo === 'dolomita')!;
  const carvao = insumos.find((i) => i.tipo === 'carvao')!;
  const coque = insumos.find((i) => i.tipo === 'coque')!;

  const initial = origem
    ? {
        nome: `Corrida de ${origem.nome}`,
        tipo: 'corrida_real' as const,
        cliente_id: origem.cliente_id ?? clientes[0]?.id ?? '',
        blend: origem.blend as BlendDb,
        carvao_mdc: Number(origem.carvao_mdc),
        carvao_densidade: Number(origem.carvao_densidade),
        coque_kg: Number(origem.coque_kg),
        calcario_kg: Number(origem.calcario_kg),
        bauxita_kg: Number(origem.bauxita_kg),
        dolomita_kg: Number(origem.dolomita_kg),
        quebras: origem.quebras as unknown as Record<string, number> as never,
        estabilidade: origem.estabilidade as never,
        sucata_kg: Number(origem.sucata_kg),
        sucata_preco_ton: Number(origem.sucata_preco_ton),
        sucata_destino: origem.sucata_destino as never,
        observacoes: `Baseada na simulação ${origem.nome}.`,
        simulacao_origem_id: origem.id,
      }
    : { nome: 'Nova corrida', tipo: 'corrida_real' as const };

  return (
    <div className="space-y-4">
      <header>
        <h1 className="text-2xl font-semibold">Nova corrida real</h1>
        <p className="text-sm text-muted-foreground">
          {origem
            ? `Baseada na simulação "${origem.nome}". Ajuste os valores reais antes de salvar.`
            : 'Registre os dados da corrida executada. Preencha a análise química depois.'}
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
        initial={initial}
        submitLabel="Salvar corrida"
      />
    </div>
  );
}
