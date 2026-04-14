import type { createClient as createServerSbClient } from '@/lib/supabase/server';

/**
 * Helpers de versionamento para cadastros com `valid_from/valid_to`.
 *
 * Estratégia atual (v1): sequencial sem transação client-side, na ordem
 *   1) INSERT nova versão (valid_from=NOW, valid_to=NULL)
 *   2) UPDATE versão anterior SET valid_to=NOW
 *
 * A ordem é proposital: se o INSERT falhar, o estado é preservado
 * (1 linha ativa). Se o UPDATE falhar depois do INSERT, ficamos com
 * 2 linhas ativas por alguns ms — caso reconciliável manualmente, melhor
 * que zero linhas ativas (que seria destrutivo).
 *
 * TODO v1.1 (multi-tenant): migrar para RPC com BEGIN/COMMIT e SECURITY
 * INVOKER em `supabase/migrations/0002_versioning_helpers.sql`. Single-tenant
 * na v1 tem risco prático zero de janela de inconsistência.
 */

type VersionedTable =
  | 'minerios'
  | 'insumos'
  | 'clientes'
  | 'parametros_forno';

type Db = Awaited<ReturnType<typeof createServerSbClient>>;

type RowBase = {
  id: string;
  user_id: string;
  valid_from: string;
  valid_to: string | null;
  created_at: string;
};

/**
 * Cria uma nova versão do registro mesclando `patch` sobre a versão atual.
 *
 * - Lê a linha ativa (valid_to IS NULL) com o `id` dado;
 * - INSERT de uma nova linha com os campos mesclados (patch sobre atual),
 *   user_id copiado, valid_from=NOW, valid_to=NULL;
 * - UPDATE da linha antiga setando valid_to=NOW (somente após INSERT ok).
 *
 * Retorna `{ oldId, newId }`. Se o registro não existir ou não for do
 * usuário, RLS retorna vazio e a função lança.
 */
export async function softUpdate<T extends Record<string, unknown>>(
  supabase: Db,
  table: VersionedTable,
  id: string,
  patch: Partial<T>,
): Promise<{ oldId: string; newId: string }> {
  const { data: current, error: readErr } = await supabase
    .from(table)
    .select('*')
    .eq('id', id)
    .is('valid_to', null)
    .single();

  if (readErr || !current) {
    throw new Error(
      `softUpdate(${table}): registro ${id} não encontrado ou inativo.`,
    );
  }

  const row = current as unknown as RowBase & Record<string, unknown>;
  const now = new Date().toISOString();

  // Monta payload da nova linha: tudo do atual, EXCETO id/valid_from/valid_to/created_at;
  // aplica patch por cima; user_id mantido.
  const rest: Record<string, unknown> = { ...row };
  delete rest.id;
  delete rest.valid_from;
  delete rest.valid_to;
  delete rest.created_at;

  const insertPayload = {
    ...rest,
    ...patch,
    valid_from: now,
    valid_to: null as string | null,
  };

  const { data: inserted, error: insertErr } = await supabase
    .from(table)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .insert(insertPayload as any)
    .select('id')
    .single();

  if (insertErr || !inserted) {
    throw new Error(
      `softUpdate(${table}): falha ao inserir nova versão — ${insertErr?.message ?? 'sem dados'}.`,
    );
  }

  const newId = (inserted as { id: string }).id;

  const { error: closeErr } = await supabase
    .from(table)
    .update({ valid_to: now })
    .eq('id', id)
    .is('valid_to', null);

  if (closeErr) {
    // Janela anômala: existem 2 linhas ativas. Lançamos erro; reconciliação
    // manual: SELECT onde user_id=... AND nome=... AND valid_to IS NULL
    // e fechar a linha mais antiga.
    throw new Error(
      `softUpdate(${table}): nova versão criada (${newId}) mas falhou ao fechar a antiga (${id}): ${closeErr.message}. Ação manual requerida.`,
    );
  }

  return { oldId: id, newId };
}

/**
 * "Delete" é soft: fecha a versão ativa setando valid_to=NOW.
 * Nunca executa DELETE FROM.
 */
export async function softDelete(
  supabase: Db,
  table: VersionedTable,
  id: string,
): Promise<void> {
  const now = new Date().toISOString();
  const { error } = await supabase
    .from(table)
    .update({ valid_to: now })
    .eq('id', id)
    .is('valid_to', null);

  if (error) {
    throw new Error(`softDelete(${table}): ${error.message}`);
  }
}
