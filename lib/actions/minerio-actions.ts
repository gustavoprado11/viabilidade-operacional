'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';

import { getCurrentUser } from '@/lib/queries/auth';
import { softDelete, softUpdate } from '@/lib/queries/versioning';
import { createClient } from '@/lib/supabase/server';

import { type ActionState } from './types';

const bool = z
  .union([z.string(), z.boolean(), z.undefined()])
  .transform((v) => v === true || v === 'on' || v === 'true');

const schema = z.object({
  nome: z.string().min(1, 'Nome obrigatório.'),
  preco_ton: z.coerce.number().positive(),
  fe_pct: z.coerce.number().positive(),
  sio2_pct: z.coerce.number().nonnegative(),
  al2o3_pct: z.coerce.number().nonnegative(),
  p_pct: z.coerce.number().nonnegative(),
  mn_pct: z.coerce.number().nonnegative(),
  cao_pct: z.coerce.number().nonnegative(),
  mgo_pct: z.coerce.number().nonnegative(),
  ppc_pct: z.coerce.number().nonnegative(),
  pis_credito_ton: z.coerce.number().nonnegative(),
  icms_credito_ton: z.coerce.number().nonnegative(),
  analise_validada: bool,
});

function toFieldErrors(err: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const i of err.issues) {
    const k = i.path.join('.');
    if (!out[k]) out[k] = i.message;
  }
  return out;
}

export async function criarMinerioAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const raw = Object.fromEntries(formData.entries());
  const parsed = schema.safeParse({
    ...raw,
    analise_validada: raw.analise_validada ?? false,
  });
  if (!parsed.success) {
    return { status: 'error', message: 'Dados inválidos.', fieldErrors: toFieldErrors(parsed.error) };
  }
  const user = await getCurrentUser();
  if (!user) return { status: 'error', message: 'Não autenticado.' };

  const supabase = await createClient();
  const { error } = await supabase
    .from('minerios')
    .insert({ ...parsed.data, user_id: user.id });
  if (error) return { status: 'error', message: error.message };

  revalidatePath('/cadastros/minerios');
  redirect('/cadastros/minerios');
}

export async function atualizarMinerioAction(
  id: string,
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const raw = Object.fromEntries(formData.entries());
  const parsed = schema.safeParse({
    ...raw,
    analise_validada: raw.analise_validada ?? false,
  });
  if (!parsed.success) {
    return { status: 'error', message: 'Dados inválidos.', fieldErrors: toFieldErrors(parsed.error) };
  }

  const supabase = await createClient();
  try {
    await softUpdate(supabase, 'minerios', id, parsed.data);
  } catch (e) {
    return { status: 'error', message: (e as Error).message };
  }

  revalidatePath('/cadastros/minerios');
  redirect('/cadastros/minerios');
}

export async function deletarMinerioAction(id: string): Promise<void> {
  const supabase = await createClient();
  await softDelete(supabase, 'minerios', id);
  revalidatePath('/cadastros/minerios');
}
