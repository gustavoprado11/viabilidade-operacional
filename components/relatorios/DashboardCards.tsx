import Link from 'next/link';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import type { KPIs } from '@/lib/relatorios/agregados';

const brl = (n: number | null | undefined) =>
  typeof n === 'number' && Number.isFinite(n)
    ? n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
    : '—';
const pct = (n: number | null | undefined, d = 1) =>
  typeof n === 'number' && Number.isFinite(n)
    ? `${(n * 100).toFixed(d)}%`
    : '—';
const num = (n: number | null | undefined, d = 2) =>
  typeof n === 'number' && Number.isFinite(n)
    ? n.toLocaleString('pt-BR', { minimumFractionDigits: d, maximumFractionDigits: d })
    : '—';

export function DashboardCards({ kpis }: { kpis: KPIs }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl tabular-nums">{kpis.totalCorridas}</CardTitle>
          <CardDescription>Lâminas no período</CardDescription>
        </CardHeader>
        <CardContent className="text-xs">
          <span className="text-emerald-600">{kpis.porClassificacao.viavel} viáveis</span>
          <span className="mx-1 text-muted-foreground">·</span>
          <span className="text-amber-600">{kpis.porClassificacao.alerta} alertas</span>
          <span className="mx-1 text-muted-foreground">·</span>
          <span className="text-destructive">{kpis.porClassificacao.inviavel} inviáveis</span>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-2xl tabular-nums">
            {num(kpis.producaoTotalTon)} t
          </CardTitle>
          <CardDescription>Produção total (gusa vazado)</CardDescription>
        </CardHeader>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-2xl tabular-nums">
            {brl(kpis.margemMediaPonderada)}
          </CardTitle>
          <CardDescription>Margem média ponderada / ton</CardDescription>
        </CardHeader>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-2xl tabular-nums">
            {brl(kpis.custoMedioPonderado)}
          </CardTitle>
          <CardDescription>Custo médio ponderado / ton</CardDescription>
        </CardHeader>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle
            className={`text-2xl tabular-nums ${
              (kpis.resultadoTotalCorridas ?? 0) >= 0
                ? 'text-emerald-600'
                : 'text-destructive'
            }`}
          >
            {brl(kpis.resultadoTotalCorridas)}
          </CardTitle>
          <CardDescription>Resultado total das corridas</CardDescription>
        </CardHeader>
        <CardContent className="text-xs text-muted-foreground">
          Projeção média/mês: {brl(kpis.resultadoMesProjetadoMedio)}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-2xl tabular-nums">{pct(kpis.pctDentroSpec)}</CardTitle>
          <CardDescription>% dentro da spec do cliente</CardDescription>
        </CardHeader>
      </Card>

      {kpis.maiorMargem ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Maior margem/ton</CardTitle>
            <CardDescription>
              <Link href={`/laminas/${kpis.maiorMargem.id}`} className="underline">
                {kpis.maiorMargem.nome}
              </Link>{' '}
              — {brl(kpis.maiorMargem.valor)}
            </CardDescription>
          </CardHeader>
        </Card>
      ) : null}
      {kpis.menorMargem ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Menor margem/ton</CardTitle>
            <CardDescription>
              <Link href={`/laminas/${kpis.menorMargem.id}`} className="underline">
                {kpis.menorMargem.nome}
              </Link>{' '}
              — {brl(kpis.menorMargem.valor)}
            </CardDescription>
          </CardHeader>
        </Card>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Desvios previsto × real</CardTitle>
          <CardDescription>
            {kpis.nCorridasComAnalise} corrida{kpis.nCorridasComAnalise === 1 ? '' : 's'} com análise química
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-1 text-xs">
          <div>|P|: {pct(kpis.desvioMedioP)}</div>
          <div>|Si|: {pct(kpis.desvioMedioSi)}</div>
          <div>|Mn|: {pct(kpis.desvioMedioMn)}</div>
        </CardContent>
      </Card>
    </div>
  );
}
