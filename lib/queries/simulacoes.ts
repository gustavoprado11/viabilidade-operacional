import { createClient } from '@/lib/supabase/server';
import type { Database } from '@/lib/supabase/types';

export type Simulacao = Database['public']['Tables']['simulacoes']['Row'];
export type SimulacaoTipo = 'simulacao' | 'corrida_real';
export type SimulacaoClassificacao = 'viavel' | 'alerta' | 'inviavel';

export type SimulacaoFiltros = {
  tipo?: SimulacaoTipo;
  classificacao?: SimulacaoClassificacao;
};

export async function listSimulacoes(
  filtros: SimulacaoFiltros = {},
): Promise<Simulacao[]> {
  const supabase = await createClient();
  let q = supabase
    .from('simulacoes')
    .select('*')
    .is('deleted_at', null)
    .order('created_at', { ascending: false });
  if (filtros.tipo) q = q.eq('tipo', filtros.tipo);
  if (filtros.classificacao) q = q.eq('classificacao', filtros.classificacao);
  const { data, error } = await q;
  if (error) throw error;
  return data ?? [];
}

export async function listSimulacoesPorIds(ids: string[]): Promise<Simulacao[]> {
  if (ids.length === 0) return [];
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('simulacoes')
    .select('*')
    .in('id', ids)
    .is('deleted_at', null);
  if (error) throw error;
  return data ?? [];
}

export async function getSimulacao(id: string): Promise<Simulacao | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('simulacoes')
    .select('*')
    .eq('id', id)
    .is('deleted_at', null)
    .maybeSingle();
  if (error) throw error;
  return data;
}

/**
 * Retorna todos os minérios referenciados (por ID) ignorando `valid_to`.
 * Usado para reconstruir o blend de uma simulação antiga mesmo que o minério
 * esteja arquivado. Retorna flag `arquivado` para UI.
 */
export async function getMineriosPorIds(
  ids: string[],
): Promise<Array<Database['public']['Tables']['minerios']['Row'] & { arquivado: boolean }>> {
  if (ids.length === 0) return [];
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('minerios')
    .select('*')
    .in('id', ids);
  if (error) throw error;
  return (data ?? []).map((m) => ({ ...m, arquivado: m.valid_to !== null }));
}
