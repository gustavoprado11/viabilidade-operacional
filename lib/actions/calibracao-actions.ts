'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';

import { getCurrentUser } from '@/lib/queries/auth';
import { getParametrosAtivos } from '@/lib/queries/parametros';
import { softUpdate } from '@/lib/queries/versioning';
import { createClient } from '@/lib/supabase/server';

import { type ActionState } from './types';

/**
 * Aplica calibração: cria nova versão de `parametros_forno` com os ajustes
 * e registra o evento em `calibracoes` (parametros_old_id, parametros_new_id,
 * justificativa, n corridas analisadas, desvios médios pré/pós-calibração).
 *
 * O campo `desvio_medio_depois` é projetado (ainda não há corridas com o
 * novo parâmetro). Gravamos a projeção para comparação futura.
 */

const patchSchema = z
  .record(z.string(), z.coerce.number())
  .refine((o) => Object.keys(o).length > 0, 'Nenhuma alteração.');

const payloadSchema = z.object({
  justificativa: z.string().min(20, 'Justifique em pelo menos 20 caracteres.'),
  corridas_analisadas: z.coerce.number().int().min(0),
  desvio_medio_antes: z.string(), // JSON
  desvio_medio_depois: z.string(), // JSON (projeção)
  patch: z.string(), // JSON
});

function toFieldErrors(err: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const i of err.issues) {
    const k = i.path.join('.');
    if (!out[k]) out[k] = i.message;
  }
  return out;
}

export async function aplicarCalibracaoAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const raw = Object.fromEntries(formData.entries());
  const parsed = payloadSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      status: 'error',
      message: 'Dados inválidos.',
      fieldErrors: toFieldErrors(parsed.error),
    };
  }

  let patch: Record<string, number>;
  try {
    const json = JSON.parse(parsed.data.patch);
    const parsedPatch = patchSchema.safeParse(json);
    if (!parsedPatch.success) {
      return { status: 'error', message: 'Nenhum ajuste selecionado.' };
    }
    patch = parsedPatch.data;
  } catch {
    return { status: 'error', message: 'Patch inválido.' };
  }

  const user = await getCurrentUser();
  if (!user) return { status: 'error', message: 'Não autenticado.' };

  const atuais = await getParametrosAtivos();
  if (!atuais) return { status: 'error', message: 'Nenhum parâmetro ativo.' };

  const supabase = await createClient();

  let newId: string;
  try {
    const { newId: nid } = await softUpdate(
      supabase,
      'parametros_forno',
      atuais.id,
      patch,
    );
    newId = nid;
  } catch (e) {
    return { status: 'error', message: (e as Error).message };
  }

  const { error: calErr } = await supabase.from('calibracoes').insert({
    user_id: user.id,
    parametros_old_id: atuais.id,
    parametros_new_id: newId,
    justificativa: parsed.data.justificativa,
    corridas_analisadas: parsed.data.corridas_analisadas,
    desvio_medio_antes: JSON.parse(parsed.data.desvio_medio_antes),
    desvio_medio_depois: JSON.parse(parsed.data.desvio_medio_depois),
  });

  if (calErr) {
    return {
      status: 'error',
      message: `Parâmetros atualizados mas falha no log: ${calErr.message}`,
    };
  }

  revalidatePath('/calibracao');
  revalidatePath('/cadastros/parametros');
  return {
    status: 'success',
    message:
      'Calibração aplicada. Novas simulações usarão os novos parâmetros. Simulações anteriores mantêm seus snapshots.',
  };
}
