import { createClient } from '@/lib/supabase/server';
import type { Database } from '@/lib/supabase/types';
import type { Simulacao } from '@/lib/queries/simulacoes';

export type Calibracao = Database['public']['Tables']['calibracoes']['Row'];

/**
 * Busca corridas reais no período com análise química registrada.
 * Usadas pelo motor de calibração para calcular estatísticas.
 */
export async function listCorridasPeriodoComAnalise(
  dataInicio: Date,
  dataFim: Date,
): Promise<Simulacao[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('simulacoes')
    .select('*')
    .eq('tipo', 'corrida_real')
    .is('deleted_at', null)
    .gte('corrida_timestamp', dataInicio.toISOString())
    .lte('corrida_timestamp', dataFim.toISOString())
    .or('analise_gusa_real.not.is.null,analise_escoria_real.not.is.null')
    .order('corrida_timestamp', { ascending: true });
  if (error) throw error;
  return data ?? [];
}

/**
 * Verifica se houve nova versão de `parametros_forno` no período
 * (potencial viés na análise de desvios).
 */
export async function houveCalibracaoNoPeriodo(
  dataInicio: Date,
  dataFim: Date,
): Promise<boolean> {
  const supabase = await createClient();
  const { count, error } = await supabase
    .from('calibracoes')
    .select('id', { count: 'exact', head: true })
    .gte('created_at', dataInicio.toISOString())
    .lte('created_at', dataFim.toISOString());
  if (error) throw error;
  return (count ?? 0) > 0;
}

export async function listCalibracoesRecentes(limit = 10): Promise<Calibracao[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('calibracoes')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data ?? [];
}
