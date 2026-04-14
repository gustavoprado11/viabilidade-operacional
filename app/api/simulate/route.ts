import { NextResponse, type NextRequest } from 'next/server';

import { simulateLamina } from '@/lib/calculation';
import { laminaInputSchema } from '@/lib/calculation/schemas';
import { getCurrentUser } from '@/lib/queries/auth';

/**
 * POST /api/simulate
 * Body: LaminaInput (JSON)
 * Response: LaminaResultado
 *
 * Endpoint puro: motor é síncrono e não persiste. Protegido por auth
 * (401 se sem sessão). Usado pela Fase 10 (otimizador em batch) e por
 * qualquer consumidor externo. O simulador da UI chama `simulateLamina`
 * direto no client para zero latência.
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

  const parsed = laminaInputSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Input inválido.', issues: parsed.error.issues },
      { status: 422 },
    );
  }

  const resultado = simulateLamina(parsed.data);
  return NextResponse.json(resultado);
}
