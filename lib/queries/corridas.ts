import { createClient } from '@/lib/supabase/server';
import type { Simulacao } from '@/lib/queries/simulacoes';

/**
 * Lista apenas corridas reais (tipo='corrida_real'), ordenadas por
 * corrida_timestamp DESC. Filtra deleted_at NULL.
 */
export async function listCorridas(): Promise<Simulacao[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('simulacoes')
    .select('*')
    .eq('tipo', 'corrida_real')
    .is('deleted_at', null)
    .order('corrida_timestamp', { ascending: false, nullsFirst: false });
  if (error) throw error;
  return data ?? [];
}
