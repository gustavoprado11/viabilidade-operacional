import { createClient } from '@supabase/supabase-js';

import type { Database } from '../../../lib/supabase/types';

/**
 * Soft-deleta todas as `simulacoes` do usuário E2E (tipo simulacao e
 * corrida_real) que ainda estão ativas. Cadastros (minerios/insumos/
 * clientes/parametros_forno) NÃO são tocados — o bootstrap é persistente.
 *
 * Chamada por:
 *   - globalTeardown do Playwright (ver playwright.config.ts)
 *   - `pnpm tsx tests/e2e/helpers/cleanup.ts` para limpeza manual
 */

export async function cleanupE2ESimulacoes(): Promise<number> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const email = process.env.E2E_USER_EMAIL;
  if (!url || !serviceRoleKey || !email) {
    console.warn('cleanup pulado: env vars E2E ausentes');
    return 0;
  }

  const admin = createClient<Database>(url, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data: users, error: uErr } = await admin.auth.admin.listUsers();
  if (uErr) throw uErr;
  const user = users.users.find((u) => u.email === email);
  if (!user) {
    console.warn(`cleanup: usuário ${email} não encontrado`);
    return 0;
  }

  const now = new Date().toISOString();
  const { data, error } = await admin
    .from('simulacoes')
    .update({ deleted_at: now })
    .eq('user_id', user.id)
    .is('deleted_at', null)
    .select('id');

  if (error) throw error;
  const n = data?.length ?? 0;
  console.log(`cleanup: ${n} simulações soft-deletadas do user E2E`);
  return n;
}

// Execução CLI direta
if (require.main === module) {
  (async () => {
    const { config } = await import('dotenv');
    config({ path: '.env.local' });
    await cleanupE2ESimulacoes();
  })().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}
