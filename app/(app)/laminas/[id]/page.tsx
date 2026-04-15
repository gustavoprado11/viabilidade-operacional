import Link from 'next/link';
import { notFound } from 'next/navigation';

import { DeleteButton } from '@/components/cadastros/DeleteButton';
import { ResultadoLamina } from '@/components/lamina/ResultadoLamina';
import { SimuladorForm } from '@/components/lamina/SimuladorForm';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  atualizarSimulacaoAction,
  deletarSimulacaoAction,
  duplicarSimulacaoAction,
} from '@/lib/actions/lamina-actions';
import { clienteRowToSpec } from '@/lib/actions/lamina-mapper';
import { getClienteAtivo } from '@/lib/queries/clientes';
import { listInsumosAtivos } from '@/lib/queries/insumos';
import { listMineriosAtivos } from '@/lib/queries/minerios';
import { getParametrosAtivos } from '@/lib/queries/parametros';
import {
  getMineriosPorIds,
  getSimulacao,
} from '@/lib/queries/simulacoes';
import { listClientesAtivos } from '@/lib/queries/clientes';
import type {
  LaminaResultado,
} from '@/lib/calculation/types';
import { createClient } from '@/lib/supabase/server';

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ editar?: string }>;
};

type BlendDb = Array<{ minerio_id: string; pct: number }>;

export const dynamic = 'force-dynamic';

export default async function LaminaDetailPage({ params, searchParams }: Props) {
  const { id } = await params;
  const sp = await searchParams;
  const lamina = await getSimulacao(id);
  if (!lamina) notFound();

  const modoEdicaoPedido = sp.editar === '1';
  const podeEditar = lamina.tipo === 'simulacao';
  const modoEdicao = modoEdicaoPedido && podeEditar;

  const [minerios, clientes, insumos, parametros] = await Promise.all([
    listMineriosAtivos(),
    listClientesAtivos(),
    listInsumosAtivos(),
    getParametrosAtivos(),
  ]);

  const blend = (lamina.blend ?? []) as BlendDb;
  const referencedIds = blend.map((b) => b.minerio_id);
  const activeIds = new Set(minerios.map((m) => m.id));
  const arquivadosIds = referencedIds.filter((id) => !activeIds.has(id));
  const arquivadosRows = await getMineriosPorIds(arquivadosIds);
  const allMinerios = [...minerios, ...arquivadosRows];

  const cliente = lamina.cliente_id
    ? (await getClienteAtivo(lamina.cliente_id)) ??
      (await (async () => {
        // arquivado: busca por id ignorando valid_to
        const supabase = await createClient();
        const { data } = await supabase
          .from('clientes')
          .select('*')
          .eq('id', lamina.cliente_id!)
          .maybeSingle();
        return data;
      })())
    : null;

  const clientesParaSelect = cliente && !clientes.some((c) => c.id === cliente.id)
    ? [...clientes, cliente]
    : clientes;

  // Cards de leitura usam o snapshot armazenado em `resultado`
  const resultadoSnapshot = lamina.resultado as unknown as LaminaResultado;

  if (!parametros || !insumos.length) {
    return (
      <Alert variant="destructive">
        <AlertDescription>Cadastros incompletos.</AlertDescription>
      </Alert>
    );
  }
  const calcario = insumos.find((i) => i.tipo === 'calcario')!;
  const bauxita = insumos.find((i) => i.tipo === 'bauxita')!;
  const dolomita = insumos.find((i) => i.tipo === 'dolomita')!;
  const carvao = insumos.find((i) => i.tipo === 'carvao')!;
  const coque = insumos.find((i) => i.tipo === 'coque')!;

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">{lamina.nome}</h1>
          <p className="text-sm text-muted-foreground">
            {lamina.tipo === 'corrida_real' ? 'Corrida real' : 'Simulação'} · criada em{' '}
            {new Date(lamina.created_at).toLocaleString('pt-BR')}
            {arquivadosIds.length > 0 ? (
              <span className="ml-2 rounded bg-amber-500/10 px-2 py-0.5 text-xs text-amber-700">
                referencia cadastros arquivados
              </span>
            ) : null}
          </p>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline">
            <Link href="/laminas">Voltar</Link>
          </Button>
          {podeEditar && !modoEdicao ? (
            <Button asChild>
              <Link href={`/laminas/${id}?editar=1`}>Editar</Link>
            </Button>
          ) : null}
          {lamina.tipo === 'corrida_real' ? (
            <form action={duplicarSimulacaoAction.bind(null, id)}>
              <Button type="submit" variant="outline">Clonar e corrigir</Button>
            </form>
          ) : null}
          <DeleteButton
            entity={lamina.tipo === 'corrida_real' ? 'corrida real' : 'simulação'}
            onConfirm={deletarSimulacaoAction.bind(null, id)}
          />
        </div>
      </header>

      {modoEdicao ? (
        <SimuladorForm
          action={atualizarSimulacaoAction.bind(null, id)}
          minerios={minerios}
          mineriosArquivadosExtras={arquivadosRows}
          clientes={clientesParaSelect}
          calcario={calcario}
          bauxita={bauxita}
          dolomita={dolomita}
          carvao={carvao}
          coque={coque}
          parametros={parametros}
          initial={{
            id,
            nome: lamina.nome,
            tipo: lamina.tipo as 'simulacao' | 'corrida_real',
            cliente_id: lamina.cliente_id ?? '',
            blend,
            carvao_mdc: Number(lamina.carvao_mdc),
            carvao_densidade: Number(lamina.carvao_densidade),
            carvao_cargas_por_corrida:
              lamina.carvao_cargas_por_corrida == null
                ? null
                : Number(lamina.carvao_cargas_por_corrida),
            carvao_peso_por_carga_kg:
              lamina.carvao_peso_por_carga_kg == null
                ? null
                : Number(lamina.carvao_peso_por_carga_kg),
            coque_kg: Number(lamina.coque_kg),
            calcario_kg: Number(lamina.calcario_kg),
            bauxita_kg: Number(lamina.bauxita_kg),
            dolomita_kg: Number(lamina.dolomita_kg),
            quebras: lamina.quebras as unknown as Record<string, number> as never,
            estabilidade: lamina.estabilidade as never,
            sucata_kg: Number(lamina.sucata_kg),
            sucata_preco_ton: Number(lamina.sucata_preco_ton),
            sucata_destino: lamina.sucata_destino as never,
            corrida_timestamp: lamina.corrida_timestamp ?? null,
            observacoes: lamina.observacoes ?? null,
          }}
          submitLabel="Salvar alterações"
        />
      ) : (
        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Entradas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <p><strong>Cliente:</strong> {cliente?.nome ?? '—'} {cliente?.valid_to ? '(arquivado)' : ''}</p>
              <div>
                <strong>Blend:</strong>
                <ul className="ml-4 list-disc">
                  {blend.map((b, i) => {
                    const m = allMinerios.find((x) => x.id === b.minerio_id);
                    const arq = arquivadosRows.some((x) => x.id === b.minerio_id);
                    return (
                      <li key={i}>
                        {m?.nome ?? b.minerio_id}: {b.pct}%
                        {arq ? ' (arquivado)' : ''}
                      </li>
                    );
                  })}
                </ul>
              </div>
              <p><strong>Carvão:</strong> {Number(lamina.carvao_mdc)} MDC · densidade {Number(lamina.carvao_densidade)} kg/m³</p>
              <p><strong>Coque:</strong> {Number(lamina.coque_kg)} kg</p>
              <p><strong>Bauxita:</strong> {Number(lamina.bauxita_kg)} kg · <strong>Dolomita:</strong> {Number(lamina.dolomita_kg)} kg</p>
              <p><strong>Estabilidade:</strong> {lamina.estabilidade}</p>
              <p><strong>Sucata:</strong> {Number(lamina.sucata_kg)} kg ({lamina.sucata_destino})</p>
              {lamina.corrida_timestamp ? (
                <p><strong>Data corrida:</strong> {new Date(lamina.corrida_timestamp).toLocaleString('pt-BR')}</p>
              ) : null}
              {lamina.observacoes ? (
                <p><strong>Observações:</strong> {lamina.observacoes}</p>
              ) : null}
            </CardContent>
          </Card>

          {cliente ? (
            <div>
              <ResultadoLamina
                r={resultadoSnapshot}
                cliente={clienteRowToSpec(cliente)}
                corridasPorDia={parametros?.corridas_por_dia ?? 16}
              />
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}
