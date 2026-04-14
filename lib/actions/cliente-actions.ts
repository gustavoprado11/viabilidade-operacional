'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';

import { softDelete, softUpdate } from '@/lib/queries/versioning';
import { getCurrentUser } from '@/lib/queries/auth';
import { createClient } from '@/lib/supabase/server';

import { type ActionState } from './types';

const clienteSchema = z.object({
  nome: z.string().min(1, 'Nome obrigatório.'),
  cnpj: z.string().optional().nullable(),
  p_max: z.coerce.number().positive(),
  si_max: z.coerce.number().positive(),
  mn_max: z.coerce.number().positive(),
  s_max: z.coerce.number().positive(),
  c_min: z.coerce.number().positive(),
  c_max: z.coerce.number().positive(),
  preco_gusa_ton: z.coerce.number().positive(),
});

function parseFormData(formData: FormData) {
  const raw = Object.fromEntries(formData.entries());
  return clienteSchema.safeParse({
    ...raw,
    cnpj: raw.cnpj ? String(raw.cnpj) : null,
  });
}

function zodErrorsToFields(err: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of err.issues) {
    const key = issue.path.join('.');
    if (!out[key]) out[key] = issue.message;
  }
  return out;
}

export async function criarClienteAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = parseFormData(formData);
  if (!parsed.success) {
    return { status: 'error', message: 'Dados inválidos.', fieldErrors: zodErrorsToFields(parsed.error) };
  }
  const user = await getCurrentUser();
  if (!user) return { status: 'error', message: 'Não autenticado.' };

  const supabase = await createClient();
  const { error } = await supabase
    .from('clientes')
    .insert({ ...parsed.data, user_id: user.id });

  if (error) return { status: 'error', message: error.message };

  revalidatePath('/cadastros/clientes');
  redirect('/cadastros/clientes');
}

export async function atualizarClienteAction(
  id: string,
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = parseFormData(formData);
  if (!parsed.success) {
    return { status: 'error', message: 'Dados inválidos.', fieldErrors: zodErrorsToFields(parsed.error) };
  }

  const supabase = await createClient();
  try {
    await softUpdate(supabase, 'clientes', id, parsed.data);
  } catch (e) {
    return { status: 'error', message: (e as Error).message };
  }

  revalidatePath('/cadastros/clientes');
  redirect('/cadastros/clientes');
}

export async function deletarClienteAction(id: string): Promise<void> {
  const supabase = await createClient();
  await softDelete(supabase, 'clientes', id);
  revalidatePath('/cadastros/clientes');
}
