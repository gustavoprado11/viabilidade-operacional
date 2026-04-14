import { createClient } from '@/lib/supabase/server';
import type { Database } from '@/lib/supabase/types';

export type ParametrosForno =
  Database['public']['Tables']['parametros_forno']['Row'];

export async function getParametrosAtivos(): Promise<ParametrosForno | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('parametros_forno')
    .select('*')
    .is('valid_to', null)
    .order('valid_from', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function listParametrosHistorico(): Promise<ParametrosForno[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('parametros_forno')
    .select('*')
    .order('valid_from', { ascending: false });
  if (error) throw error;
  return data ?? [];
}
