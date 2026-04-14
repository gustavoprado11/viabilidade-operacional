import { createClient } from '@/lib/supabase/server';
import type { LaminaResultado } from '@/lib/calculation/types';
import type { SimulacaoAgregado } from '@/lib/relatorios/agregados';
import type { Database } from '@/lib/supabase/types';

type SimulacaoRow = Database['public']['Tables']['simulacoes']['Row'];

export type RelatorioFiltros = Readonly<{
  de: string; // ISO
  ate: string; // ISO
  tipo?: 'simulacao' | 'corrida_real';
  classificacao?: 'viavel' | 'alerta' | 'inviavel';
  clienteId?: string;
  limit?: number;
}>;

export const EXPORT_LIMIT = 500;

function toAgregado(row: SimulacaoRow): SimulacaoAgregado {
  return {
    id: row.id,
    nome: row.nome,
    tipo: row.tipo as 'simulacao' | 'corrida_real',
    classificacao: row.classificacao as 'viavel' | 'alerta' | 'inviavel',
    created_at: row.created_at,
    corrida_timestamp: row.corrida_timestamp,
    cliente_id: row.cliente_id,
    resultado: row.resultado as unknown as LaminaResultado,
    analise_gusa_real: row.analise_gusa_real as SimulacaoAgregado['analise_gusa_real'],
  };
}

/**
 * Busca simulações no período + filtros. Limita em EXPORT_LIMIT + 1 para
 * detectar truncamento. Ordena por created_at DESC.
 */
export async function listSimulacoesRelatorio(
  filtros: RelatorioFiltros,
): Promise<{ simulacoes: SimulacaoAgregado[]; truncado: boolean }> {
  const supabase = await createClient();
  const limit = Math.min(filtros.limit ?? EXPORT_LIMIT, EXPORT_LIMIT) + 1;
  let q = supabase
    .from('simulacoes')
    .select('*')
    .is('deleted_at', null)
    .gte('created_at', filtros.de)
    .lte('created_at', filtros.ate)
    .order('created_at', { ascending: false })
    .limit(limit);
  if (filtros.tipo) q = q.eq('tipo', filtros.tipo);
  if (filtros.classificacao) q = q.eq('classificacao', filtros.classificacao);
  if (filtros.clienteId) q = q.eq('cliente_id', filtros.clienteId);
  const { data, error } = await q;
  if (error) throw error;
  const rows = data ?? [];
  const truncado = rows.length > EXPORT_LIMIT;
  const simulacoes = rows.slice(0, EXPORT_LIMIT).map(toAgregado);
  return { simulacoes, truncado };
}
