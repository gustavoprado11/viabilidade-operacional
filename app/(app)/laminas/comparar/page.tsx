import Link from 'next/link';

import { MargemChart } from '@/components/charts/MargemChart';
import { SensibilidadeChart } from '@/components/charts/SensibilidadeChart';
import { ComparativoTabela } from '@/components/comparativo/ComparativoTabela';
import { ExportCsvButton } from '@/components/comparativo/ExportCsvButton';
import { SeletorLaminas } from '@/components/comparativo/SeletorLaminas';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { listClientesAtivos } from '@/lib/queries/clientes';
import { listMineriosAtivos } from '@/lib/queries/minerios';
import {
  listSimulacoes,
  listSimulacoesPorIds,
  getMineriosPorIds,
  type Simulacao,
} from '@/lib/queries/simulacoes';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

function parseIds(raw: string | undefined): string[] {
  if (!raw) return [];
  return raw
    .split(',')
    .map((s) => s.trim())
    .filter((s) => /^[0-9a-f-]{10,}$/i.test(s))
    .slice(0, 4);
}

async function hydrarCadastros(laminas: Simulacao[]) {
  // Todos os minérios referenciados nos blends
  const blendIds = new Set<string>();
  for (const l of laminas) {
    const blend = (l.blend ?? []) as Array<{ minerio_id: string }>;
    blend.forEach((b) => blendIds.add(b.minerio_id));
  }
  const clienteIds = laminas
    .map((l) => l.cliente_id)
    .filter((x): x is string => !!x);

  const [ativos, arquivados, clientesAtivos] = await Promise.all([
    listMineriosAtivos(),
    getMineriosPorIds([...blendIds]),
    listClientesAtivos(),
  ]);

  // Buscar clientes arquivados também (para exibir nome corretamente)
  const ativosById = new Set(clientesAtivos.map((c) => c.id));
  const faltantes = clienteIds.filter((id) => !ativosById.has(id));
  const clientesArq = faltantes.length
    ? await (async () => {
        const supabase = await createClient();
        const { data } = await supabase
          .from('clientes')
          .select('*')
          .in('id', faltantes);
        return data ?? [];
      })()
    : [];

  const minerios = [
    ...ativos,
    ...arquivados.filter((m) => !ativos.some((a) => a.id === m.id)),
  ];
  const clientes = [...clientesAtivos, ...clientesArq];
  return { minerios, clientes };
}

type Props = { searchParams: Promise<{ ids?: string }> };

export default async function CompararPage({ searchParams }: Props) {
  const sp = await searchParams;
  const ids = parseIds(sp.ids);

  const [disponiveis, selecionadas] = await Promise.all([
    listSimulacoes(),
    listSimulacoesPorIds(ids),
  ]);

  // Reordena conforme a ordem dos IDs na URL
  const laminas = ids
    .map((id) => selecionadas.find((l) => l.id === id))
    .filter((x): x is Simulacao => !!x);

  const { minerios, clientes } = await hydrarCadastros(laminas);

  const cntViavel = laminas.filter((l) => l.classificacao === 'viavel').length;
  const cntAlerta = laminas.filter((l) => l.classificacao === 'alerta').length;
  const cntInv = laminas.filter((l) => l.classificacao === 'inviavel').length;

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-2xl font-semibold">Comparativo de lâminas</h1>
          <p className="text-sm text-muted-foreground">
            Selecione até 4 lâminas para comparar lado a lado.
          </p>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline">
            <Link href="/laminas">Voltar</Link>
          </Button>
          <SeletorLaminas
            disponiveis={disponiveis}
            selecionadasIds={ids}
          />
          {laminas.length > 0 ? (
            <ExportCsvButton
              laminas={laminas}
              minerios={minerios}
              clientes={clientes}
            />
          ) : null}
        </div>
      </header>

      {laminas.length === 0 ? (
        <Alert>
          <AlertDescription data-testid="placeholder-vazio">
            Nenhuma lâmina selecionada. Use o botão “Selecionar lâminas” acima.
          </AlertDescription>
        </Alert>
      ) : (
        <>
          <Alert data-testid="resumo-classificacao">
            <AlertDescription>
              {laminas.length} lâmina{laminas.length > 1 ? 's' : ''} selecionada
              {laminas.length > 1 ? 's' : ''} — {cntViavel} viável
              {cntViavel === 1 ? '' : 'is'}, {cntAlerta} alerta
              {cntAlerta === 1 ? '' : 's'}, {cntInv} inviável
              {cntInv === 1 ? '' : 'is'}.
            </AlertDescription>
          </Alert>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Tabela comparativa</CardTitle>
            </CardHeader>
            <CardContent>
              <ComparativoTabela
                laminas={laminas}
                minerios={minerios}
                clientes={clientes}
              />
            </CardContent>
          </Card>

          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">
                  Resultado/mês projetado
                </CardTitle>
              </CardHeader>
              <CardContent>
                <MargemChart laminas={laminas} />
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-base">
                  Fe blend × resultado/mês
                </CardTitle>
              </CardHeader>
              <CardContent>
                <SensibilidadeChart laminas={laminas} />
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
