'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';

import { getCurrentUser } from '@/lib/queries/auth';
import { softUpdate } from '@/lib/queries/versioning';
import { createClient } from '@/lib/supabase/server';

import { type ActionState } from './types';

const schema = z.object({
  corridas_por_dia: z.coerce.number().int().positive(),
  duracao_corrida_min: z.coerce.number().int().positive(),
  consumo_minerio_dia: z.coerce.number().positive(),
  b2_min: z.coerce.number().positive(),
  b2_max: z.coerce.number().positive(),
  b2_alvo: z.coerce.number().positive(),
  al2o3_escoria_alvo_min: z.coerce.number().positive(),
  al2o3_escoria_alvo_max: z.coerce.number().positive(),
  al2o3_escoria_limite: z.coerce.number().positive(),
  mgo_al2o3_min: z.coerce.number().nonnegative(),
  rend_fe_ref1: z.coerce.number().positive(),
  rend_ref1: z.coerce.number().positive(),
  rend_fe_ref2: z.coerce.number().positive(),
  rend_ref2: z.coerce.number().positive(),
  fator_estavel: z.coerce.number().positive(),
  fator_atencao: z.coerce.number().positive(),
  fator_instavel: z.coerce.number().positive(),
  particao_p_gusa: z.coerce.number().min(0).max(1),
  particao_mn_gusa: z.coerce.number().min(0).max(1),
  si_intercept: z.coerce.number(),
  si_coef_b2: z.coerce.number(),
  s_gusa_fixo: z.coerce.number().nonnegative(),
  c_gusa_fixo: z.coerce.number().nonnegative(),
  custo_fixo_dia: z.coerce.number().nonnegative(),
  frete_gusa_ton: z.coerce.number().nonnegative(),
  deb_pis_ton: z.coerce.number().nonnegative(),
  deb_icms_ton: z.coerce.number().nonnegative(),
  deb_ipi_ton: z.coerce.number().nonnegative(),
});

function toFieldErrors(err: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const i of err.issues) {
    const k = i.path.join('.');
    if (!out[k]) out[k] = i.message;
  }
  return out;
}

export async function atualizarParametrosAction(
  currentId: string,
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const raw = Object.fromEntries(formData.entries());
  const parsed = schema.safeParse(raw);
  if (!parsed.success) {
    return { status: 'error', message: 'Dados inválidos.', fieldErrors: toFieldErrors(parsed.error) };
  }
  const user = await getCurrentUser();
  if (!user) return { status: 'error', message: 'Não autenticado.' };

  const supabase = await createClient();
  try {
    if (currentId) {
      await softUpdate(supabase, 'parametros_forno', currentId, parsed.data);
    } else {
      const { error } = await supabase
        .from('parametros_forno')
        .insert({ ...parsed.data, user_id: user.id });
      if (error) return { status: 'error', message: error.message };
    }
  } catch (e) {
    return { status: 'error', message: (e as Error).message };
  }

  revalidatePath('/cadastros/parametros');
  return { status: 'success', message: 'Parâmetros atualizados (nova versão criada).' };
}
