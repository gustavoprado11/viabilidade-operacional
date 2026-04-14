import Link from 'next/link';

import { SimuladorForm } from '@/components/lamina/SimuladorForm';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { criarSimulacaoAction } from '@/lib/actions/lamina-actions';
import type { LaminaFormPayload } from '@/lib/actions/lamina-mapper';
import { listClientesAtivos } from '@/lib/queries/clientes';
import { listInsumosAtivos } from '@/lib/queries/insumos';
import { listMineriosAtivos } from '@/lib/queries/minerios';
import { getParametrosAtivos } from '@/lib/queries/parametros';

export const dynamic = 'force-dynamic';

type Props = {
  searchParams: Promise<{
    blend?: string;
    cliente_id?: string;
    carvao_mdc?: string;
    coque_kg?: string;
    bauxita_kg?: string;
    dolomita_kg?: string;
    nome?: string;
  }>;
};

type BlendPayload = Array<{ minerio_id: string; pct: number }>;

function parseBlend(raw: string | undefined): BlendPayload | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return null;
    const out: BlendPayload = [];
    for (const item of parsed) {
      if (
        item &&
        typeof item.minerio_id === 'string' &&
        typeof item.pct === 'number'
      ) {
        out.push({ minerio_id: item.minerio_id, pct: item.pct });
      }
    }
    return out.length > 0 ? out : null;
  } catch {
    return null;
  }
}

function numFromParam(s: string | undefined): number | undefined {
  if (!s) return undefined;
  const n = Number(s);
  return Number.isFinite(n) ? n : undefined;
}

export default async function NovaLaminaPage({ searchParams }: Props) {
  const sp = await searchParams;

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

  // Query params do otimizador (opcional) — só aplicados se blend válido
  const blendFromUrl = parseBlend(sp.blend);
  const initial: Partial<LaminaFormPayload> | undefined = blendFromUrl
    ? {
        nome: sp.nome ?? 'Nova simulação',
        tipo: 'simulacao',
        cliente_id: sp.cliente_id ?? clientes[0]?.id ?? '',
        blend: blendFromUrl,
        carvao_mdc: numFromParam(sp.carvao_mdc),
        coque_kg: numFromParam(sp.coque_kg),
        bauxita_kg: numFromParam(sp.bauxita_kg),
        dolomita_kg: numFromParam(sp.dolomita_kg),
      }
    : undefined;

  return (
    <div className="space-y-4">
      <header>
        <h1 className="text-2xl font-semibold">Nova simulação</h1>
        <p className="text-sm text-muted-foreground">
          {blendFromUrl
            ? 'Pré-preenchida a partir do otimizador. Ajuste se precisar e salve.'
            : 'Ajuste os campos à esquerda — o resultado à direita atualiza em tempo real.'}
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
        submitLabel="Salvar"
      />
    </div>
  );
}
