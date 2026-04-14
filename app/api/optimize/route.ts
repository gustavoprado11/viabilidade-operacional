import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';

import { otimizarBlend } from '@/lib/calculation/optimizer';
import type { LaminaInput, MinerioInput } from '@/lib/calculation/types';
import { getCurrentUser } from '@/lib/queries/auth';

export const runtime = 'nodejs';
export const maxDuration = 30; // segundos — Vercel hobby plan

const bodySchema = z.object({
  restricoes: z
    .object({
      feMin: z.number().optional(),
      feMax: z.number().optional(),
      al2o3EscoriaMax: z.number().optional(),
      custoTonMax: z.number().optional(),
    })
    .default({}),
  // Não valida baseInput detalhadamente — client-side já passa pelo buildLaminaInput.
  // Motor é puro e lança se algo vier inconsistente.
  baseInput: z.any(),
  minerios: z
    .array(
      z.object({
        id: z.string(),
        nome: z.string(),
        preco: z.number(),
        fe: z.number(),
        sio2: z.number(),
        al2o3: z.number(),
        p: z.number(),
        mn: z.number(),
        cao: z.number(),
        mgo: z.number(),
        ppc: z.number(),
        pisCredito: z.number(),
        icmsCredito: z.number(),
      }),
    )
    .min(2)
    .max(5),
  step: z.number().int().min(1).max(25).default(5),
  topN: z.number().int().min(1).max(50).default(10),
});

/**
 * POST /api/optimize
 * Body: { restricoes, baseInput, minerios, step?, topN? }
 * Response: { blends: OtimizacaoResult[], tempoMs: number, combinacoes: number }
 *
 * Auth obrigatório. Endpoint síncrono; Vercel maxDuration=30s. Proteção
 * de complosão combinatória: N minérios × step < 1 = rejeitado (limite 5000).
 */
export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'JSON inválido.' }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Input inválido.', issues: parsed.error.issues },
      { status: 422 },
    );
  }

  const { restricoes, baseInput, minerios, step, topN } = parsed.data;

  // Guard de combos: C(100/step + N - 1, N - 1)
  const slots = 100 / step;
  if (!Number.isInteger(slots)) {
    return NextResponse.json(
      { error: 'Step deve dividir 100 (ex.: 1, 2, 5, 10, 20, 25).' },
      { status: 422 },
    );
  }
  const combos = binomial(Math.floor(slots) + minerios.length - 1, minerios.length - 1);
  if (combos > 5000) {
    return NextResponse.json(
      {
        error: `Combinatória excessiva: ${combos} blends. Reduza minérios ou aumente o step.`,
      },
      { status: 422 },
    );
  }

  const t0 = Date.now();
  const blends = otimizarBlend(
    minerios as unknown as ReadonlyArray<MinerioInput>,
    restricoes,
    baseInput as unknown as Omit<LaminaInput, 'blend'>,
    step,
    topN,
  );
  const tempoMs = Date.now() - t0;

  return NextResponse.json({ blends, tempoMs, combinacoes: combos });
}

function binomial(n: number, k: number): number {
  if (k < 0 || k > n) return 0;
  k = Math.min(k, n - k);
  let c = 1;
  for (let i = 0; i < k; i++) {
    c = (c * (n - i)) / (i + 1);
  }
  return c;
}
