import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';

import { getCurrentUser } from '@/lib/queries/auth';
import { listClientesAtivos } from '@/lib/queries/clientes';
import { listSimulacoesRelatorio } from '@/lib/queries/relatorios';
import { calcularKPIs } from '@/lib/relatorios/agregados';
import { buildRelatorioXlsx } from '@/lib/relatorios/excel';
import { buildRelatorioPdf } from '@/lib/relatorios/pdf';

export const runtime = 'nodejs';
export const maxDuration = 30;

const querySchema = z.object({
  formato: z.enum(['xlsx', 'pdf']),
  de: z.string(),
  ate: z.string(),
  tipo: z.enum(['simulacao', 'corrida_real']).optional(),
  classificacao: z.enum(['viavel', 'alerta', 'inviavel']).optional(),
  clienteId: z.string().optional(),
});

function ts() {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}-${pad(d.getHours())}${pad(d.getMinutes())}`;
}

export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 });
  }

  const params = Object.fromEntries(req.nextUrl.searchParams.entries());
  const parsed = querySchema.safeParse(params);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Query inválida.', issues: parsed.error.issues },
      { status: 422 },
    );
  }

  const { formato, de, ate, tipo, classificacao, clienteId } = parsed.data;

  const [{ simulacoes }, clientes] = await Promise.all([
    listSimulacoesRelatorio({ de, ate, tipo, classificacao, clienteId }),
    listClientesAtivos(),
  ]);

  const kpis = calcularKPIs(simulacoes);
  const periodoLabel = `${de.slice(0, 10)} a ${ate.slice(0, 10)}`;

  if (formato === 'xlsx') {
    // Agregados por cliente
    const byCliente = new Map<
      string,
      { nCorridas: number; producaoTon: number; margens: number[]; resultado: number }
    >();
    for (const s of simulacoes) {
      const key = s.cliente_id ?? 'sem_cliente';
      if (!byCliente.has(key)) {
        byCliente.set(key, { nCorridas: 0, producaoTon: 0, margens: [], resultado: 0 });
      }
      const acc = byCliente.get(key)!;
      acc.nCorridas++;
      acc.producaoTon += s.resultado?.producao.gusaVazado ?? 0;
      if (s.resultado) {
        acc.margens.push(s.resultado.financeiro.margemPorTon);
        acc.resultado += s.resultado.financeiro.resultadoCorrida;
      }
    }
    const agregadosCli = Array.from(byCliente.entries()).map(([id, a]) => ({
      clienteNome:
        clientes.find((c) => c.id === id)?.nome ??
        (id === 'sem_cliente' ? 'Sem cliente' : id),
      nCorridas: a.nCorridas,
      producaoTon: a.producaoTon,
      margemMedia:
        a.margens.length === 0
          ? null
          : a.margens.reduce((x, y) => x + y, 0) / a.margens.length,
      resultadoTotal: a.resultado,
    }));

    const buf = await buildRelatorioXlsx(kpis, simulacoes, periodoLabel, agregadosCli);
    return new NextResponse(new Uint8Array(buf), {
      status: 200,
      headers: {
        'Content-Type':
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="relatorio-${ts()}.xlsx"`,
      },
    });
  }

  // PDF
  const bytes = buildRelatorioPdf(kpis, simulacoes, periodoLabel, user.email ?? '');
  return new NextResponse(bytes as BodyInit, {
    status: 200,
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="relatorio-${ts()}.pdf"`,
    },
  });
}
