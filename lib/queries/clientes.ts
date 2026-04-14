import { createClient } from '@/lib/supabase/server';
import type { Database } from '@/lib/supabase/types';

export type Cliente = Database['public']['Tables']['clientes']['Row'];

export async function listClientesAtivos(): Promise<Cliente[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('clientes')
    .select('*')
    .is('valid_to', null)
    .order('nome', { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function getClienteAtivo(id: string): Promise<Cliente | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('clientes')
    .select('*')
    .eq('id', id)
    .is('valid_to', null)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function listClienteHistorico(nome: string): Promise<Cliente[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('clientes')
    .select('*')
    .eq('nome', nome)
    .order('valid_from', { ascending: false });
  if (error) throw error;
  return data ?? [];
}
