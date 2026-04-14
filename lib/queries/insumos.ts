import { createClient } from '@/lib/supabase/server';
import type { Database } from '@/lib/supabase/types';

export type Insumo = Database['public']['Tables']['insumos']['Row'];
export type InsumoTipo = 'calcario' | 'bauxita' | 'dolomita' | 'coque' | 'carvao' | 'outro';
export const INSUMO_TIPOS: InsumoTipo[] = [
  'calcario', 'bauxita', 'dolomita', 'coque', 'carvao', 'outro',
];

export async function listInsumosAtivos(): Promise<Insumo[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('insumos')
    .select('*')
    .is('valid_to', null)
    .order('tipo', { ascending: true })
    .order('nome', { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function getInsumoAtivo(id: string): Promise<Insumo | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('insumos')
    .select('*')
    .eq('id', id)
    .is('valid_to', null)
    .maybeSingle();
  if (error) throw error;
  return data;
}
