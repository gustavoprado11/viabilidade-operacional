import { BotoesExport } from '@/components/relatorios/BotoesExport';
import { DashboardCards } from '@/components/relatorios/DashboardCards';
import { EvolucaoChart } from '@/components/relatorios/EvolucaoChart';
import { ParetoChart } from '@/components/relatorios/ParetoChart';
import { TabelaResumoCorridas } from '@/components/relatorios/TabelaResumoCorridas';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { listClientesAtivos } from '@/lib/queries/clientes';
import { listSimulacoesRelatorio } from '@/lib/queries/relatorios';
import {
  calcularKPIs,
  paretoCustos,
  serieMargemTon,
} from '@/lib/relatorios/agregados';

export const dynamic = 'force-dynamic';

type Props = {
  searchParams: Promise<{
    de?: string;
    ate?: string;
    tipo?: 'simulacao' | 'corrida_real';
    classificacao?: 'viavel' | 'alerta' | 'inviavel';
    clienteId?: string;
  }>;
};

function parseISO(s: string | undefined, fallback: Date): string {
  if (!s) return fallback.toISOString();
  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? fallback.toISOString() : d.toISOString();
}

export default async function RelatoriosPage({ searchParams }: Props) {
  const sp = await searchParams;
  const hoje = new Date();
  const trintaDias = new Date();
  trintaDias.setDate(hoje.getDate() - 30);

  const deISO = parseISO(sp.de, trintaDias);
  const ateISO = parseISO(sp.ate, hoje);

  const [{ simulacoes, truncado }, clientes] = await Promise.all([
    listSimulacoesRelatorio({
      de: deISO,
      ate: ateISO,
      tipo: sp.tipo,
      classificacao: sp.classificacao,
      clienteId: sp.clienteId,
    }),
    listClientesAtivos(),
  ]);

  const kpis = calcularKPIs(simulacoes);
  const serie = serieMargemTon(simulacoes);
  const pareto = paretoCustos(simulacoes);

  const buildHref = (formato: 'xlsx' | 'pdf') => {
    const qs = new URLSearchParams({ formato, de: deISO, ate: ateISO });
    if (sp.tipo) qs.set('tipo', sp.tipo);
    if (sp.classificacao) qs.set('classificacao', sp.classificacao);
    if (sp.clienteId) qs.set('clienteId', sp.clienteId);
    return `/api/export?${qs.toString()}`;
  };
  const hrefXlsx = buildHref('xlsx');
  const hrefPdf = buildHref('pdf');

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold">Relatórios</h1>
        <p className="text-sm text-muted-foreground">
          Agregados do período com exportação CSV, Excel e PDF.
        </p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Filtros</CardTitle>
          <CardDescription>
            Default: últimos 30 dias. Parâmetros via URL.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="flex flex-wrap items-end gap-3 text-sm" action="/relatorios">
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground" htmlFor="de">De</label>
              <input
                type="date"
                id="de"
                name="de"
                defaultValue={deISO.slice(0, 10)}
                className="h-9 rounded-md border border-input px-2"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground" htmlFor="ate">Até</label>
              <input
                type="date"
                id="ate"
                name="ate"
                defaultValue={ateISO.slice(0, 10)}
                className="h-9 rounded-md border border-input px-2"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground" htmlFor="tipo">Tipo</label>
              <select
                name="tipo"
                id="tipo"
                defaultValue={sp.tipo ?? ''}
                className="h-9 rounded-md border border-input px-2"
              >
                <option value="">Todos</option>
                <option value="simulacao">Simulação</option>
                <option value="corrida_real">Corrida real</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground" htmlFor="classificacao">
                Classificação
              </label>
              <select
                name="classificacao"
                id="classificacao"
                defaultValue={sp.classificacao ?? ''}
                className="h-9 rounded-md border border-input px-2"
              >
                <option value="">Todas</option>
                <option value="viavel">Viável</option>
                <option value="alerta">Alerta</option>
                <option value="inviavel">Inviável</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground" htmlFor="clienteId">
                Cliente
              </label>
              <select
                name="clienteId"
                id="clienteId"
                defaultValue={sp.clienteId ?? ''}
                className="h-9 rounded-md border border-input px-2"
              >
                <option value="">Todos</option>
                {clientes.map((c) => (
                  <option key={c.id} value={c.id}>{c.nome}</option>
                ))}
              </select>
            </div>
            <button className="h-9 rounded-md border px-3 hover:bg-accent" type="submit">
              Aplicar
            </button>
          </form>
        </CardContent>
      </Card>

      {truncado ? (
        <Alert data-testid="relatorio-truncado">
          <AlertDescription>
            Exibindo as 500 corridas mais recentes. Refine os filtros para ver menos.
          </AlertDescription>
        </Alert>
      ) : null}

      <DashboardCards kpis={kpis} />

      <BotoesExport simulacoes={simulacoes} hrefXlsx={hrefXlsx} hrefPdf={hrefPdf} />

      {simulacoes.length > 0 ? (
        <>
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Margem/ton ao longo do período</CardTitle>
              </CardHeader>
              <CardContent>
                <EvolucaoChart serie={serie} />
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Pareto de custos (média/corrida)</CardTitle>
              </CardHeader>
              <CardContent>
                <ParetoChart itens={pareto} />
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Corridas do período</CardTitle>
              <CardDescription>Ordenadas por data de criação DESC.</CardDescription>
            </CardHeader>
            <CardContent>
              <TabelaResumoCorridas simulacoes={simulacoes} />
            </CardContent>
          </Card>
        </>
      ) : (
        <Alert>
          <AlertDescription data-testid="sem-dados">
            Nenhuma lâmina no período. Ajuste os filtros ou crie simulações.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
