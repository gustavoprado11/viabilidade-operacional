/**
 * Reverte o ajuste do E2E da Fase 9:
 *   c_gusa_fixo: 4.25 → 4.2
 *
 * Cria nova versão de `parametros_forno` (softUpdate manual via service role)
 * e insere linha em `calibracoes` com justificativa explícita. A linha atual
 * (4.25) é arquivada, preserva o histórico.
 *
 * Uso: pnpm tsx scripts/revert-calibracao-e2e.ts
 */

import { createClient } from '@supabase/supabase-js';
import { config as loadEnv } from 'dotenv';
import { z } from 'zod';

import type { Database } from '../lib/supabase/types';

loadEnv({ path: '.env.local' });

const env = z
  .object({
    NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
    SUPABASE_SERVICE_ROLE_KEY: z.string().min(10),
    BOOTSTRAP_USER_EMAIL: z.string().email(),
  })
  .parse({
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
    BOOTSTRAP_USER_EMAIL: process.env.BOOTSTRAP_USER_EMAIL ?? 'teste@teste.com',
  });

const VALOR_ORIGINAL = 4.2;

async function main() {
  const admin = createClient<Database>(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );

  const { data: userResp, error: usersErr } = await admin.auth.admin.listUsers();
  if (usersErr) throw new Error(`listUsers: ${usersErr.message}`);
  const user = userResp.users.find((u) => u.email === env.BOOTSTRAP_USER_EMAIL);
  if (!user) throw new Error(`Usuário ${env.BOOTSTRAP_USER_EMAIL} não encontrado.`);

  const { data: ativo, error: readErr } = await admin
    .from('parametros_forno')
    .select('*')
    .eq('user_id', user.id)
    .is('valid_to', null)
    .order('valid_from', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (readErr || !ativo) {
    throw new Error(`Parâmetros ativos não encontrados: ${readErr?.message}`);
  }

  const valorAtual = Number(ativo.c_gusa_fixo);
  if (Math.abs(valorAtual - VALOR_ORIGINAL) < 1e-6) {
    console.log(`c_gusa_fixo já está em ${VALOR_ORIGINAL}. Nada a fazer.`);
    return;
  }

  const now = new Date().toISOString();

  // INSERT nova versão (antes de UPDATE da antiga — mesma estratégia do softUpdate)
  const { id: _id, valid_from: _vf, valid_to: _vt, created_at: _ca, ...rest } =
    ativo;
  void _id;
  void _vf;
  void _vt;
  void _ca;
  const { data: novo, error: insErr } = await admin
    .from('parametros_forno')
    .insert({ ...rest, c_gusa_fixo: VALOR_ORIGINAL, valid_from: now, valid_to: null })
    .select('id')
    .single();
  if (insErr || !novo) {
    throw new Error(`Insert falhou: ${insErr?.message}`);
  }

  const { error: updErr } = await admin
    .from('parametros_forno')
    .update({ valid_to: now })
    .eq('id', ativo.id)
    .is('valid_to', null);
  if (updErr) {
    throw new Error(
      `Update da antiga falhou (2 linhas ativas): ${updErr.message}. ID novo: ${novo.id}`,
    );
  }

  const { error: logErr } = await admin.from('calibracoes').insert({
    user_id: user.id,
    parametros_old_id: ativo.id,
    parametros_new_id: novo.id,
    justificativa:
      'Reversão: valor de teste E2E da Fase 9, retornando ao bootstrap para Fase 10 determinística.',
    corridas_analisadas: 0,
    desvio_medio_antes: null,
    desvio_medio_depois: null,
  });
  if (logErr) {
    console.warn(`Parâmetros revertidos mas log falhou: ${logErr.message}`);
  }

  console.log(
    `Revertido c_gusa_fixo: ${valorAtual.toFixed(2)} → ${VALOR_ORIGINAL.toFixed(2)}`,
  );
}

main().catch((err) => {
  console.error('Reversão falhou:', err);
  process.exit(1);
});
