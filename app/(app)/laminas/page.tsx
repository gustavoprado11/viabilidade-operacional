import Link from 'next/link';

import { EstimativaDiariaCard } from '@/components/lamina/EstimativaDiariaCard';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type { Classificacao, LaminaResultado } from '@/lib/calculation/types';
import {
  calcularEstimativaDiaria,
  type SimulacaoResumida,
} from '@/lib/laminas/estimativa-diaria';
import { getParametrosAtivos } from '@/lib/queries/parametros';
import { listSimulacoes, type SimulacaoTipo, type SimulacaoClassificacao } from '@/lib/queries/simulacoes';

export const dynamic = 'force-dynamic';

const tipoLabel = { simulacao: 'Simulação', corrida_real: 'Corrida real' };
const classLabel: Record<string, { label: string; color: string }> = {
  viavel: { label: 'Viável', color: 'text-emerald-600' },
  alerta: { label: 'Alerta', color: 'text-amber-600' },
  inviavel: { label: 'Inviável', color: 'text-destructive' },
};

type Search = Promise<{ tipo?: SimulacaoTipo; classificacao?: SimulacaoClassificacao }>;

export default async function LaminasPage({ searchParams }: { searchParams: Search }) {
  const sp = await searchParams;
  const [laminas, parametros] = await Promise.all([
    listSimulacoes({ tipo: sp.tipo, classificacao: sp.classificacao }),
    getParametrosAtivos(),
  ]);

  const corridasPorDia = parametros?.corridas_por_dia ?? 16;
  const resumos: SimulacaoResumida[] = laminas.map((l) => {
    const r = l.resultado as unknown as LaminaResultado;
    return {
      gusaCorrida: r.producao.gusaVazado,
      custoPorTonGusa: r.financeiro.custoPorTonGusa,
      margemPorTon: r.financeiro.margemPorTon,
      resultadoCorrida: r.financeiro.resultadoCorrida,
      classificacao: l.classificacao as Classificacao,
    };
  });
  const estimativa = calcularEstimativaDiaria(resumos, corridasPorDia);

  const filterPill = (label: string, href: string, active: boolean) => (
    <Link
      key={label}
      href={href}
      className={`rounded-md px-2 py-1 text-xs ${active ? 'bg-accent text-accent-foreground' : 'text-muted-foreground hover:bg-accent'}`}
    >
      {label}
    </Link>
  );

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Lâminas</h1>
          <p className="text-sm text-muted-foreground">
            Simulações e corridas reais. Exclusão é soft (reversível).
          </p>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline">
            <Link href="/laminas/comparar">Comparar</Link>
          </Button>
          <Button asChild>
            <Link href="/laminas/nova">Nova simulação</Link>
          </Button>
        </div>
      </header>

      <EstimativaDiariaCard estimativa={estimativa} />

      <div className="flex flex-wrap gap-2 border-b pb-2 text-sm">
        <span className="text-xs text-muted-foreground">Tipo:</span>
        {filterPill('Todos', '/laminas', !sp.tipo)}
        {filterPill('Simulações', '/laminas?tipo=simulacao', sp.tipo === 'simulacao')}
        {filterPill('Corridas reais', '/laminas?tipo=corrida_real', sp.tipo === 'corrida_real')}
        <span className="ml-4 text-xs text-muted-foreground">Classificação:</span>
        {filterPill('Todas', sp.tipo ? `/laminas?tipo=${sp.tipo}` : '/laminas', !sp.classificacao)}
        {(['viavel', 'alerta', 'inviavel'] as const).map((c) =>
          filterPill(
            classLabel[c]!.label,
            `/laminas?${new URLSearchParams({ ...(sp.tipo ? { tipo: sp.tipo } : {}), classificacao: c }).toString()}`,
            sp.classificacao === c,
          ),
        )}
      </div>

      {laminas.length === 0 ? (
        <p className="text-sm text-muted-foreground">Nenhuma lâmina encontrada.</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Classificação</TableHead>
              <TableHead>Criada em</TableHead>
              <TableHead className="w-32 text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {laminas.map((l) => {
              const cls = classLabel[l.classificacao] ?? { label: l.classificacao, color: '' };
              return (
                <TableRow key={l.id} data-testid={`lamina-row-${l.nome}`}>
                  <TableCell className="font-medium">{l.nome}</TableCell>
                  <TableCell>{tipoLabel[l.tipo as SimulacaoTipo] ?? l.tipo}</TableCell>
                  <TableCell className={cls.color}>{cls.label}</TableCell>
                  <TableCell>{new Date(l.created_at).toLocaleString('pt-BR')}</TableCell>
                  <TableCell className="text-right">
                    <Button asChild variant="outline" size="sm">
                      <Link href={`/laminas/${l.id}`}>Abrir</Link>
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
