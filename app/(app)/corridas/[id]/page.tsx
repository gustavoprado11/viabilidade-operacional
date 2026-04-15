import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';

import { AnaliseQuimicaForm } from '@/components/corrida/AnaliseQuimicaForm';
import { DesviosCard } from '@/components/corrida/DesviosCard';
import { VinculoSimulacao } from '@/components/corrida/VinculoSimulacao';
import { DeleteButton } from '@/components/cadastros/DeleteButton';
import { ResultadoLamina } from '@/components/lamina/ResultadoLamina';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { calcularDesvios } from '@/lib/calculation/desvios';
import type { LaminaResultado } from '@/lib/calculation/types';
import {
  atualizarAnaliseQuimicaAction,
  deletarSimulacaoAction,
  duplicarSimulacaoAction,
} from '@/lib/actions/lamina-actions';
import { clienteRowToSpec } from '@/lib/actions/lamina-mapper';
import { getClienteAtivo } from '@/lib/queries/clientes';
import { getParametrosAtivos } from '@/lib/queries/parametros';
import {
  getMineriosPorIds,
  getSimulacao,
} from '@/lib/queries/simulacoes';
import { createClient } from '@/lib/supabase/server';

type Props = { params: Promise<{ id: string }> };
type BlendDb = Array<{ minerio_id: string; pct: number }>;

export const dynamic = 'force-dynamic';

export default async function CorridaDetailPage({ params }: Props) {
  const { id } = await params;
  const corrida = await getSimulacao(id);
  if (!corrida) notFound();
  if (corrida.tipo !== 'corrida_real') {
    // Simulações vivem em /laminas/[id]
    redirect(`/laminas/${id}`);
  }

  const blend = (corrida.blend ?? []) as BlendDb;
  const referencedIds = blend.map((b) => b.minerio_id);

  const [cliente, origem, arquivados, parametros] = await Promise.all([
    corrida.cliente_id ? getClienteAtivo(corrida.cliente_id) : null,
    corrida.simulacao_origem_id ? getSimulacao(corrida.simulacao_origem_id) : null,
    getMineriosPorIds(referencedIds),
    getParametrosAtivos(),
  ]);

  // Resolver cliente mesmo se arquivado
  let clienteRow = cliente;
  if (!clienteRow && corrida.cliente_id) {
    const supabase = await createClient();
    const { data } = await supabase
      .from('clientes')
      .select('*')
      .eq('id', corrida.cliente_id)
      .maybeSingle();
    clienteRow = data;
  }

  const resultadoSnapshot = corrida.resultado as unknown as LaminaResultado;
  const desvios = calcularDesvios(
    resultadoSnapshot,
    corrida.analise_gusa_real as never,
    corrida.analise_escoria_real as never,
  );

  const anyArquivado = arquivados.some((m) => m.arquivado);

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-2xl font-semibold">{corrida.nome}</h1>
          <p className="text-sm text-muted-foreground">
            Corrida real ·{' '}
            {corrida.corrida_timestamp
              ? new Date(corrida.corrida_timestamp).toLocaleString('pt-BR')
              : '—'}
            {anyArquivado ? (
              <span className="ml-2 rounded bg-amber-500/10 px-2 py-0.5 text-xs text-amber-700">
                referencia minério arquivado
              </span>
            ) : null}
          </p>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline">
            <Link href="/corridas">Voltar</Link>
          </Button>
          <form action={duplicarSimulacaoAction.bind(null, id)}>
            <Button type="submit" variant="outline">Clonar e corrigir</Button>
          </form>
          <DeleteButton
            entity="corrida real"
            onConfirm={deletarSimulacaoAction.bind(null, id)}
          />
        </div>
      </header>

      <VinculoSimulacao origem={origem} />

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Entradas</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p>
              <strong>Cliente:</strong> {clienteRow?.nome ?? '—'}
              {clienteRow?.valid_to ? ' (arquivado)' : ''}
            </p>
            <div>
              <strong>Blend:</strong>
              <ul className="ml-4 list-disc">
                {blend.map((b, i) => {
                  const m = arquivados.find((x) => x.id === b.minerio_id);
                  return (
                    <li key={i}>
                      {m?.nome ?? b.minerio_id}: {b.pct}%
                      {m?.arquivado ? ' (arquivado)' : ''}
                    </li>
                  );
                })}
              </ul>
            </div>
            <p><strong>Estabilidade:</strong> {corrida.estabilidade}</p>
            <p><strong>Sucata:</strong> {Number(corrida.sucata_kg)} kg ({corrida.sucata_destino})</p>
            {corrida.observacoes ? (
              <p><strong>Observações:</strong> {corrida.observacoes}</p>
            ) : null}
          </CardContent>
        </Card>

        {clienteRow ? (
          <ResultadoLamina
            r={resultadoSnapshot}
            cliente={clienteRowToSpec(clienteRow)}
            corridasPorDia={parametros?.corridas_por_dia ?? 16}
          />
        ) : null}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Análise química real</CardTitle>
        </CardHeader>
        <CardContent>
          <AnaliseQuimicaForm
            action={atualizarAnaliseQuimicaAction.bind(null, id)}
            initialGusa={corrida.analise_gusa_real as never}
            initialEscoria={corrida.analise_escoria_real as never}
          />
        </CardContent>
      </Card>

      <DesviosCard
        desvios={desvios}
        tolerancia={parametros ? Number(parametros.desvio_tolerancia_pct) : undefined}
        atencao={parametros ? Number(parametros.desvio_atencao_pct) : undefined}
      />
    </div>
  );
}
