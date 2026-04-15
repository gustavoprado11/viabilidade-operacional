'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';

import { simulateLamina } from '@/lib/calculation';
import { getCurrentUser } from '@/lib/queries/auth';
import { createClient } from '@/lib/supabase/server';

import {
  buildLaminaInput,
  type LaminaFormPayload,
} from './lamina-mapper';
import { type ActionState } from './types';

const blendItemSchema = z.object({
  minerio_id: z.string().uuid(),
  pct: z.coerce.number().min(0).max(100),
});

const payloadSchema = z
  .object({
    nome: z.string().min(1, 'Nome obrigatório.'),
    tipo: z.enum(['simulacao', 'corrida_real']),
    cliente_id: z.string().uuid(),
    blend: z.array(blendItemSchema).min(1),
    carvao_mdc: z.coerce.number().nonnegative(),
    carvao_densidade: z.coerce.number().positive(),
    coque_kg: z.coerce.number().nonnegative(),
    calcario_kg: z.coerce.number().nonnegative(),
    calcario_manual: z
      .union([z.literal('true'), z.literal('false'), z.literal('on')])
      .optional()
      .transform((v) => v === 'true' || v === 'on'),
    bauxita_kg: z.coerce.number().nonnegative(),
    dolomita_kg: z.coerce.number().nonnegative(),
    quebras: z.object({
      minerio: z.coerce.number().min(0).max(1),
      carvao: z.coerce.number().min(0).max(1),
      coque: z.coerce.number().min(0).max(1),
      fundentes: z.coerce.number().min(0).max(1),
    }),
    estabilidade: z.enum(['estavel', 'atencao', 'instavel']),
    sucata_kg: z.coerce.number().nonnegative(),
    sucata_preco_ton: z.coerce.number().nonnegative(),
    sucata_destino: z.enum(['venda', 'reprocesso']),
    corrida_timestamp: z
      .string()
      .nullable()
      .optional()
      .transform((v) => (v && v.length > 0 ? v : null)),
    observacoes: z
      .string()
      .nullable()
      .optional()
      .transform((v) => (v && v.length > 0 ? v : null)),
    simulacao_origem_id: z
      .string()
      .uuid()
      .nullable()
      .optional()
      .transform((v) => (v && v.length > 0 ? v : null)),
  })
  .refine(
    (d) => Math.abs(d.blend.reduce((s, b) => s + b.pct, 0) - 100) < 0.01,
    { message: 'A soma do blend deve ser 100%.', path: ['blend'] },
  )
  .refine(
    (d) =>
      d.tipo !== 'corrida_real' || (d.corrida_timestamp && d.corrida_timestamp.length > 0),
    {
      message: 'Corrida real requer timestamp.',
      path: ['corrida_timestamp'],
    },
  );

function toFieldErrors(err: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const i of err.issues) {
    const k = i.path.join('.');
    if (!out[k]) out[k] = i.message;
  }
  return out;
}

async function fetchBundle(payload: LaminaFormPayload) {
  const supabase = await createClient();
  const [mins, cli, calc, baux, dolom, carv, coq, par] = await Promise.all([
    supabase
      .from('minerios')
      .select('*')
      .in('id', payload.blend.map((b) => b.minerio_id)),
    supabase.from('clientes').select('*').eq('id', payload.cliente_id).maybeSingle(),
    supabase
      .from('insumos')
      .select('*')
      .eq('tipo', 'calcario')
      .is('valid_to', null)
      .limit(1)
      .maybeSingle(),
    supabase
      .from('insumos')
      .select('*')
      .eq('tipo', 'bauxita')
      .is('valid_to', null)
      .limit(1)
      .maybeSingle(),
    supabase
      .from('insumos')
      .select('*')
      .eq('tipo', 'dolomita')
      .is('valid_to', null)
      .limit(1)
      .maybeSingle(),
    supabase
      .from('insumos')
      .select('*')
      .eq('tipo', 'carvao')
      .is('valid_to', null)
      .limit(1)
      .maybeSingle(),
    supabase
      .from('insumos')
      .select('*')
      .eq('tipo', 'coque')
      .is('valid_to', null)
      .limit(1)
      .maybeSingle(),
    supabase
      .from('parametros_forno')
      .select('*')
      .is('valid_to', null)
      .order('valid_from', { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  if (mins.error) throw mins.error;
  if (cli.error) throw cli.error;
  if (!cli.data) throw new Error('Cliente não encontrado ou inativo.');
  if (!calc.data) throw new Error('Calcário ativo não encontrado.');
  if (!baux.data) throw new Error('Bauxita ativa não encontrada.');
  if (!dolom.data) throw new Error('Dolomita ativa não encontrada.');
  if (!carv.data) throw new Error('Carvão ativo não encontrado.');
  if (!coq.data) throw new Error('Coque ativo não encontrado.');
  if (!par.data)
    throw new Error('Parâmetros do forno ativos não encontrados. Rode o bootstrap.');

  return {
    minerios: mins.data ?? [],
    cliente: cli.data,
    calcario: calc.data,
    bauxita: baux.data,
    dolomita: dolom.data,
    carvao: carv.data,
    coque: coq.data,
    parametros: par.data,
  };
}

function parseForm(formData: FormData) {
  const blendRaw = formData.get('blend');
  const quebrasRaw = formData.get('quebras');
  const blend = typeof blendRaw === 'string' ? JSON.parse(blendRaw) : [];
  const quebras = typeof quebrasRaw === 'string' ? JSON.parse(quebrasRaw) : {};
  const raw = {
    ...Object.fromEntries(formData.entries()),
    blend,
    quebras,
  };
  return payloadSchema.safeParse(raw);
}

export async function criarSimulacaoAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = parseForm(formData);
  if (!parsed.success) {
    return {
      status: 'error',
      message: 'Dados inválidos.',
      fieldErrors: toFieldErrors(parsed.error),
    };
  }
  const user = await getCurrentUser();
  if (!user) return { status: 'error', message: 'Não autenticado.' };

  let bundle;
  try {
    bundle = await fetchBundle(parsed.data);
  } catch (e) {
    return { status: 'error', message: (e as Error).message };
  }

  const input = buildLaminaInput(parsed.data, bundle);
  const resultado = simulateLamina(input);

  const supabase = await createClient();
  const { data, error } = await supabase
    .from('simulacoes')
    .insert({
      user_id: user.id,
      nome: parsed.data.nome,
      tipo: parsed.data.tipo,
      cliente_id: parsed.data.cliente_id,
      blend: parsed.data.blend,
      carvao_mdc: parsed.data.carvao_mdc,
      carvao_densidade: parsed.data.carvao_densidade,
      coque_kg: parsed.data.coque_kg,
      calcario_kg: parsed.data.calcario_kg,
      calcario_manual: parsed.data.calcario_manual,
      bauxita_kg: parsed.data.bauxita_kg,
      dolomita_kg: parsed.data.dolomita_kg,
      quebras: parsed.data.quebras,
      estabilidade: parsed.data.estabilidade,
      sucata_kg: parsed.data.sucata_kg,
      sucata_preco_ton: parsed.data.sucata_preco_ton,
      sucata_destino: parsed.data.sucata_destino,
      resultado: JSON.parse(JSON.stringify(resultado)),
      classificacao: resultado.validacao.classificacao,
      parametros_id: bundle.parametros.id,
      corrida_timestamp: parsed.data.corrida_timestamp ?? null,
      observacoes: parsed.data.observacoes ?? null,
      simulacao_origem_id: parsed.data.simulacao_origem_id ?? null,
    })
    .select('id')
    .single();

  if (error) return { status: 'error', message: error.message };

  revalidatePath('/laminas');
  revalidatePath('/corridas');
  redirect(
    parsed.data.tipo === 'corrida_real'
      ? `/corridas/${data!.id}`
      : `/laminas/${data!.id}`,
  );
}

export async function atualizarSimulacaoAction(
  id: string,
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = parseForm(formData);
  if (!parsed.success) {
    return {
      status: 'error',
      message: 'Dados inválidos.',
      fieldErrors: toFieldErrors(parsed.error),
    };
  }

  const supabase = await createClient();

  // Lê o registro existente para checar tipo (corrida_real é read-only).
  const { data: existing, error: readErr } = await supabase
    .from('simulacoes')
    .select('tipo')
    .eq('id', id)
    .is('deleted_at', null)
    .maybeSingle();
  if (readErr || !existing)
    return { status: 'error', message: 'Simulação não encontrada.' };
  if (existing.tipo === 'corrida_real') {
    return {
      status: 'error',
      message: 'Corrida real é imutável. Use "Clonar e corrigir".',
    };
  }

  let bundle;
  try {
    bundle = await fetchBundle(parsed.data);
  } catch (e) {
    return { status: 'error', message: (e as Error).message };
  }

  const input = buildLaminaInput(parsed.data, bundle);
  const resultado = simulateLamina(input);

  const { error } = await supabase
    .from('simulacoes')
    .update({
      nome: parsed.data.nome,
      cliente_id: parsed.data.cliente_id,
      blend: parsed.data.blend,
      carvao_mdc: parsed.data.carvao_mdc,
      carvao_densidade: parsed.data.carvao_densidade,
      coque_kg: parsed.data.coque_kg,
      calcario_kg: parsed.data.calcario_kg,
      calcario_manual: parsed.data.calcario_manual,
      bauxita_kg: parsed.data.bauxita_kg,
      dolomita_kg: parsed.data.dolomita_kg,
      quebras: parsed.data.quebras,
      estabilidade: parsed.data.estabilidade,
      sucata_kg: parsed.data.sucata_kg,
      sucata_preco_ton: parsed.data.sucata_preco_ton,
      sucata_destino: parsed.data.sucata_destino,
      resultado: JSON.parse(JSON.stringify(resultado)),
      classificacao: resultado.validacao.classificacao,
      parametros_id: bundle.parametros.id,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .is('deleted_at', null);

  if (error) return { status: 'error', message: error.message };

  revalidatePath('/laminas');
  revalidatePath(`/laminas/${id}`);
  redirect(`/laminas/${id}`);
}

export async function deletarSimulacaoAction(id: string): Promise<void> {
  const supabase = await createClient();
  await supabase
    .from('simulacoes')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', id)
    .is('deleted_at', null);
  revalidatePath('/laminas');
}

export async function duplicarSimulacaoAction(id: string): Promise<void> {
  const supabase = await createClient();
  const user = await getCurrentUser();
  if (!user) throw new Error('Não autenticado.');

  const { data: src, error } = await supabase
    .from('simulacoes')
    .select('*')
    .eq('id', id)
    .is('deleted_at', null)
    .maybeSingle();
  if (error || !src) throw new Error('Simulação não encontrada.');

  const prefix = src.tipo === 'corrida_real' ? 'Correção de' : 'Cópia de';
  const nome = `${prefix} ${src.nome}`;
  const observacoes =
    src.tipo === 'corrida_real'
      ? `Correção da corrida ${src.id} de ${
          src.corrida_timestamp
            ? new Date(src.corrida_timestamp).toLocaleString('pt-BR')
            : new Date(src.created_at).toLocaleString('pt-BR')
        }.`
      : src.observacoes;

  const { data: inserted, error: insErr } = await supabase
    .from('simulacoes')
    .insert({
      user_id: user.id,
      nome,
      tipo: src.tipo,
      cliente_id: src.cliente_id,
      blend: src.blend,
      carvao_mdc: src.carvao_mdc,
      carvao_densidade: src.carvao_densidade,
      coque_kg: src.coque_kg,
      calcario_kg: src.calcario_kg,
      bauxita_kg: src.bauxita_kg,
      dolomita_kg: src.dolomita_kg,
      quebras: src.quebras,
      estabilidade: src.estabilidade,
      sucata_kg: src.sucata_kg,
      sucata_preco_ton: src.sucata_preco_ton,
      sucata_destino: src.sucata_destino,
      resultado: src.resultado,
      classificacao: src.classificacao,
      parametros_id: src.parametros_id,
      corrida_timestamp: null,
      observacoes,
    })
    .select('id')
    .single();

  if (insErr || !inserted) throw new Error(insErr?.message ?? 'Falha ao duplicar.');

  revalidatePath('/laminas');
  redirect(`/laminas/${inserted.id}?editar=1`);
}

/**
 * Atualiza apenas a análise química real da corrida (gusa e/ou escória).
 * NÃO recalcula o snapshot previsto — os desvios são derivados on-the-fly
 * na renderização da página. Mantém o snapshot imutável (sagrado).
 */
const analiseGusaSchema = z
  .object({
    p: z.coerce.number().optional(),
    si: z.coerce.number().optional(),
    mn: z.coerce.number().optional(),
    s: z.coerce.number().optional(),
    c: z.coerce.number().optional(),
  })
  .partial();

const analiseEscoriaSchema = z
  .object({
    b2: z.coerce.number().optional(),
    b4: z.coerce.number().optional(),
    al2o3Pct: z.coerce.number().optional(),
    mgoAl2o3: z.coerce.number().optional(),
    volumeTon: z.coerce.number().optional(),
  })
  .partial();

function stripEmpty(raw: Record<string, FormDataEntryValue>): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(raw)) {
    if (typeof v === 'string' && v.trim() !== '') out[k] = v;
  }
  return out;
}

export async function atualizarAnaliseQuimicaAction(
  id: string,
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const gusaRaw: Record<string, FormDataEntryValue> = {};
  const escoriaRaw: Record<string, FormDataEntryValue> = {};
  for (const [key, val] of formData.entries()) {
    if (key.startsWith('gusa_')) gusaRaw[key.slice(5)] = val;
    else if (key.startsWith('escoria_')) escoriaRaw[key.slice(8)] = val;
  }
  const gusaParsed = analiseGusaSchema.safeParse(stripEmpty(gusaRaw));
  const escoriaParsed = analiseEscoriaSchema.safeParse(stripEmpty(escoriaRaw));
  if (!gusaParsed.success || !escoriaParsed.success) {
    return {
      status: 'error',
      message: 'Dados inválidos.',
      fieldErrors: {
        ...(gusaParsed.success ? {} : toFieldErrors(gusaParsed.error)),
        ...(escoriaParsed.success ? {} : toFieldErrors(escoriaParsed.error)),
      },
    };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from('simulacoes')
    .update({
      analise_gusa_real: Object.keys(gusaParsed.data).length
        ? JSON.parse(JSON.stringify(gusaParsed.data))
        : null,
      analise_escoria_real: Object.keys(escoriaParsed.data).length
        ? JSON.parse(JSON.stringify(escoriaParsed.data))
        : null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .eq('tipo', 'corrida_real')
    .is('deleted_at', null);

  if (error) return { status: 'error', message: error.message };

  revalidatePath(`/laminas/${id}`);
  revalidatePath(`/corridas/${id}`);
  revalidatePath('/corridas');
  return { status: 'success', message: 'Análise química registrada.' };
}
