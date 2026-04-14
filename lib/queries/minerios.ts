import { createClient } from '@/lib/supabase/server';
import type { Database } from '@/lib/supabase/types';

export type Minerio = Database['public']['Tables']['minerios']['Row'];

export async function listMineriosAtivos(): Promise<Minerio[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('minerios')
    .select('*')
    .is('valid_to', null)
    .order('nome', { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function getMinerioAtivo(id: string): Promise<Minerio | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('minerios')
    .select('*')
    .eq('id', id)
    .is('valid_to', null)
    .maybeSingle();
  if (error) throw error;
  return data;
}
