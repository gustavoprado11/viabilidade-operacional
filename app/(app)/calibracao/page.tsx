import { CalibracaoForm } from '@/components/calibracao/CalibracaoForm';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { aplicarCalibracaoAction } from '@/lib/actions/calibracao-actions';
import { parametrosRowToInput } from '@/lib/actions/lamina-mapper';
import {
  calcularEstatisticasDesvios,
  gerarRecomendacoes,
  type DesvioHistoricoInput,
} from '@/lib/calculation/calibration';
import type { LaminaResultado } from '@/lib/calculation/types';
import {
  houveCalibracaoNoPeriodo,
  listCalibracoesRecentes,
  listCorridasPeriodoComAnalise,
} from '@/lib/queries/calibracoes';
import { getParametrosAtivos } from '@/lib/queries/parametros';

export const dynamic = 'force-dynamic';

type Props = { searchParams: Promise<{ de?: string; ate?: string }> };

function parseData(s: string | undefined, fallback: Date): Date {
  if (!s) return fallback;
  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? fallback : d;
}

const MIN_APLICAR = 5;

export default async function CalibracaoPage({ searchParams }: Props) {
  const sp = await searchParams;
  const hoje = new Date();
  const noventa = new Date();
  noventa.setDate(hoje.getDate() - 90);
  const dataInicio = parseData(sp.de, noventa);
  const dataFim = parseData(sp.ate, hoje);

  const [parametros, corridas, calibracoes, huveAjuste] = await Promise.all([
    getParametrosAtivos(),
    listCorridasPeriodoComAnalise(dataInicio, dataFim),
    listCalibracoesRecentes(10),
    houveCalibracaoNoPeriodo(dataInicio, dataFim),
  ]);

  if (!parametros) {
    return (
      <Alert variant="destructive">
        <AlertDescription>
          Nenhum parâmetro do forno ativo. Rode o bootstrap.
        </AlertDescription>
      </Alert>
    );
  }

  const historico: DesvioHistoricoInput[] = corridas.map((c) => ({
    corridaId: c.id,
    timestamp: c.corrida_timestamp ?? c.created_at,
    previsto: c.resultado as unknown as LaminaResultado,
    gusaReal: c.analise_gusa_real as never,
    escoriaReal: c.analise_escoria_real as never,
  }));

  const paramsMotor = parametrosRowToInput(parametros);
  const estatisticas = calcularEstatisticasDesvios(historico);
  const recomendacoes = gerarRecomendacoes(estatisticas, paramsMotor);

  const corridasAnalisadas = historico.length;
  const podeAplicar = corridasAnalisadas >= MIN_APLICAR;

  const fmtData = (d: Date) => d.toISOString().slice(0, 10);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold">Calibração do modelo</h1>
        <p className="text-sm text-muted-foreground">
          Analisa desvios previsto × real no período e sugere ajustes aos
          coeficientes. Aplicar cria nova versão de parâmetros; simulações
          anteriores permanecem intocadas.
        </p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Período de análise</CardTitle>
          <CardDescription>
            Default: últimos 90 dias. Ajuste via URL
            (<code>?de=YYYY-MM-DD&ate=YYYY-MM-DD</code>).
          </CardDescription>
        </CardHeader>
        <CardContent className="flex gap-3 text-sm">
          <form className="flex gap-2" action="/calibracao">
            <input
              type="date"
              name="de"
              defaultValue={fmtData(dataInicio)}
              className="h-9 rounded-md border border-input px-2"
            />
            <input
              type="date"
              name="ate"
              defaultValue={fmtData(dataFim)}
              className="h-9 rounded-md border border-input px-2"
            />
            <button className="rounded-md border px-3 text-sm hover:bg-accent" type="submit">
              Aplicar
            </button>
          </form>
        </CardContent>
      </Card>

      {huveAjuste ? (
        <Alert data-testid="aviso-calibracao-no-periodo">
          <AlertDescription>
            ⚠️ Houve calibração de parâmetros no período selecionado. Os
            desvios podem ter viés.
          </AlertDescription>
        </Alert>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle className="text-base" data-testid="resumo-stats">
            Resumo estatístico ({corridasAnalisadas} corrida
            {corridasAnalisadas === 1 ? '' : 's'} com análise)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Campo</TableHead>
                <TableHead>N</TableHead>
                <TableHead>Média Δ%</TableHead>
                <TableHead>σ Δ%</TableHead>
                <TableHead>Tendência</TableHead>
                <TableHead>Confiança</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {estatisticas.map((s) => (
                <TableRow key={s.campo}>
                  <TableCell>{s.campo}</TableCell>
                  <TableCell>{s.n}</TableCell>
                  <TableCell className="tabular-nums">
                    {s.n === 0 ? '—' : `${(s.mediaDesvioPct * 100).toFixed(2)}%`}
                  </TableCell>
                  <TableCell className="tabular-nums">
                    {s.n === 0 ? '—' : `${(s.desvioPadraoPct * 100).toFixed(2)}%`}
                  </TableCell>
                  <TableCell className="text-xs">{s.tendencia}</TableCell>
                  <TableCell className="text-xs">{s.confianca}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Recomendações e ajuste manual</CardTitle>
        </CardHeader>
        <CardContent>
          <CalibracaoForm
            action={aplicarCalibracaoAction}
            parametrosAtuais={parametros}
            estatisticas={estatisticas}
            recomendacoes={recomendacoes}
            corridasAnalisadas={corridasAnalisadas}
            podeAplicar={podeAplicar}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Histórico de calibrações</CardTitle>
          <CardDescription>Últimas 10 aplicações.</CardDescription>
        </CardHeader>
        <CardContent>
          {calibracoes.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Nenhuma calibração registrada.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Corridas analisadas</TableHead>
                  <TableHead>Justificativa</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {calibracoes.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell>
                      {new Date(c.created_at).toLocaleString('pt-BR')}
                    </TableCell>
                    <TableCell>{c.corridas_analisadas}</TableCell>
                    <TableCell className="max-w-sm text-xs">
                      {c.justificativa}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
