'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';

import { getCurrentUser } from '@/lib/queries/auth';
import { softDelete, softUpdate } from '@/lib/queries/versioning';
import { createClient } from '@/lib/supabase/server';

import { type ActionState } from './types';

const optionalNumber = z
  .union([z.string(), z.number()])
  .transform((v) => (v === '' || v === undefined || v === null ? null : Number(v)))
  .refine((v) => v === null || Number.isFinite(v), 'Número inválido.');

const schema = z.object({
  nome: z.string().min(1, 'Nome obrigatório.'),
  tipo: z.enum(['calcario', 'bauxita', 'dolomita', 'coque', 'carvao', 'outro']),
  preco_unit: z.coerce.number().nonnegative(),
  unidade: z.enum(['ton', 'MDC']),
  fe_pct: optionalNumber,
  sio2_pct: optionalNumber,
  al2o3_pct: optionalNumber,
  cao_pct: optionalNumber,
  mgo_pct: optionalNumber,
  c_fixo_pct: optionalNumber,
  densidade_kg_m3: optionalNumber,
  pis_credito: optionalNumber,
  icms_credito: optionalNumber,
});

function toFieldErrors(err: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const i of err.issues) {
    const k = i.path.join('.');
    if (!out[k]) out[k] = i.message;
  }
  return out;
}

export async function criarInsumoAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = schema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) {
    return { status: 'error', message: 'Dados inválidos.', fieldErrors: toFieldErrors(parsed.error) };
  }
  const user = await getCurrentUser();
  if (!user) return { status: 'error', message: 'Não autenticado.' };

  const supabase = await createClient();
  const { error } = await supabase
    .from('insumos')
    .insert({ ...parsed.data, user_id: user.id });
  if (error) return { status: 'error', message: error.message };

  revalidatePath('/cadastros/fundentes');
  redirect('/cadastros/fundentes');
}

export async function atualizarInsumoAction(
  id: string,
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = schema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) {
    return { status: 'error', message: 'Dados inválidos.', fieldErrors: toFieldErrors(parsed.error) };
  }

  const supabase = await createClient();
  try {
    await softUpdate(supabase, 'insumos', id, parsed.data);
  } catch (e) {
    return { status: 'error', message: (e as Error).message };
  }

  revalidatePath('/cadastros/fundentes');
  redirect('/cadastros/fundentes');
}

export async function deletarInsumoAction(id: string): Promise<void> {
  const supabase = await createClient();
  await softDelete(supabase, 'insumos', id);
  revalidatePath('/cadastros/fundentes');
}
